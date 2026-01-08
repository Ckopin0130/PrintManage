import React from 'react';
import { 
  Database, Save, Download, Upload, RefreshCcw, RefreshCw, Loader2, Cloud, Trash2, Clock, ArrowLeft 
} from 'lucide-react';

const Settings = ({ 
  dbStatus, customerCount, recordCount, 
  onExport, onImport, onReset, isProcessing,
  cloudBackups = [], onCreateCloudBackup, onRestoreFromCloud, onDeleteCloudBackup,
  onBack // 接收返回函式
}) => {
  return (
    <div className="bg-slate-50 min-h-screen pb-24 font-sans flex flex-col">
       {/* 1. 置頂標題列 (與 TrackingView / RecordList 風格一致) */}
       <div className="bg-white shadow-sm sticky top-0 z-30 border-b border-slate-200">
          <div className="px-4 py-3 flex items-center">
             <button 
               onClick={onBack} 
               className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
             >
               <ArrowLeft size={22} />
             </button>
             <h2 className="text-lg font-bold text-slate-800 ml-1">系統設定</h2>
          </div>
       </div>
       
       {/* 2. 內容區域 (加入 Padding) */}
       <div className="p-6 space-y-5">
           
           {/* 資料庫狀態 */}
           <div className="bg-white p-5 rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] border border-slate-100">
              <h3 className="font-bold text-slate-700 mb-4 flex items-center pb-2 border-b border-slate-50">
                <Database size={20} className="mr-2.5 text-blue-500"/> 資料庫狀態
              </h3>
              <div className="space-y-4 text-sm text-slate-600">
                 <div className="flex justify-between items-center">
                    <span className="font-bold">連線狀態</span>
                    <span className={`font-bold flex items-center px-3 py-1 rounded-full text-xs ${dbStatus === 'online' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : (dbStatus === 'demo' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-rose-50 text-rose-600 border border-rose-100')}`}>
                       {dbStatus === 'online' ? '線上模式' : (dbStatus === 'demo' ? '離線演示' : '離線')}
                    </span>
                 </div>
                 <div className="flex justify-between items-center"><span className="font-bold">客戶總數</span><span className="font-extrabold text-lg text-slate-800">{customerCount}</span></div>
                 <div className="flex justify-between items-center"><span className="font-bold">維修總數</span><span className="font-extrabold text-lg text-slate-800">{recordCount}</span></div>
              </div>
           </div>

           {/* 雲端還原中心 */}
           <div className="bg-white p-5 rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] border border-blue-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5"><Cloud size={120} className="text-blue-600"/></div>
              <h3 className="font-bold text-slate-700 mb-4 flex items-center pb-2 border-b border-slate-50 relative z-10">
                <Cloud size={20} className="mr-2.5 text-blue-600"/> 雲端備份 (推薦)
              </h3>
              
              <button onClick={onCreateCloudBackup} disabled={isProcessing} className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mb-5 relative z-10">
                  {isProcessing ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Save size={18} className="mr-2" />}
                  建立新的還原點
              </button>

              <div className="space-y-2 relative z-10">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">可用還原點</h4>
                {cloudBackups.length === 0 ? (
                    <div className="text-center py-4 text-slate-400 text-xs bg-slate-50 rounded-xl font-bold">尚無雲端備份</div>
                ) : (
                    <div className="max-h-52 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {cloudBackups.map((backup, idx) => {
                            const dateLabel = backup.displayDate || (backup.time ? backup.time.split(' ')[0] : '未知日期');
                            const timeLabel = backup.displayTime || (backup.time ? backup.time.split(' ')[1] : '');
                            const stats = backup.stats || {};
                            return (
                                <div key={backup.id || idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                                    <div>
                                        <div className="text-xs font-bold text-slate-700 flex items-center"><Clock size={12} className="mr-1.5 text-slate-400"/> {dateLabel}</div>
                                        <div className="text-[10px] text-slate-400 pl-4 mt-0.5">{timeLabel}</div>
                                        {(stats.customers || stats.records || stats.inventory) && (
                                            <div className="text-[10px] text-slate-400 pl-4 mt-0.5">
                                                {`客戶 ${stats.customers ?? '-'} · 維修 ${stats.records ?? '-'} · 庫存 ${stats.inventory ?? '-'}`}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => onRestoreFromCloud(backup)} disabled={isProcessing} className="px-3 py-1.5 bg-white text-blue-600 border border-blue-100 rounded-lg text-[10px] font-bold hover:bg-blue-50 active:scale-95 transition-transform shadow-sm">還原</button>
                                        <button onClick={() => onDeleteCloudBackup(backup)} disabled={isProcessing} className="p-1.5 bg-white text-rose-400 border border-rose-100 rounded-lg hover:text-rose-600 hover:bg-rose-50 active:scale-95 transition-transform shadow-sm"><Trash2 size={14}/></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
              </div>
           </div>

           {/* 本機檔案備份 */}
           <div className="bg-white p-5 rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] border border-slate-100">
              <h3 className="font-bold text-slate-700 mb-4 flex items-center pb-2 border-b border-slate-50">
                <Save size={20} className="mr-2.5 text-emerald-500"/> 本機檔案備份
              </h3>
              <div className="space-y-3">
                 <button onClick={onExport} disabled={isProcessing} className="w-full py-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl font-bold hover:bg-emerald-100 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50 text-sm">
                     <Download size={16} className="mr-2" /> 下載備份檔 (JSON)
                 </button>

                 <label className={`w-full py-3 bg-white border border-slate-200 text-slate-500 rounded-xl font-bold hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer text-sm ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                     <Upload size={16} className="mr-2" /> 匯入舊檔案
                     <input type="file" accept=".json" className="hidden" onChange={onImport} disabled={isProcessing} />
                 </label>
              </div>
           </div>

           {/* 危險區域 */}
           <div className="bg-white p-5 rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] border border-rose-100">
              <h3 className="font-bold text-slate-700 mb-4 flex items-center pb-2 border-b border-slate-50">
                <RefreshCcw size={20} className="mr-2.5 text-rose-500"/> 危險操作
              </h3>
              <button onClick={onReset} disabled={isProcessing} className="w-full py-3 bg-rose-50 border border-rose-100 text-rose-500 rounded-xl font-bold hover:bg-rose-100 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50 text-sm">
                 {isProcessing ? <Loader2 size={16} className="mr-2 animate-spin" /> : <RefreshCw size={16} className="mr-2" />}
                 重置並匯入預設資料
              </button>
           </div>
           
           <div className="text-center text-[10px] font-bold text-slate-300 tracking-widest pt-4">SYSTEM V11.20</div>
       </div>
   </div>
  );
};

export default Settings;