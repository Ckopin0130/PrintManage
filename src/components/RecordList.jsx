import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Calendar, Edit, Trash2, Package, Search, 
  Filter, X, Image as ImageIcon, PlusCircle 
} from 'lucide-react';

const RecordList = ({ 
  records, customers, setCurrentView, setActiveTab, 
  startEditRecord, handleDeleteRecord, setViewingImage, startAddRecord // 假設你有傳入 startAddRecord，如果沒有也沒關係，下面有做防呆
}) => {
  
  // --- 1. 狀態管理 ---
  const [inputValue, setInputValue] = useState(''); // 搜尋框的即時輸入值
  const [debouncedSearch, setDebouncedSearch] = useState(''); // 實際用於篩選的值 (Debounced)
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, completed
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // 預設日期區間
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // --- 2. 搜尋防抖動 (Debounce) 處理 ---
  // 當使用者打字時，延遲 400ms 才更新篩選條件，避免手機上卡頓
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(inputValue);
    }, 400);

    return () => clearTimeout(timer);
  }, [inputValue]);

  // --- 3. 資料篩選邏輯 (核心) ---
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const cust = customers.find(c => c.customerID === r.customerID);
      const custName = cust ? cust.name.toLowerCase() : '';
      const fault = (r.fault || '').toLowerCase();
      const solution = (r.solution || '').toLowerCase();
      const partsText = r.parts ? r.parts.map(p => p.name).join(' ').toLowerCase() : '';
      const searchLower = debouncedSearch.toLowerCase();

      // A. 關鍵字搜尋 (包含客戶名、故障、處理、零件)
      const matchesSearch = 
        custName.includes(searchLower) || 
        fault.includes(searchLower) || 
        solution.includes(searchLower) ||
        partsText.includes(searchLower);

      // B. 狀態篩選
      let matchesStatus = true;
      if (statusFilter === 'pending') matchesStatus = (r.status === 'pending' || r.status === 'tracking'); // 包含待料與追蹤
      if (statusFilter === 'completed') matchesStatus = (r.status === 'completed');
      if (statusFilter === 'monitor') matchesStatus = (r.status === 'monitor');

      // C. 日期篩選
      let matchesDate = true;
      if (dateRange.start || dateRange.end) {
        // 判斷依據：如果是完修，用完修日；否則用建立日
        const recordDate = r.status === 'completed' && r.completedDate 
          ? r.completedDate 
          : r.date;
        if (dateRange.start) matchesDate = matchesDate && (recordDate >= dateRange.start);
        if (dateRange.end) matchesDate = matchesDate && (recordDate <= dateRange.end);
      }

      return matchesSearch && matchesStatus && matchesDate;
    }).sort((a, b) => {
      const dateA = a.status === 'completed' && a.completedDate ? a.completedDate : a.date;
      const dateB = b.status === 'completed' && b.completedDate ? b.completedDate : b.date;
      return new Date(dateB) - new Date(dateA); // 日期新到舊
    });
  }, [records, customers, debouncedSearch, statusFilter, dateRange]);

  // --- 4. 快速日期設定 ---
  const setQuickDate = (type) => {
    const today = new Date();
    if (type === 'today') {
        const str = today.toLocaleDateString('en-CA');
        setDateRange({ start: str, end: str });
    } else if (type === 'month') {
        const first = new Date(today.getFullYear(), today.getMonth(), 1).toLocaleDateString('en-CA');
        const last = new Date(today.getFullYear(), today.getMonth() + 1, 0).toLocaleDateString('en-CA');
        setDateRange({ start: first, end: last });
    } else if (type === 'clear') {
        setDateRange({ start: '', end: '' });
    }
    setShowDatePicker(false);
  };

  // 清除所有篩選
  const clearAllFilters = () => {
    setInputValue('');
    setDebouncedSearch('');
    setStatusFilter('all');
    setDateRange({ start: '', end: '' });
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24 font-sans flex flex-col">
      {/* --- 頂部導覽列 --- */}
      <div className="bg-white/95 backdrop-blur px-4 py-3 shadow-sm sticky top-0 z-30 border-b border-slate-100/50">
         <div className="flex items-center justify-between mb-3">
             <div className="flex items-center">
                <button onClick={() => {setCurrentView('dashboard'); setActiveTab('dashboard');}} className="p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors"><ArrowLeft size={22}/></button>
                <h2 className="text-lg font-extrabold text-slate-800 tracking-wide ml-1">維修紀錄總覽</h2>
             </div>
             <button onClick={() => setShowDatePicker(!showDatePicker)} className={`p-2 rounded-full transition-colors ${dateRange.start ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}>
                <Calendar size={20} />
             </button>
         </div>

         {/* 搜尋框 */}
         <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input 
                className="w-full bg-slate-100 border-none rounded-xl py-2 pl-9 pr-8 text-sm outline-none focus:ring-2 focus:ring-blue-100 font-bold text-slate-700 transition-all placeholder-slate-400" 
                placeholder="搜尋客戶、故障、零件..." 
                value={inputValue} 
                onChange={e => setInputValue(e.target.value)} 
            />
            {inputValue && <button onClick={() => setInputValue('')} className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"><X size={16}/></button>}
         </div>

         {/* 篩選標籤 (Filter Chips) - 顯示當前生效的條件 */}
         {(debouncedSearch || dateRange.start || statusFilter !== 'all') && (
            <div className="flex flex-wrap gap-2 mt-3 animate-in fade-in">
                {statusFilter !== 'all' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-slate-800 text-white shadow-sm">
                        {statusFilter === 'pending' ? '待處理' : statusFilter === 'monitor' ? '觀察中' : '已完修'}
                        <button onClick={() => setStatusFilter('all')} className="ml-1.5 hover:text-slate-300"><X size={12}/></button>
                    </span>
                )}
                {dateRange.start && (
                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-700 shadow-sm">
                        {dateRange.start} ~ {dateRange.end || '...'}
                        <button onClick={() => setQuickDate('clear')} className="ml-1.5 hover:text-blue-900"><X size={12}/></button>
                    </span>
                )}
                {debouncedSearch && (
                   <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-slate-200 text-slate-700 shadow-sm">
                        搜尋: {debouncedSearch}
                   </span>
                )}
            </div>
         )}

         {/* 日期選擇面板 */}
         {showDatePicker && (
            <div className="mt-3 bg-white border border-slate-100 rounded-xl p-3 shadow-lg shadow-slate-200/50 animate-in fade-in slide-in-from-top-2 absolute w-[calc(100%-2rem)] z-40 left-4">
                <div className="flex items-center gap-2 mb-3">
                    <input type="date" className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-sm font-bold text-slate-600 outline-none focus:border-blue-300" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
                    <span className="text-slate-300 font-bold">~</span>
                    <input type="date" className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-sm font-bold text-slate-600 outline-none focus:border-blue-300" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setQuickDate('today')} className="flex-1 py-2 bg-slate-50 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-100 border border-slate-200">今日</button>
                    <button onClick={() => setQuickDate('month')} className="flex-1 py-2 bg-slate-50 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-100 border border-slate-200">本月</button>
                    <button onClick={() => setQuickDate('clear')} className="flex-1 py-2 bg-rose-50 text-rose-600 text-xs font-bold rounded-lg hover:bg-rose-100 border border-rose-100">清除日期</button>
                </div>
            </div>
         )}

         {/* 狀態頁籤 (Tabs) */}
         <div className="flex mt-3 bg-slate-100 p-1 rounded-xl">
             {[
                 { id: 'all', label: '全部' },
                 { id: 'pending', label: '待處理' }, // 包含 tracking
                 { id: 'monitor', label: '觀察' },
                 { id: 'completed', label: '已完修' }
             ].map(tab => (
                 <button 
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${statusFilter === tab.id ? 'bg-white text-slate-800 shadow-sm scale-100' : 'text-slate-400 hover:text-slate-600 scale-[0.98]'}`}
                 >
                    {tab.label}
                 </button>
             ))}
         </div>
      </div>

      {/* --- 列表內容 --- */}
      <div className="p-4 space-y-3 flex-1 overflow-y-auto">
        {records.length === 0 ? (
             // 完全無資料時的空狀態
            <div className="text-center text-slate-400 mt-20 flex flex-col items-center">
                <Package size={48} className="mb-4 opacity-20" />
                <p className="font-bold text-sm text-slate-500">尚無任何維修紀錄</p>
                <p className="text-xs text-slate-400 mt-1">開始新增你的第一筆工作吧！</p>
                {/* 如果有傳入 startAddRecord 可以顯示按鈕 */}
                {typeof startAddRecord === 'function' && (
                    <button onClick={() => startAddRecord()} className="mt-4 flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-xl font-bold text-sm">
                        <PlusCircle size={18}/> 新增紀錄
                    </button>
                )}
            </div>
        ) : filteredRecords.length === 0 ? (
            // 篩選後無資料的空狀態
            <div className="text-center text-slate-400 mt-20 flex flex-col items-center animate-in fade-in">
                <Filter size={48} className="mb-4 opacity-20" />
                <p className="font-bold text-sm text-slate-500">沒有符合條件的紀錄</p>
                <button onClick={clearAllFilters} className="mt-3 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors">
                    清除所有篩選條件
                </button>
            </div>
        ) : (
            filteredRecords.map(r => {
                const cust = customers.find(c => c.customerID === r.customerID);
                
                // 設定狀態顏色與左邊框顏色
                let statusConfig = { 
                    labelColor: "bg-emerald-50 text-emerald-600 border-emerald-100", 
                    text: "結案",
                    borderColor: "border-l-emerald-500"
                };
                if(r.status === 'pending' || r.status === 'tracking') {
                    statusConfig = { 
                        labelColor: "bg-amber-50 text-amber-600 border-amber-100", 
                        text: "待料",
                        borderColor: "border-l-amber-500"
                    };
                }
                if(r.status === 'monitor') {
                    statusConfig = { 
                        labelColor: "bg-blue-50 text-blue-600 border-blue-100", 
                        text: "觀察",
                        borderColor: "border-l-blue-500"
                    };
                }
           
                return (
                    <div 
                      key={r.id} 
                      className={`bg-white p-4 rounded-r-2xl rounded-l-md shadow-[0_2px_8px_rgb(0,0,0,0.04)] border-y border-r border-slate-100 ${statusConfig.borderColor} border-l-[5px] active:scale-[0.99] transition-all cursor-pointer group`}
                      onClick={(e) => startEditRecord(e, r)}
                    >
                        {/* 頂部資訊列：日期 與 狀態 */}
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-extrabold text-slate-500 flex items-center font-mono tracking-tight">
                                {r.date}
                            </span>
                            <div className="flex items-center space-x-2">
                                {/* 狀態標籤 (可選：如果覺得左邊框夠明顯，這裡也可以隱藏) */}
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusConfig.labelColor}`}>
                                    {statusConfig.text}
                                </span>
                                {/* 刪除按鈕 */}
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteRecord(e, r.id); }} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors">
                                    <Trash2 size={14}/>
                                </button>
                            </div>
                        </div>
                        
                        {/* 客戶與機型 */}
                        <div className="mb-2">
                            <h3 className="font-bold text-slate-800 text-base leading-tight">
                              {cust ? cust.name : '未知客戶'}
                            </h3>
                            {cust?.assets?.[0]?.model && (
                                <div className="inline-block mt-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                    {cust.assets[0].model}
                                </div>
                            )}
                        </div>

                        {/* 故障內容 */}
                        <div className="text-sm text-slate-700 font-bold mb-1 line-clamp-1">
                          {r.fault || r.symptom || <span className="text-slate-400 font-normal italic">無故障描述</span>}
                        </div>
                        
                        {/* 處理對策 */}
                        <div className="text-xs text-slate-500 leading-relaxed mb-2 line-clamp-2 min-h-[1.5em]">
                          {r.solution || r.action || '無處理內容'}
                        </div>
                        
                        {/* 零件顯示 */}
                        {r.parts && r.parts.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5 border-t border-slate-50 pt-2">
                                {r.parts.map((p, idx) => (
                                <span key={idx} className="text-[10px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-bold flex items-center">
                                    <Package size={10} className="mr-1 text-slate-400"/> {p.name}
                                    {p.qty > 1 && <span className="ml-1 text-blue-600">x{p.qty}</span>}
                                </span>
                                ))}
                            </div>
                        )}

                        {/* 照片縮圖預覽區 (UX優化重點) */}
                        {(r.photoBefore || r.photoAfter) && (
                            <div className="mt-3 flex gap-2 pt-1">
                                {r.photoBefore && (
                                    <div 
                                        className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shadow-sm"
                                        onClick={(e) => { e.stopPropagation(); setViewingImage(r.photoBefore); }}
                                    >
                                        <img src={r.photoBefore} alt="Before" className="w-full h-full object-cover" />
                                        <div className="absolute bottom-0 right-0 bg-black/50 text-[8px] text-white px-1 font-bold">前</div>
                                    </div>
                                )}
                                {r.photoAfter && (
                                    <div 
                                        className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shadow-sm"
                                        onClick={(e) => { e.stopPropagation(); setViewingImage(r.photoAfter); }}
                                    >
                                        <img src={r.photoAfter} alt="After" className="w-full h-full object-cover" />
                                        <div className="absolute bottom-0 right-0 bg-emerald-600/80 text-[8px] text-white px-1 font-bold">後</div>
                                    </div>
                                )}
                                {/* 如果只有文字標記的需求，保留這個 */}
                                <div className="flex items-center text-[10px] text-slate-400 font-bold ml-1">
                                    <ImageIcon size={12} className="mr-1"/> 
                                    {(r.photosBefore?.length || 0) + (r.photosAfter?.length || 0) > 2 
                                        ? `+${(r.photosBefore?.length || 0) + (r.photosAfter?.length || 0) - 2} 張` 
                                        : ''}
                                </div>
                            </div>
                        )}
                    </div>
                )
            })
        )}
      </div>
    </div>
  );
};

export default RecordList;