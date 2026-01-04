import React from 'react';
import { 
  ArrowLeft, AlertCircle, Trash2, Phone, Briefcase, Calendar, 
  User, Wrench, Clock, CheckCircle, Eye 
} from 'lucide-react';

const TrackingView = ({ records, customers, setCurrentView, startEditRecord, handleDeleteRecord }) => {
  
  // 1. 排序邏輯：維持原本的簡單邏輯 (日期字串比對)
  // 因為 input type="date" 存的一定是 YYYY-MM-DD 格式，直接比對字串即可正確排序
  const trackingRecords = records.filter(r => 
    r.status === 'tracking' || r.status === 'monitor' || r.status === 'pending'
  ).sort((a, b) => {
    // 取得日期，若無則設為極大值排在最後
    const dateA = a.nextVisitDate || a.return_date || '9999-99-99';
    const dateB = b.nextVisitDate || b.return_date || '9999-99-99';
    return dateA.localeCompare(dateB);
  });

  // 2. 來源標籤產生器 (從 RecordList 移植過來)
  const getSourceBadge = (source) => {
    const baseClass = "text-[10px] px-1.5 py-0.5 rounded-md flex items-center gap-1 font-medium ml-2 shrink-0";
    switch(source) {
      case 'customer_call': return <span className={`${baseClass} bg-rose-50 text-rose-600 border border-rose-100`}><Phone size={10}/> 客戶叫修</span>;
      case 'company_dispatch': return <span className={`${baseClass} bg-blue-50 text-blue-600 border border-blue-100`}><Briefcase size={10}/> 公司派工</span>;
      case 'invoice_check': return <span className={`${baseClass} bg-emerald-50 text-emerald-600 border border-emerald-100`}><Calendar size={10}/> 例行巡檢</span>;
      default: return null;
    }
  };

  return (
     <div className="bg-slate-50 min-h-screen pb-24 animate-in font-sans">
      {/* 標題列 */}
      <div className="bg-white px-4 py-3 flex items-center shadow-sm sticky top-0 z-10 border-b border-slate-200">
         <button onClick={() => {setCurrentView('dashboard');}} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"><ArrowLeft size={22}/></button>
         <h2 className="text-lg font-bold flex-1 text-center pr-8 text-slate-800">待辦事項追蹤</h2>
      </div>

      <div className="p-3 space-y-3">
         {trackingRecords.length === 0 ? 
          <div className="text-center text-slate-400 mt-10 flex flex-col items-center">
            <CheckCircle size={48} className="opacity-20 mb-2"/>
            <span>目前無待辦事項</span>
          </div> 
          : 
          trackingRecords.map(r => {
           const cust = customers.find(c => c.customerID === r.customerID);
           const machineModel = cust?.assets?.[0]?.model || ''; // 取得機型
           
           const isMonitor = r.status === 'monitor';
           const isTracking = r.status === 'tracking';
           const visitDate = r.nextVisitDate || r.return_date;
           
           // 判斷日期緊急程度 (為了顯示顏色)
           const todayStr = new Date().toLocaleDateString('en-CA');
           const isOverdue = visitDate && visitDate < todayStr;
           const isUrgent = visitDate && visitDate === todayStr;

           return (
             <div 
                key={r.id} 
                className={`bg-white p-4 rounded-xl shadow-sm border border-slate-100 border-l-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.99] ${isMonitor ? 'border-l-blue-500' : 'border-l-orange-500'}`}
                onClick={(e) => startEditRecord(e, r)}
             >
                {/* 頂部資訊列：客戶名稱 + 機型 + 來源 + 刪除鈕 */}
                <div className="flex justify-between items-start mb-3">
                   <div className="flex items-center flex-wrap gap-y-1">
                      <User size={16} className="text-slate-400 mr-1.5 shrink-0"/>
                      <span className="text-base font-bold text-slate-800 mr-1">{cust ? cust.name : '未知客戶'}</span>
                      {machineModel && <span className="text-slate-500 font-medium text-sm">({machineModel})</span>}
                      {getSourceBadge(r.serviceSource)}
                   </div>
                   
                   <button 
                     onClick={(e) => {
                       e.stopPropagation();
                       handleDeleteRecord(e, r.id);
                     }}
                     className="p-1.5 -mr-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors shrink-0"
                   >
                     <Trash2 size={16}/>
                   </button>
                </div>

                {/* 故障內容 (多行顯示) */}
                <div className="flex items-start mb-3 bg-slate-50 p-2.5 rounded-lg">
                   <AlertCircle size={16} className="text-rose-500 mr-2 mt-0.5 shrink-0"/>
                   <span className="text-sm font-bold text-slate-700 whitespace-pre-wrap leading-relaxed">
                     {r.fault || r.description || r.symptom || '未填寫故障情形'}
                   </span>
                </div>

                {/* 底部狀態列：日期與標籤 */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    {/* 左側：預計回訪日期 */}
                    <div className="flex items-center gap-2">
                        {visitDate ? (
                            <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-md ${
                                isOverdue ? 'bg-red-50 text-red-600 animate-pulse' : 
                                isUrgent ? 'bg-orange-50 text-orange-600' : 
                                'bg-slate-100 text-slate-600'
                            }`}>
                                <Calendar size={12} className="mr-1"/>
                                {isOverdue ? '已過期: ' : isUrgent ? '今日: ' : '預計: '}
                                {visitDate}
                            </div>
                        ) : (
                            <span className="text-xs text-slate-400">無回訪日期</span>
                        )}
                    </div>

                    {/* 右側：狀態標籤 */}
                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                       isTracking ? 'bg-orange-100 text-orange-700' : 
                       isMonitor ? 'bg-blue-100 text-blue-700' : 
                       'bg-amber-100 text-amber-700'
                     }`}>
                       {isTracking ? <Clock size={12}/> : isMonitor ? <Eye size={12}/> : <Wrench size={12}/>}
                       <span className="ml-1">{isTracking ? '待追蹤' : isMonitor ? '觀察中' : '待料'}</span>
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