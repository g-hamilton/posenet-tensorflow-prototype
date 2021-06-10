import { useRef } from "react";

import * as tf from "@tensorflow/tfjs";
import * as posenet from "@tensorflow-models/posenet";

import "./App.css";
import { Camera, Canvas } from "./app-styling";

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

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
