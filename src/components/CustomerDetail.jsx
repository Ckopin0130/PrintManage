import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Edit, Trash2, MapPin, ShieldAlert, Navigation, Info, User, Smartphone, 
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
        span[class*="phone"],
        div[style*="phone"],
        div[style*="address"],
        div[style*="textDecoration"],
        div[style*="border"] {
          -webkit-touch-callout: none !important;
          -webkit-user-select: none !important;
          user-select: none !important;
          text-decoration: none !important;
          text-decoration-line: none !important;
          text-decoration-style: none !important;
          text-decoration-color: transparent !important;
          border-bottom: none !important;
          border-top: none !important;
          border-left: none !important;
          border-right: none !important;
          outline: none !important;
          -webkit-text-decoration: none !important;
          -moz-text-decoration: none !important;
          -ms-text-decoration: none !important;
          -webkit-appearance: none !important;
          -moz-appearance: none !important;
          appearance: none !important;
        }
        /* 移除手機瀏覽器自動識別電話和地址 */
        * {
          -webkit-tap-highlight-color: transparent !important;
        }
        /* 針對手機瀏覽器的特殊處理 */
        @media (max-width: 768px) {
          div[style*="phone"],
          div[style*="address"],
          span[style*="phone"],
          span[style*="address"] {
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
            appearance: none !important;
            text-decoration: none !important;
            text-decoration-line: none !important;
            text-decoration-style: none !important;
            text-decoration-color: transparent !important;
            border: none !important;
            border-bottom: none !important;
            border-top: none !important;
            border-left: none !important;
            border-right: none !important;
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
            {/* 右側撥號與導航鍵 */}
            {(selectedCustomer.phones && selectedCustomer.phones[0]?.number) && (
              <button
                onClick={() => handlePhoneClick(selectedCustomer.phones[0].number)}
                className="bg-green-50 hover:bg-green-100 p-2.5 rounded-lg transition-colors shrink-0 flex items-center justify-center ml-1"
                title="撥號"
              >
                <PhoneForwarded size={18} className="text-green-600" />
              </button>
            )}
            {selectedCustomer.address && (
              <button
                onClick={handleAddressClick}
                className="bg-blue-50 hover:bg-blue-100 p-2.5 rounded-lg transition-colors shrink-0 flex items-center justify-center ml-1"
                title="導航"
              >
                <Navigation size={18} className="text-blue-600" />
              </button>
            )}
          </div>

          {/* 第二行：聯絡人圖標 + 欄位 + 電話符號 + 電話欄位 */}
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
                  <Smartphone size={20} strokeWidth={2.5} />
                </div>
                <div 
                  className="flex-1 text-base font-bold text-slate-800 truncate min-w-0 no-phone-decoration"
                  style={{ 
                    textDecoration: 'none',
                    textDecorationLine: 'none',
                    textDecorationStyle: 'none',
                    textDecorationColor: 'transparent',
                    border: 'none',
                    borderBottom: 'none',
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    outline: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    WebkitTouchCallout: 'none',
                    WebkitUserSelect: 'none',
                    userSelect: 'none',
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
              </>
            )}
          </div>

          {/* 第三行：地址符號 + 地址 */}
          {selectedCustomer.address && (
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 shrink-0 flex items-center justify-center">
                <MapPin size={20} strokeWidth={2.5} />
              </div>
              <div 
                className="flex-1 text-base text-slate-500 leading-relaxed min-w-0 no-address-decoration"
                style={{ 
                  textDecoration: 'none',
                  textDecorationLine: 'none',
                  textDecorationStyle: 'none',
                  textDecorationColor: 'transparent',
                  border: 'none',
                  borderBottom: 'none',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  outline: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  WebkitTouchCallout: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none',
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

        {/* 明顯分隔區域 - 讓名片和履歷完全分開 */}
        <div className="mt-8 mb-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-slate-300"></div>
            </div>
            <div className="relative flex justify-center">
              <div className="bg-slate-50 px-6 py-2">
                <div className="flex items-center gap-2">
                  <History size={16} className="text-slate-500" />
                  <span className="text-sm font-extrabold text-slate-600 uppercase tracking-wider">維修履歷</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 維修履歷區域 - 全新設計 */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-3xl shadow-lg border-2 border-slate-200 overflow-hidden">
            {/* 標題列 */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex justify-between items-center">
               <h3 className="font-extrabold text-white flex items-center gap-3 text-lg">
                 <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl">
                   <History size={20} className="text-white" strokeWidth={2.5}/>
                 </div>
                 <span>維修履歷</span>
               </h3>
               <button 
                 onClick={startAddRecord} 
                 className="flex items-center gap-2 text-white text-sm font-bold bg-white/20 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/30 shadow-lg active:scale-95 transition-all hover:bg-white/30"
               >
                 <Plus size={18} className=""/> 新增紀錄
               </button>
            </div>

            {/* 搜尋列 */}
            <div className="px-6 py-4 bg-white/50 backdrop-blur-sm border-b border-slate-200/50">
                <div className="relative">
                    <Search size={16} className="absolute left-4 top-3 text-slate-400"/>
                    <input 
                        type="text" 
                        className="w-full bg-white border-2 border-slate-200 rounded-xl py-3 pl-11 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all shadow-sm"
                        placeholder="搜尋歷史紀錄 (故障、處理、零件)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button 
                        onClick={() => setSearchTerm('')} 
                        className="absolute right-4 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <X size={16}/>
                      </button>
                    )}
                </div>
            </div>

            {/* 紀錄列表 */}
            <div className="p-6 bg-white/30 backdrop-blur-sm min-h-[200px]">
               {custRecords.length === 0 ? (
                 <div className="text-center py-12 text-slate-500 flex flex-col items-center">
                   <FileText size={48} className="mb-3 opacity-30"/>
                   <div className="text-sm font-bold">{searchTerm ? '查無符合紀錄' : '尚無維修紀錄'}</div>
                 </div>
               ) : (
                 <div className="space-y-4">
                    {custRecords.map(record => {
                       let statusColor = "text-emerald-700 bg-emerald-100 border-emerald-300";
                       let statusBg = "bg-emerald-50";
                       if(record.status === 'pending') {
                         statusColor = "text-amber-700 bg-amber-100 border-amber-300";
                         statusBg = "bg-amber-50";
                       }
                       return (
                       <div 
                         key={record.id} 
                         className="bg-white rounded-2xl shadow-md border-2 border-slate-200 p-5 hover:shadow-lg transition-all hover:border-blue-300"
                       >
                          {/* 標題列 */}
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${statusBg} border-2 ${statusColor.replace('text-', 'border-')}`}></div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-bold text-slate-600">{record.date}</span>
                                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${statusColor}`}>
                                    {record.status === 'pending' ? '待料' : '結案'}
                                  </span>
                                </div>
                                <div className="text-base font-extrabold text-slate-800 mt-1">
                                  {record.fault || record.symptom}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <button 
                                onClick={(e) => startEditRecord(e, record)} 
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              >
                                <Edit size={16}/>
                              </button>
                              <button 
                                onClick={(e) => handleDeleteRecord(e, record.id)} 
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 size={16}/>
                              </button>
                            </div>
                          </div>

                          {/* 處理過程 */}
                          <div className="bg-slate-50 rounded-xl p-4 mb-3 border border-slate-200">
                            <div className="text-sm text-slate-700 leading-relaxed">
                              {record.solution || record.action || '無處理記錄'}
                            </div>
                          </div>

                          {/* 零件 */}
                          {record.parts && record.parts.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {record.parts.map(p => (
                                <span 
                                  key={p.id} 
                                  className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 font-bold"
                                >
                                  {p.name} × {p.qty}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* 照片 */}
                          {(record.photoBefore || record.photoAfter) && (
                              <div className="flex gap-3 mt-4">
                                  {record.photoBefore && (
                                    <div 
                                      onClick={(e) => {e.stopPropagation(); setViewingImage(record.photoBefore)}} 
                                      className="relative group cursor-pointer"
                                    >
                                      <img 
                                        src={record.photoBefore} 
                                        className="h-24 w-24 object-cover rounded-xl border-2 border-slate-200 shadow-sm hover:border-blue-400 transition-all" 
                                        alt="Before" 
                                      />
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-all flex items-center justify-center">
                                        <span className="text-white text-xs font-bold opacity-0 group-hover:opacity-100">維修前</span>
                                      </div>
                                    </div>
                                  )}
                                  {record.photoAfter && (
                                    <div 
                                      onClick={(e) => {e.stopPropagation(); setViewingImage(record.photoAfter)}} 
                                      className="relative group cursor-pointer"
                                    >
                                      <img 
                                        src={record.photoAfter} 
                                        className="h-24 w-24 object-cover rounded-xl border-2 border-slate-200 shadow-sm hover:border-blue-400 transition-all" 
                                        alt="After" 
                                      />
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-all flex items-center justify-center">
                                        <span className="text-white text-xs font-bold opacity-0 group-hover:opacity-100">完修後</span>
                                      </div>
                                    </div>
                                  )}
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
