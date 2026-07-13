"use client";

import Sidebar from "@/components/Sidebar";

export default function AppWorkspace() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      
      {/* 사이드바 (임시로 빈 값 전달) */}
      <Sidebar
        sessions={[]}
        activeSessionId={null}
        activeView="chat"
        onSelectSession={() => {}}
        onNewChat={() => {}}
        onDeleteSession={() => {}}
        onOpenLibrary={() => {}}
        onOpenReview={() => {}}
        onOpenRag={() => {}}
      />

      {/* 메인 영역 (흰 배경만) */}
      <div className="flex-1 min-w-0 bg-white flex items-center justify-center">
        <div className="text-center text-gray-400">
          <p className="text-lg">워크스페이스 영역</p>
          <p className="text-sm mt-1">아직 아무것도 없습니다.</p>
        </div>
      </div>
    </div>
  );
}
