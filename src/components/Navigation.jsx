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
          <tab.icon size={26} strokeWidth={isActive ? 2.5 : 2} />
        </div>
        <span className={`text-[10px] font-bold mt-0.5 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
            {tab.label}
        </span>
      </button>
    );
  };

  return (
    // 容器設定：固定高度 80px (h-20)，背景模糊，陰影
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 pb-safe z-40 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)] h-20">
      <div className="flex justify-between items-center max-w-md mx-auto h-full px-2 relative">
        
        {/* 左側 Tabs (佔 40% 寬度) */}
        <div className="flex flex-1 justify-around">
          {leftTabs.map(renderTab)}
        </div>

        {/* 中間凸出的 + 號按鈕 (佔 20% 寬度，絕對定位) */}
        <div className="w-20 relative flex justify-center">
           <button
             onClick={onOpenQuickAction}
             // 修正：顏色改為 bg-blue-400 (較淡)，移除下方文字
             className="absolute -top-10 w-14 h-14 rounded-full bg-blue-400 text-white shadow-lg shadow-blue-200 flex items-center justify-center transform transition-transform active:scale-90 hover:bg-blue-500 border-4 border-slate-50"
           >
             <Plus size={30} strokeWidth={3} />
           </button>
        </div>

        {/* 右側 Tabs (佔 40% 寬度) */}
        <div className="flex flex-1 justify-around">
          {rightTabs.map(renderTab)}
        </div>

      </div>
    </div>
  );
};

export default BottomNavigation;