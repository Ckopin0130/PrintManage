import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Plus, Search, Layers, Edit3, ChevronUp, ChevronDown, 
  RotateCcw, CheckCircle, Trash2, Package, AlertCircle
} from 'lucide-react';

// --- 1. 編輯與新增視窗 (維持功能，樣式微調) ---
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
        setUseCustomModel(defaultModel && !existingModels.includes(defaultModel));
      }
    }
  }, [isOpen, initialItem, existingModels, defaultModel]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl scale-100 transition-transform" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
           <h3 className="text-xl font-extrabold text-slate-800">{initialItem ? '編輯零件' : '新增零件'}</h3>
           {initialItem && <button onClick={() => { if(window.confirm(`確定要刪除「${formData.name}」嗎？`)) onDelete(formData.id); }} className="p-3 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-100 transition-colors"><Trash2 size={20}/></button>}
        </div>
        <div className="space-y-6 mb-8">
           <div>
             <label className="text-xs font-bold text-slate-400 block mb-2 uppercase tracking-wider">分類歸屬</label>
             {!useCustomModel ? (
               <div className="flex gap-2">
                 <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none text-slate-700 font-bold text-lg appearance-none" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})}>
                   {existingModels.map(m => <option key={m} value={m}>{m}</option>)}
                 </select>
                 <button onClick={() => {setUseCustomModel(true);}} className="bg-blue-50 text-blue-600 px-4 rounded-2xl text-sm font-bold whitespace-nowrap">自訂</button>
               </div>
             ) : (
                <div className="flex gap-2">
                  <input autoFocus placeholder="輸入新分類名稱" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none font-bold text-lg" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
                  <button onClick={() => setUseCustomModel(false)} className="bg-slate-100 text-slate-500 px-4 rounded-2xl text-sm font-bold whitespace-nowrap">取消</button>
                </div>
             )}
           </div>
           <div>
               <label className="text-xs font-bold text-slate-400 block mb-2 uppercase tracking-wider">零件名稱</label>
               <input placeholder="例: 定影上爪" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none text-xl text-slate-800 font-black placeholder:font-normal" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
           </div>
           <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                  <label className="text-xs font-bold text-slate-400 block mb-2 uppercase tracking-wider">目前數量</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none text-center font-mono font-black text-2xl text-blue-600" value={formData.qty} onChange={e => setFormData({...formData, qty: Number(e.target.value)})} />
              </div>
              <div className="col-span-1">
                  <label className="text-xs font-bold text-slate-400 block mb-2 uppercase tracking-wider">應備量</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none text-center font-mono font-bold text-xl" value={formData.max} onChange={e => setFormData({...formData, max: Number(e.target.value)})} />
              </div>
              <div className="col-span-1">
                  <label className="text-xs font-bold text-slate-400 block mb-2 uppercase tracking-wider">單位</label>
                  <input placeholder="個" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none text-center font-bold text-xl" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
              </div>
           </div>
        </div>
        <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-4 bg-slate-100 font-bold text-slate-500 rounded-2xl hover:bg-slate-200 transition-colors">取消</button>
            <button onClick={() => { if(formData.name && formData.model) onSave(formData); }} className="flex-1 py-4 bg-blue-600 font-bold text-white rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors active:scale-95">儲存</button>
        </div>
      </div>
    </div>
  );
};

// --- 2. 分類重新命名視窗 ---
const RenameGroupModal = ({ isOpen, onClose, onRename, oldName }) => {
  const [newName, setNewName] = useState(oldName || '');
  useEffect(() => { setNewName(oldName || ''); }, [oldName]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
      <div className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-800 mb-4">修改分類名稱</h3>
        <input autoFocus className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none mb-6 font-bold text-lg text-slate-700" value={newName} onChange={e => setNewName(e.target.value)} />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 bg-slate-100 font-bold text-slate-500 rounded-2xl">取消</button>
          <button onClick={() => { onRename(oldName, newName); onClose(); }} className="flex-1 py-3 bg-blue-600 font-bold text-white rounded-2xl shadow-lg">儲存</button>
        </div>
      </div>
    </div>
  );
};

