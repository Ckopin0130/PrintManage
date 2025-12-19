import React from 'react';
import { Home, Users, Package, FileText, Settings } from 'lucide-react';

const BottomNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'dashboard', icon: Home, label: '首頁' }, // label 留著當 aria-label 用
    { id: 'roster', icon: Users, label: '客戶' },
    { id: 'inventory', icon: Package, label: '庫存' },
    { id: 'records', icon: FileText, label: '紀錄' },
    { id: 'settings', icon: Settings, label: '設定' },
  ];

  return (
    // 修改：py-3 pb-5 (高度縮小)，維持深色陰影
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 px-6 py-3 pb-5 z-40 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.15)] safe-area-bottom">
      <div className="flex justify-between items-center max-w-md mx-auto h-full">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              aria-label={tab.label}
              className={`flex items-center justify-center w-14 h-14 transition-all duration-300 group rounded-2xl ${
                // 點擊時輕微上浮與縮放
                isActive ? '-translate-y-2' : 'translate-y-0 hover:bg-gray-50'
              }`}
            >
              <div 
                className={`p-3 rounded-2xl transition-all duration-300 ${
                  isActive 
                    // 激活狀態：加強陰影與藍色背景，讓這顆按鈕像浮起來的寶石
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 ring-2 ring-white scale-110' 
                    : 'bg-transparent text-gray-400 group-active:scale-95'
                }`}
              >
                {/* 圖示稍微放大一點 (26px)，因為它是主角 */}
                <tab.icon size={26} strokeWidth={isActive ? 2.5 : 2} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;