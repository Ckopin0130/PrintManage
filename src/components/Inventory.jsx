import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Plus, Search, Box, Layers, Edit3, ChevronUp, ChevronDown, 
  RotateCcw, CheckCircle, AlertCircle, Trash2
} from 'lucide-react';

// 內部的編輯彈窗 (只在這個檔案裡用)
const EditInventoryModal = ({ isOpen, onClose, onSave, onDelete, initialItem, existingModels, defaultModel }) => {
  const [formData, setFormData] = useState({ name: '', model: '', qty: 0, max: 5, unit: '個' });
  const [useCustomModel, setUseCustomModel] = useState(false);
  useEffect(() => {
    if (isOpen) {
      if (initialItem) {
        setFormData(initialItem);
        setUseCustomModel(false);
      } else {
        const targetModel = defaultModel || existingModels[0] || '共用耗材';
        setFormData({ name: '', model: targetModel, qty: 1, max: 5, unit: '個' });
        if (defaultModel && !existingModels.includes(defaultModel)) setUseCustomModel(true);
        else setUseCustomModel(false);
      }
    }
  }, [isOpen, initialItem, existingModels, defaultModel]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 animate-in" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
           <h3 className="text-lg font-bold text-gray-800">{initialItem ? '編輯零件詳情' : '新增庫存零件'}</h3>
           {initialItem && <button onClick={() => { if(window.confirm(`確定要刪除「${formData.name}」嗎？`)) onDelete(formData.id); }} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"><Trash2 size={18}/></button>}
        </div>
        <div className="space-y-4 mb-6">
           <div>
             <label className="text-xs font-bold text-gray-500 block mb-1">機型分類</label>
             {!useCustomModel ? (
               <div className="flex gap-2">
                 <select className="w-full bg-gray-50 border rounded-lg p-2.5 outline-none text-gray-700 font-bold" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})}>
                   {existingModels.map(m => <option key={m} value={m}>{m}</option>)}
                 </select>
                 <button onClick={() => {setUseCustomModel(true);}} className="bg-blue-50 text-blue-600 px-3 rounded-lg text-xs font-bold whitespace-nowrap">自訂</button>
               </div>
             ) : (
                <div className="flex gap-2">
                  <input autoFocus placeholder="輸入新機型 (例: IM 6000)" className="w-full bg-gray-50 border rounded-lg p-2.5 outline-none" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
                  <button onClick={() => setUseCustomModel(false)} className="bg-gray-100 text-gray-500 px-3 rounded-lg text-xs font-bold whitespace-nowrap">取消</button>
                </div>
             )}
           </div>
           <div><label className="text-xs font-bold text-gray-500 block mb-1">零件名稱</label><input placeholder="例: 定影上爪" className="w-full bg-gray-50 border rounded-lg p-2.5 outline-none text-base text-gray-800 font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
           <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs font-bold text-gray-500 block mb-1">目前庫存</label><div className="flex items-center bg-gray-50 border rounded-lg overflow-hidden"><input type="number" className="w-full p-2.5 outline-none text-center font-mono font-bold text-lg bg-transparent" value={formData.qty} onChange={e => setFormData({...formData, qty: Number(e.target.value)})} /></div></div>
              <div><label className="text-xs font-bold text-gray-500 block mb-1">應備量</label><input type="number" className="w-full bg-gray-50 border rounded-lg p-2.5 outline-none text-center font-mono" value={formData.max} onChange={e => setFormData({...formData, max: Number(e.target.value)})} /></div>
              <div><label className="text-xs font-bold text-gray-500 block mb-1">單位</label><input placeholder="個" className="w-full bg-gray-50 border rounded-lg p-2.5 outline-none text-center" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} /></div>
           </div>
        </div>
        <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3.5 bg-gray-100 font-bold text-gray-600 rounded-xl hover:bg-gray-200 transition-colors">取消</button>
            <button onClick={() => { if(formData.name && formData.model) onSave(formData); }} className="flex-1 py-3.5 bg-blue-600 font-bold text-white rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors active:scale-95">儲存</button>
        </div>
      </div>
    </div>
  );
};

// 外部用來顯示重命名群組的 Modal
export const RenameGroupModal = ({ isOpen, onClose, onRename, oldName }) => {
  const [newName, setNewName] = useState(oldName || '');
  useEffect(() => { setNewName(oldName || ''); }, [oldName]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 animate-in" onClick={onClose}>
      <div className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-800 mb-2">修改分類名稱</h3>
        <div className="text-xs text-gray-400 mb-4">將同步修改此分類下所有零件的機型名稱</div>
        <input autoFocus className="w-full bg-gray-50 border rounded-lg p-3 outline-none mb-4 font-bold text-gray-700 focus:ring-2 focus:ring-blue-100" value={newName} onChange={e => setNewName(e.target.value)} />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 bg-gray-100 font-bold text-gray-600 rounded-xl">取消</button>
          <button onClick={() => { onRename(oldName, newName); onClose(); }} className="flex-1 py-3 bg-blue-600 font-bold text-white rounded-xl shadow-lg">儲存</button>
        </div>
      </div>
    </div>
  );
};