// --- 3. 全新設計：大字體數據行 (Scheme A) ---
const InventoryRow = ({ item, onEdit, onRestock }) => {
    const isOut = item.qty === 0;
    
    // 樣式設定
    const containerClass = isOut 
        ? "bg-rose-50/80 border-rose-200 shadow-sm" // 缺貨：淡紅底
        : "bg-white border-slate-100 hover:border-blue-200 hover:shadow-md"; // 正常：白底

    const nameClass = isOut ? "text-rose-900" : "text-slate-800";
    const numClass = isOut ? "text-rose-600" : "text-blue-600";

    return (
        <div 
            onClick={() => onEdit(item)} 
            className={`flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98] cursor-pointer group mb-3 last:mb-0 ${containerClass}`}
        >
            {/* 左側：品名與單位 */}
            <div className="flex-1 min-w-0 pr-4">
                <div className={`text-lg font-extrabold truncate leading-tight mb-1 ${nameClass}`}>
                    {item.name}
                    {isOut && <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-200 text-rose-700 uppercase tracking-wide">缺貨</span>}
                </div>
                <div className="text-xs font-bold text-slate-400">
                    單位: {item.unit}
                </div>
            </div>

            {/* 右側：巨大數字與按鈕 */}
            <div className="flex items-center gap-4 shrink-0">
                {/* 數字顯示區： 目前 / 應備 */}
                <div className="text-right flex flex-col items-end">
                    <div className={`text-3xl font-black font-mono leading-none tracking-tight ${numClass}`}>
                        {item.qty}
                        <span className="text-base text-slate-300 font-bold ml-1">/{item.max}</span>
                    </div>
                </div>

                {/* 操作按鈕 */}
                <div onClick={e => e.stopPropagation()}>
                    {item.qty < item.max ? (
                        <button 
                            onClick={() => onRestock(item.id, item.max)} 
                            className="w-11 h-11 flex items-center justify-center rounded-xl bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-all active:scale-90 shadow-sm"
                            title="一鍵補滿"
                        >
                            <RotateCcw size={22} strokeWidth={2.5} />
                        </button>
                    ) : (
                        <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 border border-emerald-100">
                            <CheckCircle size={22} strokeWidth={2.5} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- 4. 主頁面 ---
const InventoryView = ({ inventory, onUpdateInventory, onAddInventory, onDeleteInventory, onRenameGroup, onBack }) => {
  const [editingItem, setEditingItem] = useState(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [groupToRename, setGroupToRename] = useState(null);
  const [addingToGroupModel, setAddingToGroupModel] = useState(null);

  // 分組邏輯
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

  // 搜尋時自動展開
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
    <div className="bg-slate-50 min-h-screen pb-24 flex flex-col font-sans">
       {/* 頂部導覽 */}
       <div className="bg-white/95 backdrop-blur px-4 py-3 shadow-sm sticky top-0 z-30 border-b border-slate-100/50">
         <div className="flex justify-between items-center mb-3">
            <div className="flex items-center">
              <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-full mr-1 transition-colors"><ArrowLeft size={24}/></button>
              <h2 className="text-xl font-extrabold text-slate-800 tracking-wide">庫存管理</h2>
            </div>
            <button onClick={() => setIsAddMode(true)} className="flex items-center text-sm font-bold bg-blue-600 text-white px-4 py-2.5 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"><Plus size={18} className="mr-1"/>新增品項</button>
         </div>
         <div className="relative">
            <Search size={20} className="absolute left-3 top-2.5 text-slate-400" />
            <input 
                className="w-full bg-slate-100 border-none rounded-2xl py-2.5 pl-10 pr-4 text-base outline-none focus:ring-2 focus:ring-blue-100 transition placeholder-slate-400 font-bold text-slate-700" 
                placeholder="搜尋機型或零件..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
            />
         </div>
      </div>

      {/* 列表內容 */}
      <div className="p-4 space-y-4">
          {Object.keys(groupedInventory).length === 0 ? (
            <div className="text-center text-slate-300 mt-20 flex flex-col items-center">
                <Package size={64} className="mb-4 opacity-30" strokeWidth={1} />
                <p className="font-bold text-base text-slate-400">找不到相關零件</p>
                {searchTerm && <button onClick={() => setSearchTerm('')} className="mt-2 text-blue-500 underline font-bold">清除搜尋</button>}
            </div>
          ) : (
            Object.keys(groupedInventory).sort().map(model => {
              const isExpanded = expandedCategories[model];
              const items = groupedInventory[model];
              const lowStockCount = items.filter(i => i.qty === 0).length;
              
              return (
              <div key={model} className="bg-white rounded-3xl shadow-[0_2px_15px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden">
                {/* 分類標題列 */}
                <div className="px-5 py-4 bg-white flex justify-between items-center cursor-pointer select-none active:bg-slate-50 transition-colors" onClick={() => toggleCategory(model)}>
                  <div className="flex items-center flex-1 overflow-hidden">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl mr-3 shrink-0"><Layers size={20}/></div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-extrabold text-slate-800 truncate">{model}</h3>
                            <button onClick={(e) => { e.stopPropagation(); setGroupToRename(model); }} className="p-1.5 text-slate-300 hover:text-blue-500 rounded-lg hover:bg-blue-50 transition-colors"><Edit3 size={16}/></button>
                        </div>
                        {lowStockCount > 0 && <div className="text-rose-500 text-xs font-bold flex items-center mt-1"><AlertCircle size={12} className="mr-1"/>{lowStockCount} 個品項缺貨中</div>}
                    </div>
                  </div>
                  <div className="flex items-center ml-2">
                    <button onClick={(e) => { e.stopPropagation(); setAddingToGroupModel(model); setIsAddMode(true); }} className="mr-3 w-9 h-9 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full hover:bg-blue-100 hover:text-blue-600 active:scale-90 transition-all"><Plus size={18} strokeWidth={3}/></button>
                    {isExpanded ? <ChevronUp size={24} className="text-slate-400"/> : <ChevronDown size={24} className="text-slate-400"/>}
                  </div>
                </div>

                {/* 展開後的列表 */}
                {isExpanded && (
                  <div className="px-4 pb-4 bg-slate-50/50 border-t border-slate-100 pt-4">
                     {items.map((item) => (
                        <InventoryRow 
                            key={item.id} 
                            item={item} 
                            onEdit={setEditingItem} 
                            onRestock={handleRestock} 
                        />
                     ))}
                  </div>
                )}
              </div>
            )})
          )}
      </div>

      {/* 彈出視窗 */}
      <EditInventoryModal 
        isOpen={!!editingItem || isAddMode} 
        onClose={() => { setEditingItem(null); setIsAddMode(false); setAddingToGroupModel(null); }} 
        onSave={handleModalSave} 
        onDelete={(id) => { onDeleteInventory(id); setEditingItem(null); }} 
        initialItem={editingItem} 
        existingModels={existingModels} 
        defaultModel={addingToGroupModel} 
      />
      <RenameGroupModal 
        isOpen={!!groupToRename} 
        oldName={groupToRename} 
        onClose={() => setGroupToRename(null)} 
        onRename={onRenameGroup} 
      />
    </div>
  );
};

export default InventoryView;