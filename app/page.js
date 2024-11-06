"use client";

import { InferenceEngine, CVImage } from "inferencejs";
import { useEffect, useRef, useState, useMemo } from "react";

const GUIDES = {
  disp1: ["black", {"x": 0.03, "y": 0.44}, {"x": 0.2, "y": 0.38}, {"x": 0.24, "y": 0.5}, {"x": 0.08, "y": 0.56}],
  disp2: ["black", {"x": 0.22, "y": 0.37}, {"x": 0.35, "y": 0.32}, {"x": 0.41, "y": 0.41}, {"x": 0.27, "y": 0.47}],
  disp3: ["black", {"x": 0.38, "y": 0.32}, {"x": 0.49, "y": 0.28}, {"x": 0.55, "y": 0.35}, {"x": 0.44, "y": 0.4}],
  disp4: ["black", {"x": 0.51, "y": 0.28}, {"x": 0.61, "y": 0.24}, {"x": 0.66, "y": 0.3}, {"x": 0.56, "y": 0.34}],
  disp5: ["black", {"x": 0.62, "y": 0.24}, {"x": 0.7, "y": 0.21}, {"x": 0.76, "y": 0.27}, {"x": 0.68, "y": 0.3}],
  middle: ["darkgray", {"x": 0.02, "y": 0.3}, {"x": 0.56, "y": 0.14}, {"x": 0.63, "y": 0.23}, {"x": 0.07, "y": 0.41}],
  row1: ["white", {"x": 0.57, "y": 0.5}, {"x": 0.61, "y": 0.49}, {"x": 0.63, "y": 0.5}, {"x": 0.6, "y": 0.53}],
  row2: ["yellow", {"x": 0.57, "y": 0.55}, {"x": 0.63, "y": 0.51}, {"x": 0.66, "y": 0.53}, {"x": 0.59, "y": 0.57}],
  row3: ["blue", {"x": 0.56, "y": 0.6}, {"x": 0.66, "y": 0.53}, {"x": 0.69, "y": 0.57}, {"x": 0.59, "y": 0.63}],
  row4: ["green", {"x": 0.55, "y": 0.66}, {"x": 0.69, "y": 0.57}, {"x": 0.72, "y": 0.61}, {"x": 0.59, "y": 0.7}],
  row5: ["red", {"x": 0.55, "y": 0.73}, {"x": 0.73, "y": 0.61}, {"x": 0.76, "y": 0.64}, {"x": 0.58, "y": 0.77}],
  squares: ["lightblue", {"x": 0.75, "y": 0.41}, {"x": 0.9, "y": 0.53}, {"x": 0.78, "y": 0.63}, {"x": 0.62, "y": 0.48}]
}

export default function App() {
  const inferEngine = useMemo(() => {
    return new InferenceEngine();
  }, []);

  const [modelWorkerId, setModelWorkerId] = useState(null);
  const [modelLoading, setModelLoading] = useState(false);

  const videoRef = useRef();
  const canvasRef = useRef();
  const guidesRef = useRef();

  useEffect(() => {
    if (!modelLoading) {
      setModelLoading(true);
      inferEngine
        .startWorker("azul-board-game", 3, process.env.NEXT_PUBLIC_ROBOFLOW_API_KEY)
        .then((id) => setModelWorkerId(id));
    }
  }, [inferEngine, modelLoading]);

  useEffect(() => {
    console.log("Model Worker ID: " + modelWorkerId);
    if (modelWorkerId) {
      startWebcam();
    }
  }, [modelWorkerId]);

  const startWebcam = () => {
    var constraints = {
      audio: false,
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: "environment",
      },
    };

    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play();
      };

      videoRef.current.onplay = () => {
        var ctx = canvasRef.current.getContext("2d");

        var height = videoRef.current.videoHeight;
        var width = videoRef.current.videoWidth;

        videoRef.current.width = width;
        videoRef.current.height = height;

        canvasRef.current.width = width;
        canvasRef.current.height = height;

        ctx.scale(1, 1);

        detectFrame();
      };
    });
  };

  const drawGuides = (showGuides) => {
    const ctx = guidesRef.current.getContext("2d");
    ctx.clearRect(0, 0, guidesRef.current.width, guidesRef.current.height);

    if (!showGuides) return;

    Object.keys(GUIDES).forEach((key) => {
      const guide = GUIDES[key];
      ctx.beginPath();
      ctx.moveTo(guide[1].x * guidesRef.current.width, guide[1].y * guidesRef.current.height);
      ctx.lineTo(guide[2].x * guidesRef.current.width, guide[2].y * guidesRef.current.height);
      ctx.lineTo(guide[3].x * guidesRef.current.width, guide[3].y * guidesRef.current.height);
      ctx.lineTo(guide[4].x * guidesRef.current.width, guide[4].y * guidesRef.current.height);
      ctx.closePath();
      ctx.strokeStyle = guide[0];
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  };

  const detectFrame = () => {
    if (!modelWorkerId) setTimeout(detectFrame, 100 / 3);

    const img = new CVImage(videoRef.current);
    inferEngine.infer(modelWorkerId, img).then((predictions) => {
      var ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      for (var i = 0; i < predictions.length; i++) {
        console.log(predictions[i]);
        var prediction = predictions[i];

        // draw detections
        ctx.strokeStyle = prediction.color;

        var x = prediction.bbox.x - prediction.bbox.width / 2;
        var y = prediction.bbox.y - prediction.bbox.height / 2;
        var width = prediction.bbox.width;
        var height = prediction.bbox.height;

        ctx.rect(x, y, width, height);
        ctx.fillStyle = "rgba(0, 0, 0, 0)";
        ctx.fill();
        ctx.fillStyle = ctx.strokeStyle;
        ctx.lineWidth = "4";
        ctx.strokeRect(x, y, width, height);

        var text = ctx.measureText(
          prediction.class + " " + Math.round(prediction.confidence * 100) + "%"
        );
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fillRect(x - 2, y - 30, text.width + 4, 30);
        ctx.font = "15px monospace";
        ctx.fillStyle = "black";
        ctx.fillText(
          prediction.class +
            " " +
            Math.round(prediction.confidence * 100) +
            "%",
          x,
          y - 10
        );
      }

      setTimeout(detectFrame, 100 / 3);
    });
  };

  return (
    <div>
      <div className="relative">
        <video
          width="640"
          height="480"
          ref={videoRef}
          className="relative"
        />
        <canvas
          width="640"
          height="480"
          ref={canvasRef}
          className="absolute top-0 left-0"
        />
        <canvas
          width="640"
          height="480"
          ref={guidesRef}
          className="absolute top-0 left-0"
        />
      </div>
      <div className="mt-2">
        <label className="flex items-center gap-2 ml-2">
          <input type="checkbox" onChange={(e) => drawGuides(e.target.checked)} />
          <span>Show guides</span>
        </label>
      </div>
    </div>
  );
}
