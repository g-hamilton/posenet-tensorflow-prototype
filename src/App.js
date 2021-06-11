import { useRef, useState } from "react";

// eslint-disable-next-line no-unused-vars
import * as tf from "@tensorflow/tfjs";
import * as posenet from "@tensorflow-models/posenet";

import Dropzone from "react-dropzone";

import "./App.css";
import {
  Camera,
  Canvas,
  Photo,
  ImageCanvas,
  Controls,
  ControlButton,
} from "./app-styling";
import { drawKeypoints, drawSkeleton } from "./utils";

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const posenetRef = useRef(null);
  const intervalRef = useRef(null);
  const imageCanvasRef = useRef(null);

  const [poseFromPhoto, setPoseFromPhoto] = useState(null);
  const [userPose, setUserPose] = useState(null);

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

      // update state
      setUserPose(pose);

      // draw the estimated pose to the canvas
      drawCanvas(pose, videoWidth, videoHeight, canvasRef.current);
    }
  };

  // draw to canvas
  const drawCanvas = (pose, videoWidth, videoHeight, canvas) => {
    const ctx = canvas.getContext("2d");
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    drawKeypoints(pose["keypoints"], 0.5, ctx);
    drawSkeleton(pose["keypoints"], 0.5, ctx);
  };

  // start detecting pose
  const runDetection = () => {
    console.log("starting detection");
    intervalRef.current = setInterval(() => {
      detect(posenetRef.current);
    }, 150);
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
    }, 160);
    intervalRef.current = null;
  };

  // on image upload
  const onImageUpload = (file) => {
    // optimise & display the image
    const URL = window.URL || window.webkitURL;
    const MAX_SIZE_IMG_W = 640;
    const MAX_SIZE_IMG_H = 480;
    const imageObj = new Image();
    const resultCanvas = document.createElement("canvas");

    imageObj.onload = function () {
      const ratio = this.width / this.height;
      const maxRatio = MAX_SIZE_IMG_W / MAX_SIZE_IMG_H;

      if (this.width <= MAX_SIZE_IMG_W && this.height <= MAX_SIZE_IMG_H) {
        resultCanvas.width = this.width;
        resultCanvas.height = this.height;
      } else if (ratio >= maxRatio) {
        // base on MAX_SIZE_IMG_W
        resultCanvas.width = MAX_SIZE_IMG_W;
        resultCanvas.height = resultCanvas.width / ratio;
      } else {
        // base on MAX_SIZE_IMG_H
        resultCanvas.height = MAX_SIZE_IMG_H;
        resultCanvas.width = resultCanvas.height * ratio;
      }
      resultCanvas
        .getContext("2d")
        .drawImage(this, 0, 0, resultCanvas.width, resultCanvas.height);

      resultCanvas.toBlob(async (blob) => {
        const base64Data = resultCanvas.toDataURL("image/jpeg");
        document.getElementById("thumb").src = base64Data;

        // make pose detections
        const pose = await posenetRef.current.estimateSinglePose(resultCanvas);

        // update state
        setPoseFromPhoto(pose);
        console.log("estimated pose from uploaded image:", pose);

        // draw the estimated pose to the canvas
        drawCanvas(
          pose,
          resultCanvas.width,
          resultCanvas.height,
          imageCanvasRef.current
        );
      }, "image/jpeg");
    };
    imageObj.src = URL.createObjectURL(file);
  };

  // load posenet on app load
  loadPosenet();

  return (
    <div className="App">
      <header className="App-header">
        <div>
          <h1>Let's Flow! 🧘🏻‍♀️</h1>
          <Dropzone onDrop={(acceptedFiles) => onImageUpload(acceptedFiles[0])}>
            {({ getRootProps, getInputProps }) => (
              <section>
                <div {...getRootProps()}>
                  <input {...getInputProps()} />
                  <p>
                    Drag 'n' drop a yogo pose photo here, or click to select an
                    image file
                  </p>
                </div>
              </section>
            )}
          </Dropzone>
        </div>
        <Controls>
          <ControlButton onClick={runDetection}>Start Detection</ControlButton>
          <ControlButton onClick={stopDetection}>Stop Detection</ControlButton>
        </Controls>
        <div>
          <Photo id="thumb" src="" alt="upload a yoga pose photo to begin" />
          <ImageCanvas ref={imageCanvasRef} />
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
