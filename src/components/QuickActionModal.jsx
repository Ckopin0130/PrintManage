import React, { useState, useMemo } from 'react';
import { 
  X, Search, Plus, Wrench, History, ChevronRight, 
  User, FileText, Calendar 
} from 'lucide-react';

const QuickActionModal = ({ 
  isOpen, onClose, customers, records, 
  onQuickAdd, onQuickEdit 
}) => {
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'recent'
  const [custSearch, setCustSearch] = useState('');
  
  // 新增任務表單狀態
  const [selectedCust, setSelectedCust] = useState(null);
  const [symptom, setSymptom] = useState('');

  if (!isOpen) return null;

  // --- 邏輯 A: 客戶搜尋 (用於新增) ---
  const filteredCustomers = useMemo(() => {
    if (!custSearch) return [];
    const lowerSearch = custSearch.toLowerCase();
    return customers.filter(c => 
      (c.name || '').toLowerCase().includes(lowerSearch) || 
      (c.phones && c.phones.some(p => (p.number || '').includes(lowerSearch))) ||
      (c.address && c.address.includes(lowerSearch))
    ).slice(0, 5); // 只顯示前 5 筆避免太長
  }, [customers, custSearch]);

  // --- 邏輯 B: 近期/未結案紀錄 (用於修改) ---
  const recentRecords = useMemo(() => {
    const today = new Date().toLocaleDateString('en-CA');
    return records.filter(r => 
      r.date === today || 
      r.status === 'pending' || 
      r.status === 'monitor'
    ).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
  }, [records]);

  // --- 動作處理 ---
  const handleCreateConfirm = () => {
    if (!selectedCust) return alert('請先選擇客戶');
    onQuickAdd(selectedCust, symptom);
    resetForm();
  };

  const resetForm = () => {
    setSelectedCust(null);
    setSymptom('');
    setCustSearch('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[90] flex items-end sm:items-center justify-center animate-in fade-in" onClick={resetForm}>
      <div 
        className="bg-slate-50 w-full max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        {/* 1. 頂部標題與關閉 */}
        <div className="bg-white px-5 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
          <h3 className="text-lg font-extrabold text-slate-800 tracking-wide">快速操作</h3>
          <button onClick={resetForm} className="p-1.5 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
            <X size={20} />
          </button>
        </div>

        {/* 2. 分頁切換 Tabs */}
        <div className="flex p-2 bg-white gap-2 border-b border-slate-100 shrink-0">
          <button 
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'create' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Plus size={18} /> 新增任務
          </button>
          <button 
            onClick={() => setActiveTab('recent')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'recent' 
                ? 'bg-amber-500 text-white shadow-md shadow-amber-200' 
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            <History size={18} /> 修改紀錄
          </button>
        </div>

        {/* 3. 內容區域 (可捲動) */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          
          {/* === 頁面一：新增任務 === */}
          {activeTab === 'create' && (
            <div className="space-y-4 animate-in slide-in-from-right-4">
              
              {/* 選客戶 */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">1. 選擇客戶</label>
                {!selectedCust ? (
                  <div className="relative">
                    <Search className="absolute left-3 top-3 text-slate-400" size={18}/>
                    <input 
                      autoFocus
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
                      placeholder="輸入名稱、電話搜尋..."
                      value={custSearch}
                      onChange={e => setCustSearch(e.target.value)}
                    />
                    {/* 搜尋結果列表 */}
                    {custSearch && (
                      <div className="mt-2 space-y-1">
                        {filteredCustomers.length === 0 ? (
                           <div className="p-2 text-center text-sm text-slate-400">找不到客戶</div>
                        ) : (
                           filteredCustomers.map(c => (
                             <div 
                                key={c.customerID} 
                                onClick={() => { setSelectedCust(c); setCustSearch(''); }}
                                className="flex items-center p-3 bg-slate-50 hover:bg-blue-50 border border-slate-100 rounded-xl cursor-pointer active:scale-95 transition-transform"
                             >
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs mr-3 shrink-0">
                                  {c.name?.[0] || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-sm text-slate-800 truncate">{c.name}</div>
                                  <div className="text-xs text-slate-400 truncate">{c.assets?.[0]?.model || '無機型'}</div>
                                </div>
                                <ChevronRight size={16} className="text-slate-300"/>
                             </div>
                           ))
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-xl">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><User size={20}/></div>
                       <div>
                         <div className="font-bold text-slate-800">{selectedCust.name}</div>
                         <div className="text-xs text-slate-500">{selectedCust.assets?.[0]?.model}</div>
                       </div>
                    </div>
                    <button onClick={() => setSelectedCust(null)} className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded border hover:text-rose-500">重選</button>
                  </div>
                )}
              </div>

              {/* 填問題 */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">2. 故障/任務描述</label>
                <textarea 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 resize-none h-24"
                  placeholder="例如：卡紙、更換碳粉..."
                  value={symptom}
                  onChange={e => setSymptom(e.target.value)}
                />
              </div>

              <button 
                onClick={handleCreateConfirm}
                disabled={!selectedCust}
                className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Wrench size={18} /> 建立維修單
              </button>
            </div>
          )}

          {/* === 頁面二：近期紀錄 (快速修改) === */}
          {activeTab === 'recent' && (
            <div className="space-y-3 animate-in slide-in-from-left-4">
              <div className="flex items-center justify-between px-1">
                 <span className="text-xs font-bold text-slate-400">今日 & 待處理任務</span>
              </div>
              
              {recentRecords.length === 0 ? (
                <div className="text-center py-10 text-slate-400 flex flex-col items-center">
                   <FileText size={48} className="opacity-20 mb-2"/>
                   <p>目前沒有待處理或今日的紀錄</p>
                </div>
              ) : (
                recentRecords.map(r => {
                  const cust = customers.find(c => c.customerID === r.customerID);
                  let statusBadge = { bg: 'bg-slate-100', text: 'text-slate-500', label: '已結案' };
                  if (r.status === 'pending') statusBadge = { bg: 'bg-orange-100', text: 'text-orange-600', label: '待料中' };
                  if (r.status === 'monitor') statusBadge = { bg: 'bg-amber-100', text: 'text-amber-600', label: '觀察中' };
                  if (r.date === new Date().toLocaleDateString('en-CA') && r.status === 'completed') statusBadge = { bg: 'bg-emerald-100', text: 'text-emerald-600', label: '今日完修' };

                  return (
                    <div 
                      key={r.id}
                      onClick={() => { onQuickEdit(r); onClose(); }}
                      className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm active:scale-[0.98] transition-all cursor-pointer hover:border-blue-200 group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                           <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusBadge.bg} ${statusBadge.text}`}>{statusBadge.label}</span>
                           <span className="text-[10px] font-bold text-slate-300 flex items-center"><Calendar size={10} className="mr-1"/>{r.date}</span>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500"/>
                      </div>
                      <div className="font-bold text-slate-800 text-sm mb-1">{cust?.name || '未知客戶'}</div>
                      <div className="text-xs text-slate-500 line-clamp-1">{r.fault || r.symptom || '無故障描述'}</div>
                    </div>
                  );
                })
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default QuickActionModal;