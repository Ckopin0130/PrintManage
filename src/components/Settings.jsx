import React from 'react';
import { 
  Database, Save, Download, Upload, RefreshCcw, RefreshCw, Loader2, Cloud, Trash2, Clock 
} from 'lucide-react';

const Settings = ({ 
  dbStatus, customerCount, recordCount, 
  onExport, onImport, onReset, isProcessing,
  // 接收雲端備份相關 Props
  cloudBackups = [], onCreateCloudBackup, onRestoreFromCloud, onDeleteCloudBackup
}) => {
  return (
    <div className="bg-gray-50 min-h-screen pb-24 p-6 animate-in">
       <h2 className="text-2xl font-bold text-gray-800 mb-6">設定</h2>
       
       {/* 資料庫狀態 */}
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

       {/* ★ 新增：雲端還原中心 (適合手機使用) */}
       <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10"><Cloud size={100} className="text-blue-500"/></div>
          <h3 className="font-bold text-gray-700 mb-4 flex items-center border-b pb-2 relative z-10">
            <Cloud size={20} className="mr-2 text-blue-500"/> 雲端還原中心 (推薦)
          </h3>
          
          <button onClick={onCreateCloudBackup} disabled={isProcessing} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mb-6 relative z-10">
              {isProcessing ? <Loader2 size={20} className="mr-2 animate-spin" /> : <Save size={20} className="mr-2" />}
              建立新的還原點
          </button>

          <div className="space-y-3 relative z-10">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">可用還原點</h4>
            {cloudBackups.length === 0 ? (
                <div className="text-center py-4 text-gray-400 text-sm bg-gray-50 rounded-xl">尚無雲端備份</div>
            ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {cloudBackups.map((backup, idx) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex justify-between items-center">
                            <div>
                                <div className="text-sm font-bold text-gray-700 flex items-center"><Clock size={14} className="mr-1 text-gray-400"/> {backup.time.split(' ')[0]}</div>
                                <div className="text-xs text-gray-400 pl-4">{backup.time.split(' ')[1]}</div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => onRestoreFromCloud(backup)} disabled={isProcessing} className="px-3 py-1.5 bg-white text-blue-600 border border-blue-200 rounded-lg text-xs font-bold hover:bg-blue-50 active:scale-95 transition-transform">還原</button>
                                <button onClick={() => onDeleteCloudBackup(backup)} disabled={isProcessing} className="p-1.5 bg-white text-red-400 border border-gray-200 rounded-lg hover:text-red-600 hover:bg-red-50 active:scale-95 transition-transform"><Trash2 size={14}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </div>
       </div>

       {/* 傳統檔案備份 (保留作為備用) */}
       <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <h3 className="font-bold text-gray-700 mb-4 flex items-center border-b pb-2">
            <Save size={20} className="mr-2 text-green-500"/> 本機檔案備份
          </h3>
          <div className="space-y-3">
             <button onClick={onExport} disabled={isProcessing} className="w-full py-3 bg-green-50 border border-green-100 text-green-600 rounded-xl font-bold hover:bg-green-100 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50">
                 <Download size={18} className="mr-2" /> 下載備份檔 (JSON)
             </button>

             <label className={`w-full py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center cursor-pointer ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                 <Upload size={18} className="mr-2" /> 匯入舊檔案
                 <input type="file" accept=".json" className="hidden" onChange={onImport} disabled={isProcessing} />
             </label>
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
       <div className="text-center text-xs text-gray-300 mt-10">System v11.19 (Cloud Enabled)</div>
   </div>
  );
};

export default Settings;