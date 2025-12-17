import React, { useState } from 'react';
import { 
  ArrowLeft, Edit, Trash2, MapPin, ShieldAlert, Navigation, Info, User, Phone, 
  Printer, History, Plus, FileText, Search, X 
} from 'lucide-react';

const CustomerDetail = ({ 
  selectedCustomer, records, setCurrentView, startEdit, 
  handleDeleteCustomer, handleNavClick, startAddRecord, 
  startEditRecord, handleDeleteRecord, setViewingImage 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!selectedCustomer) return null;
  
  // 篩選邏輯：只顯示符合該客戶 ID 且符合搜尋關鍵字的紀錄
  const custRecords = records.filter(r => {
      const matchId = r.customerID === selectedCustomer.customerID;
      const term = searchTerm.toLowerCase();
      const matchSearch = searchTerm === '' || 
                          (r.fault || '').toLowerCase().includes(term) || 
                          (r.solution || '').toLowerCase().includes(term) ||
                          (r.parts && r.parts.some(p => p.name.toLowerCase().includes(term)));
      return matchId && matchSearch;
  }).sort((a,b) => new Date(b.date) - new Date(a.date));

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedCustomer.address)}`;
  const serviceCount = records.filter(r => r.customerID === selectedCustomer.customerID).length; // 總次數不隨搜尋改變

  return (
    <div className="bg-gray-50 min-h-screen pb-24 animate-in">
      <div className="bg-white px-4 py-4 flex items-center shadow-sm sticky top-0 z-10 border-b border-gray-100">
        <button onClick={() => setCurrentView('roster')} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"><ArrowLeft /></button>
        <h2 className="text-lg font-bold flex-1 text-center pl-8">客戶詳情</h2>
        <div className="flex -mr-2">
          <button onClick={startEdit} className="p-2 text-blue-600 mr-1 hover:bg-blue-50 rounded-full"><Edit size={20} /></button>
          <button onClick={handleDeleteCustomer} className="p-2 text-red-500 hover:bg-red-50 rounded-full"><Trash2 size={20} /></button>
        </div>
      </div>
      <div className="p-4 space-y-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start"><h1 className="text-2xl font-bold text-gray-800 mb-1">{selectedCustomer.name}</h1><span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded font-mono">{selectedCustomer.L2_district}</span></div>
            <div className="mt-2 flex items-start justify-between">
                <div className="flex-1 mr-3 group">
                  <p className="text-gray-500 text-sm flex items-start cursor-pointer hover:text-blue-600 transition-colors" 
                      onClick={() => { if(selectedCustomer.addressNote) handleNavClick(selectedCustomer); else window.open(mapUrl, '_blank'); }}>
                      <MapPin size={16} className="mr-1.5 flex-shrink-0 mt-0.5 text-blue-500" /> 
                      <span className="leading-relaxed underline decoration-dotted decoration-gray-300 underline-offset-4 group-active:opacity-50">{selectedCustomer.address}</span>
                   </p>
                </div>
                {selectedCustomer.addressNote ? (
                    <button type="button" onClick={(e) => { e.stopPropagation(); handleNavClick(selectedCustomer); }} className="flex-shrink-0 bg-red-50 text-red-600 border border-red-100 p-2.5 rounded-xl shadow-sm active:scale-90 transition-transform flex items-center justify-center">
                        <ShieldAlert size={18} />
                    </button>
                ) : (
                    <a href={mapUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex-shrink-0 bg-blue-600 text-white p-2.5 rounded-xl shadow-md shadow-blue-200 active:scale-90 transition-transform hover:bg-blue-700 flex items-center justify-center">
                        <Navigation size={18} />
                    </a>
                )}
            </div>
            {selectedCustomer.addressNote && <div className="mt-3 text-sm bg-red-50 text-red-700 p-3 rounded-lg border border-red-100 flex items-start"><ShieldAlert size={16} className="mr-2 mt-0.5 flex-shrink-0" /><span className="font-bold">{selectedCustomer.addressNote}</span></div>}
            {selectedCustomer.notes && <div className="mt-3 text-sm bg-yellow-50 text-yellow-800 p-3 rounded-lg border border-yellow-100 flex items-start"><Info size={16} className="mr-2 mt-0.5 flex-shrink-0" /><span>{selectedCustomer.notes}</span></div>}
            <div className="mt-6 pt-5 border-t border-gray-100"><h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">聯絡人</h3>
               {selectedCustomer.phones?.map((p, idx) => (
                   <div key={idx} className="flex justify-between items-center mb-3 last:mb-0 bg-gray-50 p-2 rounded-xl">
                       <div className="flex items-center text-sm font-bold text-gray-700 ml-1"><User size={16} className="mr-2 text-gray-400" />{p.label || '電話'}</div>
                       <a href={`tel:${p.number ? p.number.replace(/[^0-9+]/g, '') : ''}`} className="bg-white text-green-600 border border-gray-200 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center shadow-sm no-underline"><Phone size={14} className="mr-1.5"/> {p.number}</a>
                   </div>
               ))}
            </div>
        </div>
         <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
           <div className="flex items-center"><div className="bg-blue-50 p-3 rounded-xl mr-4 text-blue-600"><Printer size={24}/></div><div><div className="text-xs text-gray-400 font-bold uppercase">機器型號</div><div className="font-bold text-gray-800 text-lg">{selectedCustomer.assets?.[0]?.model || '無'}</div></div></div>
            <div className="text-right"><div className="text-xs text-gray-400 font-bold uppercase">累計服務</div><div className="font-bold text-slate-800 text-2xl">{serviceCount} <span className="text-xs text-gray-400 font-normal">次</span></div></div>
         </div>
         <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-slate-50 px-5 py-4 border-b border-gray-200 flex justify-between items-center">
               <h3 className="font-bold text-gray-700 flex items-center"><History size={18} className="mr-2 text-blue-500"/> 維修履歷</h3>
               <button onClick={startAddRecord} className="flex items-center text-blue-600 text-sm font-bold bg-white px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm active:scale-95 transition-transform hover:bg-blue-50"><Plus size={16} className="mr-1"/> 新增</button>
            </div>
            {/* 新增：搜尋列 */}
            <div className="px-5 py-3 border-b border-gray-100 bg-white">
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-2.5 text-gray-400"/>
                    <input 
                        type="text" 
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-9 pr-8 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                        placeholder="搜尋歷史紀錄 (故障、處理、零件)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"><X size={14}/></button>}
                </div>
            </div>

            <div className="p-5">
               {custRecords.length === 0 ? <div className="text-center py-6 text-gray-400 flex flex-col items-center"><FileText size={32} className="mb-2 opacity-20"/>{searchTerm ? '查無符合紀錄' : '尚無紀錄'}</div> : (
                 <div className="relative border-l-2 border-slate-100 pl-6 space-y-6">
                    {custRecords.map(record => {
                       let statusColor = "text-emerald-600 bg-emerald-50";
                       if(record.status === 'pending') statusColor = "text-amber-600 bg-amber-50";
                       return (
                       <div key={record.id} className="relative group animate-in fade-in slide-in-from-bottom">
                          <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-4 border-white shadow-sm ring-1 ring-gray-100 bg-gray-200`}></div>
                          <div className="text-xs font-bold text-slate-400 mb-1 flex justify-between items-center">
                              <div className="flex items-center"><span>{record.date}</span><span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${statusColor}`}>{record.status === 'pending' ? '待料' : '結案'}</span></div>
                              <div className="flex space-x-2"><button onClick={(e) => startEditRecord(e, record)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"><Edit size={14}/></button><button onClick={(e) => handleDeleteRecord(e, record.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"><Trash2 size={14}/></button></div>
                          </div>
                          <div className="flex items-start mb-1"><span className="font-bold text-gray-800 text-sm">{record.fault || record.symptom}</span></div>
                          <div className={`text-sm bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed`}>{record.solution || record.action}</div>
                          {record.parts && record.parts.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{record.parts.map(p => <span key={p.id} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100">{p.name} x{p.qty}</span>)}</div>}
                          {(record.photoBefore || record.photoAfter) && (
                              <div className="mt-3 flex gap-2">
                                  {record.photoBefore && (<div onClick={(e) => {e.stopPropagation(); setViewingImage(record.photoBefore)}} className="relative group cursor-pointer"><img src={record.photoBefore} className="h-20 w-20 object-cover rounded-lg border border-gray-200 shadow-sm" alt="Before" /></div>)}
                                  {record.photoAfter && (<div onClick={(e) => {e.stopPropagation(); setViewingImage(record.photoAfter)}} className="relative group cursor-pointer"><img src={record.photoAfter} className="h-20 w-20 object-cover rounded-lg border border-gray-200 shadow-sm" alt="After" /></div>)}
                              </div>
                          )}
                       </div>
                    )})}
                 </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default CustomerDetail;