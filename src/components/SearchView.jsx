import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Search, X, ChevronRight } from 'lucide-react';

const SearchView = ({ customers, records, onSelectCustomer, onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedQuery(searchQuery); }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const results = useMemo(() => {
    const q = debouncedQuery.toLowerCase().trim();
    if (q === '') return { customers: [], records: [] };
    const matchCust = customers.filter(c => (c.name || '').toLowerCase().includes(q) || (c.address || '').toLowerCase().includes(q) || (c.L1_group || '').toLowerCase().includes(q) || (c.L2_district || '').toLowerCase().includes(q) || (c.phones || []).some(p => (p.number || '').includes(q)) || (c.assets || []).some(a => (a.model || '').toLowerCase().includes(q)));
    const matchRec = records.filter(r => (r.fault || '').toLowerCase().includes(q) || (r.solution || '').toLowerCase().includes(q));
    return { customers: matchCust, records: matchRec };
  }, [debouncedQuery, customers, records]);

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      <div className="bg-white px-4 py-3 shadow-sm sticky top-0 z-10 border-b border-gray-100 flex items-center">
         <button onClick={onBack} className="p-2 -ml-2 text-gray-600 mr-2 hover:bg-gray-100 rounded-full"><ArrowLeft /></button>
         <div className="flex-1 bg-gray-100 rounded-xl flex items-center px-3 py-2.5">
            <Search size={18} className="text-gray-400 mr-2"/>
            <input autoFocus className="bg-transparent outline-none flex-1 text-base text-gray-800 placeholder-gray-400" placeholder="搜尋客戶、電話、機型..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}/>
            {searchQuery && <button onClick={() => setSearchQuery('')}><X size={18} className="text-gray-400"/></button>}
         </div>
      </div>
      <div className="p-4 space-y-6">
         {debouncedQuery === '' ? (
           <div className="text-center text-gray-400 mt-20 flex flex-col items-center"><Search size={48} className="text-gray-200 mb-4" /><p>輸入關鍵字開始搜尋</p></div>
         ) : (
           <>
              {results.customers.length > 0 && (
               <div className="slide-in-from-bottom">
                 <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 ml-1">客戶 ({results.customers.length})</h3>
                 <div className="space-y-3">
                   {results.customers.map(c => (
                     <div key={c.customerID} onClick={() => onSelectCustomer(c)} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center cursor-pointer active:scale-[0.98] transition-all hover:border-blue-200">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm mr-3 flex-shrink-0">{c.name?.[0] || '?'}</div>
                        <div className="flex-1 min-w-0"><div className="font-bold text-sm text-gray-800 truncate">{c.name}</div><div className="text-xs text-gray-400 truncate">{c.address}</div></div><ChevronRight size={16} className="text-gray-300" />
                     </div>
                   ))}
                 </div>
                </div>
             )}
             {results.records.length > 0 && (
               <div className="slide-in-from-bottom" style={{animationDelay: '0.1s'}}>
                 <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 ml-1 mt-2">維修紀錄 ({results.records.length})</h3>
                 <div className="space-y-3">
                   {results.records.map(r => {
                     const cust = customers.find(c => c.customerID === r.customerID);
                     return (
                       <div key={r.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                          <div className="flex justify-between items-center mb-1"><span className="text-xs text-blue-500 font-bold bg-blue-50 px-2 py-0.5 rounded">{r.date}</span><span className="text-xs text-gray-400">{cust?.name || '未知客戶'}</span></div>
                          <div className="font-bold text-sm text-gray-800">{r.fault}</div><div className="text-xs text-gray-500 mt-1 truncate">{r.solution}</div>
                       </div>
                     )
                   })}
                  </div>
               </div>
             )}
             {results.customers.length === 0 && results.records.length === 0 && <div className="text-center text-sm text-gray-400 mt-10">找不到符合的資料</div>}
           </>
         )}
      </div>
    </div>
  );
};

export default SearchView;