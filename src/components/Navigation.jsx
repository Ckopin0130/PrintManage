import React from 'react';
import { Home, Users, Package, FileText, Settings } from 'lucide-react';

const BottomNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'dashboard', icon: Home, label: '首頁' },
    { id: 'roster', icon: Users, label: '客戶' },
    { id: 'inventory', icon: Package, label: '庫存' },
    { id: 'records', icon: FileText, label: '紀錄' },
    { id: 'settings', icon: Settings, label: '設定' },
  ];

  return (
    // 修改：py-2 (高度縮小)，維持深色陰影讓它浮起來
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 px-6 py-2 z-40 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.15)] safe-area-bottom">
      
      {/* items-center 確保垂直置中 */}
      <div className="flex justify-between items-center max-w-md mx-auto h-full">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              aria-label={tab.label}
              className={`flex items-center justify-center w-14 h-12 transition-all duration-300 group rounded-xl relative ${
                // 點擊時輕微上浮
                isActive ? '-translate-y-1' : 'translate-y-0'
              }`}
            >
              <div 
                className={`p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center ${
                  isActive 
                    // 激活狀態：藍色背景、深陰影、稍微放大
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200 ring-2 ring-white scale-110' 
                    : 'bg-transparent text-gray-400 group-active:scale-95 group-hover:text-gray-600'
                }`}
              >
                {/* 圖示放大：28px (Active) / 26px (Inactive) */}
                <tab.icon size={isActive ? 28 : 26} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              
              {/* (選用) 底部小圓點指示器，增加一點點細節 */}
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full opacity-0"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;