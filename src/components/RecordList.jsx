import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Calendar, Trash2, Search, X, 
  User, AlertCircle, Wrench, Package, Briefcase, Phone
} from 'lucide-react';

const RecordList = ({ 
  records, customers, setCurrentView, setActiveTab, 
  startEditRecord, handleDeleteRecord, setViewingImage 
}) => {
  
  // --- 1. 狀態管理 ---
  const [inputValue, setInputValue] = useState(''); 
  const [debouncedSearch, setDebouncedSearch] = useState(''); 
  const [statusFilter, setStatusFilter] = useState('all'); 
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // --- 2. 搜尋防抖動 ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(inputValue);
    }, 400);
    return () => clearTimeout(timer);
  }, [inputValue]);

  // --- 3. 來源屬性 UI 處理 ---
  const getSourceBadge = (source) => {
    const baseClass = "text-xs px-2 py-0.5 rounded-md flex items-center gap-1 font-medium ml-2";
    switch(source) {
      case 'customer_call': 
        return <span className={`${baseClass} bg-rose-50 text-rose-600`}><Phone size={12}/> 客戶叫修</span>;
      case 'company_dispatch': 
        return <span className={`${baseClass} bg-blue-50 text-blue-600`}><Briefcase size={12}/> 公司派工</span>;
      case 'invoice_check': 
        return <span className={`${baseClass} bg-emerald-50 text-emerald-600`}><Calendar size={12}/> 例行巡檢</span>;
      default: return null;
    }
  };

  // --- 4. 資料篩選邏輯 ---
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const cust = customers.find(c => c.customerID === r.customerID);
      const custName = cust ? cust.name.toLowerCase() : '';
      const fault = (r.fault || '').toLowerCase();
      const solution = (r.solution || '').toLowerCase();
      const partsText = r.parts ? r.parts.map(p => p.name).join(' ').toLowerCase() : '';
      const searchLower = debouncedSearch.toLowerCase();

      const matchesSearch = 
        custName.includes(searchLower) || 
        fault.includes(searchLower) || 
        solution.includes(searchLower) ||
        partsText.includes(searchLower);

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

  // --- 5. 日期快速設定 (新增 昨日 與 本週) ---
  const setQuickDate = (type) => {
    const today = new Date();
    
    // 輔助函數：格式化日期為 YYYY-MM-DD
    const formatDate = (date) => date.toLocaleDateString('en-CA');

    if (type === 'today') {
        const str = formatDate(today);
        setDateRange({ start: str, end: str });
    } else if (type === 'yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const str = formatDate(yesterday);
        setDateRange({ start: str, end: str });
    } else if (type === 'week') {
        // 計算本週一 (Monday)
        const day = today.getDay(); 
        const diff = today.getDate() - day + (day === 0 ? -6 : 1); // 如果是週日(0)，要減6天回到週一
        const monday = new Date(today.setDate(diff));
        
        // 計算本週日 (Sunday)
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        setDateRange({ start: formatDate(monday), end: formatDate(sunday) });
    } else if (type === 'month') {
        const first = new Date(today.getFullYear(), today.getMonth(), 1);
        const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        setDateRange({ start: formatDate(first), end: formatDate(last) });
    } else if (type === 'clear') {
        setDateRange({ start: '', end: '' });
    }
    setShowDatePicker(false);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24 font-sans flex flex-col">
      {/* 頂部導覽列 */}
      <div className="bg-white px-4 py-3 shadow-sm sticky top-0 z-30 border-b border-slate-200">
         <div className="flex items-center justify-between mb-3">
             <div className="flex items-center">
                <button onClick={() => {setCurrentView('dashboard'); setActiveTab('dashboard');}} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full"><ArrowLeft size={22}/></button>
                <h2 className="text-lg font-bold text-slate-800 ml-1">維修紀錄</h2>
             </div>
             <button onClick={() => setShowDatePicker(!showDatePicker)} className={`p-2 rounded-full ${dateRange.start ? 'text-blue-600' : 'text-slate-500'}`}>
                <Calendar size={20} />
             </button>
         </div>

         {/* 搜尋框 */}
         <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input 
                className="w-full bg-slate-100 border-none rounded-lg py-2 pl-9 pr-8 text-sm outline-none font-medium text-slate-700 placeholder-slate-400" 
                placeholder="搜尋..." 
                value={inputValue} 
                onChange={e => setInputValue(e.target.value)} 
            />
            {inputValue && <button onClick={() => setInputValue('')} className="absolute right-2 top-2 text-slate-400"><X size={16}/></button>}
         </div>

         {/* 篩選標籤 (僅顯示關鍵字與日期) */}
         {(debouncedSearch || dateRange.start) && (
            <div className="flex flex-wrap gap-2 mt-2 ml-1">
                {dateRange.start && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold flex items-center">
                        📅 {dateRange.start} ~ {dateRange.end}
                    </span>
                )}
                {debouncedSearch && (
                    <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded font-bold">
                        🔍 搜尋: {debouncedSearch}
                    </span>
                )}
            </div>
         )}

         {/* 日期選擇器 (更新版：增加昨日與本週) */}
         {showDatePicker && (
            <div className="mt-2 bg-white border border-slate-200 rounded-lg p-3 shadow-lg absolute w-[calc(100%-2rem)] z-40 left-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex gap-2 mb-3">
                    <input type="date" className="flex-1 border border-slate-300 p-2 rounded-lg text-sm font-bold text-slate-700" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
                    <input type="date" className="flex-1 border border-slate-300 p-2 rounded-lg text-sm font-bold text-slate-700" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
                </div>
                
                {/* 第一排：今日、昨日 */}
                <div className="flex gap-2 mb-2">
                    <button onClick={() => setQuickDate('today')} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors">
                        今日
                    </button>
                    <button onClick={() => setQuickDate('yesterday')} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors">
                        昨日
                    </button>
                </div>

                {/* 第二排：本週、本月 */}
                <div className="flex gap-2 mb-2">
                    <button onClick={() => setQuickDate('week')} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors">
                        本週
                    </button>
                    <button onClick={() => setQuickDate('month')} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors">
                        本月
                    </button>
                </div>

                {/* 清除按鈕 */}
                <button onClick={() => setQuickDate('clear')} className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-lg transition-colors border border-rose-100">
                    清除日期篩選
                </button>
            </div>
         )}
         
         {/* 簡易狀態切換 */}
         <div className="flex mt-3 border-t pt-2 border-slate-100">
             {['all', 'pending', 'monitor', 'completed'].map(id => (
                 <button key={id} onClick={() => setStatusFilter(id)} className={`flex-1 text-xs py-1 transition-colors ${statusFilter === id ? 'font-bold text-blue-600 bg-blue-50 rounded-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                    {id === 'all' ? '全部' : id === 'pending' ? '待處理' : id === 'monitor' ? '觀察' : '已完修'}
                 </button>
             ))}
         </div>
      </div>

      {/* --- 列表內容 --- */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-2 space-y-3">
        {records.length === 0 ? (
            <div className="text-center text-slate-400 mt-10">尚無紀錄</div>
        ) : filteredRecords.length === 0 ? (
            <div className="text-center text-slate-400 mt-10">查無資料</div>
        ) : (
            filteredRecords.map(r => {
                const cust = customers.find(c => c.customerID === r.customerID);
                
                // 狀態左邊框顏色
                let borderClass = 'border-l-4 border-l-slate-300';
                if(r.status === 'completed') borderClass = 'border-l-4 border-l-emerald-500';
                if(r.status === 'pending' || r.status === 'tracking') borderClass = 'border-l-4 border-l-amber-500';
                if(r.status === 'monitor') borderClass = 'border-l-4 border-l-blue-500';

                return (
                    <div 
                      key={r.id} 
                      className={`bg-white p-4 shadow-sm border border-slate-100 rounded-r-xl ${borderClass} cursor-pointer hover:shadow-md transition-shadow`} 
                      onClick={(e) => startEditRecord(e, r)}
                    >
                        {/* 第一行：業者名稱(機器型號) + 來源屬性 */}
                        <div className="flex justify-between items-start mb-2">
                            <div className="text-base text-slate-800 font-bold flex items-center flex-wrap">
                                <User size={16} className="text-slate-400 mr-2 shrink-0"/>
                                <span className="mr-1">{cust?.name || '未知客戶'}</span>
                                {cust?.assets?.[0]?.model && <span className="text-slate-500 font-normal">({cust.assets[0].model})</span>}
                                {getSourceBadge(r.serviceSource)}
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteRecord(e, r.id); }} className="text-slate-300 hover:text-red-500 p-1">
                                <Trash2 size={16}/>
                            </button>
                        </div>

                        {/* 第二行：故障描述 */}
                        {(r.fault || r.symptom) && (
                            <div className="flex items-start mb-2 text-base text-slate-700">
                                <AlertCircle size={16} className="text-slate-400 mr-2 mt-1 shrink-0"/>
                                <span>{r.fault || r.symptom}</span>
                            </div>
                        )}

                        {/* 第三行：處理過程 */}
                        <div className="flex items-start mb-2 text-base text-slate-700 whitespace-pre-wrap">
                            <Wrench size={16} className="text-slate-400 mr-2 mt-1 shrink-0"/>
                            <span>{r.solution || r.action || '無處理紀錄'}</span>
                        </div>

                        {/* 第四行：更換零件 */}
                        {r.parts && r.parts.length > 0 && (
                            <div className="flex items-start mb-2 text-base text-slate-700">
                                <Package size={16} className="text-slate-400 mr-2 mt-1 shrink-0"/>
                                <span>{r.parts.map(p => `${p.name} x${p.qty}`).join('、')}</span>
                            </div>
                        )}

                        {/* 第五行：照片 */}
                        {(r.photoBefore || r.photoAfter) && (
                            <div className="flex items-center mt-2 pl-6">
                                {r.photoBefore && (
                                    <img 
                                        src={r.photoBefore} 
                                        alt="Before" 
                                        className="w-16 h-16 object-cover rounded-md border border-slate-200 mr-2" 
                                        onClick={(e) => { e.stopPropagation(); setViewingImage(r.photoBefore); }}
                                    />
                                )}
                                {r.photoAfter && (
                                    <img 
                                        src={r.photoAfter} 
                                        alt="After" 
                                        className="w-16 h-16 object-cover rounded-md border border-slate-200" 
                                        onClick={(e) => { e.stopPropagation(); setViewingImage(r.photoAfter); }}
                                    />
                                )}
                            </div>
                        )}

                        {/* 底部日期與狀態文字 */}
                        <div className="text-xs text-slate-400 mt-2 text-right border-t border-slate-50 pt-2">
                           {r.date} · {r.status === 'completed' ? '已完修' : r.status === 'pending' ? '待處理' : '觀察中'}
                        </div>
                    </div>
                )
            })
        )}
      </div>
    </div>
  );
};

export default RecordList;