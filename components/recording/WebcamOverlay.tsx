"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import type { WebcamPosition } from "@/types/recording";

interface WebcamOverlayProps {
  stream: MediaStream | null;
  enabled: boolean;
  onPositionChange: (position: WebcamPosition) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

export function WebcamOverlay({
  stream,
  enabled,
  onPositionChange,
  containerRef,
}: WebcamOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!enabled || !stream) return null;

  return (
    <motion.div
      drag
      dragConstraints={containerRef}
      dragMomentum={false}
      onDragEnd={(_, info) => {
        const container = containerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const x = (info.point.x - rect.left) / rect.width;
        const y = (info.point.y - rect.top) / rect.height;
        onPositionChange({
          x: Math.max(0, Math.min(0.85, x)),
          y: Math.max(0, Math.min(0.85, y)),
        });
      }}
      className="absolute bottom-6 left-6 z-10 cursor-grab active:cursor-grabbing"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
    >
      <div className="h-[140px] w-[140px] overflow-hidden rounded-full border-[3px] border-white shadow-2xl">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover mirror"
          style={{ transform: "scaleX(-1)" }}
        />
      </div>
    </motion.div>
  );
}
