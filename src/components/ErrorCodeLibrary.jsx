import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Search, Plus, Wrench, Save, X, Trash2, 
  BookOpen, Hash, StickyNote, Edit3
} from 'lucide-react';

const ErrorCodeLibrary = ({ 
  errorCodes = [], 
  spModes = [], 
  techNotes = [],
  onBack, 
  onSave, 
  onDelete 
}) => {
  const [activeTab, setActiveTab] = useState('error'); // 'error', 'sp', 'note'
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal 狀態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  // 定義分頁屬性 (使用紫色系為主，搭配各類別顏色)
  const tabs = [
    { id: 'error', label: '故障代碼', icon: BookOpen, color: 'text-rose-600', activeBorder: 'border-rose-600', activeText: 'text-rose-600' },
    { id: 'sp', label: 'SP 模式', icon: Hash, color: 'text-amber-600', activeBorder: 'border-amber-600', activeText: 'text-amber-600' },
    { id: 'note', label: '技術筆記', icon: StickyNote, color: 'text-emerald-600', activeBorder: 'border-emerald-600', activeText: 'text-emerald-600' }
  ];

  // --- 篩選邏輯 ---
  const filteredData = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    if (activeTab === 'error') {
      return errorCodes.filter(c => 
        (c.code || '').toLowerCase().includes(lower) || 
        (c.desc || '').toLowerCase().includes(lower) ||
        (c.model || '').toLowerCase().includes(lower) ||
        (c.solution || '').toLowerCase().includes(lower)
      );
    } else if (activeTab === 'sp') {
      return spModes.filter(s => 
        (s.cmd || '').toLowerCase().includes(lower) || 
        (s.title || '').toLowerCase().includes(lower) || 
        (s.desc || '').toLowerCase().includes(lower)
      );
    } else {
      return techNotes.filter(n => 
        (n.title || '').toLowerCase().includes(lower) || 
        (n.content || '').toLowerCase().includes(lower)
      );
    }
  }, [activeTab, searchTerm, errorCodes, spModes, techNotes]);

  // --- Modal 操作 ---
  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      setFormData(item);
    } else {
      // 根據分頁初始化不同表單
      if (activeTab === 'error') setFormData({ code: '', model: '', desc: '', solution: '' });
      if (activeTab === 'sp') setFormData({ cmd: '', title: '', desc: '' });
      if (activeTab === 'note') setFormData({ title: '', content: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    const timestamp = Date.now();
    const id = editingItem ? editingItem.id : timestamp.toString();
    const newItem = { ...formData, id, timestamp };

    // 簡單驗證
    if (activeTab === 'error' && (!newItem.code || !newItem.desc)) return alert('代碼與描述必填');
    if (activeTab === 'sp' && !newItem.cmd) return alert('指令必填');
    if (activeTab === 'note' && !newItem.title) return alert('標題必填');

    // 呼叫父層儲存
    onSave(activeTab, newItem, editingItem ? editingItem.id : null);
    setIsModalOpen(false);
  };

  const handleDeleteItem = () => {
    if (!confirm('確定要刪除嗎？')) return;
    onDelete(activeTab, editingItem.id);
    setIsModalOpen(false);
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans pb-24">
      {/* 頂部導航 (統一風格) */}
      <div className="bg-white/95 backdrop-blur px-4 pt-3 pb-0 shadow-sm sticky top-0 z-30 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <BookOpen className="text-violet-600" size={24} />
              知識庫
            </h1>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-violet-600 text-white px-3 py-2 rounded-xl text-sm font-bold flex items-center shadow-md active:scale-95 transition-transform hover:bg-violet-700"
          >
            <Plus size={18} className="mr-1" /> 
            新增
          </button>
        </div>

        {/* 分頁籤 (Tabs) */}
        <div className="flex gap-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
              className={`pb-3 flex items-center gap-2 text-sm font-bold border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? `${tab.activeBorder} ${tab.activeText}` 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <tab.icon size={18}/> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 搜尋區 */}
      <div className="p-4 bg-white border-b border-slate-100 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder={
              activeTab === 'error' ? "搜尋代碼 (如 SC542)..." : 
              activeTab === 'sp' ? "搜尋指令 (如 5-810)..." : "搜尋筆記關鍵字..."
            }
            className="w-full bg-slate-100 pl-10 pr-4 py-3 rounded-xl font-bold text-lg outline-none focus:ring-2 focus:ring-violet-200 text-slate-700 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* 列表內容 */}
      <div className="p-4 space-y-3">
        {filteredData.length === 0 ? (
          <div className="text-center py-20 text-slate-400 flex flex-col items-center">
            <BookOpen size={48} className="mb-3 opacity-20"/>
            <p className="font-bold">無符合資料，新增一筆試試？</p>
          </div>
        ) : (
          filteredData.map(item => (
            <div 
              key={item.id} 
              onClick={() => handleOpenModal(item)}
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 active:bg-slate-50 transition-all cursor-pointer relative overflow-hidden group hover:shadow-md hover:border-violet-100"
            >
              {/* 1. 故障代碼卡片 */}
              {activeTab === 'error' && (
                <>
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>
                  <div className="flex justify-between items-start mb-2 pl-3">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-rose-600 tracking-tight font-mono">{item.code}</span>
                        {item.model && <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">{item.model}</span>}
                      </div>
                      <h3 className="font-bold text-slate-800 text-lg mt-1">{item.desc}</h3>
                    </div>
                  </div>
                  {item.solution && (
                    <div className="mt-2 pl-3 pt-3 border-t border-slate-50 flex items-start gap-2">
                      <Wrench size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                      <p className="text-slate-600 text-sm leading-relaxed">{item.solution}</p>
                    </div>
                  )}
                </>
              )}

              {/* 2. SP 模式卡片 */}
              {activeTab === 'sp' && (
                <>
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
                  <div className="pl-3">
                    <div className="flex justify-between items-center">
                       <span className="text-xl font-black text-slate-800 font-mono tracking-wider">SP {item.cmd}</span>
                       <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-lg">指令</span>
                    </div>
                    <h3 className="font-bold text-slate-700 mt-1 text-lg">{item.title}</h3>
                    {item.desc && <p className="text-slate-500 text-sm mt-2 bg-slate-50 p-2 rounded-lg leading-relaxed border border-slate-100">{item.desc}</p>}
                  </div>
                </>
              )}

              {/* 3. 技術筆記卡片 */}
              {activeTab === 'note' && (
                <>
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                  <div className="pl-3">
                    <h3 className="font-bold text-slate-800 text-lg mb-2">{item.title}</h3>
                    <p className="text-slate-600 text-sm whitespace-pre-wrap line-clamp-3 leading-relaxed">{item.content}</p>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* 新增/編輯 Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center">
                {editingItem ? <Edit3 className="mr-2" size={20}/> : <Plus className="mr-2" size={20}/>}
                {editingItem ? '編輯' : '新增'} 
                {activeTab === 'error' ? '故障代碼' : activeTab === 'sp' ? 'SP指令' : '筆記'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white rounded-full text-slate-500 shadow-sm hover:bg-slate-100"><X size={20}/></button>
            </div>
            
            <div className="p-5 space-y-4 overflow-y-auto bg-white">
              {/* --- 代碼表單 --- */}
              {activeTab === 'error' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-500">代碼 (必填)</label>
                       <input className="input-style font-mono text-xl" value={formData.code || ''} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="SC542"/>
                    </div>
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-500">機型</label>
                       <input className="input-style" value={formData.model || ''} onChange={e => setFormData({...formData, model: e.target.value})} placeholder="MPC3503"/>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">故障描述 (必填)</label>
                    <input className="input-style" value={formData.desc || ''} onChange={e => setFormData({...formData, desc: e.target.value})} placeholder="定影溫度異常"/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">對策</label>
                    <textarea rows={5} className="input-style resize-none" value={formData.solution || ''} onChange={e => setFormData({...formData, solution: e.target.value})} placeholder="輸入維修步驟..."/>
                  </div>
                </>
              )}

              {/* --- SP表單 --- */}
              {activeTab === 'sp' && (
                <>
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-slate-500">SP 指令 (必填)</label>
                     <input className="input-style font-mono text-xl" value={formData.cmd || ''} onChange={e => setFormData({...formData, cmd: e.target.value})} placeholder="5-810"/>
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-slate-500">功能名稱</label>
                     <input className="input-style" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="SC Reset (解除紅燈)"/>
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-slate-500">操作說明 / 備註</label>
                     <textarea rows={5} className="input-style resize-none" value={formData.desc || ''} onChange={e => setFormData({...formData, desc: e.target.value})} placeholder="進入後按下 Execute 關機重開..."/>
                  </div>
                </>
              )}

              {/* --- 筆記表單 --- */}
              {activeTab === 'note' && (
                <>
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-slate-500">標題 (必填)</label>
                     <input className="input-style text-lg" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="例: 掃描SMB設定教學"/>
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-slate-500">筆記內容</label>
                     <textarea rows={10} className="input-style resize-none" value={formData.content || ''} onChange={e => setFormData({...formData, content: e.target.value})} placeholder="輸入內容..."/>
                  </div>
                </>
              )}

              {editingItem && (
                <button onClick={handleDeleteItem} className="w-full py-3 text-red-500 font-bold bg-red-50 rounded-xl hover:bg-red-100 flex items-center justify-center gap-2 mt-4">
                  <Trash2 size={18} /> 刪除此項目
                </button>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-200 text-slate-600 rounded-xl font-bold">取消</button>
              <button onClick={handleSubmit} className="flex-1 py-3 bg-violet-600 text-white rounded-xl font-bold shadow-lg shadow-violet-200 active:scale-[0.98] transition-all">
                <Save size={20} className="inline mr-2" /> 儲存
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .input-style {
          width: 100%;
          background-color: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 0.75rem;
          font-weight: 700;
          color: #334155;
          outline: none;
          transition: all 0.2s;
        }
        .input-style:focus {
          border-color: #8b5cf6;
          background-color: #fff;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }
        .input-style::placeholder {
          color: #cbd5e1;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default ErrorCodeLibrary;