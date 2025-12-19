import React from 'react';
import { Home, Users, Package, FileText, Settings } from 'lucide-react';

const BottomNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'dashboard', label: '首頁', icon: Home },
    { id: 'roster', label: '客戶', icon: Users },
    { id: 'inventory', label: '庫存', icon: Package },
    { id: 'records', label: '紀錄', icon: FileText },
    { id: 'settings', label: '設定', icon: Settings },
  ];

  return (
    // 修改重點：
    // 1. py-2: 縮小上下內距，讓導航列變矮
    // 2. shadow-...: 維持您喜歡的深色上浮陰影
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 px-6 py-2 z-40 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.15)] safe-area-bottom">
      <div className="flex justify-between items-center max-w-md mx-auto h-full">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center w-14 transition-all duration-300 group ${
                // 點擊時微幅上移
                isActive ? '-translate-y-1' : 'translate-y-0'
              }`}
            >
              <div 
                className={`p-1.5 rounded-2xl transition-all duration-300 mb-0.5 ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100' 
                    : 'bg-transparent text-gray-400 group-active:text-gray-600'
                }`}
              >
                {/* 恢復適當的圖示大小 */}
                <tab.icon size={isActive ? 22 : 20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span 
                className={`text-[10px] font-bold leading-none transition-colors duration-300 ${
                  isActive ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;