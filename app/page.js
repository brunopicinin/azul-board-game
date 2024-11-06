"use client";

import { useEffect, useRef, useState } from "react";

const TARGET_FPS = 15;

const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;

const COLORS = {
  black: "#000000",
  red: "#FF0000",
  yellow: "#FFFF00",
  dark_blue: "#0000FF",
  light_blue: "#00FFFF",
}

const TEXT_COLORS = {
  black: "white",
  red: "white",
  yellow: "black",
  dark_blue: "white",
  light_blue: "black",
}

const GUIDES = {
  disp1: ["black", {"x": 0.02, "y": 0.44}, {"x": 0.2, "y": 0.37}, {"x": 0.25, "y": 0.5}, {"x": 0.08, "y": 0.56}],
  disp2: ["black", {"x": 0.21, "y": 0.37}, {"x": 0.35, "y": 0.32}, {"x": 0.42, "y": 0.42}, {"x": 0.26, "y": 0.49}],
  disp3: ["black", {"x": 0.36, "y": 0.32}, {"x": 0.49, "y": 0.27}, {"x": 0.57, "y": 0.36}, {"x": 0.43, "y": 0.42}],
  disp4: ["black", {"x": 0.5, "y": 0.27}, {"x": 0.6, "y": 0.23}, {"x": 0.68, "y": 0.32}, {"x": 0.58, "y": 0.36}],
  disp5: ["black", {"x": 0.61, "y": 0.23}, {"x": 0.71, "y": 0.19}, {"x": 0.79, "y": 0.27}, {"x": 0.68, "y": 0.32}],
  floor: ["gray", {"x": 0.02, "y": 0.28}, {"x": 0.55, "y": 0.14}, {"x": 0.63, "y": 0.22}, {"x": 0.07, "y": 0.42}],
  row1: ["red", {"x": 0.57, "y": 0.5}, {"x": 0.61, "y": 0.48}, {"x": 0.63, "y": 0.51}, {"x": 0.59, "y": 0.53}],
  row2: ["yellow", {"x": 0.57, "y": 0.55}, {"x": 0.64, "y": 0.5}, {"x": 0.66, "y": 0.53}, {"x": 0.59, "y": 0.58}],
  row3: ["cyan", {"x": 0.56, "y": 0.6}, {"x": 0.66, "y": 0.53}, {"x": 0.69, "y": 0.56}, {"x": 0.59, "y": 0.64}],
  row4: ["blue", {"x": 0.55, "y": 0.66}, {"x": 0.69, "y": 0.57}, {"x": 0.73, "y": 0.6}, {"x": 0.58, "y": 0.7}],
  row5: ["magenta", {"x": 0.55, "y": 0.73}, {"x": 0.73, "y": 0.61}, {"x": 0.76, "y": 0.64}, {"x": 0.58, "y": 0.78}],
  sqr1: ["darkred", {"x": 0.74, "y": 0.41}, {"x": 0.77, "y": 0.43}, {"x": 0.64, "y": 0.51}, {"x": 0.62, "y": 0.48}],
  sqr2: ["gold", {"x": 0.78, "y": 0.43}, {"x": 0.8, "y": 0.46}, {"x": 0.67, "y": 0.53}, {"x": 0.65, "y": 0.51}],
  sqr3: ["turquoise", {"x": 0.8, "y": 0.46}, {"x": 0.84, "y": 0.48}, {"x": 0.7, "y": 0.56}, {"x": 0.68, "y": 0.53}],
  sqr4: ["darkblue", {"x": 0.84, "y": 0.48}, {"x": 0.87, "y": 0.51}, {"x": 0.74, "y": 0.6}, {"x": 0.7, "y": 0.56}],
  sqr5: ["darkmagenta", {"x": 0.87, "y": 0.51}, {"x": 0.91, "y": 0.54}, {"x": 0.78, "y": 0.64}, {"x": 0.74, "y": 0.6}]
}

const initialGameState = Object.keys(GUIDES).reduce((acc, key) => {
  acc[key] = [];
  return acc;
}, {});

