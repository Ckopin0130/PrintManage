import React, { useState, useMemo } from 'react';
import { Plus, Edit3, X } from 'lucide-react';

const tabs = [
  { key: 'error', name: '故障代碼', color: 'red', fields: [
    { label: '代碼', prop: 'code' },
    { label: '機型', prop: 'model' },
    { label: '描述', prop: 'desc' },
    { label: '對策', prop: 'solution' },
  ] },
  { key: 'sp', name: 'SP 模式', color: 'yellow', fields: [
    { label: '指令', prop: 'cmd' },
    { label: '功能名稱', prop: 'title' },
    { label: '說明', prop: 'desc' },
  ] },
  { key: 'note', name: '技術筆記', color: 'green', fields: [
    { label: '標題', prop: 'title' },
    { label: '內容', prop: 'content' },
  ] },
];

export default function ErrorCodeLibrary({ errorCodes = [], spModes = [], techNotes = [], onSave, onDelete }) {
  const [tab, setTab] = useState('error');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const currentTab = useMemo(() => tabs.find(t => t.key === tab), [tab]);
  const color = currentTab.color;
  // 取得分頁資料
  let data = [];
  if(tab==='error') data=errorCodes;
  if(tab==='sp') data=spModes;
  if(tab==='note') data=techNotes;
  // 搜尋
  const filtered = data.filter(item =>
    currentTab.fields.some(f => String(item[f.prop] || '').toLowerCase().includes(search.toLowerCase()))
  );

  // 對應欄位的初始表單
  const getEmpty = () => Object.fromEntries(currentTab.fields.map(f => [f.prop, '']));

  const [form, setForm] = useState(getEmpty());
  React.useEffect(()=>{
    if (modalOpen) setForm(editItem ? { ...editItem } : getEmpty());
  // eslint-disable-next-line
  }, [modalOpen, editItem, tab]);

  // 儲存
  const handleSave = () => {
    if(onSave) onSave(tab, form, editItem?.id);
    setModalOpen(false); setEditItem(null);
  };
  const handleDelete = () => {
    if (onDelete && editItem) onDelete(tab, editItem.id);
    setModalOpen(false); setEditItem(null);
  };

  return (
    <div className="bg-slate-50 min-h-screen p-4">
      {/* 頂部 nav */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-2xl font-bold">維修知識庫</div>
        <button
          className={`flex items-center px-4 py-2 bg-${color}-100 text-${color}-700 rounded hover:bg-${color}-200`}
          onClick={() => { setEditItem(null); setModalOpen(true); }}
        >
          <Plus className="mr-1" size={18} />
          新增
        </button>
      </div>
      {/* 分頁 Tab */}
      <div className="flex mb-3">
        {tabs.map(t => (
          <button key={t.key}
            className={`py-2 px-4 mr-2 rounded-t-lg font-semibold ${tab===t.key?`bg-${t.color}-100 text-${t.color}-700`:'bg-slate-100 text-slate-500'}`}
            onClick={() => setTab(t.key)}
          >{t.name}</button>
        ))}
      </div>
      {/* 搜尋列 */}
      <input
        className="mb-4 w-full px-3 py-2 border rounded"
        placeholder="搜尋關鍵字..."
        value={search}
        onChange={e=>setSearch(e.target.value)}
      />
      {/* 內容列表 */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-slate-400 text-center py-12">查無資料</div>
        ) : filtered.map(item => (
          <div key={item.id}
            className={`bg-white rounded-lg shadow p-4 border-l-4 border-${color}-500 flex justify-between cursor-pointer`}
            onClick={() => { setEditItem(item); setModalOpen(true); }}
          >
            <div>
              {currentTab.fields.map(f =>
                <div key={f.prop}><b>{f.label}：</b>{item[f.prop]}</div>
              )}
            </div>
            <Edit3 size={20} className="text-slate-400" />
          </div>
        ))}
      </div>
      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg border">
            <div className="flex justify-between items-center mb-3">
              <div className="font-bold text-lg">{editItem ? '編輯' : '新增'}{currentTab.name}</div>
              <button onClick={()=>{setModalOpen(false);setEditItem(null);}} className="text-slate-400 hover:text-red-500"><X size={20}/></button>
            </div>
            <div className="space-y-3 mb-3">
              {currentTab.fields.map(f => (
                <div key={f.prop}>
                  <label className="font-semibold text-sm mb-1 inline-block">{f.label}</label>
                  <input
                    className="w-full px-3 py-2 border rounded text-base"
                    value={form[f.prop]||''}
                    onChange={e => setForm({ ...form, [f.prop]: e.target.value })}
                    autoFocus={f.prop==='code' || f.prop==='cmd' || f.prop==='title'}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between gap-2">
              {editItem && <button className="px-4 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200" onClick={handleDelete}>刪除</button>}
              <div className="flex-1 text-right">
                <button className="px-4 py-2 bg-slate-200 rounded hover:bg-slate-300 mr-2" onClick={()=>setModalOpen(false)}>取消</button>
                <button className={`px-4 py-2 bg-${color}-600 text-white rounded hover:bg-${color}-700`} onClick={handleSave}>儲存</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

