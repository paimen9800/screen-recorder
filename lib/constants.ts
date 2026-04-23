export const APP_NAME = "ScreenRec";

export const RECORDING = {
  MAX_DURATION_SECONDS: 30 * 60, // 30 minutes
  CANVAS_FPS: 30,
  CHUNK_INTERVAL_MS: 1000,
  COUNTDOWN_SECONDS: 3,
  WEBCAM_SIZE_PX: 180,
  VIDEO_BITRATE: 5_000_000, // 5 Mbps
} as const;

export const CODEC_CANDIDATES = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
] as const;
