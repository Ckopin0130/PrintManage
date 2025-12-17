import React from 'react';
import { ArrowLeft } from 'lucide-react';

const WorkLog = ({ records, customers, setCurrentView, showToast }) => {
  const todayStr = new Date().toLocaleDateString('en-CA'); // 使用當地時間格式 YYYY-MM-DD
  const todaysRecords = records.filter(r => r.date === todayStr);

  const generateLogText = () => {
      return todaysRecords.map((r, i) => {
          const cust = customers.find(c => c.customerID === r.customerID);
          return `${i+1}. ${cust?.name || '未知'}\n    故障: ${r.fault}\n    處理: ${r.solution}\n    狀態: ${r.status === 'completed' ? '完修' : '待追蹤'}`;
      }).join('\n\n');
  };

  const copyLog = () => {
      const text = generateLogText();
      if (!text) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(() => showToast('已複製到剪貼簿')).catch(() => showToast('複製失敗', 'error'));
      } else {
           const textArea = document.createElement("textarea");
           textArea.value = text;
           document.body.appendChild(textArea);
           textArea.select();
           document.execCommand("Copy");
           textArea.remove();
           showToast('已複製到剪貼簿');
      }
  };

  return (
     <div className="bg-gray-50 min-h-screen pb-24 animate-in">
      <div className="bg-white px-4 py-4 flex items-center shadow-sm sticky top-0 z-10 border-b border-gray-100">
         <button onClick={() => {setCurrentView('dashboard');}} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"><ArrowLeft /></button>
         <h2 className="text-lg font-bold flex-1 text-center pr-8">今日工作日誌</h2>
         <button onClick={copyLog} className="text-blue-600 font-bold text-sm bg-blue-50 px-3 py-1.5 rounded-lg active:scale-95 transition-transform">複製</button>
      </div>
      <div className="p-4">
         <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm font-mono text-sm text-gray-700 whitespace-pre-wrap min-h-[300px]">
            {todaysRecords.length > 0 ? generateLogText() : "今日尚無維修紀錄..."}
         </div>
      </div>
     </div>
  );
};

export default WorkLog;