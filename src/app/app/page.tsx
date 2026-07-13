"use client";

import { useState } from "react";
import SettingsModal from "@/components/SettingsModal";

export default function AppWorkspace() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // 임시 사용자 정보 (나중에 실제 데이터로 교체)
  const userName = "홍길동";
  const userPlan = "Pro";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      
      {/* 왼쪽 최소 프로필 바 */}
      <div className="w-16 border-r border-gray-200 flex flex-col justify-between bg-white">
        
        {/* 상단 여백 */}
        <div></div>

        {/* 하단 프로필 영역 */}
        <div className="p-3 border-t border-gray-200 relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-gray-300 flex-shrink-0" />
            <div className="text-left min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{userName}</div>
              <div className="text-xs text-gray-500">{userPlan}</div>
            </div>
          </button>

          {/* 프로필 드롭다운 메뉴 */}
          {showProfileMenu && (
            <div className="absolute bottom-full left-3 mb-2 w-44 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  setIsSettingsOpen(true);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
              >
                설정
              </button>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  // 로그아웃 로직 (나중에 연결)
                  alert("로그아웃 (추후 연결)");
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
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
