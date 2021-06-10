import styled from "styled-components";
import Webcam from "react-webcam";

export const Camera = styled(Webcam)`
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

export const Canvas = styled.canvas`
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
