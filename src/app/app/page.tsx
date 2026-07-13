"use client";

import { useState } from "react";
import SettingsModal from "@/components/SettingsModal";

export default function AppWorkspace() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      
      {/* 왼쪽 최소 프로필 바 */}
      <div className="w-16 border-r border-gray-200 flex flex-col items-center pt-6 bg-white">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
          title="설정"
        >
          👤
        </button>
      </div>

      {/* 메인 영역 (흰 배경) */}
      <div className="flex-1 min-w-0 bg-white flex items-center justify-center">
        <div className="text-center text-gray-400">
          <p className="text-lg">워크스페이스 영역</p>
          <p className="text-sm mt-1">아직 아무것도 없습니다.</p>
        </div>
      </div>

      {/* 설정 모달 */}
      <SettingsModal 
        open={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
}
