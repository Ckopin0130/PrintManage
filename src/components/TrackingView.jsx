import React from 'react';
import { 
  ArrowLeft, Trash2, Search, User, AlertCircle, 
  Briefcase, Phone, Calendar, Clock, CheckCircle, Eye, Wrench 
} from 'lucide-react';

const TrackingView = ({ records, customers, setCurrentView, startEditRecord, handleDeleteRecord }) => {
  
  // 1. 排序邏輯 (維持不變)
  const trackingRecords = records.filter(r => 
    r.status === 'tracking' || r.status === 'monitor' || r.status === 'pending'
  ).sort((a, b) => {
    const dateA = a.nextVisitDate || a.return_date || '9999-99-99';
    const dateB = b.nextVisitDate || b.return_date || '9999-99-99';
    return dateA.localeCompare(dateB);
  });

  // 2. 來源標籤 (維持 RecordList 風格：小字、圓角、淡色背景)
  const getSourceBadge = (source) => {
    const baseClass = "text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 font-medium ml-2 border";
    switch(source) {
      case 'customer_call': return <span className={`${baseClass} bg-rose-50 text-rose-600 border-rose-100`}><Phone size={10}/> 客戶叫修</span>;
      case 'company_dispatch': return <span className={`${baseClass} bg-blue-50 text-blue-600 border-blue-100`}><Briefcase size={10}/> 公司派工</span>;
      case 'invoice_check': return <span className={`${baseClass} bg-emerald-50 text-emerald-600 border-emerald-100`}><Calendar size={10}/> 例行巡檢</span>;
      default: return null;
    }
  };

  // 3. 人性化日期格式與顏色邏輯
  const getFriendlyDateInfo = (dateStr) => {
    if (!dateStr) return { text: '未設定回訪', color: 'text-slate-400' };

    const targetDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // 解決時區導致的星期幾誤差，直接操作字串
    const dateObj = new Date(dateStr.replace(/-/g, '/')); 
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekDayStr = weekDays[dateObj.getDay()];

    let prefix = '';
    if (diffDays === 0) prefix = '今日';
    else if (diffDays === 1) prefix = '明日';
    else if (diffDays === 2) prefix = '後天';
    else if (diffDays === -1) prefix = '昨日';
    
    // 格式：明日 (二) 2026-01-06
    const text = `${prefix ? prefix + ' ' : ''}(${weekDayStr}) ${dateStr}`;

    // 顏色邏輯 (越近越紅)
    let color = 'text-slate-500';
    if (diffDays < 0) color = 'text-red-600 font-extrabold'; // 過期
    else if (diffDays === 0) color = 'text-red-500 font-extrabold'; // 今日
    else if (diffDays <= 2) color = 'text-orange-600 font-bold'; // 明後天
    else if (diffDays <= 7) color = 'text-orange-500 font-bold'; // 一週內
    
    return { text, color };
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
             const visitDateInfo = getFriendlyDateInfo(r.nextVisitDate || r.return_date);

             // 狀態邊框顏色 (與 RecordList 一致)
             let borderClass = 'border-l-4 border-l-amber-500'; 
             if(r.status === 'monitor') borderClass = 'border-l-4 border-l-blue-500';

             return (
               <div 
                  key={r.id} 
                  className={`bg-white p-4 shadow-sm border border-slate-100 rounded-r-xl ${borderClass} cursor-pointer hover:shadow-md transition-shadow`}
                  onClick={(e) => startEditRecord(e, r)}
               >
                  {/* 第 1 行 (Meta)：日期 + 來源 (縮小、灰色、對齊) */}
                  <div className="flex items-center mb-1 pl-[1px]">
                      <div className="flex items-center text-xs font-bold text-slate-400">
                          <Calendar size={12} className="mr-1"/>
                          {r.date}
                      </div>
                      {getSourceBadge(r.serviceSource)}
                  </div>

                  {/* 第 2 行 (標題)：客戶名稱 + 機型 (與 RecordList 完全對齊) */}
                  <div className="flex justify-between items-start mb-2">
                      <div className="text-base text-slate-800 font-bold flex items-center flex-wrap">
                          <User size={16} className="text-slate-400 mr-2 shrink-0"/>
                          <span className="mr-1">{cust?.name || '未知客戶'}</span>
                          {cust?.assets?.[0]?.model && <span className="text-slate-500 font-normal">({cust.assets[0].model})</span>}
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteRecord(e, r.id); }} 
                        className="text-slate-300 hover:text-red-500 p-1 -mt-1"
                      >
                        <Trash2 size={16}/>
                      </button>
                  </div>

                  {/* 第 3 行 (內容)：故障問題 (與 RecordList 一致的字體大小與縮排) */}
                  {(r.fault || r.description || r.symptom) && (
                      <div className="flex items-start mb-2 text-base text-slate-700 whitespace-pre-wrap">
                          <AlertCircle size={16} className="text-slate-400 mr-2 mt-1 shrink-0"/>
                          <span>{r.fault || r.description || r.symptom}</span>
                      </div>
                  )}

                  {/* 第 4 行 (底部)：左邊回訪日 | 右邊狀態 */}
                  <div className="text-xs mt-2 border-t border-slate-50 pt-2 flex items-center justify-between">
                      
                      {/* 左側：預計回訪日期 (有顏色) */}
                      <div className={`flex items-center ${visitDateInfo.color}`}>
                          <Clock size={12} className="mr-1"/>
                          <span className="font-bold">{visitDateInfo.text}</span>
                      </div>

                      {/* 右側：狀態 (灰色) */}
                      <div className="flex items-center gap-1 text-slate-400">
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