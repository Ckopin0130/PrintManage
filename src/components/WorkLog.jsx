import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, ChevronLeft, ChevronRight, Copy, Check, 
  List, Clipboard, Package, Wrench, AlertCircle, Calendar
} from 'lucide-react';

const WorkLog = ({ records, customers, setCurrentView, showToast }) => {
  // --- 1. 基本設定 ---
  const todayStr = new Date().toLocaleDateString('en-CA');
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [viewMode, setViewMode] = useState('visual'); // 'visual'(圖文) 或 'text'(純文字)
  const [isCopied, setIsCopied] = useState(false);

  // --- 2. 日期操作邏輯 ---
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

  const getDisplayTitle = () => {
    if (selectedDate === todayStr) return '今日 (Today)';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (selectedDate === yesterday.toLocaleDateString('en-CA')) return '昨日 (Yesterday)';
    return selectedDate;
  };

  // --- 3. 核心資料篩選 ---
  const targetRecords = useMemo(() => {
    return records.filter(r => {
      // 邏輯：完修案件歸檔於「完修日」，未完修案件歸檔於「建立日」
      const recordDate = r.status === 'completed' && r.completedDate 
        ? r.completedDate 
        : r.date;
      return recordDate === selectedDate;
    });
  }, [records, selectedDate]);

  // --- 4. ★★★ 自動計算：今日耗材總表 ★★★ ---
  // 這段邏輯會把今天所有行程的零件加總，例如：A客戶換1個鼓，B客戶換1個鼓 -> 今日總計：鼓 x2
  const partsSummary = useMemo(() => {
    const summary = {};
    targetRecords.forEach(r => {
        if (r.parts && r.parts.length > 0) {
            r.parts.forEach(p => {
                if (summary[p.name]) {
                    summary[p.name] += (p.qty || 1);
                } else {
                    summary[p.name] = (p.qty || 1);
                }
            });
        }
    });
    // 轉成陣列格式方便顯示
    return Object.entries(summary).map(([name, qty]) => ({ name, qty }));
  }, [targetRecords]);

  // --- 5. 生成純文字日誌 (修復排版邏輯) ---
  const logText = useMemo(() => {
      if (targetRecords.length === 0) return '本日無維修紀錄。';
      
      const header = `📅 工作日誌：${selectedDate}\n====================`;

      // A. 案件清單
      const listContent = targetRecords.map((r, i) => {
          const cust = customers.find(c => c.customerID === r.customerID);
          const custName = cust?.name || '未知客戶';
          const model = cust?.assets?.[0]?.model ? `(${cust.assets[0].model})` : '';
          
          let statusText = '觀察';
          if (r.status === 'completed') statusText = '完修';
          if (r.status === 'pending' || r.status === 'tracking') statusText = '待料';
          if (r.status === 'monitor') statusText = '觀察';

          // 零件文字 (若無零件則不顯示該行)
          const partsRow = (r.parts && r.parts.length > 0) 
              ? `\n   📦 更換: ${r.parts.map(p => `${p.name} x${p.qty}`).join('、')}` 
              : '';

          // 乾淨的排版
          return `${i + 1}. ${custName} ${model} [${statusText}]\n   🔧 故障: ${r.fault || r.symptom}\n   📝 處理: ${r.solution || r.action}${partsRow}`;
      }).join('\n\n--------------------\n\n');

      // B. 底部總耗材統計 (回報重點)
      let footer = '';
      if (partsSummary.length > 0) {
          footer = `\n\n📊 今日耗材統計 (總計)：\n${partsSummary.map(p => `● ${p.name}: ${p.qty}`).join('\n')}`;
      } else {
          footer = `\n\n📊 今日耗材統計：無`;
      }

      return `${header}\n\n${listContent}${footer}`;
  }, [targetRecords, customers, partsSummary, selectedDate]);

  // --- 6. 複製功能 ---
  const handleCopy = () => {
      navigator.clipboard.writeText(logText).then(() => {
          setIsCopied(true);
          if (showToast) showToast('已複製到剪貼簿', 'success');
          setTimeout(() => setIsCopied(false), 2000);
      });
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
             {/* 視覺切換按鈕 (膠囊狀) */}
             <div className="flex bg-slate-100 p-1 rounded-lg">
                 <button 
                    onClick={() => setViewMode('visual')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${viewMode === 'visual' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                 >
                    <List size={14}/> 列表
                 </button>
                 <button 
                    onClick={() => setViewMode('text')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${viewMode === 'text' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                 >
                    <Clipboard size={14}/> 文字
                 </button>
             </div>
         </div>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
         
         {/* --- 1. 日期選擇區塊 --- */}
         <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between gap-4 mb-3">
                <button onClick={() => changeDate(-1)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-blue-600"><ChevronLeft size={24}/></button>
                <div className="flex flex-col items-center">
                    <span className="text-xs text-slate-400 font-bold mb-0.5">{getDisplayTitle()}</span>
                    <div className="relative flex items-center gap-2 text-xl font-extrabold text-slate-800">
                        {selectedDate}
                        {/* 隱藏的日期輸入框，點擊文字可叫出日曆 */}
                        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                </div>
                <button onClick={() => changeDate(1)} disabled={selectedDate >= todayStr} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-blue-600 disabled:opacity-30"><ChevronRight size={24}/></button>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setQuickDate('yesterday')} className="flex-1 py-2 bg-slate-50 text-slate-600 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-100">昨日</button>
                <button onClick={() => setQuickDate('today')} className="flex-1 py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-xl border border-blue-100 hover:bg-blue-50">今日</button>
            </div>
         </div>

         {/* --- 2. 今日總結看板 (無論模式都顯示) --- */}
         {/* 這是為了符合「點進來要看到什麼」：看到今天做了幾件，用了多少料 */}
         {targetRecords.length > 0 && (
            <div className="flex gap-2 animate-in fade-in">
                {/* 左邊：件數 */}
                <div className="flex-1 bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">總件數</span>
                    <span className="text-2xl font-black text-slate-700">{targetRecords.length}</span>
                </div>
                
                {/* 右邊：耗材總表 (若有) */}
                {partsSummary.length > 0 ? (
                    <div className="flex-[2] bg-purple-50 p-3 rounded-xl border border-purple-100 shadow-sm flex flex-col justify-center">
                         <div className="flex items-center gap-1.5 mb-2">
                            <Package size={14} className="text-purple-600"/>
                            <span className="text-xs text-purple-700 font-bold">今日耗材總計</span>
                         </div>
                         <div className="flex flex-wrap gap-1.5">
                            {partsSummary.map((p, i) => (
                                <span key={i} className="text-xs font-bold text-purple-800 bg-white px-2 py-0.5 rounded border border-purple-100 shadow-sm">
                                    {p.name} <span className="text-purple-500">x{p.qty}</span>
                                </span>
                            ))}
                         </div>
                    </div>
                ) : (
                    // 若無耗材，顯示無耗材狀態
                    <div className="flex-[2] bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-slate-400">
                        <Check size={16} className="mb-1 opacity-50"/>
                        <span className="text-xs font-bold">今日無消耗零件</span>
                    </div>
                )}
            </div>
         )}

         {/* --- 3. 內容顯示區 --- */}
         {targetRecords.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 opacity-40">
                 <Calendar size={48} className="text-slate-300 mb-2" />
                 <p className="font-bold text-slate-400">無行程紀錄</p>
             </div>
         ) : viewMode === 'visual' ? (
             // --- 模式 A: 卡片列表 (一般人邏輯：清楚的清單) ---
             <div className="space-y-3">
                 {targetRecords.map((r, i) => {
                     const cust = customers.find(c => c.customerID === r.customerID);
                     // 狀態標籤樣式
                     let statusConfig = { bg: "bg-slate-100", text: "text-slate-500", label: "觀察" };
                     if (r.status === 'completed') statusConfig = { bg: "bg-emerald-100", text: "text-emerald-700", label: "完修" };
                     if (r.status === 'pending' || r.status === 'tracking') statusConfig = { bg: "bg-amber-100", text: "text-amber-700", label: "待料" };

                     return (
                        <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            {/* 第一行：編號 + 客戶名 + 狀態 */}
                            <div className="flex justify-between items-start mb-3 pb-2 border-b border-slate-50">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                                        {i + 1}
                                    </div>
                                    <div className="font-bold text-slate-800 text-base">
                                        {cust?.name || '未知客戶'}
                                        {cust?.assets?.[0]?.model && <span className="text-slate-400 text-xs font-normal ml-1">({cust.assets[0].model})</span>}
                                    </div>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded ${statusConfig.bg} ${statusConfig.text}`}>
                                    {statusConfig.label}
                                </span>
                            </div>
                            
                            {/* 內容區 */}
                            <div className="space-y-2 pl-8">
                                {/* 故障 */}
                                <div className="flex items-start gap-2 text-sm">
                                    <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5"/>
                                    <span className="text-slate-700 font-medium">{r.fault || r.symptom}</span>
                                </div>
                                {/* 處理 */}
                                <div className="flex items-start gap-2 text-sm">
                                    <Wrench size={16} className="text-blue-400 shrink-0 mt-0.5"/>
                                    <span className="text-slate-600 whitespace-pre-wrap">{r.solution || r.action}</span>
                                </div>
                                {/* 該單零件 (紫色強調) */}
                                {r.parts && r.parts.length > 0 && (
                                    <div className="flex items-start gap-2 text-sm bg-purple-50 p-2 rounded-lg border border-purple-100 mt-1">
                                        <Package size={16} className="text-purple-500 shrink-0 mt-0.5"/>
                                        <span className="text-purple-800 font-bold">
                                            {r.parts.map(p => `${p.name} x${p.qty}`).join('、')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                     );
                 })}
             </div>
         ) : (
             // --- 模式 B: 純文字預覽 (產生什麼：整齊的報告) ---
             <div className="animate-in fade-in">
                 <textarea 
                    readOnly
                    value={logText}
                    className="w-full h-[450px] bg-slate-800 text-slate-200 p-4 rounded-xl font-mono text-sm leading-relaxed resize-none focus:outline-none border border-slate-700 shadow-inner"
                 />
                 
                 <div className="mt-4 sticky bottom-4">
                    <button 
                        onClick={handleCopy}
                        className={`w-full py-3.5 rounded-xl font-bold text-base shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${
                            isCopied 
                                ? 'bg-emerald-500 text-white shadow-emerald-200' 
                                : 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700'
                        }`}
                    >
                        {isCopied ? <Check size={20}/> : <Copy size={20}/>}
                        {isCopied ? '已複製成功！' : '一鍵複製內容'}
                    </button>
                    <p className="text-center text-xs text-slate-400 mt-2">可直接貼上 Line 群組或回報系統</p>
                 </div>
             </div>
         )}
      </div>
     </div>
  );
};

export default WorkLog;