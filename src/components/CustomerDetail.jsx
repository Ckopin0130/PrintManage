import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  ArrowLeft, Edit, Trash2, MapPin, Navigation, Info, User, Smartphone, 
  Printer, History, Plus, FileText, Search, X, Building2, PhoneForwarded, Wrench
} from 'lucide-react';
import '../styles/customerDetail.css';

// 內部組件：資訊行（統一圖示+文字+動作按鈕的結構）
const InfoRow = ({ 
  icon: Icon, 
  color, 
  text, 
  subText, 
  onClick, 
  actionIcon: ActionIcon,
  actionTitle,
  className = '',
  textClassName = '',
  align = 'center' // 'center' | 'start'
}) => {
  const containerClass = align === 'start' ? 'flex items-start gap-3' : 'flex items-center gap-3';
  
  return (
    <div className={containerClass}>
      <div className={`bg-${color}-50 p-2.5 rounded-xl text-${color}-600 shrink-0 flex items-center justify-center`}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div className={`flex-1 min-w-0 ${className}`}>
        {typeof text === 'string' ? (
          <div className={`text-base font-bold ${textClassName || (text ? 'text-slate-800' : 'text-slate-400')}`}>
            {text || '暫無資料'}
          </div>
        ) : (
          text
        )}
        {subText && (
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded ml-2">
            {subText}
          </span>
        )}
      </div>
      {ActionIcon && onClick && (
        <button
          onClick={onClick}
          className={`bg-${color}-50 hover:bg-${color}-100 p-2.5 rounded-lg transition-colors shrink-0 flex items-center justify-center ml-1`}
          title={actionTitle}
        >
          <ActionIcon size={18} className={`text-${color}-600`} />
        </button>
      )}
    </div>
  );
};

