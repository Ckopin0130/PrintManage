import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Search, X, Calendar, User, AlertCircle, Wrench, Package, 
  Clock, FileText, Copy, Check
} from 'lucide-react';

// --- 1. 報表預覽視窗 (修正：完整結尾與去編號邏輯) ---
const WorkLogReportModal = ({ isOpen, onClose, records = [], customers = [], dateLabel }) => {
  const [isCopied, setIsCopied] = useState(false);

  // 生成報表文字
  const reportText = useMemo(() => {
    if (!Array.isArray(records) || records.length === 0) return '無資料';

    // ★★★ 智慧去編號函式 ★★★
    // 能移除： "1. 文字", "2、文字", "(1) 文字", "1 文字", "① 文字"
    const stripNumbering = (str) => {
        if (!str) return '';
        return str.replace(/^([\d０-９]+[.、\s)）\uff0e]+|[(（][\d０-９]+[)）]|[\u2460-\u2473])\s*/, '');
    };

    const formatMMDD = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${month}/${day}`;
    };

    // === A. 維修行程列表 (Job List) ===
    const listText = records.map((r) => {
        const cust = Array.isArray(customers) ? customers.find(c => c.customerID === r.customerID) : null;
        const model = cust?.assets?.[0]?.model ? `(${cust.assets[0].model})` : '';
        
        // 🔸 層級：客戶名稱 (機型)
        let text = `🔸${cust?.name || '未知'} ${model}`;
        
        // 🔹 層級：故障 (若無內容則不顯示)
        const faultContent = r.fault || r.symptom || '';
        if (faultContent) {
            text += `\n🔹 故障：`;
            const lines = String(faultContent).split('\n');
            lines.forEach(line => {
                // 自動移除每一行開頭的編號
                const cleanLine = stripNumbering(line.trim());
                if(cleanLine) text += `\n▪️${cleanLine}`;
            });
        }

        // 🔹 層級：處理
        const solutionContent = r.solution || r.action || '無填寫';
        text += `\n🔹 處理：`;
        const solLines = String(solutionContent).split('\n');
        solLines.forEach(line => {
             // 自動移除每一行開頭的編號
             const cleanLine = stripNumbering(line.trim());
             if(cleanLine) text += `\n▪️${cleanLine}`;
        });

        // 🔹 層級：更換零件 (黑白文字)
        if (Array.isArray(r.parts) && r.parts.length > 0) {
            const partsStr = r.parts.map(p => `${p.name} x${p.qty}`).join('、');
            text += `\n🔹 更換: ${partsStr}`;
        }

        // 🔹 結案日期 (結案才顯示)
        if (r.status === 'completed') {
            const finishDate = r.completedDate || r.date;
            text += `\n🔹 結案：${formatMMDD(finishDate)}`;
        }

        return text;
    }).join('\n\n');

    // === B. 耗材統計 (Summary) ===
    const summaryByModel = {};
    records.forEach(r => {
        if (Array.isArray(r.parts) && r.parts.length > 0) {
            const cust = Array.isArray(customers) ? customers.find(c => c.customerID === r.customerID) : null;
            const modelName = cust?.assets?.[0]?.model || '通用/其他';

            if (!summaryByModel[modelName]) {
                summaryByModel[modelName] = {};
            }

            r.parts.forEach(p => {
                summaryByModel[modelName][p.name] = (summaryByModel[modelName][p.name] || 0) + (p.qty || 1);
            });
        }
    });

    // 格式化耗材統計文字 (🔸機型 -> ▪️零件)
    let summaryList = '';
    const models = Object.keys(summaryByModel).sort();

    if (models.length > 0) {
        summaryList = models.map(model => {
            // 這裡也自動去除機型名稱可能帶有的編號
            const cleanModel = stripNumbering(model);
            const partsObj = summaryByModel[model];
            const partsLines = Object.entries(partsObj).map(([name, qty]) => {
                return `▪️${name} x${qty}`;
            }).join('\n');

            return `🔸${cleanModel}\n${partsLines}`;
        }).join('\n\n');
    } else {
        summaryList = '🔸無更換零件';
    }

    // 組合最終報表 (🔺層級)
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
                <button onClick={onClose} className="p-1.5 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200">
                    <X size={20} />
                </button> 
            </div>
            
            <div className="flex-1 overflow-y-auto bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4 font-mono text-sm leading-relaxed whitespace-pre-wrap text-slate-700 shadow-inner">
                {reportText}
            </div>
            
            <button onClick={handleCopy} className={`w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center transition-all ${isCopied ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {isCopied ? <Check className="mr-2" size={20}/> : <Copy className="mr-2" size={20}/>}
                {isCopied ? '已複製' : '複製內容 (傳送給 LINE)'}
            </button>
        </div>
    </div>
  );
};

// --- 2. 主元件 WorkLog ---
const WorkLog = ({ 
  records = [], customers = [], setCurrentView, showToast 
}) => {
  
  const [inputValue, setInputValue] = useState(''); 
  const [debouncedSearch, setDebouncedSearch] = useState(''); 
  const [activeDateTab, setActiveDateTab] = useState('today'); 
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    handleDateTabClick('today');
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(inputValue);
    }, 400);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const handleDateTabClick = (type) => {
    setActiveDateTab(type);
    const today = new Date();
    const formatDate = (date) => date.toLocaleDateString('en-CA');

    if (type === 'all') {
        setDateRange({ start: '', end: '' });
        setShowDatePicker(false);
    } else if (type === 'today') {
        const str = formatDate(today);
        setDateRange({ start: str, end: str });
        setShowDatePicker(false);
    } else if (type === 'yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const str = formatDate(yesterday);
        setDateRange({ start: str, end: str });
        setShowDatePicker(false);
    } else if (type === 'week') {
        const day = today.getDay(); 
        const diff = today.getDate() - day + (day === 0 ? -6 : 1); 
        const monday = new Date(today.setDate(diff));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        setDateRange({ start: formatDate(monday), end: formatDate(sunday) });
        setShowDatePicker(false);
    } else if (type === 'month') {
        const first = new Date(today.getFullYear(), today.getMonth(), 1);
        const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        setDateRange({ start: formatDate(first), end: formatDate(last) });
        setShowDatePicker(false);
    } else if (type === 'custom') {
        setShowDatePicker(!showDatePicker);
    }
  };

  const filteredRecords = useMemo(() => {
    if (!Array.isArray(records)) return [];

    return records.filter(r => {
      const cust = Array.isArray(customers) ? customers.find(c => c.customerID === r.customerID) : null;
      const custName = cust ? cust.name.toLowerCase() : '';
      const fault = (r.fault || '').toLowerCase();
      const solution = (r.solution || '').toLowerCase();
      const partsText = (Array.isArray(r.parts)) ? r.parts.map(p => p.name).join(' ').toLowerCase() : '';
      const searchLower = debouncedSearch.toLowerCase();

      const matchesSearch = 
        custName.includes(searchLower) || 
        fault.includes(searchLower) || 
        solution.includes(searchLower) ||
        partsText.includes(searchLower);

      let matchesDate = true;
      if (dateRange.start || dateRange.end) {
        const recordDate = r.status === 'completed' && r.completedDate ? r.completedDate : r.date;
        if (dateRange.start) matchesDate = matchesDate && (recordDate >= dateRange.start);
        if (dateRange.end) matchesDate = matchesDate && (recordDate <= dateRange.end);
      }

      return matchesSearch && matchesDate;
    }).sort((a, b) => {
       const dateA = a.status === 'completed' && a.completedDate ? a.completedDate : a.date;
       const dateB = b.status === 'completed' && b.completedDate ? b.completedDate : b.date;
       return new Date(dateB) - new Date(dateA);
    });
  }, [records, customers, debouncedSearch, dateRange]);

  const getDateLabel = () => {
      if(activeDateTab === 'today') return '今日';
      if(activeDateTab === 'yesterday') return '昨日';
      if(dateRange.start && dateRange.end) return `${dateRange.start} ~ ${dateRange.end}`;
      if(dateRange.start) return `${dateRange.start} 之後`;
      return '全部紀錄';
  };

  const formatMMDD = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${month}/${day}`;
    };

  return (
    <div className="bg-slate-50 min-h-screen pb-24 font-sans flex flex-col">
      <div className="bg-white/95 backdrop-blur shadow-sm sticky top-0 z-30 border-b border-slate-100/50">
         <div className="px-4 py-3 flex items-center justify-between">
             <div className="flex items-center">
                <button onClick={() => setCurrentView('dashboard')} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full"><ArrowLeft size={22}/></button>
                <h2 className="text-lg font-bold text-slate-800 ml-1">工作日誌</h2>
             </div>
             <button 
                onClick={() => setShowReportModal(true)}
                className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors flex items-center gap-1"
             >
                <FileText size={20}/>
             </button>
         </div>

         <div className="px-4 pb-2 relative">
            <Search size={16} className="absolute left-7 top-2.5 text-slate-400" />
            <input 
                className="w-full bg-slate-100 border-none rounded-xl py-2 pl-9 pr-8 text-sm outline-none font-medium text-slate-700 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" 
                placeholder="搜尋客戶、故障、處理內容..." 
                value={inputValue} 
                onChange={e => setInputValue(e.target.value)} 
            />
            {inputValue && <button onClick={() => setInputValue('')} className="absolute right-6 top-2 text-slate-400"><X size={16}/></button>}
         </div>

         <div className="px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar items-center">
            {[
                { id: 'all', label: '全部' },
                { id: 'today', label: '今日' },
                { id: 'yesterday', label: '昨日' },
                { id: 'week', label: '本週' },
                { id: 'month', label: '本月' },
            ].map(btn => (
                <button
                    key={btn.id}
                    onClick={() => handleDateTabClick(btn.id)}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                        activeDateTab === btn.id 
                            ? 'bg-slate-800 text-white border-slate-800 shadow-sm' 
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    {btn.label}
                </button>
            ))}
            
            <button 
                onClick={() => handleDateTabClick('custom')}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-1 ${
                    activeDateTab === 'custom'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-blue-600 border-blue-100 hover:bg-blue-50'
                }`}
            >
                <Calendar size={12}/> 
                {dateRange.start && activeDateTab === 'custom' ? '範圍' : '自訂'}
            </button>
         </div>

         {showDatePicker && activeDateTab === 'custom' && (
            <div className="px-4 pb-3 animate-in slide-in-from-top-2">
                <div className="bg-white border border-blue-200 rounded-xl p-3 shadow-lg bg-blue-50/50">
                    <div className="flex gap-2 items-center">
                        <input type="date" className="flex-1 border border-blue-200 p-2 rounded-lg text-sm font-bold text-slate-700 outline-none" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
                        <span className="text-blue-300 font-bold">~</span>
                        <input type="date" className="flex-1 border border-blue-200 p-2 rounded-lg text-sm font-bold text-slate-700 outline-none" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
                    </div>
                </div>
            </div>
         )}
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50 p-2 space-y-3">
        {filteredRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-40">
                <Search size={48} className="text-slate-300 mb-2" />
                <p className="font-bold text-slate-400">查無資料</p>
            </div>
        ) : (
            filteredRecords.map(r => {
                const cust = Array.isArray(customers) ? customers.find(c => c.customerID === r.customerID) : null;
                
                let borderClass = 'border-l-4 border-l-slate-300';
                let statusLabel = '觀察';
                let statusBg = 'bg-slate-100 text-slate-500';

                if(r.status === 'completed') {
                    borderClass = 'border-l-4 border-l-emerald-500';
                    statusLabel = '結案';
                    statusBg = 'bg-emerald-50 text-emerald-600';
                } else if(r.status === 'pending' || r.status === 'tracking') {
                    borderClass = 'border-l-4 border-l-amber-500';
                    statusLabel = '待料';
                    statusBg = 'bg-amber-50 text-amber-600';
                } else if (r.status === 'monitor') {
                    borderClass = 'border-l-4 border-l-blue-500';
                    statusLabel = '觀察';
                    statusBg = 'bg-blue-50 text-blue-600';
                }

                return (
                    <div 
                      key={r.id} 
                      className={`bg-white p-4 shadow-sm border border-slate-100 rounded-r-xl ${borderClass}`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="text-base text-slate-800 font-bold flex items-center flex-wrap">
                                <User size={16} className="text-slate-400 mr-2 shrink-0"/>
                                <span className="mr-1">{cust?.name || '未知客戶'}</span>
                                {cust?.assets?.[0]?.model && <span className="text-slate-500 font-normal">({cust.assets[0].model})</span>}
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusBg}`}>
                                {statusLabel}
                            </span>
                        </div>

                        <div className="flex items-start mb-2 text-base text-slate-700">
                            <AlertCircle size={16} className="text-slate-400 mr-2 mt-1 shrink-0"/>
                            <span>{r.fault || r.symptom || '無故障描述'}</span>
                        </div>

                        <div className="flex items-start mb-2 text-base text-slate-700 whitespace-pre-wrap">
                            <Wrench size={16} className="text-slate-400 mr-2 mt-1 shrink-0"/>
                            <span>{r.solution || r.action || '無處理內容'}</span>
                        </div>

                        {Array.isArray(r.parts) && r.parts.length > 0 && (
                            <div className="flex items-start mb-2 text-base text-slate-700">
                                <Package size={16} className="text-slate-400 mr-2 mt-1 shrink-0"/>
                                <span className="font-bold">{r.parts.map(p => `${p.name} x${p.qty}`).join('、')}</span>
                            </div>
                        )}

                        <div className="text-xs text-slate-400 mt-2 text-right border-t border-slate-50 pt-2 flex items-center justify-end gap-1">
                           <Clock size={12}/> {r.status === 'completed' ? `${formatMMDD(r.date)} 接案 | ${formatMMDD(r.completedDate || r.date)} 結案` : `${formatMMDD(r.date)} 接案`}
                        </div>
                    </div>
                )
            })
        )}
      </div>

      <WorkLogReportModal 
         isOpen={showReportModal} 
         onClose={() => setShowReportModal(false)} 
         records={filteredRecords}
         customers={customers}
         dateLabel={getDateLabel()}
      />

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default WorkLog;