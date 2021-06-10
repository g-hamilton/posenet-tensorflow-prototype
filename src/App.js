import { useRef } from "react";

import * as tf from "@tensorflow/tfjs";
import * as posenet from "@tensorflow-models/posenet";

import "./App.css";
import { Camera, Canvas } from "./app-styling";

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  // run posenet model
  // https://github.com/tensorflow/tfjs-models/tree/master/posenet
  const runPosenet = async () => {
    const net = await posenet.load({
      inputResolution: { width: 640, height: 480 },
      scale: 0.5,
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <Camera ref={webcamRef} />
        <Canvas ref={canvasRef} />
      </header>
    </div>
  );
}

export default App;
