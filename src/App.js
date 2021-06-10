import * as tf from "@tensorflow/tfjs";
import * as posenet from "@tensorflow-models/posenet";
import Webcam from "react-webcam";

import styled from "styled-components";

import "./App.css";

const Camera = styled(Webcam)`
  position: absolute;
  left: 0;
  right: 0;
  margin-left: auto;
  margin-right: auto;
  text-align: center;
  z-index: 9;
  width: 640px;
  height: 480px;
`;

const Canvas = styled.canvas`
  position: absolute;
  left: 0;
  right: 0;
  margin-left: auto;
  margin-right: auto;
  text-align: center;
  z-index: 9;
  width: 640px;
  height: 480px;
`;

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <Camera />
        <Canvas />
      </header>
    </div>
  );
}

export default App;
