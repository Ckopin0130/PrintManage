import React from 'react';
import { Home, Users, Package, FileText, Plus } from 'lucide-react';

const BottomNavigation = ({ activeTab, onTabChange, onOpenQuickAction }) => {
  // 定義左側與右側的按鈕群
  const leftTabs = [
    { id: 'dashboard', icon: Home, label: '首頁' },
    { id: 'roster', icon: Users, label: '客戶' },
  ];
  
  const rightTabs = [
    { id: 'inventory', icon: Package, label: '庫存' },
    { id: 'records', icon: FileText, label: '紀錄' },
  ];

  // 渲染單個 Tab 的輔助函數
  const renderTab = (tab) => {
    const isActive = activeTab === tab.id;
    return (
      <button
        key={tab.id}
        onClick={() => onTabChange(tab.id)}
        className={`flex flex-col items-center justify-center w-16 h-full transition-all duration-300 ${
          isActive ? '-translate-y-1' : ''
        }`}
      >
        <div 
          className={`p-2 rounded-2xl transition-all duration-300 ${
            isActive 
              ? 'bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100 scale-110' 
              : 'text-gray-400 hover:text-gray-600 bg-transparent'
          }`}
        >
          <tab.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
        </div>
        <span className={`text-[10px] font-bold mt-1 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
            {tab.label}
        </span>
      </button>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 pb-safe z-40 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.05)] h-[80px]">
      <div className="flex justify-between items-center max-w-md mx-auto h-16 px-4 relative">
        
        {/* 左側 Tabs */}
        <div className="flex gap-2">
          {leftTabs.map(renderTab)}
        </div>

        {/* 中間凸出的 + 號按鈕 (浮動) */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-6">
           <button
             onClick={onOpenQuickAction}
             className="w-16 h-16 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-200 flex items-center justify-center transform transition-transform active:scale-90 hover:bg-blue-700 border-4 border-gray-50"
           >
             <Plus size={32} strokeWidth={3} />
           </button>
           {/* 下方文字 */}
           <div className="text-[10px] font-bold text-gray-400 text-center mt-1">快速</div>
        </div>

        {/* 右側 Tabs */}
        <div className="flex gap-2">
          {rightTabs.map(renderTab)}
        </div>

      </div>
    </div>
  );
};

export default BottomNavigation;