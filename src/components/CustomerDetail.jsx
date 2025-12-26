import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Edit, Trash2, MapPin, Navigation, Info, User, Phone, 
  Printer, History, Plus, FileText, Search, X, Building2, PhoneForwarded, Wrench, Mail, Calendar
} from 'lucide-react';

const CustomerDetail = ({ 
  selectedCustomer, records, setCurrentView, startEdit, 
  handleDeleteCustomer, handleNavClick, startAddRecord, 
  startEditRecord, handleDeleteRecord, setViewingImage 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!selectedCustomer) return null;
  
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
    if (selectedCustomer.address) {
      window.open(mapUrl, '_blank');
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 min-h-screen pb-24 flex flex-col font-sans">
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
        div[class*="phone"] *,
        div[class*="address"] *,
        span[class*="address"],
        div[style*="phone"],
        div[style*="address"] {
          -webkit-touch-callout: none !important;
          -webkit-user-select: none !important;
          text-decoration: none !important;
          text-decoration-line: none !important;
          text-decoration-style: none !important;
          text-decoration-color: transparent !important;
          border-bottom: none !important;
          -webkit-text-decoration: none !important;
          -moz-text-decoration: none !important;
          -ms-text-decoration: none !important;
        }
        * {
          -webkit-tap-highlight-color: transparent;
        }
        @media (max-width: 768px) {
          div[style*="phone"],
          div[style*="address"] {
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
            appearance: none !important;
            text-decoration: none !important;
            border: none !important;
            outline: none !important;
          }
        }
      `}</style>

      {/* 頂部標題列 */}
      <div className="bg-white/95 backdrop-blur-md px-4 py-3 flex items-center shadow-sm sticky top-0 z-30 border-b border-slate-100/50 shrink-0">
        <button onClick={() => setCurrentView('roster')} className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
          <ArrowLeft size={24}/>
        </button>
        <h2 className="text-lg font-extrabold flex-1 text-center text-slate-800 tracking-wide">客戶詳情</h2>
        <div className="flex gap-1 -mr-2">
          <button onClick={startEdit} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
            <Edit size={20} />
          </button>
          <button onClick={handleDeleteCustomer} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors">
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-6 space-y-6">
        {/* 客戶名片卡 - 全新設計 */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          {/* 頂部漸變標題區 */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 px-6 py-8 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
                  <Building2 size={24} className="text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-extrabold text-white mb-1">{selectedCustomer.name}</h1>
                  {selectedCustomer.L2_district && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-blue-100 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                        {selectedCustomer.L2_district}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 信息區域 */}
          <div className="p-6 space-y-4">
            {/* 聯絡人 */}
            <div className="flex items-center gap-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 hover:bg-emerald-50 transition-colors">
              <div className="bg-emerald-500 p-3 rounded-xl shadow-sm">
                <User size={20} className="text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-emerald-600 mb-1">聯絡人</div>
                <div className={`text-base font-bold ${selectedCustomer.contactPerson ? 'text-slate-800' : 'text-slate-400'}`}>
                  {selectedCustomer.contactPerson || '暫無資料'}
                </div>
              </div>
            </div>

            {/* 電話 */}
            {selectedCustomer.phones && selectedCustomer.phones.length > 0 && selectedCustomer.phones[0].number && (
              <div className="flex items-center gap-4 p-4 bg-green-50/50 rounded-2xl border border-green-100/50 hover:bg-green-50 transition-colors">
                <div className="bg-green-500 p-3 rounded-xl shadow-sm">
                  <Phone size={20} className="text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-green-600 mb-1">電話</div>
                  <div 
                    className="text-base font-bold text-slate-800"
                    style={{ 
                      textDecoration: 'none',
                      WebkitTapHighlightColor: 'transparent',
                      WebkitTouchCallout: 'none',
                      WebkitUserSelect: 'none',
                      userSelect: 'none'
                    }}
                  >
                    {selectedCustomer.phones[0].number}
                  </div>
                </div>
                <button
                  onClick={() => handlePhoneClick(selectedCustomer.phones[0].number)}
                  className="bg-green-500 hover:bg-green-600 p-3 rounded-xl transition-colors shadow-sm active:scale-95"
                >
                  <PhoneForwarded size={20} className="text-white" />
                </button>
              </div>
            )}

            {/* 地址 */}
            {selectedCustomer.address && (
              <div className="flex items-center gap-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 hover:bg-blue-50 transition-colors">
                <div className="bg-blue-500 p-3 rounded-xl shadow-sm">
                  <MapPin size={20} className="text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-blue-600 mb-1">地址</div>
                  <div 
                    className="text-sm text-slate-700 leading-relaxed"
                    style={{ 
                      textDecoration: 'none',
                      WebkitTapHighlightColor: 'transparent',
                      WebkitTouchCallout: 'none',
                      WebkitUserSelect: 'none',
                      userSelect: 'none'
                    }}
                  >
                    {selectedCustomer.address}
                  </div>
                </div>
                <button
                  onClick={handleAddressClick}
                  className="bg-blue-500 hover:bg-blue-600 p-3 rounded-xl transition-colors shadow-sm active:scale-95"
                >
                  <Navigation size={20} className="text-white" />
                </button>
              </div>
            )}

            {/* 備註 */}
            <div className="flex items-start gap-4 p-4 bg-violet-50/50 rounded-2xl border border-violet-100/50">
              <div className="bg-violet-500 p-3 rounded-xl shadow-sm mt-0.5">
                <Info size={20} className="text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-violet-600 mb-1">備註</div>
                <div className={`text-sm leading-relaxed ${selectedCustomer.notes ? 'text-slate-700' : 'text-slate-400'}`}>
                  {selectedCustomer.notes || '無備註'}
                </div>
              </div>
            </div>

            {/* 機器型號與服務次數 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-amber-500 p-2.5 rounded-lg shadow-sm">
                    <Printer size={18} className="text-white" strokeWidth={2.5} />
                  </div>
                  <div className="text-xs font-bold text-amber-600">機器型號</div>
                </div>
                <div className="text-base font-bold text-slate-800">
                  {selectedCustomer.assets && selectedCustomer.assets.length > 0 
                    ? selectedCustomer.assets.map((asset, idx) => asset.model || '無機型').join(', ')
                    : '無機型'}
                </div>
              </div>
              
              <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-slate-500 p-2.5 rounded-lg shadow-sm">
                    <Wrench size={18} className="text-white" strokeWidth={2.5} />
                  </div>
                  <div className="text-xs font-bold text-slate-600">累計服務</div>
                </div>
                <div className="text-base font-bold text-slate-800">
                  {serviceCount} 次
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 分隔線 */}
        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center">
            <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 px-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">維修履歷</span>
            </div>
          </div>
        </div>

        {/* 維修履歷區域 */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-blue-50/30 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-extrabold text-slate-800 flex items-center gap-3">
              <div className="bg-blue-500 p-2 rounded-lg shadow-sm">
                <History size={18} className="text-white" strokeWidth={2.5}/>
              </div>
              <span>維修履歷</span>
            </h3>
            <button 
              onClick={startAddRecord} 
              className="flex items-center text-white text-sm font-bold bg-blue-600 px-4 py-2 rounded-xl shadow-sm active:scale-95 transition-transform hover:bg-blue-700"
            >
              <Plus size={16} className="mr-1"/> 新增
            </button>
          </div>

          {/* 搜尋列 */}
          <div className="px-6 py-4 border-b border-gray-100 bg-white">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-3 text-gray-400"/>
              <input 
                type="text" 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-11 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
                placeholder="搜尋歷史紀錄 (故障、處理、零件)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="absolute right-4 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={16}/>
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {custRecords.length === 0 ? (
              <div className="text-center py-12 text-gray-400 flex flex-col items-center">
                <FileText size={48} className="mb-3 opacity-20"/>
                <div className="text-sm font-bold">{searchTerm ? '查無符合紀錄' : '尚無紀錄'}</div>
              </div>
            ) : (
              <div className="relative border-l-2 border-slate-200 pl-6 space-y-6">
                {custRecords.map(record => {
                  let statusColor = "text-emerald-600 bg-emerald-50 border-emerald-200";
                  if(record.status === 'pending') statusColor = "text-amber-600 bg-amber-50 border-amber-200";
                  return (
                    <div key={record.id} className="relative group">
                      <div className="absolute -left-[29px] top-0 w-5 h-5 rounded-full border-4 border-white shadow-md bg-blue-500 ring-2 ring-blue-100"></div>
                      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-slate-400"/>
                            <span className="text-xs font-bold text-slate-500">{record.date}</span>
                            <span className={`ml-2 px-2 py-1 rounded-lg text-[10px] font-bold border ${statusColor}`}>
                              {record.status === 'pending' ? '待料' : '結案'}
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <button 
                              onClick={(e) => startEditRecord(e, record)} 
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit size={14}/>
                            </button>
                            <button 
                              onClick={(e) => handleDeleteRecord(e, record.id)} 
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={14}/>
                            </button>
                          </div>
                        </div>
                        <div className="mb-2">
                          <span className="font-bold text-slate-800 text-sm">{record.fault || record.symptom}</span>
                        </div>
                        <div className="text-sm bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed mb-3">
                          {record.solution || record.action}
                        </div>
                        {record.parts && record.parts.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {record.parts.map(p => (
                              <span key={p.id} className="text-[10px] bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg border border-blue-100 font-bold">
                                {p.name} x{p.qty}
                              </span>
                            ))}
                          </div>
                        )}
                        {(record.photoBefore || record.photoAfter) && (
                          <div className="flex gap-3">
                            {record.photoBefore && (
                              <div 
                                onClick={(e) => {e.stopPropagation(); setViewingImage(record.photoBefore)}} 
                                className="relative group cursor-pointer"
                              >
                                <img 
                                  src={record.photoBefore} 
                                  className="h-24 w-24 object-cover rounded-xl border-2 border-gray-200 shadow-sm hover:border-blue-300 transition-colors" 
                                  alt="Before" 
                                />
                              </div>
                            )}
                            {record.photoAfter && (
                              <div 
                                onClick={(e) => {e.stopPropagation(); setViewingImage(record.photoAfter)}} 
                                className="relative group cursor-pointer"
                              >
                                <img 
                                  src={record.photoAfter} 
                                  className="h-24 w-24 object-cover rounded-xl border-2 border-gray-200 shadow-sm hover:border-blue-300 transition-colors" 
                                  alt="After" 
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;
