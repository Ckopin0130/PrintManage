import React from 'react';
import { ArrowLeft, AlertCircle, Trash2 } from 'lucide-react';

const TrackingView = ({ records, customers, setCurrentView, startEditRecord, handleDeleteRecord }) => {
  // ▼▼▼ [修正重點] ▼▼▼
  // 修正排序邏輯：將字串轉為 Date 物件再相減，確保 1/6 會排在 1/29 前面
  const trackingRecords = records.filter(r => 
    r.status === 'tracking' || r.status === 'monitor' || r.status === 'pending'
  ).sort((a, b) => {
    // 取得日期，若無則設為極大值確保排在最後
    const dateA = a.nextVisitDate || a.return_date || '9999-12-31';
    const dateB = b.nextVisitDate || b.return_date || '9999-12-31';
    
    // 使用 new Date() 轉換成時間戳記來比較數字大小
    return new Date(dateA) - new Date(dateB);
  });
  // ▲▲▲ [修正結束] ▲▲▲
  
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
                      new Date(visitDate) <= new Date() ? 'text-red-600' : 
                      new Date(visitDate) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) ? 'text-orange-600' : 
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