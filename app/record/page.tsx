"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useScreenRecorder } from "@/hooks/useScreenRecorder";
import { useVideoUpload } from "@/hooks/useVideoUpload";
import { RecordingControls } from "@/components/recording/RecordingControls";
import { WebcamOverlay } from "@/components/recording/WebcamOverlay";
import { CountdownOverlay } from "@/components/recording/CountdownOverlay";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/format";
import { ArrowLeft, Download, Save, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";

export default function RecordPage() {
  const router = useRouter();
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState("");

  const {
    status,
    duration,
    webcamEnabled,
    micEnabled,
    recordedBlob,
    error,
    webcamStream,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    toggleWebcam,
    toggleMic,
    updateWebcamPosition,
    discardRecording,
    canvasRef,
  } = useScreenRecorder();

  const { upload, uploading, progress } = useVideoUpload();

  const previewUrl = useMemo(
    () => (recordedBlob ? URL.createObjectURL(recordedBlob) : null),
    [recordedBlob]
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleSave = async () => {
    if (!recordedBlob) return;

    const videoId = await upload(recordedBlob, {
      title: title || `録画 ${new Date().toLocaleString("ja-JP")}`,
      durationSeconds: duration,
    });

    if (videoId) {
      router.push(`/watch/${videoId}`);
    }
  };

  const handleDownload = () => {
    if (!recordedBlob) return;
    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recording-${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isActive = status === "countdown" || status === "recording" || status === "paused";
  const showPreview = status === "processing" && recordedBlob;

  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          ダッシュボードに戻る
        </Link>
      </div>

      {/* 常にDOMに存在するCanvas（非表示時は画面外） */}
      <canvas
        ref={canvasRef}
        className="fixed -left-[9999px] -top-[9999px]"
        aria-hidden="true"
      />

      {/* メインエリア */}
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        {/* エラー表示 */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/20 px-4 py-2 text-red-300">
            {error}
          </div>
        )}

        {/* アイドル状態 */}
        {status === "idle" && !recordedBlob && (
          <div className="flex flex-col items-center gap-8 text-center">
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-white">画面録画</h1>
              <p className="text-gray-400 max-w-md">
                画面とカメラを同時に録画できます。録画ボタンを押すと画面共有のダイアログが表示されます。
              </p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <RecordingControls
                status={status}
                duration={duration}
                webcamEnabled={webcamEnabled}
                micEnabled={micEnabled}
                onStart={startRecording}
                onStop={stopRecording}
                onPause={pauseRecording}
                onResume={resumeRecording}
                onToggleWebcam={toggleWebcam}
                onToggleMic={toggleMic}
              />
              <p className="text-xs text-gray-500">
                Chrome / Edge 推奨
              </p>
            </div>
          </div>
        )}

        {/* カウントダウン */}
        {status === "countdown" && <CountdownOverlay />}

        {/* 録画中：プレビュー */}
        {(status === "recording" || status === "paused") && (
          <div className="flex flex-col items-center gap-6 w-full max-w-4xl">
            <div
              ref={previewContainerRef}
              className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-gray-800"
            >
              {/* Canvasの映像をvideoで表示 */}
              <CanvasPreview canvasRef={canvasRef} />
              <WebcamOverlay
                stream={webcamStream}
                enabled={webcamEnabled}
                onPositionChange={updateWebcamPosition}
                containerRef={previewContainerRef as React.RefObject<HTMLDivElement>}
              />
            </div>

            <RecordingControls
              status={status}
              duration={duration}
              webcamEnabled={webcamEnabled}
              micEnabled={micEnabled}
              onStart={startRecording}
              onStop={stopRecording}
              onPause={pauseRecording}
              onResume={resumeRecording}
              onToggleWebcam={toggleWebcam}
              onToggleMic={toggleMic}
            />
          </div>
        )}

        {/* 録画完了：プレビュー＋保存 */}
        {showPreview && (
          <div className="flex flex-col items-center gap-6 w-full max-w-3xl">
            <h2 className="text-xl font-semibold text-white">録画プレビュー</h2>

            <div className="w-full aspect-video rounded-xl overflow-hidden bg-black border border-gray-800">
              <video
                src={previewUrl || undefined}
                controls
                className="w-full h-full"
              />
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>{formatDuration(duration)}</span>
              <span>|</span>
              <span>{(recordedBlob.size / (1024 * 1024)).toFixed(1)} MB</span>
            </div>

            {/* タイトル入力 */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="タイトルを入力（任意）"
              className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* アクションボタン */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSave}
                disabled={uploading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    アップロード中... {progress}%
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    保存して共有
                  </>
                )}
              </Button>

              <Button
                onClick={handleDownload}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <Download className="mr-2 h-4 w-4" />
                ダウンロード
              </Button>

              <Button
                onClick={discardRecording}
                variant="ghost"
                className="text-gray-400 hover:text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                破棄
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Canvasの合成映像をvideoタグでプレビュー表示するコンポーネント
function CanvasPreview({ canvasRef }: { canvasRef: React.RefObject<HTMLCanvasElement> }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const stream = canvas.captureStream(30);
    video.srcObject = stream;
    video.play().catch(() => {});

    return () => {
      video.srcObject = null;
    };
  }, [canvasRef]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="w-full h-full object-contain"
    />
  );
}
