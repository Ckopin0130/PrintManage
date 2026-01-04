import React from 'react';
import { 
  ArrowLeft, Trash2, Search, User, AlertCircle, 
  Briefcase, Phone, Calendar, Clock, CheckCircle 
} from 'lucide-react';

const TrackingView = ({ records, customers, setCurrentView, startEditRecord, handleDeleteRecord }) => {
  
  // 1. 排序邏輯 (維持不變：日期由近到遠)
  const trackingRecords = records.filter(r => 
    r.status === 'tracking' || r.status === 'monitor' || r.status === 'pending'
  ).sort((a, b) => {
    const dateA = a.nextVisitDate || a.return_date || '9999-99-99';
    const dateB = b.nextVisitDate || b.return_date || '9999-99-99';
    return dateA.localeCompare(dateB);
  });

  // 2. 來源標籤 (維持與 RecordList 一致的樣式)
  const getSourceBadge = (source) => {
    const baseClass = "text-xs px-2 py-0.5 rounded-md flex items-center gap-1 font-medium ml-2";
    switch(source) {
      case 'customer_call': return <span className={`${baseClass} bg-rose-50 text-rose-600`}><Phone size={12}/> 客戶叫修</span>;
      case 'company_dispatch': return <span className={`${baseClass} bg-blue-50 text-blue-600`}><Briefcase size={12}/> 公司派工</span>;
      case 'invoice_check': return <span className={`${baseClass} bg-emerald-50 text-emerald-600`}><Calendar size={12}/> 例行巡檢</span>;
      default: return null;
    }
  };

  return (
     <div className="bg-slate-50 min-h-screen pb-24 font-sans flex flex-col">
      {/* 標題列 (與 RecordList 一致) */}
      <div className="bg-white shadow-sm sticky top-0 z-30 border-b border-slate-200">
         <div className="px-4 py-3 flex items-center justify-between">
             <div className="flex items-center">
                <button onClick={() => {setCurrentView('dashboard');}} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full"><ArrowLeft size={22}/></button>
                <h2 className="text-lg font-bold text-slate-800 ml-1">待辦事項追蹤</h2>
             </div>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50 p-2 space-y-3">
         {trackingRecords.length === 0 ? 
          <div className="text-center text-slate-400 mt-10 flex flex-col items-center">
             <Search size={32} className="opacity-20 mb-2"/>
             <span>目前無待辦事項</span>
          </div> : 
          trackingRecords.map(r => {
             const cust = customers.find(c => c.customerID === r.customerID);
             
             // 狀態邊框顏色 (與 RecordList 一致)
             // tracking/pending -> 橘黃色 (待處理/追蹤)
             // monitor -> 藍色 (觀察)
             let borderClass = 'border-l-4 border-l-amber-500'; 
             if(r.status === 'monitor') borderClass = 'border-l-4 border-l-blue-500';

             const visitDate = r.nextVisitDate || r.return_date;
             
             // 判斷是否過期 (僅改變文字顏色，不改變背景)
             const todayStr = new Date().toLocaleDateString('en-CA');
             const isOverdue = visitDate && visitDate < todayStr;
             const isUrgent = visitDate && visitDate === todayStr;
             
             const dateColorClass = isOverdue ? 'text-red-500 font-bold' : isUrgent ? 'text-orange-500 font-bold' : 'text-slate-400';

             return (
               <div 
                  key={r.id} 
                  className={`bg-white p-4 shadow-sm border border-slate-100 rounded-r-xl ${borderClass} cursor-pointer hover:shadow-md transition-shadow`}
                  onClick={(e) => startEditRecord(e, r)}
               >
                  {/* Header: 客戶名稱、機型、來源、刪除鈕 */}
                  <div className="flex justify-between items-start mb-2">
                      <div className="text-base text-slate-800 font-bold flex items-center flex-wrap">
                          <User size={16} className="text-slate-400 mr-2 shrink-0"/>
                          <span className="mr-1">{cust?.name || '未知客戶'}</span>
                          {cust?.assets?.[0]?.model && <span className="text-slate-500 font-normal">({cust.assets[0].model})</span>}
                          {getSourceBadge(r.serviceSource)}
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteRecord(e, r.id); }} 
                        className="text-slate-300 hover:text-red-500 p-1"
                      >
                        <Trash2 size={16}/>
                      </button>
                  </div>

                  {/* Body: 故障內容 (多行顯示) */}
                  <div className="flex items-start mb-2 text-base text-slate-700 whitespace-pre-wrap">
                      <AlertCircle size={16} className="text-slate-400 mr-2 mt-1 shrink-0"/>
                      <span>{r.fault || r.description || r.symptom || '未填寫故障情形'}</span>
                  </div>

                  {/* Footer: 日期與狀態 (仿照 RecordList 的右下角風格) */}
                  <div className="text-xs mt-2 text-right border-t border-slate-50 pt-2 flex items-center justify-end gap-1">
                      <Clock size={12} className={dateColorClass}/>
                      <span className={dateColorClass}>
                        {visitDate ? `預計回訪: ${visitDate}` : '無日期'}
                      </span>
                      <span className="text-slate-300 mx-1">·</span>
                      <span className="text-slate-400">
                        {r.status === 'tracking' ? '待追蹤' : r.status === 'monitor' ? '觀察中' : '待料'}
                      </span>
                  </div>
               </div>
             )
         })}
      </div>
     </div>
  );
};

export default TrackingView;