import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Edit, Trash2, MapPin, ShieldAlert, Navigation, Info, User, Phone, 
  Printer, History, Plus, FileText, Search, X, Building2, PhoneForwarded, Wrench
} from 'lucide-react';

const CustomerDetail = ({ 
  selectedCustomer, records, setCurrentView, startEdit, 
  handleDeleteCustomer, handleNavClick, startAddRecord, 
  startEditRecord, handleDeleteRecord, setViewingImage 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!selectedCustomer) return null;
  
  // 優化：使用 useMemo 快取篩選結果，避免每次 render 都重新計算
  const custRecords = useMemo(() => {
    return records.filter(r => {
        const matchId = r.customerID === selectedCustomer.customerID;
        const term = searchTerm.toLowerCase();
        const matchSearch = searchTerm === '' || 
                            (r.fault || '').toLowerCase().includes(term) || 
                            (r.solution || '').toLowerCase().includes(term) ||
                            (r.parts && r.parts.some(p => p.name.toLowerCase().includes(term)));
        return matchId && matchSearch;
    }).sort((a,b) => new Date(b.date) - new Date(a.date));
  }, [records, selectedCustomer.customerID, searchTerm]);

  const serviceCount = records.filter(r => r.customerID === selectedCustomer.customerID).length;
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedCustomer.address || '')}`;
  const handlePhoneClick = (phoneNumber) => {
    if (phoneNumber) {
      window.location.href = `tel:${phoneNumber.replace(/[^0-9+]/g, '')}`;
    }
  };
  const handleAddressClick = () => {
    if (selectedCustomer.addressNote) {
      handleNavClick(selectedCustomer);
    } else if (selectedCustomer.address) {
      window.open(mapUrl, '_blank');
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24 flex flex-col font-sans">
      <style>{`
        a[href^="tel:"] {
          text-decoration: none !important;
          border: none !important;
          outline: none !important;
          -webkit-tap-highlight-color: transparent !important;
          text-decoration-line: none !important;
          text-decoration-style: none !important;
          text-decoration-color: transparent !important;
        }
        a[href^="tel:"]:hover,
        a[href^="tel:"]:active,
        a[href^="tel:"]:focus {
          text-decoration: none !important;
          border: none !important;
          outline: none !important;
          text-decoration-line: none !important;
          text-decoration-style: none !important;
          text-decoration-color: transparent !important;
        }
        /* 強制移除所有電話和地址的底線 */
        div[class*="phone"] *,
        div[class*="address"] *,
        span[class*="address"],
        div[style*="phone"],
        div[style*="address"],
        div[style*="textDecoration"],
        div[style*="border"] {
          -webkit-touch-callout: none !important;
          -webkit-user-select: none !important;
          text-decoration: none !important;
          text-decoration-line: none !important;
          text-decoration-style: none !important;
          text-decoration-color: transparent !important;
          border-bottom: none !important;
          border-top: none !important;
          border-left: none !important;
          border-right: none !important;
          -webkit-text-decoration: none !important;
          -moz-text-decoration: none !important;
          -ms-text-decoration: none !important;
        }
        /* 移除手機瀏覽器自動識別電話和地址 */
        * {
          -webkit-tap-highlight-color: transparent;
        }
        /* 針對手機瀏覽器的特殊處理 */
        @media (max-width: 768px) {
          div[style*="phone"],
          div[style*="address"] {
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
            appearance: none !important;
            text-decoration: none !important;
            border: none !important;
            outline: none !important;
            -webkit-text-decoration: none !important;
            -moz-text-decoration: none !important;
            -ms-text-decoration: none !important;
          }
        }
      `}</style>
      {/* 頂部標題列 - 與 Dashboard 風格一致 */}
      <div className="bg-white/95 backdrop-blur px-4 py-3 flex items-center shadow-sm sticky top-0 z-30 border-b border-slate-100/50 shrink-0">
        <button onClick={() => setCurrentView('roster')} className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-full transition-colors"><ArrowLeft size={24}/></button>
        <h2 className="text-lg font-extrabold flex-1 text-center text-slate-800 tracking-wide">客戶詳情</h2>
        <div className="flex gap-1 -mr-2">
          <button onClick={startEdit} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"><Edit size={20} /></button>
          <button onClick={handleDeleteCustomer} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"><Trash2 size={20} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 space-y-4">
        {/* 名片卡區域 - 統一設計，無分隔線 */}
        <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] border border-slate-100 p-5 space-y-4">
          {/* 第一行：客戶名稱（哪個地區） */}
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 shrink-0 flex items-center justify-center">
              <Building2 size={20} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-800 truncate">{selectedCustomer.name}</h1>
              {selectedCustomer.L2_district && (
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{selectedCustomer.L2_district}</span>
              )}
            </div>
          </div>

          {/* 第二行：聯絡人圖標 + 欄位 + 電話符號 + 電話欄位 + 撥號鍵符號 */}
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600 shrink-0 flex items-center justify-center">
              <User size={20} strokeWidth={2.5} />
            </div>
            <div className={`flex-1 text-base font-bold ${selectedCustomer.contactPerson ? 'text-slate-800' : 'text-slate-400 bg-slate-50 px-2 py-1 rounded'}`}>
              {selectedCustomer.contactPerson || '暫無資料'}
            </div>
            {selectedCustomer.phones && selectedCustomer.phones.length > 0 && selectedCustomer.phones[0].number && (
              <>
                <div className="bg-green-50 p-2.5 rounded-xl text-green-600 shrink-0 flex items-center justify-center">
                  <Phone size={20} strokeWidth={2.5} />
                </div>
                <div 
                  className="flex-1 text-base font-bold text-slate-800 truncate min-w-0"
                  style={{ 
                    textDecoration: 'none',
                    border: 'none',
                    outline: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    WebkitTouchCallout: 'none',
                    WebkitUserSelect: 'none',
                    userSelect: 'none',
                    textDecorationLine: 'none',
                    textDecorationStyle: 'none',
                    textDecorationColor: 'transparent',
                    borderBottom: 'none',
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    WebkitTextDecoration: 'none',
                    MozTextDecoration: 'none',
                    MsTextDecoration: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    appearance: 'none'
                  }}
                >
                  {selectedCustomer.phones[0].number}
                </div>
                <button
                  onClick={() => handlePhoneClick(selectedCustomer.phones[0].number)}
                  className="bg-green-50 hover:bg-green-100 p-2.5 rounded-lg transition-colors shrink-0 flex items-center justify-center"
                >
                  <PhoneForwarded size={18} className="text-green-600" />
                </button>
              </>
            )}
          </div>

          {/* 第三行：地址符號 + 地址 + 導航符號 */}
          {selectedCustomer.address && (
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 shrink-0 flex items-center justify-center">
                <MapPin size={20} strokeWidth={2.5} />
              </div>
              <div 
                className="flex-1 text-base text-slate-500 leading-relaxed min-w-0"
                style={{ 
                  textDecoration: 'none',
                  border: 'none',
                  outline: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  WebkitTouchCallout: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none',
                  textDecorationLine: 'none',
                  textDecorationStyle: 'none',
                  textDecorationColor: 'transparent',
                  borderBottom: 'none',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  WebkitTextDecoration: 'none',
                  MozTextDecoration: 'none',
                  MsTextDecoration: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  appearance: 'none'
                }}
              >
                {selectedCustomer.address}
              </div>
              <button
                onClick={handleAddressClick}
                className="bg-blue-50 hover:bg-blue-100 p-2.5 rounded-lg transition-colors shrink-0 flex items-center justify-center"
              >
                <Navigation size={18} className="text-blue-600" />
              </button>
            </div>
          )}

          {/* 第四行：備註 + 欄位 */}
          <div className="flex items-start gap-3">
            <div className="bg-violet-50 p-2.5 rounded-xl text-violet-600 shrink-0 flex items-center justify-center">
              <Info size={20} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-base ${selectedCustomer.notes ? 'text-slate-700' : 'text-slate-400 bg-slate-50 px-2 py-1 rounded'} leading-relaxed`}>
                {selectedCustomer.notes || '無備註'}
              </div>
            </div>
          </div>

          {/* 第五行：機器型號符號 + 機型 + 板手符號 + 次數 */}
          <div className="flex items-center gap-3">
            <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600 shrink-0 flex items-center justify-center">
              <Printer size={20} strokeWidth={2.5} />
            </div>
            <div className="flex-1 flex items-center gap-2 min-w-0">
              {selectedCustomer.assets && selectedCustomer.assets.length > 0 ? (
                selectedCustomer.assets.map((asset, idx) => (
                  <span key={idx} className="text-base font-bold text-slate-800">
                    {asset.model || '無機型'}
                  </span>
                ))
              ) : (
                <span className="text-base font-bold text-slate-800">無機型</span>
              )}
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl text-slate-600 shrink-0 flex items-center justify-center">
              <Wrench size={20} strokeWidth={2.5} />
            </div>
            <div className="text-base font-bold text-slate-800 shrink-0">
              {serviceCount} 次
            </div>
          </div>
        </div>

        {/* 分隔線 - 讓名片和履歷明顯分開 */}
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center">
            <div className="bg-slate-50 px-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">維修履歷</span>
            </div>
          </div>
        </div>
        {/* 維修履歷區域 */}
        <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
               <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
                 <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600">
                   <History size={18} strokeWidth={2.5}/>
                 </div>
                 <span>維修履歷</span>
               </h3>
               <button onClick={startAddRecord} className="flex items-center text-blue-600 text-sm font-bold bg-white px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm active:scale-95 transition-transform hover:bg-blue-50">
                 <Plus size={16} className="mr-1"/> 新增
               </button>
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
