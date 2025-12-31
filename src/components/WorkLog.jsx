import React, { useState, useMemo } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Copy, Check, Calendar, FileText } from 'lucide-react';

const WorkLog = ({ records, customers, setCurrentView, showToast }) => {
  // 1. 使用標準日期格式 YYYY-MM-DD
  const todayStr = new Date().toLocaleDateString('en-CA');
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [isCopied, setIsCopied] = useState(false);

  // 切換日期的函數
  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toLocaleDateString('en-CA'));
  };

  // 優化 1: 使用 useMemo 篩選當日紀錄，避免無謂的重複運算
  // 修復：對於已完成的記錄，使用完成日期；對於未完成的記錄，使用創建日期
  const targetRecords = useMemo(() => {
    return records.filter(r => {
      const recordDate = r.status === 'completed' && r.completedDate 
        ? r.completedDate 
        : r.date;
      return recordDate === selectedDate;
    });
  }, [records, selectedDate]);

  // 優化 2: 使用 useMemo 生成日誌文字，只有當紀錄改變時才重新組字串
  const logText = useMemo(() => {
      if (targetRecords.length === 0) return '';
      
      return targetRecords.map((r, i) => {
          const cust = customers.find(c => c.customerID === r.customerID);
          // 處理零件文字
          const partsText = (r.parts && r.parts.length > 0) 
              ? `\n    更換: ${r.parts.map(p => `${p.name} x${p.qty}`).join(', ')}` 
              : '';
          
          // 狀態顯示轉換
          let statusText = '觀察';
          if (r.status === 'completed') statusText = '完修';
          if (r.status === 'pending') statusText = '待料';

          return `${i+1}. ${cust?.name || '未知客戶'}\n    故障: ${r.fault}\n    處理: ${r.solution}${partsText}\n    狀態: ${statusText}`;
      }).join('\n\n');
  }, [targetRecords, customers]);

  const handleCopy = () => {
      if (!logText) {
          showToast('該日無資料可複製', 'error');
          return;
      }
      navigator.clipboard.writeText(logText).then(() => {
          showToast('已複製到剪貼簿');
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
      });
  };

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
         {/* --- 日期選擇區 --- */}
         <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between gap-2">
            <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"><ChevronLeft size={24}/></button>
            <div className="flex-1 flex flex-col items-center">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">{getDisplayTitle()}</span>
                <div className="relative">
                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                    <div className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-lg border border-blue-100 font-mono font-bold text-lg cursor-pointer hover:bg-blue-100 transition-colors">
                        <Calendar size={18} /><span>{selectedDate}</span>
                    </div>
                </div>
            </div>
            <button onClick={() => changeDate(1)} disabled={selectedDate >= todayStr} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronRight size={24}/></button>
         </div>

         {/* --- 內容顯示區 --- */}
         <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm min-h-[400px] relative transition-all">
            <div className="absolute top-4 right-4 z-10">
                <button onClick={handleCopy} disabled={!logText} className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${isCopied ? 'bg-green-100 text-green-700 ring-2 ring-green-200' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 disabled:opacity-50'}`}>
                    {isCopied ? <Check size={14}/> : <Copy size={14}/>}
                    <span>{isCopied ? '已複製' : '複製'}</span>
                </button>
            </div>
            
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${targetRecords.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                {selectedDate} 工作摘要 ({targetRecords.length} 筆)
            </h3>
            
            {targetRecords.length > 0 ? (
                <pre className="font-mono text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {logText}
                </pre>
            ) : (
                <div className="flex flex-col items-center justify-center mt-20 text-gray-300">
                    <FileText size={48} className="mb-2 opacity-20" />
                    <span className="italic">--- 該日無維修紀錄 ---</span>
                </div>
            )}
         </div>
      </div>
     </div>
  );
};

export default WorkLog;