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
    // 1. py-2 pb-5: 上方留白減少，下方留白增加(考量手機橫條)，整體視覺會上移
    // 2. shadow: 維持深色浮起陰影
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 px-6 py-2 pb-6 z-40 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.15)] safe-area-bottom">
      
      {/* 修改：items-center (垂直置中)，讓圖示不會沈在底下 */}
      <div className="flex justify-between items-center max-w-md mx-auto h-full">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center w-14 transition-all duration-300 group relative ${
                // 點擊時輕微上浮效果維持，但不需位移太多
                isActive ? '-translate-y-1' : 'translate-y-0'
              }`}
            >
              {/* 圖示容器：大幅縮減 mb (間距) */}
              <div 
                className={`p-1.5 rounded-2xl transition-all duration-300 mb-0.5 ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100' 
                    : 'bg-transparent text-gray-400 group-active:text-gray-600'
                }`}
              >
                {/* 圖示大小微調，讓比例更協調 */}
                <tab.icon size={isActive ? 24 : 22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              
              {/* 文字標籤：字體緊湊化 */}
              <span 
                className={`text-[10px] leading-none font-bold transition-colors duration-300 ${
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