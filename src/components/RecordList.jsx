import React from 'react';
import { ArrowLeft, Calendar, Edit, Trash2, Package } from 'lucide-react';

const RecordList = ({ 
  records, customers, setCurrentView, setActiveTab, 
  startEditRecord, handleDeleteRecord, setViewingImage 
}) => {
  return (
    <div className="bg-slate-50 min-h-screen pb-24 font-sans">
      <div className="bg-white/95 backdrop-blur px-6 py-3 flex items-center sticky top-0 z-30 shadow-sm border-b border-slate-100/50">
         <button onClick={() => {setCurrentView('dashboard'); setActiveTab('dashboard');}} className="p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors"><ArrowLeft size={22}/></button>
         <h2 className="text-lg font-extrabold flex-1 text-center pr-8 text-slate-800 tracking-wide">服務紀錄總覽</h2>
      </div>
      <div className="p-4 space-y-3">
        {records.length === 0 ? <div className="text-center text-slate-400 mt-20 font-bold text-sm">尚無任何紀錄</div> : records.map(r => {
           const cust = customers.find(c => c.customerID === r.customerID);
           let statusColor = "bg-emerald-50 text-emerald-600 border-emerald-100";
           if(r.status === 'pending') statusColor = "bg-amber-50 text-amber-600 border-amber-100";
           if(r.status === 'monitor') statusColor = "bg-blue-50 text-blue-600 border-blue-100";
           
           return (
             <div key={r.id} className="bg-white p-4 rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] border border-slate-100 hover:border-blue-100 transition-all active:scale-[0.99] group">
                <div className="flex justify-between items-start mb-2">
                   <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 flex items-center"><Calendar size={10} className="mr-1.5"/>{r.date}</span>
                   <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>{r.status === 'pending' ? '待料' : (r.status === 'monitor' ? '觀察' : '結案')}</span>
                      <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => startEditRecord(e, r)} className="text-slate-300 hover:text-blue-600 p-1"><Edit size={14}/></button>
                        <button onClick={(e) => handleDeleteRecord(e, r.id)} className="text-slate-300 hover:text-rose-500 p-1"><Trash2 size={14}/></button>
                      </div>
                   </div>
                </div>
                <h3 className="font-bold text-slate-800 text-base mb-1 flex items-center">{cust ? cust.name : '未知客戶'}</h3>
                <div className="text-sm text-slate-600 line-clamp-1 mb-2 font-bold">{r.fault || r.symptom}</div>
                <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">{r.solution || r.action}</div>
                
                {r.parts && r.parts.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {r.parts.map((p, idx) => (
                      <span key={idx} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md border border-blue-100 font-bold flex items-center">
                        <Package size={10} className="mr-1"/> {p.name} x{p.qty}
                      </span>
                    ))}
                  </div>
                )}

                {(r.photoBefore || r.photoAfter) && (
                    <div className="mt-3 flex gap-2 overflow-x-auto">
                       {r.photoBefore && <img src={r.photoBefore} onClick={(e) => { e.stopPropagation(); setViewingImage(r.photoBefore); }} className="h-16 w-16 object-cover rounded-xl border border-slate-100 cursor-pointer shadow-sm" alt="before"/>}
                       {r.photoAfter && <img src={r.photoAfter} onClick={(e) => { e.stopPropagation(); setViewingImage(r.photoAfter); }} className="h-16 w-16 object-cover rounded-xl border border-slate-100 cursor-pointer shadow-sm" alt="after"/>}
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