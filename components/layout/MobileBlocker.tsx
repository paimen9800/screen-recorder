"use client";

import { useEffect, useState } from "react";
import { Monitor } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export function MobileBlocker({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function checkMobile() {
      const mobile = window.innerWidth < 768;
      const hasDisplayMedia = "getDisplayMedia" in (navigator.mediaDevices || {});
      setIsMobile(mobile || !hasDisplayMedia);
    }

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (isMobile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 px-6">
        <div className="text-center space-y-4">
          <Monitor className="h-16 w-16 text-gray-500 mx-auto" />
          <h1 className="text-xl font-bold text-white">{APP_NAME}</h1>
          <p className="text-gray-400 max-w-sm">
            画面録画機能はデスクトップブラウザ（Chrome / Edge）でのみご利用いただけます。
            PCからアクセスしてください。
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
