import React from 'react';
import { Home, Users, Package, FileText, Settings } from 'lucide-react';

const BottomNavigation = ({ activeTab, onTabChange }) => (
  <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-2 px-4 flex justify-between items-center z-40 safe-area-bottom shadow-[0_-5px_20px_rgba(0,0,0,0.03)] pb-safe">
    {[
      { id: 'dashboard', label: '首頁', icon: Home },
      { id: 'roster', label: '客戶', icon: Users },
      { id: 'inventory', label: '庫存', icon: Package },
      { id: 'records', label: '紀錄', icon: FileText },
      { id: 'settings', label: '設定', icon: Settings },
    ].map(tab => (
      <button type="button" key={tab.id} onClick={() => onTabChange(tab.id)} className={`flex flex-col items-center justify-center space-y-1 transition-all w-1/5 py-1 ${activeTab === tab.id ? 'text-blue-600 scale-105' : 'text-gray-400 hover:text-gray-600'}`}>
        <tab.icon size={22} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
        <span className="text-[10px] font-medium">{tab.label}</span>
      </button>
    ))}
  </div>
);

export default BottomNavigation;