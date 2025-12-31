import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Calendar, Edit, Trash2, Package, Search, 
  Filter, CheckCircle, Clock, AlertCircle, X, ChevronDown 
} from 'lucide-react';

const RecordList = ({ 
  records, customers, setCurrentView, setActiveTab, 
  startEditRecord, handleDeleteRecord, setViewingImage
}) => {
  
  // --- 1. 狀態管理 ---
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, completed
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // 預設日期區間
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // --- 2. 資料篩選邏輯 (核心) ---
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const cust = customers.find(c => c.customerID === r.customerID);
      const custName = cust ? cust.name.toLowerCase() : '';
      const fault = (r.fault || '').toLowerCase();
      const solution = (r.solution || '').toLowerCase();
      const searchLower = searchTerm.toLowerCase();

      // A. 關鍵字搜尋 (包含客戶名、故障、處理)
      const matchesSearch = 
        custName.includes(searchLower) || 
        fault.includes(searchLower) || 
        solution.includes(searchLower);

      // B. 狀態篩選
      let matchesStatus = true;
      if (statusFilter === 'pending') matchesStatus = (r.status === 'pending' || r.status === 'monitor');
      if (statusFilter === 'completed') matchesStatus = (r.status === 'completed');

      // C. 日期篩選 (如果有設定的話)
      // 修復：對於已完成的記錄，使用完成日期；對於未完成的記錄，使用創建日期
      let matchesDate = true;
      if (dateRange.start || dateRange.end) {
        const recordDate = r.status === 'completed' && r.completedDate 
          ? r.completedDate 
          : r.date;
        if (dateRange.start) matchesDate = matchesDate && (recordDate >= dateRange.start);
        if (dateRange.end) matchesDate = matchesDate && (recordDate <= dateRange.end);
      }

      return matchesSearch && matchesStatus && matchesDate;
    }).sort((a, b) => {
      // 修復：排序時使用完成日期（如果已完成）或創建日期
      const dateA = a.status === 'completed' && a.completedDate ? a.completedDate : a.date;
      const dateB = b.status === 'completed' && b.completedDate ? b.completedDate : b.date;
      return new Date(dateB) - new Date(dateA); // 依照日期新到舊排序
    });
  }, [records, customers, searchTerm, statusFilter, dateRange]);

  // --- 3. 快速日期設定 ---
  const setQuickDate = (type) => {
    const today = new Date();
    if (type === 'today') {
        const str = today.toLocaleDateString('en-CA');
        setDateRange({ start: str, end: str });
    } else if (type === 'month') {
        const first = new Date(today.getFullYear(), today.getMonth(), 1).toLocaleDateString('en-CA');
        const last = new Date(today.getFullYear(), today.getMonth() + 1, 0).toLocaleDateString('en-CA');
        setDateRange({ start: first, end: last });
    } else if (type === 'all') {
        setDateRange({ start: '', end: '' });
    }
    setShowDatePicker(false);
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
             <button onClick={() => setShowDatePicker(!showDatePicker)} className={`p-2 rounded-full transition-colors ${dateRange.start ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50'}`}>
                <Calendar size={20} />
             </button>
         </div>

         {/* 搜尋框 */}
         <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input 
                className="w-full bg-slate-100 border-none rounded-xl py-2 pl-9 pr-8 text-sm outline-none focus:ring-2 focus:ring-blue-100 font-bold text-slate-700 transition-all placeholder-slate-400" 
                placeholder="搜尋客戶、故障原因..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
            />
            {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"><X size={16}/></button>}
         </div>

         {/* 日期選擇面板 (可展開) */}
         {showDatePicker && (
            <div className="mt-3 bg-white border border-slate-100 rounded-xl p-3 shadow-sm animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 mb-3">
                    <input type="date" className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-600 outline-none" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
                    <span className="text-slate-300">~</span>
                    <input type="date" className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-600 outline-none" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setQuickDate('today')} className="flex-1 py-1.5 bg-slate-50 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-100">今日</button>
                    <button onClick={() => setQuickDate('month')} className="flex-1 py-1.5 bg-slate-50 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-100">本月</button>
                    <button onClick={() => setQuickDate('all')} className="flex-1 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100">全部</button>
                </div>
            </div>
         )}

         {/* 狀態頁籤 (Tabs) */}
         <div className="flex mt-3 bg-slate-100 p-1 rounded-xl">
             {[
                 { id: 'all', label: '全部' },
                 { id: 'pending', label: '待處理/觀察' },
                 { id: 'completed', label: '已完修' }
             ].map(tab => (
                 <button 
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${statusFilter === tab.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                    {tab.label}
                 </button>
             ))}
         </div>
      </div>

      {/* --- 列表內容 --- */}
      <div className="p-4 space-y-3 flex-1 overflow-y-auto">
        {filteredRecords.length === 0 ? (
            <div className="text-center text-slate-400 mt-20 flex flex-col items-center">
                <Filter size={48} className="mb-4 opacity-20" />
                <p className="font-bold text-sm">沒有符合的紀錄</p>
                <button onClick={() => {setSearchTerm(''); setStatusFilter('all'); setDateRange({start:'', end:''});}} className="mt-2 text-xs text-blue-500 font-bold underline">清除所有篩選</button>
            </div>
        ) : (
            filteredRecords.map(r => {
                const cust = customers.find(c => c.customerID === r.customerID);
                let statusConfig = { color: "bg-emerald-50 text-emerald-600 border-emerald-100", text: "結案" };
                if(r.status === 'pending') statusConfig = { color: "bg-amber-50 text-amber-600 border-amber-100", text: "待料" };
                if(r.status === 'monitor') statusConfig = { color: "bg-blue-50 text-blue-600 border-blue-100", text: "觀察" };
           
                return (
                    <div 
                      key={r.id} 
                      className="bg-white p-4 rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] border border-slate-100 hover:border-blue-200 transition-all active:scale-[0.99] group cursor-pointer"
                      onClick={(e) => {
                        // 點擊整個卡片進入編輯紀錄
                        startEditRecord(e, r);
                      }}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 flex items-center font-mono">
                                <Calendar size={10} className="mr-1.5"/>{r.date}
                            </span>
                            <div className="flex items-center space-x-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusConfig.color}`}>{statusConfig.text}</span>
                                {/* 操作按鈕區 */}
                                <div className="flex">
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteRecord(e, r.id); }} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"><Trash2 size={14}/></button>
                                </div>
                            </div>
                        </div>
                        
                        {/* 客戶名稱區域 - 移除單獨的 onClick，讓點擊時觸發卡片的 onClick */}
                        <div className="mb-2">
                            <h3 className="font-bold text-slate-800 text-base flex items-center">
                              {cust ? cust.name : '未知客戶'}
                            </h3>
                            <div className="text-xs text-slate-400 font-bold">{cust?.assets?.[0]?.model || ''}</div>
                        </div>

                        {/* 故障描述和處理過程 - 不需要單獨的 onClick，會觸發卡片的 onClick */}
                        <div className="text-sm text-slate-700 font-bold mb-1">
                          {r.fault || r.symptom}
                        </div>
                        <div className="text-xs text-slate-500 leading-relaxed mb-2 line-clamp-2">
                          {r.solution || r.action}
                        </div>
                        
                        {r.parts && r.parts.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5 border-t border-slate-50 pt-2">
                                {r.parts.map((p, idx) => (
                                <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-bold flex items-center">
                                    <Package size={10} className="mr-1"/> {p.name}
                                </span>
                                ))}
                            </div>
                        )}

                        {(r.photoBefore || r.photoAfter) && (
                            <div className="mt-3 flex gap-2">
                                {r.photoBefore && <div className="h-1.5 w-1.5 rounded-full bg-blue-400"></div>}
                                {r.photoAfter && <div className="h-1.5 w-1.5 rounded-full bg-emerald-400"></div>}
                                <span className="text-[10px] text-slate-300">包含照片</span>
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