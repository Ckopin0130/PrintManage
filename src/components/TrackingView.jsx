import React, { useMemo } from 'react';
import { ArrowLeft, AlertCircle, Trash2 } from 'lucide-react';

const TrackingView = ({ records, customers, setCurrentView, startEditRecord, handleDeleteRecord }) => {
  
  // 🛠️ 工具函式：將日期字串轉為純數字 (YYYYMMDD) 以便精準排序
  // 範例：'2025-1-6' -> 20250106, '2025-12-31' -> 20251231
  const getDateValue = (dateStr) => {
    if (!dateStr) return 99999999; // 無日期者排最後
    // 移除所有非數字字符 (如 - 或 /)
    const cleanStr = dateStr.replace(/[^0-9]/g, '');
    
    // 如果格式怪異 (長度不足)，嘗試解析
    if (cleanStr.length < 8) {
       // 嘗試拆解重新組裝 (相容 2025-1-6 這種無補零格式)
       const parts = dateStr.split(/[-/]/);
       if (parts.length === 3) {
         const y = parseInt(parts[0]);
         const m = parseInt(parts[1]);
         const d = parseInt(parts[2]);
         return y * 10000 + m * 100 + d;
       }
       return 99999999;
    }
    return parseInt(cleanStr);
  };

  const trackingRecords = useMemo(() => {
    return records
      .filter(r => r.status === 'tracking' || r.status === 'monitor' || r.status === 'pending')
      .sort((a, b) => {
        // 取得比較的日期，若無則視為無限遠
        const dateA = a.nextVisitDate || a.return_date || '';
        const dateB = b.nextVisitDate || b.return_date || '';
        
        const valA = getDateValue(dateA);
        const valB = getDateValue(dateB);

        // 數字小的排前面 (升冪排序) -> 日期近的排第一
        return valA - valB;
      });
  }, [records]);
  
  return (
     <div className="bg-gray-50 min-h-screen pb-24 animate-in">
      <div className="bg-white px-4 py-4 flex items-center shadow-sm sticky top-0 z-10 border-b border-gray-100">
         <button onClick={() => {setCurrentView('dashboard');}} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"><ArrowLeft /></button>
         <h2 className="text-lg font-bold flex-1 text-center pr-8">待辦事項追蹤</h2>
      </div>
      <div className="p-4 space-y-4">
         {trackingRecords.length === 0 ? 
          <div className="text-center text-gray-400 mt-10">目前無待辦事項</div> : trackingRecords.map(r => {
           const cust = customers.find(c => c.customerID === r.customerID);
           const isMonitor = r.status === 'monitor';
           const isTracking = r.status === 'tracking';
           const visitDate = r.nextVisitDate || r.return_date;
           
           // 判斷是否過期 (用來顯示紅色警示)
           const isOverdue = visitDate && getDateValue(visitDate) <= getDateValue(new Date().toLocaleDateString('en-CA'));
           const isUpcoming = visitDate && !isOverdue && getDateValue(visitDate) <= getDateValue(new Date(Date.now() + 3 * 86400000).toLocaleDateString('en-CA'));

           return (
             <div key={r.id} className={`bg-white p-4 rounded-xl shadow-sm border-l-4 hover:shadow-md transition-shadow ${isMonitor ? 'border-blue-400' : 'border-amber-400'}`}>
                <div className="flex justify-between items-start mb-2">
                   <span className="text-xs font-bold text-gray-500">{r.date}</span>
                   <div className="flex items-center gap-2">
                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                       isTracking ? 'bg-orange-100 text-orange-700' : 
                       isMonitor ? 'bg-blue-100 text-blue-700' : 
                       'bg-amber-100 text-amber-700'
                     }`}>
                       {isTracking ? '待追蹤' : isMonitor ? '觀察中' : '待料'}
                     </span>
                     {/* 刪除按鈕 */}
                     <button 
                       onClick={(e) => {
                         e.stopPropagation();
                         handleDeleteRecord(e, r.id);
                       }}
                       className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                     >
                       <Trash2 size={14}/>
                     </button>
                   </div>
                </div>
                <div onClick={(e) => startEditRecord(e, r)} className="cursor-pointer">
                  <h3 className="font-bold text-gray-800">{cust ? cust.name : '未知客戶'}</h3>
                  <div className="text-sm text-gray-600 mt-1">{r.fault || r.description || r.symptom}</div>
                  {visitDate && (
                    <div className={`text-xs mt-2 font-bold ${
                      isOverdue ? 'text-red-600' : 
                      isUpcoming ? 'text-orange-600' : 
                      'text-gray-500'
                    }`}>
                      預計回訪: {visitDate}
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-2 flex items-center"><AlertCircle size={12} className="mr-1"/> 點擊編輯後續處置</div>
                </div>
             </div>
           )
         })}
      </div>
     </div>
  );
};

export default TrackingView;