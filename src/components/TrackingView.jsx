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

  // 2. 來源標籤
  const getSourceBadge = (source) => {
    const baseClass = "text-xs px-2 py-0.5 rounded flex items-center gap-1 font-medium ml-2";
    switch(source) {
      case 'customer_call': return <span className={`${baseClass} bg-rose-50 text-rose-600 border border-rose-100`}><Phone size={12}/> 客戶叫修</span>;
      case 'company_dispatch': return <span className={`${baseClass} bg-blue-50 text-blue-600 border border-blue-100`}><Briefcase size={12}/> 公司派工</span>;
      case 'invoice_check': return <span className={`${baseClass} bg-emerald-50 text-emerald-600 border border-emerald-100`}><Calendar size={12}/> 例行巡檢</span>;
      default: return null;
    }
  };

  // 3. 人性化日期格式與顏色邏輯
  const getFriendlyDateInfo = (dateStr) => {
    if (!dateStr) return { text: '未設定回訪', color: 'text-slate-400' };

    const targetDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 歸零時間，只比日期
    
    // 計算天數差
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // 取得星期幾
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekDayStr = weekDays[targetDate.getDay()]; // 注意：new Date(dateStr) 可能是 UTC，若用 YYYY-MM-DD 字串通常會解析為 UTC，需留意時區。但在 input type="date" 本地使用通常沒問題。
    // 簡單修正：直接用 new Date(dateStr + 'T00:00:00') 確保本地時間或是直接操作
    const localDay = new Date(dateStr.replace(/-/g, '/') + ' 00:00:00').getDay(); // 較兼容的寫法
    const localWeekDayStr = weekDays[localDay];

    // 組合文字： "明日 (二) 2025-01-07"
    let prefix = '';
    if (diffDays === 0) prefix = '今日';
    else if (diffDays === 1) prefix = '明日';
    else if (diffDays === 2) prefix = '後天';
    else if (diffDays === -1) prefix = '昨日';
    
    const text = `${prefix ? prefix + ' ' : ''}(${localWeekDayStr}) ${dateStr}`;

    // 決定顏色 (越近越紅)
    let color = 'text-slate-600';
    if (diffDays < 0) color = 'text-red-700 font-extrabold'; // 過期：深紅
    else if (diffDays === 0) color = 'text-red-600 font-extrabold'; // 今日：紅
    else if (diffDays <= 2) color = 'text-orange-600 font-bold'; // 明後天：深橘
    else if (diffDays <= 7) color = 'text-orange-500 font-bold'; // 一週內：橘
    
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

             // 狀態邊框顏色
             let borderClass = 'border-l-4 border-l-amber-500'; 
             if(r.status === 'monitor') borderClass = 'border-l-4 border-l-blue-500';

             return (
               <div 
                  key={r.id} 
                  className={`bg-white p-4 shadow-sm border border-slate-100 rounded-r-xl ${borderClass} cursor-pointer hover:shadow-md transition-shadow`}
                  onClick={(e) => startEditRecord(e, r)}
               >
                  {/* 第 1 行：任務日期 (無框，大字體) + 來源 */}
                  <div className="flex items-center mb-1">
                      <div className="flex items-center text-lg font-bold text-slate-700 mr-2">
                          <Calendar size={18} className="mr-1.5 text-slate-400"/>
                          {r.date}
                      </div>
                      {getSourceBadge(r.serviceSource)}
                  </div>

                  {/* 第 2 行：客戶名稱 (大字體) + 機型 + 刪除鈕 */}
                  <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center flex-wrap">
                          <User size={18} className="text-slate-400 mr-1.5 shrink-0"/>
                          <span className="text-lg font-bold text-slate-900 mr-2">{cust?.name || '未知客戶'}</span>
                          {cust?.assets?.[0]?.model && <span className="text-slate-500 font-medium text-sm">({cust.assets[0].model})</span>}
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteRecord(e, r.id); }} 
                        className="text-slate-300 hover:text-red-500 p-1 -mt-1"
                      >
                        <Trash2 size={18}/>
                      </button>
                  </div>

                  {/* 第 3 行：故障內容 */}
                  {(r.fault || r.description || r.symptom) && (
                      <div className="flex items-start mb-3 text-base text-slate-600 whitespace-pre-wrap pl-1">
                          <AlertCircle size={18} className="text-slate-400 mr-2 mt-0.5 shrink-0"/>
                          <span>{r.fault || r.description || r.symptom}</span>
                      </div>
                  )}

                  {/* 第 4 行 (底部)：左邊回訪日(大字體+顏色) | 右邊狀態 */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
                      
                      {/* 左側：預計回訪日期 */}
                      <div className={`flex items-center text-lg ${visitDateInfo.color}`}>
                          <Clock size={18} className="mr-1.5"/>
                          {visitDateInfo.text}
                      </div>

                      {/* 右側：狀態 (灰色) */}
                      <div className={`flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-full ${
                          r.status === 'tracking' ? 'bg-orange-50 text-orange-600' : 
                          r.status === 'monitor' ? 'bg-blue-50 text-blue-600' : 
                          'bg-amber-50 text-amber-600'
                      }`}>
                          {r.status === 'tracking' ? <CheckCircle size={14}/> : r.status === 'monitor' ? <Eye size={14}/> : <Wrench size={14}/>}
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