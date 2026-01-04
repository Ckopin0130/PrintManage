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

  // 2. 來源標籤 (樣式微調，適合放在日期旁邊)
  const getSourceBadge = (source) => {
    const baseClass = "text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 font-medium ml-2";
    switch(source) {
      case 'customer_call': return <span className={`${baseClass} bg-rose-50 text-rose-600 border border-rose-100`}><Phone size={10}/> 客戶叫修</span>;
      case 'company_dispatch': return <span className={`${baseClass} bg-blue-50 text-blue-600 border border-blue-100`}><Briefcase size={10}/> 公司派工</span>;
      case 'invoice_check': return <span className={`${baseClass} bg-emerald-50 text-emerald-600 border border-emerald-100`}><Calendar size={10}/> 例行巡檢</span>;
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
             
             // 判斷日期緊急程度
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
                  {/* 第一行：任務時間(含圖示) + 來源 */}
                  <div className="flex items-center mb-1.5">
                      <div className="flex items-center text-xs text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded-md">
                          <Calendar size={12} className="mr-1.5"/>
                          <span>{r.date}</span>
                      </div>
                      {getSourceBadge(r.serviceSource)}
                  </div>

                  {/* 第二行：客戶名稱 (大標題) + 刪除鈕 */}
                  <div className="flex justify-between items-start mb-2">
                      <div className="text-lg font-bold text-slate-800 flex items-center flex-wrap">
                          <span className="mr-2">{cust?.name || '未知客戶'}</span>
                          {cust?.assets?.[0]?.model && <span className="text-slate-400 font-normal text-sm">({cust.assets[0].model})</span>}
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteRecord(e, r.id); }} 
                        className="text-slate-300 hover:text-red-500 p-1 -mt-1 -mr-1"
                      >
                        <Trash2 size={18}/>
                      </button>
                  </div>

                  {/* 第三行：故障問題 (多行) */}
                  <div className="flex items-start mb-3 text-base text-slate-600 whitespace-pre-wrap leading-relaxed pl-1">
                      <AlertCircle size={16} className="text-slate-400 mr-2 mt-1 shrink-0"/>
                      <span>{r.fault || r.description || r.symptom || '未填寫故障情形'}</span>
                  </div>

                  {/* 第四行(底部)：左邊回訪日期 | 右邊狀態 */}
                  <div className="flex items-center justify-between border-t border-slate-50 pt-2.5 mt-1">
                      
                      {/* 左側：預計回訪 (重點顏色) */}
                      <div className={`flex items-center gap-1.5 text-xs ${dateColorClass}`}>
                          <Clock size={14}/>
                          {visitDate ? `預計回訪: ${visitDate}` : '未設定回訪'}
                      </div>

                      {/* 右側：狀態標籤 */}
                      <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                          r.status === 'tracking' ? 'bg-orange-100 text-orange-700' : 
                          r.status === 'monitor' ? 'bg-blue-100 text-blue-700' : 
                          'bg-amber-100 text-amber-700'
                      }`}>
                          {r.status === 'tracking' ? <CheckCircle size={12}/> : r.status === 'monitor' ? <Eye size={12}/> : <Wrench size={12}/>}
                          <span>
                             {r.status === 'tracking' ? '待追蹤' : r.status === 'monitor' ? '觀察中' : '待料'}
                          </span>
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