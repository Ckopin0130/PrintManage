import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Calendar, Trash2, Search, X, 
  User, AlertCircle, Wrench, Package, Briefcase, Phone, Clock
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
  const [activeDateTab, setActiveDateTab] = useState('all'); 

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

  // --- 5. 日期快速設定邏輯 ---
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

  return (
    <div className="bg-slate-50 min-h-screen pb-24 font-sans flex flex-col">
      {/* 頂部固定區塊 */}
      <div className="bg-white shadow-sm sticky top-0 z-30 border-b border-slate-200">
         
         {/* 1. 標題列 */}
         <div className="px-4 py-3 flex items-center justify-between">
             <div className="flex items-center">
                <button onClick={() => {setCurrentView('dashboard'); setActiveTab('dashboard');}} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full"><ArrowLeft size={22}/></button>
                <h2 className="text-lg font-bold text-slate-800 ml-1">維修紀錄</h2>
             </div>
         </div>

         {/* 2. 搜尋框 */}
         <div className="px-4 pb-1 relative">
            <Search size={16} className="absolute left-7 top-2.5 text-slate-400" />
            <input 
                className="w-full bg-slate-100 border-none rounded-lg py-2 pl-9 pr-8 text-sm outline-none font-medium text-slate-700 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" 
                placeholder="搜尋客戶、故障、零件..." 
                value={inputValue} 
                onChange={e => setInputValue(e.target.value)} 
            />
            {inputValue && <button onClick={() => setInputValue('')} className="absolute right-6 top-2 text-slate-400"><X size={16}/></button>}
         </div>

         {/* 3. 日期快速按鈕 (橫向滑動區) - 修改樣式為藍色系 */}
         <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar items-center">
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
                            // 這裡改成藍色背景 + 藍色陰影，符合 App 主色調
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200' 
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    {btn.label}
                </button>
            ))}
            
            {/* 自訂日期按鈕 */}
            <button 
                onClick={() => handleDateTabClick('custom')}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-1 ${
                    activeDateTab === 'custom'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                        : 'bg-white text-blue-600 border-blue-100 hover:bg-blue-50'
                }`}
            >
                <Calendar size={12}/> 
                {dateRange.start && activeDateTab === 'custom' ? '已選範圍' : '自訂'}
            </button>
         </div>

         {/* 日期選擇器面板 (僅點自訂時出現) */}
         {showDatePicker && activeDateTab === 'custom' && (
            <div className="px-4 pb-3 animate-in slide-in-from-top-2">
                <div className="bg-white border border-blue-200 rounded-xl p-3 shadow-lg bg-blue-50/50">
                    <div className="flex gap-2 items-center">
                        <input type="date" className="flex-1 border border-blue-200 p-2 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-blue-400" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
                        <span className="text-blue-300 font-bold">~</span>
                        <input type="date" className="flex-1 border border-blue-200 p-2 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-blue-400" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
                    </div>
                </div>
            </div>
         )}
         
         {/* 4. 狀態篩選 Tabs */}
         <div className="flex border-t border-slate-100">
             {['all', 'pending', 'monitor', 'completed'].map(id => (
                 <button key={id} onClick={() => setStatusFilter(id)} className={`flex-1 text-xs py-3 font-bold transition-colors relative ${statusFilter === id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                    {id === 'all' ? '全部案件' : id === 'pending' ? '待處理' : id === 'monitor' ? '觀察中' : '已完修'}
                    {statusFilter === id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>}
                 </button>
             ))}
         </div>
      </div>

      {/* --- 列表內容 --- */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-2 space-y-3">
        {records.length === 0 ? (
            <div className="text-center text-slate-400 mt-10">尚無紀錄</div>
        ) : filteredRecords.length === 0 ? (
            <div className="text-center text-slate-400 mt-10 flex flex-col items-center">
                <Search size={32} className="opacity-20 mb-2"/>
                <span>查無符合資料</span>
                <button onClick={() => {setInputValue(''); setStatusFilter('all'); handleDateTabClick('all');}} className="mt-2 text-xs text-blue-500 underline">
                    清除所有篩選
                </button>
            </div>
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
                        <div className="text-xs text-slate-400 mt-2 text-right border-t border-slate-50 pt-2 flex items-center justify-end gap-1">
                           <Clock size={12}/>
                           {r.date} · {r.status === 'completed' ? '已完修' : r.status === 'pending' ? '待處理' : '觀察中'}
                        </div>
                    </div>
                )
            })
        )}
      </div>
      
      {/* 針對橫向捲軸的樣式修補 */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default RecordList;