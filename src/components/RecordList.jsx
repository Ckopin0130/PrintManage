import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Calendar, Trash2, Search, X, PlusCircle, Filter
} from 'lucide-react';

const RecordList = ({ 
  records, customers, setCurrentView, setActiveTab, 
  startEditRecord, handleDeleteRecord, setViewingImage, startAddRecord 
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

  // --- 3. 來源屬性對照表 ---
  const getSourceLabel = (source) => {
    switch(source) {
      case 'customer_call': return '客戶叫修';
      case 'company_dispatch': return '公司派工';
      case 'invoice_check': return '例行巡檢';
      default: return source ? '一般' : '';
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

      // 關鍵字搜尋
      const matchesSearch = 
        custName.includes(searchLower) || 
        fault.includes(searchLower) || 
        solution.includes(searchLower) ||
        partsText.includes(searchLower);

      // 狀態篩選
      let matchesStatus = true;
      if (statusFilter === 'pending') matchesStatus = (r.status === 'pending' || r.status === 'tracking');
      if (statusFilter === 'completed') matchesStatus = (r.status === 'completed');
      if (statusFilter === 'monitor') matchesStatus = (r.status === 'monitor');

      // 日期篩選
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

  // --- 5. 日期快速設定 ---
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

  const clearAllFilters = () => {
    setInputValue('');
    setDebouncedSearch('');
    setStatusFilter('all');
    setDateRange({ start: '', end: '' });
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24 font-sans flex flex-col">
      {/* --- 頂部導覽列 (維持功能但簡化樣式) --- */}
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

         {/* 篩選標籤 */}
         {(debouncedSearch || dateRange.start || statusFilter !== 'all') && (
            <div className="flex flex-wrap gap-2 mt-2">
                {statusFilter !== 'all' && <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded">狀態: {statusFilter === 'pending' ? '待處理' : statusFilter === 'monitor' ? '觀察' : '完修'}</span>}
                {dateRange.start && <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded">{dateRange.start}~{dateRange.end}</span>}
            </div>
         )}

         {/* 日期選擇器 */}
         {showDatePicker && (
            <div className="mt-2 bg-white border border-slate-200 rounded-lg p-3 shadow-lg absolute w-[calc(100%-2rem)] z-40 left-4">
                <div className="flex gap-2 mb-2">
                    <input type="date" className="flex-1 border p-1 rounded" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
                    <input type="date" className="flex-1 border p-1 rounded" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setQuickDate('today')} className="flex-1 py-1 bg-slate-100 text-xs rounded">今日</button>
                    <button onClick={() => setQuickDate('month')} className="flex-1 py-1 bg-slate-100 text-xs rounded">本月</button>
                    <button onClick={() => setQuickDate('clear')} className="flex-1 py-1 bg-slate-100 text-xs rounded text-red-500">清除</button>
                </div>
            </div>
         )}
         
         {/* 簡易狀態切換 */}
         <div className="flex mt-3 border-t pt-2 border-slate-100">
             {['all', 'pending', 'monitor', 'completed'].map(id => (
                 <button key={id} onClick={() => setStatusFilter(id)} className={`flex-1 text-xs py-1 ${statusFilter === id ? 'font-bold text-slate-800' : 'text-slate-400'}`}>
                    {id === 'all' ? '全部' : id === 'pending' ? '待處理' : id === 'monitor' ? '觀察' : '已完修'}
                 </button>
             ))}
         </div>
      </div>

      {/* --- 列表內容 (依照您的要求重新排版) --- */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-2 space-y-2">
        {records.length === 0 ? (
            <div className="text-center text-slate-400 mt-10">尚無紀錄</div>
        ) : filteredRecords.length === 0 ? (
            <div className="text-center text-slate-400 mt-10">查無資料</div>
        ) : (
            filteredRecords.map(r => {
                const cust = customers.find(c => c.customerID === r.customerID);
                const sourceLabel = getSourceLabel(r.serviceSource);
                
                // 統一字型樣式設定
                const baseTextStyle = "text-base text-slate-700 leading-normal"; 
                
                return (
                    <div 
                      key={r.id} 
                      className="bg-white p-4 border-b border-slate-200 cursor-pointer" // 移除圓角和陰影，改用分隔線，風格更統一
                      onClick={(e) => startEditRecord(e, r)}
                    >
                        {/* 第一行：業者名稱(機器型號) + 來源屬性 */}
                        <div className="flex justify-between items-start mb-1">
                            <div className={baseTextStyle}>
                                <span className="font-medium">{cust?.name || '未知客戶'}</span>
                                {cust?.assets?.[0]?.model && <span> ({cust.assets[0].model})</span>}
                                {sourceLabel && <span className="ml-2 text-slate-500">[{sourceLabel}]</span>}
                            </div>
                            {/* 為了操作方便，這裡還是保留刪除按鈕，但做得比較隱蔽 */}
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteRecord(e, r.id); }} className="text-slate-300 hover:text-red-500">
                                <Trash2 size={16}/>
                            </button>
                        </div>

                        {/* 第二行：故障描述 (若無則不顯示) */}
                        {(r.fault || r.symptom) && (
                            <div className={`${baseTextStyle} mt-1`}>
                                故障：{r.fault || r.symptom}
                            </div>
                        )}

                        {/* 第三行：處理過程 (支援分行) */}
                        <div className={`${baseTextStyle} mt-1 whitespace-pre-wrap`}>
                            {r.solution || r.action || '無處理過程'}
                        </div>

                        {/* 第四行：更換了什麼零件 */}
                        {r.parts && r.parts.length > 0 && (
                            <div className={`${baseTextStyle} mt-1`}>
                                更換：{r.parts.map(p => `${p.name} x${p.qty}`).join('、')}
                            </div>
                        )}

                        {/* 第五行：照片 */}
                        {(r.photoBefore || r.photoAfter) && (
                            <div className="mt-2 flex gap-2">
                                {r.photoBefore && (
                                    <img 
                                        src={r.photoBefore} 
                                        alt="Before" 
                                        className="w-20 h-20 object-cover border border-slate-200" // 統一照片大小
                                        onClick={(e) => { e.stopPropagation(); setViewingImage(r.photoBefore); }}
                                    />
                                )}
                                {r.photoAfter && (
                                    <img 
                                        src={r.photoAfter} 
                                        alt="After" 
                                        className="w-20 h-20 object-cover border border-slate-200" 
                                        onClick={(e) => { e.stopPropagation(); setViewingImage(r.photoAfter); }}
                                    />
                                )}
                            </div>
                        )}
                        
                        {/* 補充：顯示日期 (放在最下方或第一行右側都可以，這裡為了不打亂五行結構，放在最底部淡淡顯示) */}
                        <div className="text-xs text-slate-400 mt-2 text-right">
                           {r.date} {r.status === 'completed' ? '(完修)' : r.status === 'pending' ? '(待料)' : '(觀察)'}
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