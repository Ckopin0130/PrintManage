import React from 'react';
import { ArrowLeft, Calendar, Edit, Trash2, Package } from 'lucide-react';

const RecordList = ({ 
  records, customers, setCurrentView, setActiveTab, 
  startEditRecord, handleDeleteRecord, setViewingImage 
}) => {
  return (
    <div className="bg-gray-50 min-h-screen pb-24 animate-in">
      <div className="bg-white px-4 py-4 flex items-center shadow-sm sticky top-0 z-10 border-b border-gray-100">
         <button onClick={() => {setCurrentView('dashboard'); setActiveTab('dashboard');}} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"><ArrowLeft /></button>
         <h2 className="text-lg font-bold flex-1 text-center pr-8">服務紀錄總覽 (Top 300)</h2>
      </div>
      <div className="p-4 space-y-4">
        {records.length === 0 ? <div className="text-center text-gray-400 mt-10">尚無任何紀錄</div> : records.map(r => {
           const cust = customers.find(c => c.customerID === r.customerID);
           let statusColor = "bg-emerald-100 text-emerald-700";
           if(r.status === 'pending') statusColor = "bg-amber-100 text-amber-700";
           if(r.status === 'monitor') statusColor = "bg-blue-100 text-blue-700";
           
           return (
             <div key={r.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                   <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded flex items-center"><Calendar size={12} className="mr-1"/>{r.date}</span>
                   <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusColor}`}>{r.status === 'pending' ? '待料' : (r.status === 'monitor' ? '觀察' : '結案')}</span>
                      <button onClick={(e) => startEditRecord(e, r)} className="text-gray-400 hover:text-blue-600 p-1"><Edit size={16}/></button>
                      <button onClick={(e) => handleDeleteRecord(e, r.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={16}/></button>
                   </div>
                </div>
                <h3 className="font-bold text-gray-800 text-lg mb-1 flex items-center">{cust ? cust.name : '未知客戶'}</h3>
                <div className="text-sm text-gray-600 line-clamp-1 mb-1 font-bold">{r.fault || r.symptom}</div>
                <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">{r.solution || r.action}</div>
                
                {/* 新增：顯示更換零件的部分 */}
                {r.parts && r.parts.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {r.parts.map((p, idx) => (
                      <span key={idx} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100 font-bold flex items-center">
                        <Package size={10} className="mr-1"/> {p.name} x{p.qty}
                      </span>
                    ))}
                  </div>
                )}

                {(r.photoBefore || r.photoAfter) && (
                    <div className="mt-3 flex gap-2 overflow-x-auto">
                       {r.photoBefore && <img src={r.photoBefore} onClick={(e) => { e.stopPropagation(); setViewingImage(r.photoBefore); }} className="h-20 w-20 object-cover rounded-lg border border-gray-200 cursor-pointer" alt="before"/>}
                       {r.photoAfter && <img src={r.photoAfter} onClick={(e) => { e.stopPropagation(); setViewingImage(r.photoAfter); }} className="h-20 w-20 object-cover rounded-lg border border-gray-200 cursor-pointer" alt="after"/>}
                    </div>
                )}
             </div>
           )
         })}
      </div>
    </div>
  );
};

export default RecordList;