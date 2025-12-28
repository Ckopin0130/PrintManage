import React from 'react';
import { Home, Users, Package, FileText, ClipboardList } from 'lucide-react';

const BottomNavigation = ({ activeTab, onTabChange, onOpenQuickAction }) => {
  // 定義所有 5 個按鈕，平均分散
  const allTabs = [
    { id: 'dashboard', icon: Home, label: '首頁' },
    { id: 'roster', icon: Users, label: '客戶' },
    { id: 'quick', icon: ClipboardList, label: '任務', isQuick: true },
    { id: 'inventory', icon: Package, label: '庫存' },
    { id: 'records', icon: FileText, label: '紀錄' },
  ];

  // 渲染單個 Tab 的輔助函數
  const renderTab = (tab) => {
    const isActive = activeTab === tab.id;
    
    // 如果是快速操作按鈕
    if (tab.isQuick) {
      return (
        <button
          key={tab.id}
          onClick={onOpenQuickAction}
          className="flex flex-col items-center justify-center flex-1 h-full active:scale-95 transition-transform"
        >
          <div className="p-1.5 rounded-xl transition-all duration-200 text-slate-400 bg-transparent">
            <tab.icon size={24} strokeWidth={2} />
          </div>
          <span className="text-[10px] font-bold mt-0.5 text-slate-400 transition-colors">
            {tab.label}
          </span>
        </button>
      );
    }
    
    // 一般 Tab
    return (
      <button
        key={tab.id}
        onClick={() => onTabChange(tab.id)}
        className="flex flex-col items-center justify-center flex-1 h-full active:scale-95 transition-transform"
      >
        <div 
          className={`p-1.5 rounded-xl transition-all duration-200 ${
            isActive 
              ? 'bg-blue-50 text-blue-600'
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
        {/* 5個按鈕平均分散 */}
        <div className="flex flex-1 justify-around h-full w-full">
          {allTabs.map(renderTab)}
        </div>
      </div>
    </div>
  );
};

export default BottomNavigation;