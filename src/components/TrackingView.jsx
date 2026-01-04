import React from 'react';
import { 
  ArrowLeft, Trash2, Search, User, AlertCircle, 
  Briefcase, Phone, Calendar, Clock, CheckCircle, Eye, Wrench 
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

  // 2. 來源標籤 (維持 RecordList 風格)
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
      {/* 標題列 */}
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
             
             // 狀態邊框顏色
             let borderClass = 'border-l-4 border-l-amber-500'; 
             if(r.status === 'monitor') borderClass = 'border-l-4 border-l-blue-500';

             const visitDate = r.nextVisitDate || r.return_date;
             
             // 判斷日期緊急程度 (文字顏色)
             const todayStr = new Date().toLocaleDateString('en-CA');
             const isOverdue = visitDate && visitDate < todayStr;
             const isUrgent = visitDate && visitDate === todayStr;
             
             const dateColorClass = isOverdue ? 'text-rose-600 font-bold' : isUrgent ? 'text-orange-500 font-bold' : 'text-slate-500 font-bold';

             return (
               <div 
                  key={r.id} 
                  className={`bg-white p-4 shadow-sm border border-slate-100 rounded-r-xl ${borderClass} cursor-pointer hover:shadow-md transition-shadow`}
                  onClick={(e) => startEditRecord(e, r)}
               >
                  {/* 第 1 行：任務日期 + 來源 */}
                  <div className="flex items-center mb-1">
                      <div className="flex items-center text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">
                          <Calendar size={12} className="mr-1"/>
                          {r.date}
                      </div>
                      {getSourceBadge(r.serviceSource)}
                  </div>

                  {/* 第 2 行：客戶名稱 + 機型 + 刪除鈕 */}
                  <div className="flex justify-between items-start mb-2">
                      <div className="text-base text-slate-800 font-bold flex items-center flex-wrap">
                          <User size={16} className="text-slate-400 mr-2 shrink-0"/>
                          <span className="mr-1">{cust?.name || '未知客戶'}</span>
                          {cust?.assets?.[0]?.model && <span className="text-slate-500 font-normal">({cust.assets[0].model})</span>}
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteRecord(e, r.id); }} 
                        className="text-slate-300 hover:text-red-500 p-1"
                      >
                        <Trash2 size={16}/>
                      </button>
                  </div>

                  {/* 第 3 行：故障內容 */}
                  {(r.fault || r.description || r.symptom) && (
                      <div className="flex items-start mb-3 text-base text-slate-700 whitespace-pre-wrap">
                          <AlertCircle size={16} className="text-slate-400 mr-2 mt-1 shrink-0"/>
                          <span>{r.fault || r.description || r.symptom}</span>
                      </div>
                  )}

                  {/* 第 4 行 (底部)：左邊回訪日(有色) | 右邊狀態(灰) */}
                  <div className="text-xs mt-2 border-t border-slate-50 pt-2 flex items-center justify-between">
                      
                      {/* 左側：預計回訪日期 (顏色區分) */}
                      <div className={`flex items-center ${dateColorClass}`}>
                          <Clock size={12} className="mr-1"/>
                          {visitDate ? `預計回訪: ${visitDate}` : '未設定回訪'}
                      </div>

                      {/* 右側：狀態 (灰色，靠右) */}
                      <div className="text-slate-400">
                          {r.status === 'tracking' ? '待追蹤' : r.status === 'monitor' ? '觀察中' : '待料'}
                      </div>
                  </div>
               </div>
             )
         })}
      </div>
     </div>
  );
};

export default TrackingView;