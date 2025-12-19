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
    // 維持深色陰影與高度設定
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 px-6 py-2 z-40 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.15)] safe-area-bottom">
      
      <div className="flex justify-between items-center max-w-md mx-auto h-full">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              aria-label={tab.label}
              className={`flex items-center justify-center w-14 h-12 transition-all duration-300 group rounded-xl relative ${
                isActive ? '-translate-y-1' : 'translate-y-0'
              }`}
            >
              <div 
                className={`p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center ${
                  isActive 
                    // 修改重點：改回之前的淺藍色背景 (bg-blue-50) 與深藍文字 (text-blue-600)
                    // 移除了原本的 bg-blue-600 (深藍色塊)
                    ? 'bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100 scale-110' 
                    : 'bg-transparent text-gray-400 group-active:scale-95 group-hover:text-gray-600'
                }`}
              >
                {/* 圖示大小維持稍微放大，視覺更清晰 */}
                <tab.icon size={isActive ? 28 : 26} strokeWidth={isActive ? 2.5 : 2} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;