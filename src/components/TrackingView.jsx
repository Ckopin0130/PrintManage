import React from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';

const TrackingView = ({ records, customers, setCurrentView, startEditRecord }) => {
  const trackingRecords = records.filter(r => r.status === 'pending' || r.status === 'monitor');
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
           return (
             <div key={r.id} onClick={(e) => startEditRecord(e, r)} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-amber-400 cursor-pointer hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                   <span className="text-xs font-bold text-gray-500">{r.date}</span>
                   <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${r.status==='pending'?'bg-amber-100 text-amber-700':'bg-blue-100 text-blue-700'}`}>{r.status === 'pending' ? '待料' : '觀察中'}</span>
                </div>
                <h3 className="font-bold text-gray-800">{cust ? cust.name : '未知客戶'}</h3>
                <div className="text-sm text-gray-600 mt-1">{r.fault}</div>
                <div className="text-xs text-gray-400 mt-2 flex items-center"><AlertCircle size={12} className="mr-1"/> 點擊編輯後續處置</div>
             </div>
           )
         })}
      </div>
     </div>
  );
};

export default TrackingView;