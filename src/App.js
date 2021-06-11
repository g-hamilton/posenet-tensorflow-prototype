import { useRef, useState, useEffect } from "react";

import { ProgressBar } from "react-bootstrap";

// eslint-disable-next-line no-unused-vars
import * as tf from "@tensorflow/tfjs";
import * as posenet from "@tensorflow-models/posenet";

import { StyledDropzone } from "./components/dropzone/dropzone";

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
  const poseFromPhoto = useRef(null);
  const photoVector = useRef(null);
  const overallMatchScore = useRef(null);
  const meaningfulFeedback = useRef(null);

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
    // console.log("starting detection");
    intervalRef.current = setInterval(() => {
      detect(posenetRef.current);
    }, 150);
  };

  // stop detecting pose
  const stopDetection = () => {
    // console.log("stopping detection");
    // stop active pose detection
    clearInterval(intervalRef.current);
    // clear the canvas
    setTimeout(() => {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }, 160);
    intervalRef.current = null;
    overallMatchScore.current = null;
    setUserPose(null);
  };

  // method to transform a pose object from posenet into a
  // vector (52-float) array of flattened data.
  // returns a vector array where...
  // Values 0-33: are x,y coordinates for 17 body parts in alphabetical order
  // Values 34-51: are confidence values for each of the 17 body parts in alphabetical order
  // Value 51: A sum of all the confidence values
  const composeVector = (pose) => {
    // copy the pose object to avoid mutating the original when sorting
    const p = JSON.parse(JSON.stringify(pose));
    // sort keypoints alphabetically
    p.keypoints.sort((a, b) => {
      const textA = a.part.toLowerCase();
      const textB = b.part.toLowerCase();
      return textA < textB ? -1 : textA > textB ? 1 : 0;
    });
    // init an empty array
    const flatArray = [];
    // iterate the sorted keypoints to extract x & y positions (filling values 0-33 of the vector array)
    p.keypoints.forEach((kp) => {
      flatArray.push(kp.position.x);
      flatArray.push(kp.position.y);
    });
    // iterate the sorted keypoints to extract each keypoint confidence score (filling values 34-51 of the vector array)
    p.keypoints.forEach((kp) => {
      flatArray.push(kp.score);
    });
    // extract the overall confidence score (filling value 52 of the vector array)
    flatArray.push(p.score);
    // return the vector
    return flatArray;
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

        // make pose detection
        const pose = await posenetRef.current.estimateSinglePose(resultCanvas);
        // console.log("estimated pose from uploaded image:", pose);

        // transform the keypoints object to a flat array
        if (pose) {
          // update refs
          poseFromPhoto.current = pose;
          photoVector.current = composeVector(poseFromPhoto.current);
          // console.log(
          //   "flattened keypoints array from uploaded image:",
          //   photoVector.current
          // );
        }

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

  const weightedDistanceMatching = (poseVector1, poseVector2) => {
    let vector1PoseXY = poseVector1.slice(0, 34);
    let vector1Confidences = poseVector1.slice(34, 51);
    let vector1ConfidenceSum = poseVector1.slice(51, 52);

    let vector2PoseXY = poseVector2.slice(0, 34);

    // First summation
    let summation1 = 1 / vector1ConfidenceSum;

    // Second summation
    let summation2 = 0;
    for (let i = 0; i < vector1PoseXY.length; i++) {
      let tempConf = Math.floor(i / 2);
      let tempSum =
        vector1Confidences[tempConf] *
        Math.abs(vector1PoseXY[i] - vector2PoseXY[i]);
      summation2 = summation2 + tempSum;
    }

    return summation1 * summation2;
  };

  const getMeaningfulFeedback = (score) => {
    switch (true) {
      case score < 100:
        return "Immaculate!";
      case score < 250:
        return "Incredible!";
      case score < 500:
        return "Really good!";
      case score < 1000:
        return "Almost there!";
      case score < 2000:
        return "Needs a little work";
      case score < 3000:
        return "Try to match the pose in the photo";
      default:
        return "Try to match the pose in the photo";
    }
  };

  // on first mount & when user pose data changes
  // we can try to compare the user pose with the uploaded photo pose
  // using the techniques used by Google's Move Mirror team:
  // https://medium.com/tensorflow/move-mirror-an-ai-experiment-with-pose-estimation-in-the-browser-using-tensorflow-js-2f7b769f9b23
  useEffect(() => {
    if (photoVector.current && userPose) {
      // flatten the keypoints object into a vector array
      const userVector = composeVector(userPose);
      // time to compare the two poses
      const result = weightedDistanceMatching(photoVector.current, userVector);
      overallMatchScore.current = result;
      // generate some kind of meaningful feedback for the user
      meaningfulFeedback.current = getMeaningfulFeedback(result);
    }
  }, [userPose]);

  // load posenet on app load
  loadPosenet();

  return (
    <div className="App">
      <header className="App-header">
        <div>
          <h1>Let's Flow! 🧘🏻‍♀️</h1>
          <StyledDropzone
            onDrop={(acceptedFiles) => onImageUpload(acceptedFiles[0])}
          />
        </div>
        <Controls>
          <ControlButton
            className="btn btn-sm btn-primary"
            onClick={runDetection}
          >
            Start Detection
          </ControlButton>
          <ControlButton
            className="btn btn-sm btn-primary"
            onClick={stopDetection}
          >
            Stop Detection
          </ControlButton>
          {overallMatchScore.current && (
            <ProgressBar
              now={((5000 - overallMatchScore.current) / 5000) * 100}
              animated
              striped
              variant="success"
              label={`${meaningfulFeedback.current}`}
            />
          )}
        </Controls>
        <div>
          <Photo id="thumb" src="" alt="upload a yoga pose photo to begin ⬆️" />
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
