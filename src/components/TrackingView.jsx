import React from 'react';
import { 
  ArrowLeft, Trash2, Search, User, AlertCircle, 
  Briefcase, Phone, Calendar, Clock, CheckCircle, Eye, Wrench 
} from 'lucide-react';

const TrackingView = ({ records, customers, setCurrentView, startEditRecord, handleDeleteRecord }) => {
  
  const trackingRecords = records.filter(r => 
    r.status === 'tracking' || r.status === 'monitor' || r.status === 'pending'
  ).sort((a, b) => {
    const dateA = a.nextVisitDate || a.return_date || '9999-99-99';
    const dateB = b.nextVisitDate || b.return_date || '9999-99-99';
    return dateA.localeCompare(dateB);
  });

  const getSourceBadge = (source) => {
    const baseClass = "text-xs px-2 py-0.5 rounded-md flex items-center gap-1 font-medium ml-2";
    switch(source) {
      case 'customer_call': return <span className={`${baseClass} bg-rose-50 text-rose-600`}><Phone size={12}/> 客戶叫修</span>;
      case 'company_dispatch': return <span className={`${baseClass} bg-blue-50 text-blue-600`}><Briefcase size={12}/> 公司派工</span>;
      case 'invoice_check': return <span className={`${baseClass} bg-emerald-50 text-emerald-600`}><Calendar size={12}/> 例行巡檢</span>;
      default: return null;
    }
  };

  const getFriendlyDateInfo = (dateStr) => {
    if (!dateStr) return { text: '未設定回訪', color: 'text-slate-400' };
    const targetDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const dateObj = new Date(dateStr.replace(/-/g, '/'));
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekDayStr = weekDays[dateObj.getDay()];
    
    let prefix = '';
    if (diffDays === 0) prefix = '今日';
    else if (diffDays === 1) prefix = '明日';
    else if (diffDays === 2) prefix = '後天';
    else if (diffDays === -1) prefix = '昨日';

    const text = `${prefix ? prefix + ' ' : ''}(${weekDayStr}) ${dateStr}`;

    let color = 'text-slate-600';
    if (diffDays < 0) color = 'text-red-600 font-extrabold';
    else if (diffDays === 0) color = 'text-red-500 font-extrabold';
    else if (diffDays <= 2) color = 'text-orange-600 font-bold';
    else if (diffDays <= 7) color = 'text-orange-500 font-bold';

    return { text, color };
  };

  return (
     <div className="bg-slate-50 min-h-screen pb-24 font-sans flex flex-col">
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

             let borderClass = 'border-l-4 border-l-amber-500'; 
             if(r.status === 'monitor') borderClass = 'border-l-4 border-l-blue-500';

             return (
               <div 
                  key={r.id} 
                  className={`bg-white p-4 shadow-sm border border-slate-100 rounded-r-xl ${borderClass} cursor-pointer hover:shadow-md transition-shadow`}
                  onClick={(e) => startEditRecord(e, r)}
               >
                  {/* 第 1 行：任務日期 + 來源 + 刪除鈕 */}
                  <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                          <Calendar size={16} className="text-slate-400 mr-2 shrink-0"/>
                          <span className="text-sm font-bold text-slate-500">{r.date}</span>
                          {getSourceBadge(r.serviceSource)}
                      </div>
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteRecord(e, r.id); }} 
                        className="text-slate-300 hover:text-red-500 p-1 -mr-1"
                      >
                        <Trash2 size={16}/>
                      </button>
                  </div>

                  {/* 第 2 行：業者名稱 + 機型 */}
                  <div className="flex items-center mb-2">
                      <User size={16} className="text-slate-400 mr-2 shrink-0"/>
                      <span className="text-base font-bold text-slate-800 mr-2">{cust?.name || '未知客戶'}</span>
                      {cust?.assets?.[0]?.model && (
                          <span className="text-sm text-slate-500 font-medium">({cust.assets[0].model})</span>
                      )}
                  </div>

                  {/* 第 3 行：故障問題 */}
                  {/* [修正] mb-0：完全移除下方留白，緊貼分隔線 */}
                  {(r.fault || r.description || r.symptom) && (
                      <div className="flex items-start mb-0 text-base text-slate-700 whitespace-pre-wrap break-words">
                          <AlertCircle size={16} className="text-slate-400 mr-2 mt-1 shrink-0"/>
                          {/* [修正] flex-1：確保文字區塊自動填滿剩餘寬度，不會被截斷 */}
                          <span className="flex-1">{r.fault || r.description || r.symptom}</span>
                      </div>
                  )}

                  {/* 第 4 行 (底部)：回訪時間 | 狀態 */}
                  {/* [修正] mt-1：稍微拉開一點點距離避免太擠，pt-1：極小的內距，border-t：保留分隔線 */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-1 mt-1">
                      
                      {/* 左側：回訪日期 */}
                      <div className={`flex items-center text-base ${visitDateInfo.color}`}>
                          <Clock size={16} className="mr-2 shrink-0"/>
                          <span className="font-bold">{visitDateInfo.text}</span>
                      </div>

                      {/* 右側：狀態標籤 */}
                      <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                          r.status === 'tracking' ? 'bg-orange-50 text-orange-600' : 
                          r.status === 'monitor' ? 'bg-blue-50 text-blue-600' : 
                          'bg-amber-50 text-amber-600'
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