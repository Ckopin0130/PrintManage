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
        // 修正：移除 translate-y 避免跑版，改用單純的顏色變化
        className="flex flex-col items-center justify-center flex-1 h-full active:scale-95 transition-transform"
      >
        <div 
          className={`p-1.5 rounded-xl transition-all duration-200 ${
            isActive 
              ? 'bg-blue-50 text-blue-600' // 選中狀態：不放大，僅變色
              : 'text-slate-400 bg-transparent'
          }`}
        >
          <tab.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
        </div>
        <span className={`text-[10px] font-bold mt-0.5 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
            {tab.label}
        </span>
      </button>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 pb-safe z-40 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)] h-16">
      <div className="flex justify-between items-center max-w-md mx-auto h-full px-2 relative">
        
        {/* 左側 Tabs */}
        <div className="flex flex-1 justify-around h-full">
          {leftTabs.map(renderTab)}
        </div>

        {/* 中間 + 號按鈕 (改為平面樣式，與兩側一致) */}
        <div className="flex flex-1 justify-center h-full">
           <button
             onClick={onOpenQuickAction}
             className="flex flex-col items-center justify-center flex-1 h-full active:scale-95 transition-transform group"
           >
             <div className="p-1.5 rounded-xl transition-all duration-200 bg-blue-50 text-blue-600 group-hover:bg-blue-100">
               <Plus size={24} strokeWidth={2.5} />
             </div>
             <span className="text-[10px] font-bold mt-0.5 text-blue-600">
                新增
             </span>
           </button>
        </div>

        {/* 右側 Tabs */}
        <div className="flex flex-1 justify-around h-full">
          {rightTabs.map(renderTab)}
        </div>

      </div>
    </div>
  );
};

export default BottomNavigation;