import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Calendar, Trash2, Search, X, 
  User, AlertCircle, Wrench, Package, Briefcase, Phone, Clock,
  FileText, Copy, Check, CheckCircle, Eye
} from 'lucide-react';

// --- 內建報表模組 ---
const WorkLogReportModal = ({ isOpen, onClose, records = [], customers = [], dateLabel }) => {
  const [isCopied, setIsCopied] = useState(false);

  const reportText = useMemo(() => {
    if (!Array.isArray(records) || records.length === 0) return '無資料';

    const stripNumbering = (str) => {
        if (!str) return '';
        return str.replace(/^([\d０-９]+[.、\s)）\uff0e]+|[(（][\d０-９]+[)）]|[\u2460-\u2473])\s*/, '');
    };

    const simplifyModelName = (model) => {
        if (!model) return '';
        let s = model.replace(/[()（）]/g, '');
        s = s.replace(/^(MP|IM|SP|Aficio)\s*C?/i, '');
        return s.trim();
    };

    const getSourceText = (source) => {
        switch(source) {
            case 'customer_call': return '客戶叫修';
            case 'company_dispatch': return '公司派工';
            case 'invoice_check': return '例行巡檢';
            default: return '一般';
        }
    };

    const getDateInfoText = (record) => {
        if (record.status === 'completed') {
            return `完修:${record.completedDate || record.date}`;
        } else if (record.status === 'tracking' || record.status === 'monitor') {
            const nextDate = record.nextVisitDate || record.return_date || '未定';
            return `回訪:${nextDate}`;
        }
        return `待處理`;
    };

    // === A. 維修行程列表 ===
    const listText = records.map((r) => {
        const cust = Array.isArray(customers) ? customers.find(c => c.customerID === r.customerID) : null;
        const rawModel = cust?.assets?.[0]?.model || '';
        const simpleModel = rawModel ? simplifyModelName(rawModel) : '';
        
        // 標題行：🔸客戶 3504 [來源] [日期]
        let text = `🔸${cust?.name || '未知'} ${simpleModel} [${getSourceText(r.serviceSource)}] [${getDateInfoText(r)}]`;
        
        // 故障 (去除頓點後空白)
        const faultContent = r.symptom || r.fault || ''; 
        if (faultContent) {
            text += `\n🔹故障：`;
            String(faultContent).split('\n').forEach(line => {
                const cleanLine = stripNumbering(line.trim());
                if(cleanLine) text += `\n▪️${cleanLine}`;
            });
        }

        // 處理 (去除頓點後空白)
        const solutionContent = r.action || r.solution || '';
        if (solutionContent) {
            text += `\n🔹處理：`;
            String(solutionContent).split('\n').forEach(line => {
                 const cleanLine = stripNumbering(line.trim());
                 if(cleanLine) text += `\n▪️${cleanLine}`;
            });
        }

        // 更換 (去除頓點後空白)
        if (Array.isArray(r.parts) && r.parts.length > 0) {
            const partsStr = r.parts.map(p => `${p.name} x${p.qty}`).join('、');
            text += `\n🔹更換：${partsStr}`;
        }
        return text;
    }).join('\n\n');

    // === B. 耗材統計 ===
    const summaryByModel = {};
    records.forEach(r => {
        if (Array.isArray(r.parts) && r.parts.length > 0) {
            const cust = Array.isArray(customers) ? customers.find(c => c.customerID === r.customerID) : null;
            const rawModel = cust?.assets?.[0]?.model || '通用/其他';
            const modelName = simplifyModelName(rawModel) || rawModel;
            
            if (!summaryByModel[modelName]) summaryByModel[modelName] = {};
            r.parts.forEach(p => {
                summaryByModel[modelName][p.name] = (summaryByModel[modelName][p.name] || 0) + (p.qty || 1);
            });
        }
    });

    let summaryList = '';
    const models = Object.keys(summaryByModel).sort();
    if (models.length > 0) {
        summaryList = models.map(model => {
            const partsObj = summaryByModel[model];
            const partsLines = Object.entries(partsObj).map(([name, qty]) => `▪️${name} x${qty}`).join('\n');
            return `🔸${model}\n${partsLines}`;
        }).join('\n\n');
    } else {
        summaryList = '🔸無更換零件';
    }

    return `【維修工作日報】 ${dateLabel}\n----------------\n\n🔺維修行程\n${listText}\n\n🔺今日耗材統計\n${summaryList}\n\n----------------\n系統自動生成`;
  }, [records, customers, dateLabel]);

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[90] flex items-start justify-center pt-10 px-4 animate-in fade-in" onClick={onClose}>
        <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2 border-b pb-3">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    <FileText className="mr-2 text-blue-600"/> 日報表預覽
                </h3>
                <button onClick={onClose} className="p-1.5 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"><X size={20} /></button> 
            </div>
            <div className="flex-1 overflow-y-auto bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4 font-mono text-sm leading-relaxed whitespace-pre-wrap text-slate-700 shadow-inner">
                {reportText}
            </div>
            <button onClick={handleCopy} className={`w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center transition-all ${isCopied ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {isCopied ? <Check className="mr-2" size={20}/> : <Copy className="mr-2" size={20}/>}
                {/* 修正後的判斷式 */}
                {isCopied ? '已複製 (照片需手動傳送)' : '複製內容 (傳送給 LINE)'}
            </button>
        </div>
    </div>
  );
};

const RecordList = ({ 
  records, customers, setCurrentView, setActiveTab, 
  startEditRecord, handleDeleteRecord, setViewingImage 
}) => {
  
  const [inputValue, setInputValue] = useState(''); 
  const [debouncedSearch, setDebouncedSearch] = useState(''); 
  const [statusFilter, setStatusFilter] = useState('all'); 
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [activeDateTab, setActiveDateTab] = useState('all'); 
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(inputValue); }, 400);
    return () => clearTimeout(timer);
  }, [inputValue]);

  // [樣式統一] 來源標籤：與 TrackingView 完全一致
  const getSourceBadge = (source) => {
    const baseClass = "text-xs px-2 py-0.5 rounded-md flex items-center gap-1 font-medium ml-2";
    switch(source) {
      case 'customer_call': return <span className={`${baseClass} bg-rose-50 text-rose-600`}><Phone size={12}/> 客戶叫修</span>;
      case 'company_dispatch': return <span className={`${baseClass} bg-blue-50 text-blue-600`}><Briefcase size={12}/> 公司派工</span>;
      case 'invoice_check': return <span className={`${baseClass} bg-emerald-50 text-emerald-600`}><Calendar size={12}/> 例行巡檢</span>;
      default: return null;
    }
  };
  
  // [新增] 簡化機型名稱 (移除括號與 MP/IM)
  const simplifyModelName = (model) => {
      if (!model) return '';
      let s = model.replace(/[()（）]/g, '');
      s = s.replace(/^(MP|IM|SP|Aficio)\s*C?/i, '');
      return s.trim();
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const cust = customers.find(c => c.customerID === r.customerID);
      const custName = cust ? cust.name.toLowerCase() : '';
      const fault = (r.fault || '').toLowerCase();
      const solution = (r.action || r.solution || '').toLowerCase();
      const partsText = r.parts ? r.parts.map(p => p.name).join(' ').toLowerCase() : '';
      const searchLower = debouncedSearch.toLowerCase();

      const matchesSearch = custName.includes(searchLower) || fault.includes(searchLower) || solution.includes(searchLower) || partsText.includes(searchLower);

      let matchesStatus = true;
      if (statusFilter === 'pending') matchesStatus = (r.status === 'pending' || r.status === 'tracking'); 
      if (statusFilter === 'completed') matchesStatus = (r.status === 'completed');
      if (statusFilter === 'monitor') matchesStatus = (r.status === 'monitor');

      let matchesDate = true;
      if (dateRange.start || dateRange.end) {
        const recordDate = r.status === 'completed' && r.completedDate ? r.completedDate : r.date;
        if (dateRange.start) matchesDate = matchesDate && (recordDate >= dateRange.start);
        if (dateRange.end) matchesDate = matchesDate && (recordDate <= dateRange.end);
      }
      return matchesSearch && matchesStatus && matchesDate;
    }).sort((a, b) => {
      const dateA = a.status === 'completed' && a.completedDate ? a.completedDate : a.date;
      const dateB = b.status === 'completed' && b.completedDate ? b.completedDate : b.date;
      return new Date(dateB) - new Date(dateA);
    });
  }, [records, customers, debouncedSearch, statusFilter, dateRange]);

  const handleDateTabClick = (type) => {
    setActiveDateTab(type);
    const today = new Date();
    const formatDate = (date) => date.toLocaleDateString('en-CA');

    if (type === 'all') { setDateRange({ start: '', end: '' }); setShowDatePicker(false); }
    else if (type === 'today') { const str = formatDate(today); setDateRange({ start: str, end: str }); setShowDatePicker(false); }
    else if (type === 'yesterday') { const y = new Date(today); y.setDate(y.getDate() - 1); const str = formatDate(y); setDateRange({ start: str, end: str }); setShowDatePicker(false); }
    else if (type === 'week') { 
        const day = today.getDay(); const diff = today.getDate() - day + (day === 0 ? -6 : 1); 
        const monday = new Date(today.setDate(diff)); const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
        setDateRange({ start: formatDate(monday), end: formatDate(sunday) }); setShowDatePicker(false); 
    }
    else if (type === 'month') { 
        const first = new Date(today.getFullYear(), today.getMonth(), 1); const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        setDateRange({ start: formatDate(first), end: formatDate(last) }); setShowDatePicker(false); 
    }
    else if (type === 'custom') { setShowDatePicker(!showDatePicker); }
  };

  const getDateLabel = () => {
      if(activeDateTab === 'today') return '今日';
      if(activeDateTab === 'yesterday') return '昨日';
      if(activeDateTab === 'week') return '本週';
      if(activeDateTab === 'month') return '本月';
      if(dateRange.start && dateRange.end) return `${dateRange.start} ~ ${dateRange.end}`;
      if(dateRange.start) return `${dateRange.start} 之後`;
      return '維修紀錄總表';
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24 font-sans flex flex-col">
      <div className="bg-white shadow-sm sticky top-0 z-30 border-b border-slate-200">
         <div className="px-4 py-3 flex items-center justify-between">
             <div className="flex items-center">
                <button onClick={() => {setCurrentView('dashboard'); setActiveTab('dashboard');}} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full"><ArrowLeft size={22}/></button>
                <h2 className="text-lg font-bold text-slate-800 ml-1">維修紀錄</h2>
             </div>
             <button 
                onClick={() => setShowReportModal(true)}
                className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors flex items-center gap-1 shadow-sm"
             >
                <FileText size={20}/>
             </button>
         </div>

         <div className="px-4 pb-2 relative">
            <Search size={16} className="absolute left-7 top-2.5 text-slate-400" />
            <input className="w-full bg-slate-100 border-none rounded-lg py-2 pl-9 pr-8 text-sm outline-none font-medium text-slate-700 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" placeholder="搜尋客戶、故障、零件..." value={inputValue} onChange={e => setInputValue(e.target.value)} />
            {inputValue && <button onClick={() => setInputValue('')} className="absolute right-6 top-2 text-slate-400"><X size={16}/></button>}
         </div>

         <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar items-center">
            {[{ id: 'all', label: '全部' }, { id: 'today', label: '今日' }, { id: 'yesterday', label: '昨日' }, { id: 'week', label: '本週' }, { id: 'month', label: '本月' }].map(btn => (
                <button key={btn.id} onClick={() => handleDateTabClick(btn.id)} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${activeDateTab === btn.id ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{btn.label}</button>
            ))}
            <button onClick={() => handleDateTabClick('custom')} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 ${activeDateTab === 'custom' ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200' : 'bg-white text-blue-600 border-blue-100 hover:bg-blue-50'}`}><Calendar size={12}/> 自訂</button>
         </div>

         {showDatePicker && activeDateTab === 'custom' && (
            <div className="px-4 pb-2 animate-in slide-in-from-top-2"><div className="bg-white border border-blue-200 rounded-xl p-3 shadow-lg bg-blue-50/50"><div className="flex gap-2 items-center"><input type="date" className="flex-1 border border-blue-200 p-2 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-blue-400" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} /><span className="text-blue-300 font-bold">~</span><input type="date" className="flex-1 border border-blue-200 p-2 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-blue-400" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} /></div></div></div>
         )}
         
         <div className="px-4 pb-3 flex gap-2">
             {['all', 'pending', 'monitor', 'completed'].map(id => (
                 <button key={id} onClick={() => setStatusFilter(id)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border text-center ${statusFilter === id ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{id === 'all' ? '全部' : id === 'pending' ? '待處理' : id === 'monitor' ? '觀察' : '完修'}</button>
             ))}
         </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50 p-2 space-y-3">
        {records.length === 0 ? <div className="text-center text-slate-400 mt-10">尚無紀錄</div> : filteredRecords.length === 0 ? <div className="text-center text-slate-400 mt-10 flex flex-col items-center"><Search size={32} className="opacity-20 mb-2"/><span>查無符合資料</span><button onClick={() => {setInputValue(''); setStatusFilter('all'); handleDateTabClick('all');}} className="mt-2 text-xs text-blue-500 underline">清除所有篩選</button></div> : (
            filteredRecords.map(r => {
                const cust = customers.find(c => c.customerID === r.customerID);
                const faultContent = r.symptom || r.fault || r.description || '';
                const actionContent = r.action || r.solution || '';
                const rawModel = cust?.assets?.[0]?.model || '';
                const simpleModel = rawModel ? simplifyModelName(rawModel) : '';

                let borderClass = 'border-l-4 border-l-slate-300';
                if(r.status === 'completed') borderClass = 'border-l-4 border-l-emerald-500';
                if(r.status === 'pending' || r.status === 'tracking') borderClass = 'border-l-4 border-l-amber-500';
                if(r.status === 'monitor') borderClass = 'border-l-4 border-l-blue-500';

                return (
                    <div key={r.id} className={`bg-white p-4 shadow-sm border border-slate-100 rounded-r-xl ${borderClass} cursor-pointer hover:shadow-md transition-shadow`} onClick={(e) => startEditRecord(e, r)}>
                        
                        {/* 1. 【標題】 業者名稱(大字體) + 機器型號(簡化) + 刪除鈕 */}
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center flex-wrap">
                                <User size={16} className="text-slate-400 mr-2 shrink-0"/>
                                <span className="text-base font-bold text-slate-800 mr-2">{cust?.name || '未知客戶'}</span>
                                {simpleModel && <span className="text-sm text-slate-500 font-medium">({simpleModel})</span>}
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteRecord(e, r.id); }} className="text-slate-300 hover:text-red-500 p-1 -mr-1"><Trash2 size={16}/></button>
                        </div>

                        {/* 2. 【資訊】 叫修日期(小字體) + 來源標籤 */}
                        <div className="flex items-center mb-2">
                             <Calendar size={16} className="text-slate-400 mr-2 shrink-0"/>
                             <span className="text-sm font-bold text-slate-500">{r.date}</span>
                             {getSourceBadge(r.serviceSource)}
                        </div>

                        {/* 3. 【故障】 (若無則隱藏) */}
                        {faultContent && (
                             <div className="flex items-start mb-1 text-base text-slate-700 whitespace-pre-wrap">
                                 <AlertCircle size={16} className="text-slate-400 mr-2 mt-1 shrink-0"/>
                                 <span>{faultContent}</span>
                             </div>
                        )}
                        
                        {/* 4. 【處置】 (若無則隱藏) */}
                        {actionContent && (
                             <div className="flex items-start mb-1 text-base text-slate-700 whitespace-pre-wrap">
                                 <Wrench size={16} className="text-slate-400 mr-2 mt-1 shrink-0"/>
                                 <span>{actionContent}</span>
                             </div>
                        )}
                        
                        {/* 5. 【料件】 (若無則隱藏) */}
                        {r.parts && r.parts.length > 0 && (
                            <div className="flex items-start mb-1 text-base text-slate-700">
                                <Package size={16} className="text-slate-400 mr-2 mt-1 shrink-0"/>
                                <span>{r.parts.map(p => `${p.name} x${p.qty}`).join('、')}</span>
                            </div>
                        )}

                        {/* 6. 【照片】 (若無則隱藏) */}
                        {(r.photoBefore || r.photoAfter) && (
                            <div className="flex items-center mt-2 pl-6 mb-2">
                                {r.photoBefore && <img src={r.photoBefore} alt="Before" className="w-16 h-16 object-cover rounded-md border border-slate-200 mr-2" onClick={(e) => { e.stopPropagation(); setViewingImage(r.photoBefore); }}/>}
                                {r.photoAfter && <img src={r.photoAfter} alt="After" className="w-16 h-16 object-cover rounded-md border border-slate-200" onClick={(e) => { e.stopPropagation(); setViewingImage(r.photoAfter); }}/>}
                            </div>
                        )}

                        {/* 7. 【底部】 完修日/回訪日 + 狀態標籤 (靠右) */}
                        <div className="flex items-center justify-end border-t border-slate-50 pt-2 mt-1">
                             <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                                 r.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                                 r.status === 'tracking' ? 'bg-orange-50 text-orange-600' : 
                                 r.status === 'monitor' ? 'bg-blue-50 text-blue-600' : 
                                 'bg-amber-50 text-amber-600'
                             }`}>
                                 {r.status === 'completed' ? <CheckCircle size={12}/> : r.status === 'tracking' ? <CheckCircle size={12}/> : r.status === 'monitor' ? <Eye size={12}/> : <Wrench size={12}/>}
                                 <span>
                                    {r.status === 'completed' ? (r.completedDate ? `完修: ${r.completedDate}` : '已完修') : 
                                     r.status === 'tracking' ? (r.nextVisitDate ? `回訪: ${r.nextVisitDate}` : '待追蹤') :
                                     r.status === 'monitor' ? (r.nextVisitDate ? `觀察: ${r.nextVisitDate}` : '觀察中') : '待處理'}
                                 </span>
                             </div>
                        </div>
                    </div>
                )
            })
        )}
      </div>
      <WorkLogReportModal isOpen={showReportModal} onClose={() => setShowReportModal(false)} records={filteredRecords} customers={customers} dateLabel={getDateLabel()} />
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
};

export default RecordList;