const CustomerDetail = ({ 
  selectedCustomer, records, setCurrentView, startEdit, 
  handleDeleteCustomer, handleNavClick, startAddRecord, 
  startEditRecord, handleDeleteRecord, setViewingImage 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModel, setSelectedModel] = useState('all'); // 機型篩選器

  // 當切換到客戶詳情時，重置滾動位置到頂部
  useEffect(() => {
    if (selectedCustomer) {
      // 重置視窗滾動位置
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      // 重置主容器的滾動位置（如果有）
      const mainContainer = document.querySelector('.bg-slate-50');
      if (mainContainer) {
        mainContainer.scrollTop = 0;
      }
    }
  }, [selectedCustomer?.customerID]); // 當客戶 ID 改變時重置

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
        // 機型篩選邏輯
        const matchModel = selectedModel === 'all' || 
                          (r.machineModel && r.machineModel === selectedModel) ||
                          (!r.machineModel && selectedModel === 'unspecified');
        return matchId && matchSearch && matchModel;
    }).sort((a,b) => new Date(b.date) - new Date(a.date));
  }, [records, selectedCustomer.customerID, searchTerm, selectedModel]);

  // 優化：使用 useMemo 快取計算結果
  const serviceCount = useMemo(() => 
    records.filter(r => r.customerID === selectedCustomer.customerID).length,
    [records, selectedCustomer.customerID]
  );

  const mapUrl = useMemo(() => 
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedCustomer.address || '')}`,
    [selectedCustomer.address]
  );

  // 優化：使用 useCallback 快取函數
  const handlePhoneClick = useCallback((phoneNumber) => {
    if (phoneNumber) {
      window.location.href = `tel:${phoneNumber.replace(/[^0-9+]/g, '')}`;
    }
  }, []);

  const handleAddressClick = useCallback(() => {
    if (selectedCustomer.addressNote) {
      handleNavClick(selectedCustomer);
    } else if (selectedCustomer.address) {
      // 检测是否是移动设备
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // 移动设备：直接在当前窗口打开
        window.location.href = mapUrl;
      } else {
        // 桌面设备：在新标签页打开
        window.open(mapUrl, '_blank', 'noopener,noreferrer');
      }
    }
  }, [selectedCustomer, mapUrl, handleNavClick]);

  return (
    <div className="bg-slate-50 min-h-screen pb-24 flex flex-col font-sans">
      {/* 頂部標題列 - 與 Dashboard 風格一致 */}
      <div className="bg-white/95 backdrop-blur px-4 py-3 flex items-center shadow-sm sticky top-0 z-30 border-b border-slate-100/50 shrink-0">
        <button onClick={() => setCurrentView('roster')} className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-full transition-colors"><ArrowLeft size={24}/></button>
        <h2 className="text-lg font-extrabold flex-1 text-center text-slate-800 tracking-wide">客戶詳情</h2>
        <div className="flex gap-1 -mr-2">
          <button onClick={startEdit} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"><Edit size={20} /></button>
          <button onClick={(e) => handleDeleteCustomer(e, selectedCustomer)} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"><Trash2 size={20} /></button>
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

          {/* 第二行：聯絡人 */}
          <InfoRow
            icon={User}
            color="emerald"
            text={selectedCustomer.contactPerson || '暫無資料'}
            textClassName={selectedCustomer.contactPerson ? 'text-slate-800' : 'text-slate-400'}
          />

          {/* 第三行：電話 */}
          <InfoRow
            icon={Smartphone}
            color="green"
            text={
              selectedCustomer.phones && selectedCustomer.phones.length > 0 && selectedCustomer.phones[0].number ? (
                <div className="text-base font-bold text-slate-800 truncate min-w-0 no-phone-decoration">
                  {selectedCustomer.phones[0].number}
                </div>
              ) : (
                <div className="text-base font-bold text-slate-400">暫無資料</div>
              )
            }
          />

          {/* 第四行：地址 */}
          <InfoRow
            icon={MapPin}
            color="blue"
            text={selectedCustomer.address || '暫無資料'}
            textClassName={selectedCustomer.address ? 'text-slate-500' : 'text-slate-400'}
          />

          {/* 第五行：備註 */}
          <InfoRow
            icon={Info}
            color="violet"
            text={selectedCustomer.notes || '暫無資料'}
            textClassName={selectedCustomer.notes ? 'text-slate-700' : 'text-slate-400'}
            align="start"
          />

          {/* 第六行：機器型號符號 + 機型 + 板手符號 + 次數 */}
          <div className="flex items-center gap-3">
            <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600 shrink-0 flex items-center justify-center">
              <Printer size={20} strokeWidth={2.5} />
            </div>
            <div className="flex-1 flex items-center gap-2 min-w-0 flex-wrap">
              {selectedCustomer.assets && selectedCustomer.assets.length > 0 ? (
                selectedCustomer.assets.map((asset, idx) => {
                  const isSelected = selectedModel === asset.model;
                  return (
                    <button
                      key={asset.id || `asset-${idx}-${asset.model || 'unknown'}`}
                      onClick={() => setSelectedModel(isSelected ? 'all' : asset.model)}
                      className={`text-base font-bold px-2 py-1 rounded border transition-all ${
                        isSelected 
                          ? 'bg-amber-100 text-amber-800 border-amber-300 ring-2 ring-amber-200' 
                          : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-amber-50 hover:border-amber-200'
                      }`}
                    >
                      {asset.model || '暫無資料'}
                    </button>
                  );
                })
              ) : (
                <span className="text-base font-bold text-slate-400">暫無資料</span>
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
        </div>
        {/* 維修履歷區域 */}
        <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] border-2 border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
               <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
                 <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600">
                   <History size={18} strokeWidth={2.5}/>
                 </div>
                 <span>維修履歷</span>
               </h3>
               <button onClick={() => startAddRecord(selectedCustomer)} className="flex items-center text-blue-600 text-sm font-bold bg-white px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm active:scale-95 transition-transform hover:bg-blue-50">
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
                       // [修正] 狀態顏色與文字顯示邏輯
                       let statusLabel = '結案';
                       let statusColor = "text-emerald-600 bg-emerald-50";

                       if (record.status === 'pending') {
                           statusLabel = '待料';
                           statusColor = "text-amber-600 bg-amber-50";
                       } else if (record.status === 'tracking') {
                           statusLabel = '追蹤';
                           statusColor = "text-orange-600 bg-orange-50";
                       } else if (record.status === 'monitor') {
                           statusLabel = '觀察';
                           statusColor = "text-blue-600 bg-blue-50";
                       }

                       return (
                       <div key={record.id} className="relative group animate-in fade-in slide-in-from-bottom">
                          <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-4 border-white shadow-sm ring-1 ring-gray-100 bg-gray-200`}></div>
                          <div className="text-xs font-bold text-slate-400 mb-1 flex justify-between items-center">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span>{record.date}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] ${statusColor}`}>{statusLabel}</span>
                                {record.machineModel && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                                    <Printer size={10} />
                                    {record.machineModel}
                                  </span>
                                )}
                              </div>
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

export default React.memo(CustomerDetail);