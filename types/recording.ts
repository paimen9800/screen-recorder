export type RecordingStatus =
  | "idle"
  | "countdown"
  | "recording"
  | "paused"
  | "processing"
  | "uploading";

export interface WebcamPosition {
  x: number;
  y: number;
}

export type WebcamPlacement =
  | "bottom-left"
  | "bottom-right"
  | "top-left"
  | "top-right";

export interface RecordingSettings {
  webcamEnabled: boolean;
  micEnabled: boolean;
  webcamPlacement: WebcamPlacement;
}
