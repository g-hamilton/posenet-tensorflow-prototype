import { useRef } from "react";

// eslint-disable-next-line no-unused-vars
import * as tf from "@tensorflow/tfjs";
import * as posenet from "@tensorflow-models/posenet";

import "./App.css";
import { Camera, Canvas } from "./app-styling";
import { drawKeypoints, drawSkeleton } from "./utils";

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const posenetRef = useRef(null);
  const intervalRef = useRef(null);

  // load posenet model
  // https://github.com/tensorflow/tfjs-models/tree/master/posenet
  const loadPosenet = async () => {
    posenetRef.current = await posenet.load({
      inputResolution: { width: 640, height: 480 },
      scale: 0.5,
    });
  };

  // detect poses
  const detect = async (net) => {
    // check webcam is ready
    if (
      typeof webcamRef.current !== undefined &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      // get video properties
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      // set video width
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      // make pose detections
      const pose = await net.estimateSinglePose(video);
      // console.log(pose);

      // draw the estimated pose to the canvas
      drawCanvas(pose, video, videoWidth, videoHeight, canvasRef);
    }
  };

  // draw to canvas
  const drawCanvas = (pose, video, videoWidth, videoHeight, canvas) => {
    const ctx = canvas.current.getContext("2d");
    canvas.current.width = videoWidth;
    canvas.current.height = videoHeight;

    drawKeypoints(pose["keypoints"], 0.5, ctx);
    drawSkeleton(pose["keypoints"], 0.5, ctx);
  };

  // start detecting pose
  const runDetection = () => {
    console.log("starting detection");
    intervalRef.current = setInterval(() => {
      detect(posenetRef.current);
    }, 100);
  };

  // stop detecting pose
  const stopDetection = () => {
    console.log("stopping detection");
    // stop active pose detection
    clearInterval(intervalRef.current);
    // clear the canvas
    setTimeout(() => {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }, 120);
    intervalRef.current = null;
  };

  // load posenet on app load
  loadPosenet();

  return (
    <div className="App">
      <header className="App-header">
        <div style={{ marginBottom: 20 }}>
          <h1>Let's Flow!</h1>
          <button onClick={runDetection}>Start Detection</button>
          <button onClick={stopDetection}>Stop Detection</button>
        </div>
        <div>
          <Camera ref={webcamRef} />
          <Canvas ref={canvasRef} />
        </div>
      </header>
    </div>
  );
}

export default App;
