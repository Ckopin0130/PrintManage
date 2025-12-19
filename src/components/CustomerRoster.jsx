import React, { useEffect } from 'react';
import { 
  Search, Plus, ChevronRight, MapPin, Building2, School, Tent, 
  Users, AlertTriangle, Navigation, Phone 
} from 'lucide-react';
import { PageHeader } from './SharedUI';

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

  // 第一層：選擇大區域 (維持條列式)
  if (rosterLevel === 'l1' || (rosterLevel !== 'l2' && rosterLevel !== 'l3')) {
    const validCustomers = Array.isArray(customers) ? customers : [];
    const l1Groups = ['屏東區', '高雄區', '學校單位', '軍事單位', ...new Set(validCustomers.map(c => c.L1_group || '未分類'))].filter((v, i, a) => a.indexOf(v) === i && v);
    const getCountByL1 = (group) => validCustomers.filter(c => c.L1_group === group).length;

    return (
      <div className="app-page">
        <PageHeader 
          title="客戶名冊" 
          onBack={() => { setActiveTab('dashboard'); setCurrentView('dashboard'); }} 
          rightAction={
            <>
              <button onClick={() => setCurrentView('search')} className="btn-icon"><Search size={22}/></button>
              <button onClick={() => setCurrentView('add')} className="btn-icon text-blue-600 bg-blue-50 hover:bg-blue-100"><Plus size={22} strokeWidth={2.5}/></button>
            </>
          }
        />
        <div className="p-4 space-y-3">
           <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">選擇區域分類</div>
           {l1Groups.map(group => (
             <button key={group} onClick={() => { setSelectedL1(group); setRosterLevel('l2'); }} className="app-card w-full p-4 flex items-center hover:border-blue-200 group">
               <div className="bg-slate-50 p-3 rounded-full mr-4 border border-slate-100 group-hover:bg-blue-50 transition-colors">
                  {getL1Icon(group)}
               </div>
               <div className="flex-1 text-left">
                  <h3 className="text-card-title">{group}</h3>
                  <span className="text-label">共 {getCountByL1(group)} 位客戶</span>
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

  // 第二層：選擇鄉鎮市區 (修改重點：改為條列式)
  if (rosterLevel === 'l2') {
    const validCustomers = Array.isArray(customers) ? customers : [];
    const l2List = [...new Set(validCustomers.filter(c => c.L1_group === selectedL1).map(c => c.L2_district || '未分區'))]
      .map(d => ({ name: d, count: validCustomers.filter(c => c.L1_group === selectedL1 && (c.L2_district || '未分區') === d).length }))
      .sort((a, b) => b.count - a.count);
    
    return (
      <div className="app-page">
         <PageHeader 
            title={selectedL1} 
            onBack={() => setRosterLevel('l1')}
            rightAction={
              <>
                <button onClick={() => setCurrentView('search')} className="btn-icon"><Search size={22}/></button>
                <button onClick={() => setCurrentView('add')} className="btn-icon text-blue-600 bg-blue-50 hover:bg-blue-100"><Plus size={22} strokeWidth={2.5}/></button>
              </>
            }
         />
        {/* 修改：改為 space-y-3 (垂直列表)，移除 grid */}
        <div className="p-4 space-y-3">
           <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">選擇區域 / 鄉鎮</div>
           {l2List.map(item => (
               <button 
                  key={item.name} 
                  onClick={() => { setSelectedL2(item.name); setRosterLevel('l3'); }} 
                  className="app-card w-full p-4 flex items-center hover:border-blue-200 group"
               >
                 {/* 左側圖示：沿用上一層的圖示，但稍微縮小一點 */}
                 <div className="bg-slate-50 p-2.5 rounded-full mr-4 border border-slate-100 group-hover:bg-blue-50 transition-colors">
                    {/* 我們再包一層 div 來縮放 icon */}
                    <div className="scale-90">
                        {getL1Icon(selectedL1)}
                    </div>
                 </div>

                 {/* 中間文字 */}
                 <div className="flex-1 text-left">
                    <h3 className="text-card-title">{item.name}</h3>
                    <span className="text-label">共 {item.count} 戶</span>
                 </div>

                 {/* 右側箭頭 */}
                 <div className="bg-slate-50 p-1.5 rounded-full">
                    <ChevronRight size={16} className="text-slate-300" />
                 </div>
               </button>
           ))}
        </div>
      </div>
    );
  }

  // 第三層：客戶列表 (保持不變)
  if (rosterLevel === 'l3') {
    const validCustomers = Array.isArray(customers) ? customers : [];
    const filteredCustomers = validCustomers.filter(c => c.L1_group === selectedL1 && (c.L2_district || '未分區') === selectedL2);
    
    return (
      <div className="app-page">
        <PageHeader 
            title={selectedL2} 
            onBack={() => setRosterLevel('l2')}
            rightAction={
              <>
                <button onClick={() => setCurrentView('search')} className="btn-icon"><Search size={22}/></button>
                <button onClick={() => setCurrentView('add')} className="btn-icon text-blue-600 bg-blue-50 hover:bg-blue-100"><Plus size={22} strokeWidth={2.5}/></button>
              </>
            }
        />
        <div className="p-4 space-y-3">
           {filteredCustomers.map(customer => (
              <div key={customer.customerID} className="app-card p-4 flex flex-col">
                 <div className="flex items-start mb-3 cursor-pointer" onClick={() => { setSelectedCustomer(customer); setCurrentView('detail'); }}>
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-extrabold text-sm mr-3 flex-shrink-0 border border-blue-100 shadow-sm">{customer.name?.substring(0, 1)}</div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                            <h3 className="text-card-title truncate">{customer.name}</h3>
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
                      <button type="button" onClick={(e) => { e.stopPropagation(); setTargetCustomer(customer); setShowAddressAlert(true); }} className="flex-1 btn-action bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 text-xs"><Navigation size={14}/> 導航注意</button>
                    ) : (
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customer.address)}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex-1 btn-action bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-100 text-xs no-underline"><Navigation size={14}/> 導航</a>
                    )}
                    {customer.phones?.length === 1 ? (
                        <a href={`tel:${customer.phones[0].number ? customer.phones[0].number.replace(/[^0-9+]/g, '') : ''}`} onClick={(e) => e.stopPropagation()} className="flex-1 btn-action bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 text-xs no-underline"><Phone size={14}/> 撥號</a>
                    ) : (
                        <button type="button" onClick={(e) => { e.stopPropagation(); if(customer.phones?.length>0) {setTargetCustomer(customer); setShowPhoneSheet(true);} else showToast('無電話資料', 'error'); }} className="flex-1 btn-action bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 text-xs"><Phone size={14}/> 撥號</button>
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