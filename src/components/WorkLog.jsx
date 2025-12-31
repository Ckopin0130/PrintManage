import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, ChevronLeft, ChevronRight, Copy, Check, 
  FileText, List, Clipboard, Package, Wrench, AlertCircle, User
} from 'lucide-react';

const WorkLog = ({ records, customers, setCurrentView, showToast }) => {
  // --- 1. 基本設定 ---
  const todayStr = new Date().toLocaleDateString('en-CA');
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [viewMode, setViewMode] = useState('visual'); // 'visual'(圖文) 或 'text'(純文字)
  const [isCopied, setIsCopied] = useState(false);

  // --- 2. 日期操作 ---
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

  // --- 3. 核心資料篩選 ---
  const targetRecords = useMemo(() => {
    return records.filter(r => {
      // 完修案件看「完修日」，其他看「建立日」
      const recordDate = r.status === 'completed' && r.completedDate 
        ? r.completedDate 
        : r.date;
      return recordDate === selectedDate;
    });
  }, [records, selectedDate]);

  // --- 4. 自動計算：今日耗材總表 (最重要功能) ---
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
    // 轉成陣列: [{name: '碳粉', qty: 2}, ...]
    return Object.entries(summary).map(([name, qty]) => ({ name, qty }));
  }, [targetRecords]);

  // --- 5. 生成純文字日誌 (修復格式與編號) ---
  const logText = useMemo(() => {
      if (targetRecords.length === 0) return '今日無紀錄';
      
      const dateHeader = `📅 工作日誌：${selectedDate}\n====================`;

      // A. 案件清單
      const listContent = targetRecords.map((r, i) => {
          const cust = customers.find(c => c.customerID === r.customerID);
          const custName = cust?.name || '未知客戶';
          const model = cust?.assets?.[0]?.model ? ` (${cust.assets[0].model})` : '';
          
          let statusText = '觀察';
          if (r.status === 'completed') statusText = '完修';
          if (r.status === 'pending' || r.status === 'tracking') statusText = '待料';
          if (r.status === 'monitor') statusText = '觀察';

          // 零件文字
          const partsRow = (r.parts && r.parts.length > 0) 
              ? `\n   📦 更換: ${r.parts.map(p => `${p.name} x${p.qty}`).join('、')}` 
              : '';

          // 格式修正：移除多餘空格，使用標準條列
          return `${i + 1}. ${custName}${model} [${statusText}]\n   🔧 故障: ${r.fault || r.symptom}\n   📝 處理: ${r.solution || r.action}${partsRow}`;
      }).join('\n--------------------\n');

      // B. 底部總耗材統計 (重點)
      let footer = '';
      if (partsSummary.length > 0) {
          footer = `\n\n📊 今日耗材統計 (總計)：\n${partsSummary.map(p => `● ${p.name}: ${p.qty}`).join('\n')}`;
      } else {
          footer = `\n\n📊 今日耗材統計：無`;
      }

      return `${dateHeader}\n${listContent}${footer}`;
  }, [targetRecords, customers, partsSummary, selectedDate]);

  // --- 6. 複製功能 ---
  const handleCopy = () => {
      navigator.clipboard.writeText(logText).then(() => {
          setIsCopied(true);
          if (showToast) showToast('已複製到剪貼簿', 'success');
          setTimeout(() => setIsCopied(false), 2000);
      });
  };

  const getDisplayTitle = () => {
      if (selectedDate === todayStr) return '今日';
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (selectedDate === yesterday.toLocaleDateString('en-CA')) return '昨日';
      return selectedDate;
  };

  return (
     <div className="bg-slate-50 min-h-screen pb-24 font-sans flex flex-col">
      
      {/* 頂部導航 */}
      <div className="bg-white px-4 py-3 shadow-sm sticky top-0 z-30 border-b border-slate-200">
         <div className="flex items-center justify-between">
             <div className="flex items-center">
                <button onClick={() => setCurrentView('dashboard')} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full"><ArrowLeft size={22}/></button>
                <h2 className="text-lg font-bold text-slate-800 ml-1">工作日誌</h2>
             </div>
             {/* 模式切換按鈕 (膠囊狀) */}
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
         
         {/* 1. 日期選擇區塊 */}
         <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between gap-4 mb-3">
                <button onClick={() => changeDate(-1)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-blue-600"><ChevronLeft size={24}/></button>
                <div className="flex flex-col items-center">
                    <span className="text-xs text-slate-400 font-bold mb-0.5">{getDisplayTitle()}</span>
                    <div className="relative flex items-center gap-2 text-xl font-extrabold text-slate-800">
                        {selectedDate}
                        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                </div>
                <button onClick={() => changeDate(1)} disabled={selectedDate >= todayStr} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-blue-600 disabled:opacity-30"><ChevronRight size={24}/></button>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setQuickDate('yesterday')} className="flex-1 py-2 bg-slate-50 text-slate-600 text-xs font-bold rounded-xl border border-slate-200">昨日</button>
                <button onClick={() => setQuickDate('today')} className="flex-1 py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-xl border border-blue-100">今日</button>
            </div>
         </div>

         {/* 2. 今日數據統計 & 耗材總表 (無論哪個模式都顯示，方便查看) */}
         {targetRecords.length > 0 && (
            <div className="space-y-3">
                {/* 件數統計 */}
                <div className="flex gap-2">
                    <div className="flex-1 bg-white p-2 rounded-xl border border-slate-200 flex flex-col items-center">
                        <span className="text-[10px] text-slate-400 font-bold">總件數</span>
                        <span className="text-lg font-extrabold text-slate-700">{targetRecords.length}</span>
                    </div>
                    {partsSummary.length > 0 && (
                        <div className="flex-[2] bg-purple-50 p-2 rounded-xl border border-purple-100 flex flex-col justify-center px-3">
                             <div className="flex items-center gap-1 mb-1">
                                <Package size={12} className="text-purple-600"/>
                                <span className="text-[10px] text-purple-600 font-bold">今日耗材總計</span>
                             </div>
                             <div className="flex flex-wrap gap-1">
                                {partsSummary.map((p, i) => (
                                    <span key={i} className="text-xs font-bold text-purple-800 bg-white px-1.5 rounded border border-purple-100">
                                        {p.name} x{p.qty}
                                    </span>
                                ))}
                             </div>
                        </div>
                    )}
                </div>
            </div>
         )}

         {/* 3. 內容顯示區 (視圖切換) */}
         {targetRecords.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 opacity-40">
                 <FileText size={48} className="text-slate-300 mb-2" />
                 <p className="font-bold text-slate-400">今日無行程</p>
             </div>
         ) : viewMode === 'visual' ? (
             // --- 介面 A: 卡片列表 (乾淨版，無時間軸線) ---
             <div className="space-y-3">
                 {targetRecords.map((r, i) => {
                     const cust = customers.find(c => c.customerID === r.customerID);
                     // 狀態樣式
                     let statusStyle = "bg-slate-100 text-slate-500";
                     let statusLabel = "觀察";
                     if (r.status === 'completed') { statusStyle = "bg-emerald-100 text-emerald-600"; statusLabel = "完修"; }
                     if (r.status === 'pending' || r.status === 'tracking') { statusStyle = "bg-amber-100 text-amber-600"; statusLabel = "待料"; }

                     return (
                        <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            {/* 標題行 */}
                            <div className="flex justify-between items-start mb-3 pb-2 border-b border-slate-50">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold">
                                        {i + 1}
                                    </div>
                                    <div className="font-bold text-slate-800">
                                        {cust?.name || '未知客戶'}
                                        {cust?.assets?.[0]?.model && <span className="text-slate-400 text-xs font-normal ml-1">({cust.assets[0].model})</span>}
                                    </div>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded ${statusStyle}`}>{statusLabel}</span>
                            </div>
                            
                            {/* 內容行 */}
                            <div className="space-y-2 pl-8">
                                <div className="flex items-start gap-2 text-sm">
                                    <AlertCircle size={16} className="text-slate-400 shrink-0 mt-0.5"/>
                                    <span className="text-slate-600 font-medium">{r.fault || r.symptom}</span>
                                </div>
                                <div className="flex items-start gap-2 text-sm">
                                    <Wrench size={16} className="text-slate-400 shrink-0 mt-0.5"/>
                                    <span className="text-slate-600 whitespace-pre-wrap">{r.solution || r.action}</span>
                                </div>
                                {/* 該筆紀錄使用的零件 */}
                                {r.parts && r.parts.length > 0 && (
                                    <div className="flex items-start gap-2 text-sm bg-purple-50 p-2 rounded-lg">
                                        <Package size={16} className="text-purple-500 shrink-0 mt-0.5"/>
                                        <span className="text-purple-700 font-bold">
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
             // --- 介面 B: 純文字預覽 (修正版) ---
             <div className="animate-in fade-in">
                 <textarea 
                    readOnly
                    value={logText}
                    className="w-full h-[400px] bg-slate-800 text-slate-200 p-4 rounded-xl font-mono text-sm leading-relaxed resize-none focus:outline-none"
                 />
                 
                 <button 
                    onClick={handleCopy}
                    className={`mt-4 w-full py-3 rounded-xl font-bold text-base shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${
                        isCopied 
                            ? 'bg-emerald-500 text-white shadow-emerald-200' 
                            : 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700'
                    }`}
                 >
                     {isCopied ? <Check size={20}/> : <Copy size={20}/>}
                     {isCopied ? '已複製！' : '複製文字內容'}
                 </button>
             </div>
         )}
      </div>
     </div>
  );
};

export default WorkLog;