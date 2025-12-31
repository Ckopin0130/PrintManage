import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, ChevronLeft, ChevronRight, Copy, Check, 
  Calendar, FileText, Share2, Clipboard, List, PieChart
} from 'lucide-react';

const WorkLog = ({ records, customers, setCurrentView, showToast }) => {
  // 1. 設定日期 (預設今日)
  const todayStr = new Date().toLocaleDateString('en-CA');
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [viewMode, setViewMode] = useState('visual'); // 'visual' (圖文) 或 'text' (純文字)
  const [isCopied, setIsCopied] = useState(false);

  // 2. 切換日期的函數
  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toLocaleDateString('en-CA'));
  };

  const setQuickDate = (type) => {
    const d = new Date();
    if (type === 'yesterday') d.setDate(d.getDate() - 1);
    setSelectedDate(d.toLocaleDateString('en-CA'));
  };

  // 3. 篩選當日紀錄
  const targetRecords = useMemo(() => {
    return records.filter(r => {
      // 判斷邏輯：完修看完修日，其餘看建立日
      const recordDate = r.status === 'completed' && r.completedDate 
        ? r.completedDate 
        : r.date;
      return recordDate === selectedDate;
    });
  }, [records, selectedDate]);

  // 4. 生成日誌文字 (複製用)
  const logText = useMemo(() => {
      if (targetRecords.length === 0) return '';
      
      return targetRecords.map((r, i) => {
          const cust = customers.find(c => c.customerID === r.customerID);
          // 零件文字處理
          const partsText = (r.parts && r.parts.length > 0) 
              ? `\n    更換: ${r.parts.map(p => `${p.name} x${p.qty}`).join('、')}` 
              : '';
          
          // 狀態顯示轉換
          let statusText = '觀察';
          if (r.status === 'completed') statusText = '完修';
          if (r.status === 'pending' || r.status === 'tracking') statusText = '待料';

          // 格式化輸出
          return `${i+1}. ${cust?.name || '未知客戶'}${cust?.assets?.[0]?.model ? ` (${cust.assets[0].model})` : ''}\n    故障: ${r.fault || r.symptom}\n    處理: ${r.solution || r.action}${partsText}\n    狀態: ${statusText}`;
      }).join('\n\n');
  }, [targetRecords, customers]);

  // 5. 複製功能
  const handleCopy = () => {
      if (!logText) return;
      navigator.clipboard.writeText(logText).then(() => {
          setIsCopied(true);
          if (showToast) showToast('日誌已複製到剪貼簿', 'success');
          setTimeout(() => setIsCopied(false), 2000);
      });
  };

  // 6. 計算當日統計
  const stats = useMemo(() => {
      const total = targetRecords.length;
      const completed = targetRecords.filter(r => r.status === 'completed').length;
      const pending = targetRecords.filter(r => r.status === 'pending' || r.status === 'tracking').length;
      const monitor = targetRecords.filter(r => r.status === 'monitor').length;
      return { total, completed, pending, monitor };
  }, [targetRecords]);

  // 輔助顯示標題
  const getDisplayTitle = () => {
      if (selectedDate === todayStr) return '今日 (Today)';
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (selectedDate === yesterday.toLocaleDateString('en-CA')) return '昨日 (Yesterday)';
      return selectedDate;
  };

  return (
     <div className="bg-slate-50 min-h-screen pb-24 font-sans flex flex-col">
      
      {/* --- 頂部導航 --- */}
      <div className="bg-white px-4 py-3 shadow-sm sticky top-0 z-30 border-b border-slate-200">
         <div className="flex items-center justify-between">
             <div className="flex items-center">
                <button onClick={() => setCurrentView('dashboard')} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full"><ArrowLeft size={22}/></button>
                <h2 className="text-lg font-bold text-slate-800 ml-1">工作日誌</h2>
             </div>
             {/* 模式切換按鈕 */}
             <div className="flex bg-slate-100 p-1 rounded-lg">
                 <button 
                    onClick={() => setViewMode('visual')}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'visual' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                 >
                    <List size={18}/>
                 </button>
                 <button 
                    onClick={() => setViewMode('text')}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'text' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                 >
                    <Clipboard size={18}/>
                 </button>
             </div>
         </div>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
         
         {/* --- 日期控制器 --- */}
         <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between gap-4 mb-3">
                <button onClick={() => changeDate(-1)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-blue-600 transition-colors"><ChevronLeft size={24}/></button>
                <div className="flex flex-col items-center">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">{getDisplayTitle()}</span>
                    <div className="relative flex items-center gap-2 text-xl font-extrabold text-slate-800">
                        {selectedDate}
                        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                </div>
                <button onClick={() => changeDate(1)} disabled={selectedDate >= todayStr} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronRight size={24}/></button>
            </div>
            {/* 快速按鈕 */}
            <div className="flex gap-2">
                <button onClick={() => setQuickDate('yesterday')} className="flex-1 py-2 bg-slate-50 text-slate-600 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-100 active:scale-[0.98] transition-all">昨日</button>
                <button onClick={() => setQuickDate('today')} className="flex-1 py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-xl border border-blue-100 hover:bg-blue-100 active:scale-[0.98] transition-all">今日</button>
            </div>
         </div>

         {/* --- 統計數據條 (僅當有資料時顯示) --- */}
         {targetRecords.length > 0 && (
             <div className="flex gap-3 px-1">
                 <div className="flex-1 bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center">
                     <span className="text-xs text-slate-400 font-bold mb-1">總件數</span>
                     <span className="text-xl font-extrabold text-slate-700">{stats.total}</span>
                 </div>
                 <div className="flex-1 bg-emerald-50 p-3 rounded-xl border border-emerald-100 shadow-sm flex flex-col items-center">
                     <span className="text-xs text-emerald-600/70 font-bold mb-1">完修</span>
                     <span className="text-xl font-extrabold text-emerald-600">{stats.completed}</span>
                 </div>
                 {(stats.pending > 0 || stats.monitor > 0) && (
                    <div className="flex-1 bg-amber-50 p-3 rounded-xl border border-amber-100 shadow-sm flex flex-col items-center">
                        <span className="text-xs text-amber-600/70 font-bold mb-1">待/觀</span>
                        <span className="text-xl font-extrabold text-amber-600">{stats.pending + stats.monitor}</span>
                    </div>
                 )}
             </div>
         )}

         {/* --- 主內容區 (根據模式切換) --- */}
         {targetRecords.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 opacity-40">
                 <FileText size={64} className="text-slate-300 mb-4" />
                 <p className="font-bold text-slate-400">該日無維修紀錄</p>
             </div>
         ) : viewMode === 'visual' ? (
             // --- 模式 A: 圖文時間軸 (好讀) ---
             <div className="space-y-4 relative pl-4">
                 {/* 裝飾用的左側時間軸線 */}
                 <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-slate-200"></div>
                 
                 {targetRecords.map((r, i) => {
                     const cust = customers.find(c => c.customerID === r.customerID);
                     let statusColor = "bg-slate-100 text-slate-500";
                     if (r.status === 'completed') statusColor = "bg-emerald-100 text-emerald-600";
                     if (r.status === 'pending') statusColor = "bg-amber-100 text-amber-600";
                     if (r.status === 'monitor') statusColor = "bg-blue-100 text-blue-600";

                     return (
                        <div key={i} className="relative pl-8 animate-in slide-in-from-bottom duration-500" style={{animationDelay: `${i*100}ms`}}>
                            {/* 序號球 */}
                            <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm shadow-md ring-4 ring-slate-50 z-10">
                                {i + 1}
                            </div>
                            
                            {/* 卡片本體 */}
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg">{cust?.name || '未知客戶'}</h3>
                                        {cust?.assets?.[0]?.model && <div className="text-xs text-slate-500 font-bold mt-0.5">{cust.assets[0].model}</div>}
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${statusColor}`}>
                                        {r.status === 'completed' ? '完修' : r.status === 'pending' ? '待料' : '觀察'}
                                    </span>
                                </div>
                                
                                <div className="space-y-2 text-sm text-slate-600">
                                    <div className="flex gap-2">
                                        <span className="font-bold text-slate-400 shrink-0">故障:</span>
                                        <span>{r.fault || r.symptom}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="font-bold text-slate-400 shrink-0">處理:</span>
                                        <span className="whitespace-pre-wrap">{r.solution || r.action}</span>
                                    </div>
                                    {r.parts && r.parts.length > 0 && (
                                        <div className="flex gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-2">
                                            <span className="font-bold text-slate-400 shrink-0">更換:</span>
                                            <span className="font-bold text-slate-700">
                                                {r.parts.map(p => `${p.name} x${p.qty}`).join('、')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                     );
                 })}
             </div>
         ) : (
             // --- 模式 B: 純文字複製 (好用) ---
             <div className="animate-in fade-in">
                 <div className="bg-slate-800 text-slate-200 p-4 rounded-2xl shadow-lg relative overflow-hidden font-mono text-sm leading-relaxed whitespace-pre-wrap border border-slate-700">
                     {logText}
                 </div>
                 <p className="text-center text-xs text-slate-400 mt-2">此格式已最佳化，適合直接貼上 Line 群組</p>
                 
                 <div className="sticky bottom-6 mt-6">
                     <button 
                        onClick={handleCopy}
                        className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${
                            isCopied 
                                ? 'bg-emerald-500 text-white shadow-emerald-200' 
                                : 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700'
                        }`}
                     >
                         {isCopied ? <Check size={24}/> : <Copy size={24}/>}
                         {isCopied ? '複製成功！' : '複製日誌內容'}
                     </button>
                 </div>
             </div>
         )}
      </div>
     </div>
  );
};

export default WorkLog;