import React from 'react';
import { Database, Save, Download, Upload, RefreshCcw, RefreshCw, Loader2 } from 'lucide-react';

const Settings = ({ 
  dbStatus, customerCount, recordCount, 
  onExport, onImport, onReset, isProcessing // 接收 isProcessing 狀態
}) => {
  return (
    <div className="bg-gray-50 min-h-screen pb-24 p-6 animate-in">
       <h2 className="text-2xl font-bold text-gray-800 mb-6">設定</h2>
       
       {/* 資料庫狀態卡片 */}
       <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <h3 className="font-bold text-gray-700 mb-4 flex items-center border-b pb-2">
            <Database size={20} className="mr-2 text-blue-500"/> 資料庫狀態
          </h3>
          <div className="space-y-4 text-sm text-gray-600">
             <div className="flex justify-between items-center">
                <span>連線狀態</span>
                <span className={`font-bold flex items-center px-3 py-1 rounded-full text-xs ${dbStatus === 'online' ? 'bg-green-100 text-green-700' : (dbStatus === 'demo' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700')}`}>
                   {dbStatus === 'online' ? '線上模式' : (dbStatus === 'demo' ? '離線演示' : '離線')}
                </span>
             </div>
             <div className="flex justify-between"><span>客戶總數</span><span className="font-bold text-lg">{customerCount}</span></div>
             <div className="flex justify-between"><span>維修總數</span><span className="font-bold text-lg">{recordCount}</span></div>
          </div>
       </div>

       {/* 資料備份與還原卡片 */}
       <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <h3 className="font-bold text-gray-700 mb-4 flex items-center border-b pb-2">
            <Save size={20} className="mr-2 text-green-500"/> 資料備份與還原
          </h3>
          <div className="space-y-3">
             {/* 匯出按鈕 */}
             <button onClick={onExport} disabled={isProcessing} className="w-full py-3 bg-green-50 border border-green-100 text-green-600 rounded-xl font-bold hover:bg-green-100 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                 <Download size={18} className="mr-2" /> 建立還原點 (匯出 JSON)
             </button>

             {/* 匯入按鈕 (增加 Loading 狀態) */}
             <label className={`w-full py-3 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl font-bold hover:bg-blue-100 active:scale-95 transition-all flex items-center justify-center cursor-pointer ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                 {isProcessing ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Upload size={18} className="mr-2" />}
                 {isProcessing ? '資料還原中...' : '從檔案還原 (匯入 JSON)'}
                 <input type="file" accept=".json" className="hidden" onChange={onImport} disabled={isProcessing} />
             </label>
             <p className="text-xs text-gray-400 text-center mt-2">還原時請選擇先前建立的 backup_日期.json 檔案</p>
          </div>
       </div>

       {/* 危險區域 */}
       <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 mb-6">
          <h3 className="font-bold text-gray-700 mb-4 flex items-center border-b pb-2">
            <RefreshCcw size={20} className="mr-2 text-red-500"/> 危險操作區域
          </h3>
          <button onClick={onReset} disabled={isProcessing} className="w-full py-3 bg-red-50 border-2 border-red-100 text-red-500 rounded-xl font-bold hover:bg-red-100 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50">
             {isProcessing ? <Loader2 size={18} className="mr-2 animate-spin" /> : <RefreshCw size={18} className="mr-2" />}
             重置並匯入預設資料
          </button>
       </div>
       <div className="text-center text-xs text-gray-300 mt-10">System v11.18</div>
   </div>
  );
};

export default Settings;