// 主要庫存頁面元件
const InventoryView = ({ inventory, onUpdateInventory, onAddInventory, onDeleteInventory, onRenameGroup, onBack }) => {
  const [editingItem, setEditingItem] = useState(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [groupToRename, setGroupToRename] = useState(null);
  const [addingToGroupModel, setAddingToGroupModel] = useState(null);

  const groupedInventory = useMemo(() => {
    const groups = {};
    const filtered = inventory.filter(i => 
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      i.model.toLowerCase().includes(searchTerm.toLowerCase())
    );
    filtered.forEach(item => {
      const model = item.model || '未分類';
      if (!groups[model]) groups[model] = [];
      groups[model].push(item);
    });
    return groups;
  }, [inventory, searchTerm]);

  useEffect(() => {
    if (searchTerm) {
      const allKeys = Object.keys(groupedInventory).reduce((acc, key) => ({...acc, [key]: true}), {});
      setExpandedCategories(allKeys);
    }
  }, [searchTerm, groupedInventory]);

  const toggleCategory = (model) => setExpandedCategories(prev => ({...prev, [model]: !prev[model]}));
  const handleRestock = (id, max) => {
    const item = inventory.find(i => i.id === id);
    if(item) onUpdateInventory({...item, qty: max});
  };
  const handleModalSave = (itemData) => {
    if (isAddMode) {
      onAddInventory(itemData);
      setIsAddMode(false);
      setAddingToGroupModel(null);
    } else {
      onUpdateInventory(itemData);
      setEditingItem(null);
    }
  };
  const existingModels = useMemo(() => [...new Set(inventory.map(i => i.model || '共用耗材'))], [inventory]);

  return (
    <div className="bg-gray-50 min-h-screen pb-24 flex flex-col">
       <div className="bg-white px-4 py-3 shadow-sm sticky top-0 z-10 border-b border-gray-100">
         <div className="flex justify-between items-center mb-3">
            <div className="flex items-center">
              <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full mr-2"><ArrowLeft size={20}/></button>
              <h2 className="text-lg font-bold">庫存管理</h2>
            </div>
            <button onClick={() => setIsAddMode(true)} className="flex items-center text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded-full shadow hover:bg-blue-700 transition"><Plus size={14} className="mr-1"/>新增品項</button>
         </div>
         <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input className="w-full bg-gray-100 rounded-lg py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-100 transition placeholder-gray-400" placeholder="搜尋機型或零件..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
         </div>
      </div>
      <div className="p-4 space-y-4">
          {Object.keys(groupedInventory).length === 0 ? (
            <div className="text-center text-gray-400 mt-20 flex flex-col items-center"><Box size={48} className="mb-4 text-gray-200" /><p>找不到相關零件</p></div>
          ) : (
            Object.keys(groupedInventory).sort().map(model => {
              const isExpanded = expandedCategories[model];
              const items = groupedInventory[model];
              const lowStockCount = items.filter(i => i.qty === 0).length;
              return (
              <div key={model} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden slide-in-from-bottom">
                <div className="px-4 py-3 bg-gray-50/80 flex justify-between items-center cursor-pointer select-none active:bg-gray-100 transition-colors" onClick={() => toggleCategory(model)}>
                  <div className="flex items-center flex-1">
                    <Layers size={16} className="text-blue-500 mr-2"/>
                    <h3 className="text-sm font-bold text-gray-700 mr-2">{model}</h3>
                    <button onClick={(e) => { e.stopPropagation(); setGroupToRename(model); }} className="p-1.5 bg-white border border-gray-200 text-gray-400 hover:text-blue-600 rounded-lg shadow-sm mr-2 active:scale-90 transition-transform"><Edit3 size={12}/></button>
                    <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-bold">{items.length}</span>
                    {lowStockCount > 0 && <span className="ml-2 bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center"><AlertCircle size={10} className="mr-1"/>{lowStockCount} 缺貨</span>}
                  </div>
                  <div className="flex items-center">
                    <button onClick={(e) => { e.stopPropagation(); setAddingToGroupModel(model); setIsAddMode(true); }} className="mr-3 w-7 h-7 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 active:scale-90 transition-transform"><Plus size={14} /></button>
                    {isExpanded ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
                  </div>
                </div>
                {isExpanded && (
                  <div className="divide-y divide-gray-50">
                     {items.map((item) => {
                      const isLowStock = item.qty === 0;
                      const isWarning = item.qty > 0 && item.qty <= (item.max * 0.3);
                      return (
                        <div key={item.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setEditingItem(item)}>
                            <div className="flex-1 mr-4">
                                <div className="flex items-center mb-1">
                                  <div className="font-bold text-gray-800 text-sm">{item.name}</div>
                                  {isLowStock && <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] rounded font-bold">缺貨</span>}
                                </div>
                                <div className="text-[10px] text-gray-400 font-mono">應備: {item.max} {item.unit}</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={`text-xl font-bold font-mono ${isLowStock ? 'text-red-600' : (isWarning ? 'text-amber-600' : 'text-blue-600')}`}>{item.qty}</div>
                                {item.qty < item.max ? (
                                  <button onClick={(e) => { e.stopPropagation(); handleRestock(item.id, item.max); }} className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors active:scale-90" title="一鍵補滿"><RotateCcw size={14} /></button>
                                ) : ( <div className="w-8 h-8 flex items-center justify-center text-gray-300"><CheckCircle size={16}/></div> )}
                            </div>
                        </div>
                      );})}
                  </div>
                )}
              </div>
            )})
          )}
      </div>
      <EditInventoryModal isOpen={!!editingItem || isAddMode} onClose={() => { setEditingItem(null); setIsAddMode(false); setAddingToGroupModel(null); }} onSave={handleModalSave} onDelete={(id) => { onDeleteInventory(id); setEditingItem(null); }} initialItem={editingItem} existingModels={existingModels} defaultModel={addingToGroupModel} />
      <RenameGroupModal isOpen={!!groupToRename} oldName={groupToRename} onClose={() => setGroupToRename(null)} onRename={onRenameGroup} />
    </div>
  );
};

export default InventoryView;