const isPointInPolygon = (point, polygon) => {
  let inside = false;
  for (let i = 0, j = 3; i <= 3; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect = ((yi > point.y) !== (yj > point.y))
        && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

const listPossiblePicks = (gameState) => {
  const displays = ["disp1", "disp2", "disp3", "disp4", "disp5", "floor"];
  const possiblePicks = [];

  for (const display of displays) {
    const tiles = gameState[display];
    if (tiles.length === 0) continue;

    // Get unique colors in this display
    const colors = [...new Set(tiles)];

    // For each color, create a pick with all tiles of that color
    for (const color of colors) {
      const colorTiles = tiles.filter(tile => tile === color);
      possiblePicks.push({
        display,
        color,
        count: colorTiles.length
      });
    }
  }

  return possiblePicks;
}

const listPossiblePlays = (gameState) => {
  const possiblePicks = listPossiblePicks(gameState);
  const possiblePlays = [];

  for (const pick of possiblePicks) {
    const display = pick.display;
    const color = pick.color;
    const count = pick.count;

    // Check each row
    for (let rowNum = 1; rowNum <= 5; rowNum++) {
      const rowKey = `row${rowNum}`;
      const sqrKey = `sqr${rowNum}`;
      const rowTiles = gameState[rowKey];
      const sqrTiles = gameState[sqrKey];

      // Skip if square already has this color
      if (sqrTiles.includes(color)) {
        continue;
      }

      // Row must be empty or only contain same color
      if (rowTiles.length === 0 || rowTiles.every(tile => tile === color)) {
        possiblePlays.push({
          pick: {
            display,
            color,
            count
          },
          row: rowNum
        });
      }
    }
  }

  return possiblePlays;
}

const rankPossiblePlays = (gameState) => {
  const possiblePlays = listPossiblePlays(gameState);

  // Calculate score for each play
  const scoredPlays = possiblePlays.map(play => {
    const rowNum = play.row;
    const rowCapacity = rowNum; // row number equals its capacity
    const currentTiles = gameState[`row${rowNum}`].length;
    const remainingCapacity = rowCapacity - currentTiles;
    const pickedTiles = play.pick.count;

    let score = 0;

    // Add points for tiles that fit in remaining capacity
    const fittingTiles = Math.min(remainingCapacity, pickedTiles);
    score += fittingTiles;

    // Add points for total tiles that will be in row after pick
    const finalTileCount = currentTiles + fittingTiles;
    score += finalTileCount * 2;

    // Subtract points for empty spaces left in row after placing tiles
    const emptySpacesAfterPlacement = Math.max(0, remainingCapacity - pickedTiles);
    score -= emptySpacesAfterPlacement * 3;

    // Subtract points for overflow tiles
    const overflowTiles = Math.max(0, pickedTiles - remainingCapacity);
    score -= overflowTiles * 5;

    return { ...play, score };
  });

  // Sort by score in descending order
  return scoredPlays.sort((a, b) => b.score - a.score);
}

export default function App() {
  const [model, setModel] = useState(null);
  const [modelLoading, setModelLoading] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [gameState, setGameState] = useState(initialGameState);
  const [suggestedMoves, setSuggestedMoves] = useState([]);

  const videoRef = useRef();
  const canvasRef = useRef();
  const guidesRef = useRef();

  useEffect(() => {
    if (!modelLoading) {
      setModelLoading(true);
      window.roboflow
        .auth({ publishable_key: process.env.NEXT_PUBLIC_ROBOFLOW_API_KEY })
        .load({ model: "azul-board-game", version: 3 })
        .then((m) => {
          m.configure({ threshold: 0.5, overlap: 0.25, max_objects: 200 });
          setModel(m);
        });
    }
  }, [modelLoading]);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const videoDevices = devices.filter(device => device.kind === "videoinput");
        setCameras(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedCamera(videoDevices[0].deviceId);
        }
      });
  }, []);

  useEffect(() => {
    if (model && selectedCamera) {
      startWebcam();
    }
  }, [model, selectedCamera]);

  const startWebcam = () => {
    if (videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }

    const constraints = {
      audio: false,
      video: {
        width: { ideal: VIDEO_WIDTH },
        height: { ideal: VIDEO_HEIGHT },
        deviceId: selectedCamera
      },
    };

    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play();
      };

      videoRef.current.onloadeddata = () => {
        const ctx = canvasRef.current.getContext("2d");
        const height = videoRef.current.videoHeight;
        const width = videoRef.current.videoWidth;

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
    if (!model) {
      setTimeout(detectFrame, 1000 / TARGET_FPS);
      return;
    }

    if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      model.detect(videoRef.current).then((predictions) => {
        // reset canvas
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        // reset game state
        const gameStateCopy = structuredClone(initialGameState);

        for (let i = 0; i < predictions.length; i++) {
          const prediction = predictions[i];
          drawDetection(ctx, prediction);
          updateGameState(prediction, gameStateCopy);
        }

        setGameState(gameStateCopy);
      });
    }

    setTimeout(detectFrame, 1000 / TARGET_FPS);
  };

  const drawDetection = (ctx, prediction) => {
    const x = prediction.bbox.x - prediction.bbox.width / 2;
    const y = prediction.bbox.y - prediction.bbox.height / 2;
    const width = prediction.bbox.width;
    const height = prediction.bbox.height;

    ctx.strokeStyle = COLORS[prediction.class];
    ctx.lineWidth = "2";
    ctx.strokeRect(x, y, width, height);
  }

  const updateGameState = (prediction, gameStateCopy) => {
    const centerPoint = {
      x: prediction.bbox.x / canvasRef.current.width,
      y: prediction.bbox.y / canvasRef.current.height
    };

    Object.entries(GUIDES).forEach(([guideName, guide]) => {
      if (isPointInPolygon(centerPoint, guide.slice(1))) {
        gameStateCopy[guideName].push(prediction.class);
      }
    });
  }

  const handleSuggestMoves = () => {
    const suggestedMoves = rankPossiblePlays(gameState).slice(0, 5);
    setSuggestedMoves(suggestedMoves);
  }

  return (
    <div>
      <div className="relative">
        {/* video controls */}
        <div className="absolute top-2 right-2 z-10">
          <select
            className="bg-white p-2 rounded"
            value={selectedCamera || ""}
            onChange={(e) => setSelectedCamera(e.target.value)}
          >
            {cameras.map(camera => (
              <option key={camera.deviceId} value={camera.deviceId}>
                {camera.label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 ml-3">
            <input type="checkbox" onChange={(e) => drawGuides(e.target.checked)} />
            <span>Show guides</span>
          </label>
        </div>
        {/* video */}
        <video
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
          ref={videoRef}
          className="relative"
        />
        <canvas
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
          ref={canvasRef}
          className="absolute top-0 left-0"
        />
        <canvas
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
          ref={guidesRef}
          className="absolute top-0 left-0"
        />
      </div>
      {/* game controls */}
      <div className="p-2">
        <button className="px-4 py-2 rounded mb-2 flex items-center gap-2" onClick={handleSuggestMoves}>
          <svg className="w-4 h-4 text-white fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M349.4 44.6c5.9-13.7 1.5-29.7-10.6-38.5s-28.6-8-39.9 1.8l-256 224c-10 8.8-13.6 22.9-8.9 35.3S50.7 288 64 288l111.5 0L98.6 467.4c-5.9 13.7-1.5 29.7 10.6 38.5s28.6 8 39.9-1.8l256-224c10-8.8 13.6-22.9 8.9-35.3s-16.6-20.7-30-20.7l-111.5 0L349.4 44.6z"/></svg>
          Suggest Moves
        </button>
        <div className="p-1">
          {suggestedMoves.map((move, index) => (
            <div key={index} className="mt-2">
              Pick {move.pick.count}
              {" "}
              <span
                className="px-2 py-1 rounded-full text-sm"
                style={{ backgroundColor: COLORS[move.pick.color], color: TEXT_COLORS[move.pick.color] }}
              >
                {move.pick.color.replace("_", " ")}
              </span>
              {" "}
              from
              {" "}
              <span
                className="px-2 py-1 rounded-full bg-slate-300 text-sm"
              >
                {move.pick.display.replace("disp", "display ")}
              </span>
              {" "}
              and place in
              {" "}
              <span className="px-2 py-1 rounded-full bg-slate-300 text-sm">row {move.row}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
