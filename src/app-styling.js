import styled from "styled-components";
import Webcam from "react-webcam";

export const Camera = styled(Webcam)`
  position: absolute;
  right: 20px;
  text-align: center;
  z-index: 9;
  width: 640px;
  height: 480px;
`;

export const Canvas = styled.canvas`
  position: absolute;
  right: 20px;
  text-align: center;
  z-index: 9;
  width: 640px;
  height: 480px;
`;

export const Photo = styled.img`
  position: absolute;
  left: 20px;
  text-align: center;
  z-index: 9;
  width: 640px;
  height: 480px;
`;

export const ImageCanvas = styled.canvas`
  position: absolute;
  left: 20px;
  text-align: center;
  z-index: 9;
  width: 640px;
  height: 480px;
`;

export const Controls = styled.div`
  margin-bottom: 20px;
`;

export const ControlButton = styled.button`
  margin-right: 10px;
`;
