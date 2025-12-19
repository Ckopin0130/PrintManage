import React, { useEffect } from 'react';
import { 
  Home, Search, Plus, ChevronRight, ArrowLeft, MapPin, Building2, School, Tent, 
  Users, AlertTriangle, Navigation, Phone 
} from 'lucide-react';

const getL1Icon = (group) => {
  const safeGroup = group || '';
  if (safeGroup.includes('屏東')) return <MapPin size={24} className="text-blue-500" />;
  if (safeGroup.includes('高雄')) return <Building2 size={24} className="text-orange-500" />;
  if (safeGroup.includes('學校')) return <School size={24} className="text-emerald-500" />;
  if (safeGroup.includes('軍事')) return <Tent size={24} className="text-violet-500" />;
  return <Users size={24} className="text-slate-400" />;
};

const CustomerRoster = ({ 
  customers = [], rosterLevel = 'l1', setRosterLevel, 
  selectedL1, setSelectedL1, selectedL2, setSelectedL2, 
  setCurrentView, setActiveTab, setSelectedCustomer, 
  setTargetCustomer, setShowAddressAlert, setShowPhoneSheet, showToast 
}) => {
  
  useEffect(() => {
    if (!rosterLevel || !['l1', 'l2', 'l3'].includes(rosterLevel)) {
      if (setRosterLevel) setRosterLevel('l1');
    }
  }, [rosterLevel, setRosterLevel]);

  // 通用頂部導航列 (統一風格)
  const Header = ({ title, onBack, rightAction }) => (
    <div className="bg-white/95 backdrop-blur px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm border-b border-slate-100/50">
       <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors">
          {rosterLevel === 'l1' ? <Home size={22} /> : <ArrowLeft size={22} />}
       </button>
       <h2 className="text-lg font-extrabold text-slate-800 tracking-wide">{title}</h2>
       <div className="flex items-center gap-1">
          {rightAction}
       </div>
    </div>
  );

  // 第一層：選擇大區域
  if (rosterLevel === 'l1' || (rosterLevel !== 'l2' && rosterLevel !== 'l3')) {
    const validCustomers = Array.isArray(customers) ? customers : [];
    const l1Groups = ['屏東區', '高雄區', '學校單位', '軍事單位', ...new Set(validCustomers.map(c => c.L1_group || '未分類'))].filter((v, i, a) => a.indexOf(v) === i && v);
    const getCountByL1 = (group) => validCustomers.filter(c => c.L1_group === group).length;

    return (
      <div className="bg-slate-50 min-h-screen pb-24 font-sans">
        <Header 
          title="客戶名冊" 
          onBack={() => { setActiveTab('dashboard'); setCurrentView('dashboard'); }} 
          rightAction={
            <>
              <button onClick={() => setCurrentView('search')} className="p-2 text-slate-400 hover:text-blue-600 rounded-full"><Search size={22}/></button>
              <button onClick={() => setCurrentView('add')} className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"><Plus size={22} strokeWidth={2.5}/></button>
            </>
          }
        />
        <div className="p-4 space-y-3">
           <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">選擇區域分類</div>
           {l1Groups.map(group => (
             <button key={group} onClick={() => { setSelectedL1(group); setRosterLevel('l2'); }} className="w-full bg-white p-4 rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center active:scale-[0.98] transition-all hover:border-blue-200 group">
               <div className="bg-slate-50 p-3 rounded-full mr-4 border border-slate-100 group-hover:bg-blue-50 transition-colors">
                  {getL1Icon(group)}
               </div>
               <div className="flex-1 text-left">
                  <h3 className="text-base font-bold text-slate-800">{group}</h3>
                  <span className="text-xs text-slate-400 font-bold">共 {getCountByL1(group)} 位客戶</span>
               </div>
               <div className="bg-slate-50 p-1.5 rounded-full">
                  <ChevronRight size={16} className="text-slate-300" />
               </div>
             </button>
           ))}
        </div>
      </div>
    );
  }

  // 第二層：選擇鄉鎮市區
  if (rosterLevel === 'l2') {
    const validCustomers = Array.isArray(customers) ? customers : [];
    const l2List = [...new Set(validCustomers.filter(c => c.L1_group === selectedL1).map(c => c.L2_district || '未分區'))].map(d => ({ name: d, count: validCustomers.filter(c => c.L1_group === selectedL1 && (c.L2_district || '未分區') === d).length })).sort((a, b) => b.count - a.count);
    
    return (
      <div className="bg-slate-50 min-h-screen pb-24 font-sans">
         <Header 
            title={selectedL1} 
            onBack={() => setRosterLevel('l1')}
            rightAction={
              <>
                <button onClick={() => setCurrentView('search')} className="p-2 text-slate-400 hover:text-blue-600 rounded-full"><Search size={22}/></button>
                <button onClick={() => setCurrentView('add')} className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"><Plus size={22} strokeWidth={2.5}/></button>
              </>
            }
         />
        <div className="p-4 grid grid-cols-2 gap-3">
           {l2List.map(item => (
               <button key={item.name} onClick={() => { setSelectedL2(item.name); setRosterLevel('l3'); }} className="bg-white p-4 rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col items-center justify-center active:scale-[0.96] transition-all h-32 hover:border-blue-300 hover:shadow-md group">
                 <div className="mb-2 scale-110 opacity-80 group-hover:scale-125 transition-transform">{getL1Icon(selectedL1)}</div>
                 <h3 className="font-bold text-slate-700 text-base text-center">{item.name}</h3>
                 <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full mt-2">{item.count} 戶</span>
               </button>
           ))}
        </div>
      </div>
    );
  }

  // 第三層：客戶列表
  if (rosterLevel === 'l3') {
    const validCustomers = Array.isArray(customers) ? customers : [];
    const filteredCustomers = validCustomers.filter(c => c.L1_group === selectedL1 && (c.L2_district || '未分區') === selectedL2);
    
    return (
      <div className="bg-slate-50 min-h-screen pb-24 font-sans">
        <Header 
            title={selectedL2} 
            onBack={() => setRosterLevel('l2')}
            rightAction={
              <>
                <button onClick={() => setCurrentView('search')} className="p-2 text-slate-400 hover:text-blue-600 rounded-full"><Search size={22}/></button>
                <button onClick={() => setCurrentView('add')} className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"><Plus size={22} strokeWidth={2.5}/></button>
              </>
            }
        />
        <div className="p-4 space-y-3">
           {filteredCustomers.map(customer => (
              <div key={customer.customerID} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_2px_8px_rgb(0,0,0,0.04)] flex flex-col active:scale-[0.99] transition-all">
                 <div className="flex items-start mb-3 cursor-pointer" onClick={() => { setSelectedCustomer(customer); setCurrentView('detail'); }}>
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-extrabold text-sm mr-3 flex-shrink-0 border border-blue-100 shadow-sm">{customer.name?.substring(0, 1)}</div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                            <h3 className="font-bold text-slate-800 text-base truncate">{customer.name}</h3>
                            <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-1 rounded-md font-bold ml-2 flex-shrink-0 border border-slate-200">{customer.assets?.[0]?.model || '無機型'}</span>
                        </div>
                        <div className="flex items-center text-xs text-slate-400 mt-1 font-medium">
                            {customer.addressNote && <AlertTriangle size={12} className="text-rose-500 mr-1 flex-shrink-0" />}
                            <span className={`truncate ${customer.addressNote ? 'text-rose-500 font-bold' : ''}`}>{customer.address}</span>
                        </div>
                    </div>
                 </div>
                 <div className="flex space-x-2 border-t border-slate-50 pt-3">
                    {customer.addressNote ? (
                      <button type="button" onClick={(e) => { e.stopPropagation(); setTargetCustomer(customer); setShowAddressAlert(true); }} className="flex-1 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold flex items-center justify-center hover:bg-rose-100 transition-colors border border-rose-100"><Navigation size={14} className="mr-1.5"/> 導航注意</button>
                    ) : (
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customer.address)}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold flex items-center justify-center hover:bg-slate-100 transition-colors no-underline border border-slate-100"><Navigation size={14} className="mr-1.5"/> 導航</a>
                    )}
                    {customer.phones?.length === 1 ? (
                        <a href={`tel:${customer.phones[0].number ? customer.phones[0].number.replace(/[^0-9+]/g, '') : ''}`} onClick={(e) => e.stopPropagation()} className="flex-1 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold flex items-center justify-center hover:bg-emerald-100 no-underline border border-emerald-100"><Phone size={14} className="mr-1.5"/> 撥號</a>
                    ) : (
                        <button type="button" onClick={(e) => { e.stopPropagation(); if(customer.phones?.length>0) {setTargetCustomer(customer); setShowPhoneSheet(true);} else showToast('無電話資料', 'error'); }} className="flex-1 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold flex items-center justify-center hover:bg-emerald-100 border border-emerald-100"><Phone size={14} className="mr-1.5"/> 撥號</button>
                    )}
                 </div>
              </div>
           ))}
        </div>
      </div>
    );
  }
  return null;
};

export default CustomerRoster;