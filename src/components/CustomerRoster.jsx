import React, { useEffect } from 'react';
import { 
  Home, Search, Plus, ChevronRight, ArrowLeft, MapPin, Building2, School, Tent, 
  Users, AlertTriangle, Navigation, Phone 
} from 'lucide-react';

// 輔助函數：取得區域圖示
const getL1Icon = (group) => {
  const safeGroup = group || '';
  if (safeGroup.includes('屏東')) return <MapPin size={24} className="text-blue-500" />;
  if (safeGroup.includes('高雄')) return <Building2 size={24} className="text-orange-500" />;
  if (safeGroup.includes('學校')) return <School size={24} className="text-green-500" />;
  if (safeGroup.includes('軍事')) return <Tent size={24} className="text-purple-500" />;
  return <Users size={24} className="text-gray-500" />;
};

const CustomerRoster = ({ 
  customers = [], 
  rosterLevel = 'l1', 
  setRosterLevel, 
  selectedL1, setSelectedL1, 
  selectedL2, setSelectedL2, 
  setCurrentView, setActiveTab, 
  setSelectedCustomer, 
  setTargetCustomer, setShowAddressAlert, setShowPhoneSheet, showToast 
}) => {
  
  // 防呆機制：如果 rosterLevel 是空的，或是奇怪的值，自動設回 'l1'
  useEffect(() => {
    if (!rosterLevel || !['l1', 'l2', 'l3'].includes(rosterLevel)) {
      if (setRosterLevel) setRosterLevel('l1');
    }
  }, [rosterLevel, setRosterLevel]);

  // 第一層：選擇大區域 (預設顯示)
  if (rosterLevel === 'l1' || (rosterLevel !== 'l2' && rosterLevel !== 'l3')) {
    const validCustomers = Array.isArray(customers) ? customers : [];
    const l1Groups = ['屏東區', '高雄區', '學校單位', '軍事單位', ...new Set(validCustomers.map(c => c.L1_group || '未分類'))].filter((v, i, a) => a.indexOf(v) === i && v);
    const getCountByL1 = (group) => validCustomers.filter(c => c.L1_group === group).length;

    return (
      <div className="bg-gray-50 min-h-screen pb-24">
        <div className="bg-white px-4 py-4 flex items-center shadow-sm sticky top-0 z-10 border-b border-gray-100">
           <button onClick={() => { setActiveTab('dashboard'); setCurrentView('dashboard'); }} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"><Home size={20}/></button>
           <h2 className="text-lg font-bold flex-1 text-center pr-6">客戶名冊</h2>
           <div className="flex -mr-2"><button onClick={() => setCurrentView('search')} className="p-2 mr-1 text-gray-500 hover:bg-gray-100 rounded-full"><Search size={20}/></button><button onClick={() => { setCurrentView('add'); }} className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"><Plus size={20} /></button></div>
        </div>
        <div className="p-4 space-y-3">
           <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">選擇區域分類</div>
           {l1Groups.map(group => (
             <button key={group} onClick={() => { setSelectedL1(group); setRosterLevel('l2'); }} className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center active:scale-[0.98] transition-all hover:border-blue-200">
               <div className="bg-blue-50 p-3 rounded-full mr-4 text-blue-600 border border-blue-100">{getL1Icon(group)}</div>
               <div className="flex-1 text-left"><h3 className="text-base font-bold text-gray-800">{group}</h3><span className="text-xs text-gray-500 font-medium">共 {getCountByL1(group)} 位客戶</span></div><ChevronRight className="text-gray-300" />
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
      <div className="bg-gray-50 min-h-screen pb-24">
         <div className="bg-white px-4 py-4 flex items-center shadow-sm sticky top-0 z-10 border-b border-gray-100">
           <button onClick={() => setRosterLevel('l1')} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"><ArrowLeft /></button>
           <h2 className="text-lg font-bold flex-1 text-center pr-8">{selectedL1}</h2>
           <div className="flex -mr-2"><button onClick={() => setCurrentView('search')} className="p-2 mr-1 text-gray-500 hover:bg-gray-100 rounded-full"><Search size={20}/></button><button onClick={() => { setCurrentView('add'); }} className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"><Plus size={20} /></button></div>
         </div>
        <div className="p-4 grid grid-cols-2 gap-3">
           {l2List.map(item => (
               <button key={item.name} onClick={() => { setSelectedL2(item.name); setRosterLevel('l3'); }} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center active:scale-[0.98] transition-all h-32 hover:border-blue-300 hover:shadow-md">
                 {getL1Icon(selectedL1)}<h3 className="font-bold text-gray-800 text-base text-center">{item.name}</h3><span className="text-xs bg-gray-100 text-gray-600 font-medium px-2 py-0.5 rounded-md mt-2">{item.count} 戶</span>
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
      <div className="bg-gray-50 min-h-screen pb-24">
        <div className="bg-white px-4 py-4 flex items-center shadow-sm sticky top-0 z-10 border-b border-gray-100">
          <button onClick={() => setRosterLevel('l2')} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"><ArrowLeft /></button>
          <h2 className="text-lg font-bold flex-1 text-center pr-8">{selectedL2}</h2>
          <div className="flex -mr-2"><button onClick={() => setCurrentView('search')} className="p-2 mr-1 text-gray-500 hover:bg-gray-100 rounded-full"><Search size={20}/></button><button onClick={() => { setCurrentView('add'); }} className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"><Plus size={20} /></button></div>
        </div>
        <div className="p-4 space-y-3">
           {filteredCustomers.map(customer => (
              <div key={customer.customerID} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                 <div className="flex items-start mb-3 cursor-pointer" onClick={() => { setSelectedCustomer(customer); setCurrentView('detail'); }}>
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm mr-3 flex-shrink-0">{customer.name?.substring(0, 1)}</div>
                    <div className="flex-1 min-w-0"><div className="flex justify-between items-start"><h3 className="font-bold text-gray-800 text-base truncate">{customer.name}</h3><span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-1 rounded-full font-bold ml-2 flex-shrink-0">{customer.assets?.[0]?.model || '無機型'}</span></div><div className="flex items-center text-xs text-gray-500 mt-1">{customer.addressNote && <AlertTriangle size={12} className="text-red-500 mr-1 flex-shrink-0" />}<span className={`truncate ${customer.addressNote ? 'text-red-500 font-bold' : ''}`}>{customer.address}</span></div></div>
                 </div>
                 <div className="flex space-x-2 border-t border-gray-50 pt-3">
                    {customer.addressNote ? (
                      <button type="button" onClick={(e) => { e.stopPropagation(); setTargetCustomer(customer); setShowAddressAlert(true); }} className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold flex items-center justify-center hover:bg-blue-100 transition-colors"><Navigation size={16} className="mr-1.5"/> 導航</button>
                    ) : (
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customer.address)}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold flex items-center justify-center hover:bg-blue-100 transition-colors no-underline"><Navigation size={16} className="mr-1.5"/> 導航</a>
                    )}
                    {customer.phones?.length === 1 ? (
                        <a href={`tel:${customer.phones[0].number ? customer.phones[0].number.replace(/[^0-9+]/g, '') : ''}`} onClick={(e) => e.stopPropagation()} className="flex-1 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-bold flex items-center justify-center hover:bg-green-100 no-underline"><Phone size={16} className="mr-1.5"/> 撥號</a>
                    ) : (
                        <button type="button" onClick={(e) => { e.stopPropagation(); if(customer.phones?.length>0) {setTargetCustomer(customer); setShowPhoneSheet(true);} else showToast('無電話資料', 'error'); }} className="flex-1 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-bold flex items-center justify-center hover:bg-green-100"><Phone size={16} className="mr-1.5"/> 撥號</button>
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