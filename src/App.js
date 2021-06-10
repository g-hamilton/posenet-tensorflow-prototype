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
    // load posenet
    const net = await posenet.load({
      inputResolution: { width: 640, height: 480 },
      scale: 0.5,
    });
    // run pose detection every 100ms
    setInterval(() => {
      detect(net);
    }, 100);
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
      console.log(pose);
    }
  };

  // let's do this!
  runPosenet();

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
