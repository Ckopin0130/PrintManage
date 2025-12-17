import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Copy, Check, Calendar } from 'lucide-react';

const WorkLog = ({ records, customers, setCurrentView, showToast }) => {
  // 1. 改用 "YYYY-MM-DD" 字串來管理日期，比用 +/- 數字更直覺
  const todayStr = new Date().toLocaleDateString('en-CA');
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [isCopied, setIsCopied] = useState(false);

  // 切換日期的函數 (+1 或 -1 天)
  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toLocaleDateString('en-CA'));
  };

  // 找出「選定日期」當天的所有紀錄
  const targetRecords = records.filter(r => r.date === selectedDate);

  // 產生文字報告的邏輯
  const generateLogText = () => {
      return targetRecords.map((r, i) => {
          const cust = customers.find(c => c.customerID === r.customerID);
          // 處理零件文字
          const partsText = (r.parts && r.parts.length > 0) 
              ? `\n    更換: ${r.parts.map(p => `${p.name} x${p.qty}`).join(', ')}` 
              : '';
          
          return `${i+1}. ${cust?.name || '未知'}\n    故障: ${r.fault}\n    處理: ${r.solution}${partsText}\n    狀態: ${r.status === 'completed' ? '完修' : (r.status === 'pending' ? '待料' : '觀察')}`;
      }).join('\n\n');
  };

  const handleCopy = () => {
      const text = generateLogText();
      if (!text) {
          showToast('該日無資料可複製', 'error');
          return;
      }
      navigator.clipboard.writeText(text).then(() => {
          showToast('已複製到剪貼簿');
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
      });
  };

  // 判斷標題顯示 (如果是今天或昨天，顯示中文方便辨識)
  const getDisplayTitle = () => {
      if (selectedDate === todayStr) return '今日 (Today)';
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (selectedDate === yesterday.toLocaleDateString('en-CA')) return '昨日 (Yesterday)';
      
      return selectedDate;
  };

  return (
     <div className="bg-gray-50 min-h-screen pb-24 animate-in">
      <div className="bg-white px-4 py-4 flex items-center shadow-sm sticky top-0 z-10 border-b border-gray-100">
         <button onClick={() => setCurrentView('dashboard')} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"><ArrowLeft /></button>
         <h2 className="text-lg font-bold flex-1 text-center pr-8">工作日誌</h2>
      </div>

      <div className="p-4 space-y-4">
         {/* --- 日期選擇控制區 (升級版) --- */}
         <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between gap-2">
            
            {/* 上一天按鈕 */}
            <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                <ChevronLeft size={24}/>
            </button>

            {/* 中間：日期選擇器 */}
            <div className="flex-1 flex flex-col items-center">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">{getDisplayTitle()}</span>
                <div className="relative">
                    {/* 這是一個隱藏原本外觀的原生日期輸入框，讓它看起來像文字按鈕 */}
                    <input 
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-lg border border-blue-100 font-mono font-bold text-lg cursor-pointer hover:bg-blue-100 transition-colors">
                        <Calendar size={18} />
                        <span>{selectedDate}</span>
                    </div>
                </div>
            </div>

            {/* 下一天按鈕 (如果是今天就不能按) */}
            <button onClick={() => changeDate(1)} disabled={selectedDate >= todayStr} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronRight size={24}/>
            </button>
         </div>

         {/* --- 內容顯示區 --- */}
         <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm min-h-[400px] relative transition-all">
            <div className="absolute top-4 right-4 z-10">
                <button onClick={handleCopy} className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${isCopied ? 'bg-green-100 text-green-700 ring-2 ring-green-200' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
                    {isCopied ? <Check size={14}/> : <Copy size={14}/>}
                    <span>{isCopied ? '已複製' : '複製'}</span>
                </button>
            </div>
            
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${targetRecords.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                {selectedDate} 工作摘要 ({targetRecords.length} 筆)
            </h3>
            
            <pre className="font-mono text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {targetRecords.length > 0 ? generateLogText() : <div className="text-gray-400 italic text-center mt-10">--- 該日無維修紀錄 ---</div>}
            </pre>
         </div>
      </div>
     </div>
  );
};

export default WorkLog;