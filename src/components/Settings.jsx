import React from 'react';
import { Database, Save, Download, Upload, RefreshCcw, RefreshCw } from 'lucide-react';

const Settings = ({ 
  dbStatus, customerCount, recordCount, 
  onExport, onImport, onReset 
}) => {
  return (
    <div className="bg-gray-50 min-h-screen pb-24 p-6 animate-in">
       <h2 className="text-2xl font-bold text-gray-800 mb-6">設定</h2>
       <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <h3 className="font-bold text-gray-700 mb-4 flex items-center border-b pb-2"><Database size={20} className="mr-2 text-blue-500"/> 資料庫狀態</h3>
          <div className="space-y-4 text-sm text-gray-600">
             <div className="flex justify-between items-center"><span>連線狀態</span><span className={`font-bold flex items-center px-3 py-1 rounded-full text-xs ${dbStatus === 'online' ? 'bg-green-100 text-green-700' : (dbStatus === 'demo' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700')}`}>{dbStatus === 'online' ? '線上模式' : (dbStatus === 'demo' ? '離線演示' : '離線')}</span></div>
             <div className="flex justify-between"><span>客戶總數</span><span className="font-bold text-lg">{customerCount}</span></div>
             <div className="flex justify-between"><span>維修總數 (顯示)</span><span className="font-bold text-lg">{recordCount}</span></div>
             <div className="flex justify-between"><span>版本</span><span className="font-mono text-gray-400">v11.17 (Stable)</span></div>
          </div>
       </div>
       <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <h3 className="font-bold text-gray-700 mb-4 flex items-center border-b pb-2"><Save size={20} className="mr-2 text-green-500"/> 資料管理</h3>
          <div className="space-y-3">
             <button onClick={onExport} className="w-full py-3 bg-green-50 border border-green-100 text-green-600 rounded-xl font-bold hover:bg-green-100 active:scale-95 transition-all flex items-center justify-center">
                 <Download size={18} className="mr-2" /> 匯出目前資料 (JSON)
             </button>
             <label className="w-full py-3 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl font-bold hover:bg-blue-100 active:scale-95 transition-all flex items-center justify-center cursor-pointer">
                 <Upload size={18} className="mr-2" /> 匯入資料 (JSON)
                 <input type="file" accept=".json" className="hidden" onChange={onImport} />
             </label>
          </div>
       </div>
       <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <h3 className="font-bold text-gray-700 mb-4 flex items-center border-b pb-2"><RefreshCcw size={20} className="mr-2 text-red-500"/> 資料救援</h3>
          <button onClick={onReset} className="w-full py-3 bg-red-50 border-2 border-red-100 text-red-500 rounded-xl font-bold hover:bg-red-100 active:scale-95 transition-all flex items-center justify-center"><RefreshCw size={18} className="mr-2" />重置並匯入完整資料庫</button>
       </div>
       <div className="text-center text-xs text-gray-300 mt-10">Designed for Engineers</div>
   </div>
  );
};

export default Settings;