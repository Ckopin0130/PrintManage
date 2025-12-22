import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Plus, Search, ChevronRight, ChevronDown, Edit3, 
  RotateCcw, CheckCircle, Trash2, AlertTriangle, Box, Tag, 
  Printer, Palette, Archive, MoreHorizontal, Droplets,
  GripVertical, FileText, Copy, RefreshCw, X, Settings, FolderPlus
} from 'lucide-react';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  TouchSensor
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- 0. 全域設定與圖示 ---

const ICON_MAP = {
  Droplets, Palette, Printer, Archive, MoreHorizontal, Box, Tag, Settings, FolderPlus
};

// 預設分類
const DEFAULT_CATEGORIES = [
  { id: 'cat_toner', name: '碳粉系列', icon: 'Droplets', color: 'text-sky-600', bg: 'bg-sky-100', border: 'border-sky-200' },
  { id: 'cat_color', name: '彩色影印機', icon: 'Palette', color: 'text-purple-600', bg: 'bg-purple-100', border: 'border-purple-200' },
  { id: 'cat_bw', name: '黑白影印機', icon: 'Printer', color: 'text-zinc-600', bg: 'bg-zinc-100', border: 'border-zinc-200' },
  { id: 'cat_common', name: '共用耗材', icon: 'Archive', color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-200' },
  { id: 'cat_other', name: '其他周邊', icon: 'MoreHorizontal', color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' }
];

// 資料遷移
const migrateCategory = (modelName, item) => {
    if (item.categoryId) return item.categoryId;
    const up = (modelName || '').toUpperCase();
    if (item.categoryType === 'TONER' || up.includes('碳粉') || up.includes('TONER') || up.includes('INK')) return 'cat_toner';
    if (item.categoryType === 'COLOR' || up.includes(' C') || up.includes('MPC') || up.includes('IMC') || up.includes('彩色')) return 'cat_color';
    if (item.categoryType === 'BW' || up.includes('MP') || up.includes('IM') || up.includes('AFICIO') || up.includes('黑白')) return 'cat_bw';
    if (item.categoryType === 'COMMON' || up.includes('耗材') || up.includes('共用') || up.includes('COMMON')) return 'cat_common';
    return 'cat_other';
};

// 文字清理
const cleanItemName = (modelName, itemName) => {
    if (!modelName || !itemName) return itemName;
    let display = itemName;
    const modelClean = modelName.trim();
    const escapedModel = modelClean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    display = display.replace(new RegExp(`\\(${escapedModel}\\)`, 'gi'), '');
    display = display.replace(new RegExp(`${escapedModel}`, 'gi'), '');
    const tokens = modelClean.split(/[\s\-_/]+/).filter(t => t.length > 1); 
    tokens.sort((a, b) => b.length - a.length); 
    tokens.forEach(token => {
        try { display = display.replace(new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ''); } catch (e) {}
    });
    display = display.replace(/\(\s*\)/g, '');
    display = display.replace(/^[\s\-_]+|[\s\-_]+$/g, '').trim();
    return display || itemName; 
};

// --- 1. 報表視窗 ---
const ReportModal = ({ isOpen, onClose, inventory, categories, modelOrder, itemOrder }) => {
  const [copied, setCopied] = useState(false);
  const [onlyMissing, setOnlyMissing] = useState(false);

  const reportText = useMemo(() => {
    if (!inventory || inventory.length === 0) return '無庫存資料';

    const strItemOrder = itemOrder ? itemOrder.map(String) : [];
    const groupedData = {}; 

    inventory.forEach(item => {
        const catId = item.categoryId || migrateCategory(item.model, item);
        const model = item.model || '未分類';
        
        if (!groupedData[catId]) groupedData[catId] = {};
        if (!groupedData[catId][model]) groupedData[catId][model] = [];
        groupedData[catId][model].push(item);
    });

    let text = `【庫存盤點報表】${new Date().toLocaleDateString()}\n`;
    if(onlyMissing) text += `(僅顯示需補貨)\n`;
    text += `----------------`; 
    
    let hasContent = false;

    categories.forEach(cat => {
        const modelsObj = groupedData[cat.id];
        if (!modelsObj) return;
        const modelsInThisCat = Object.keys(modelsObj);
        if (modelsInThisCat.length === 0) return;

        modelsInThisCat.sort((a, b) => {
            if (modelOrder) {
               const idxA = modelOrder.indexOf(a);
               const idxB = modelOrder.indexOf(b);
               if (idxA !== -1 && idxB !== -1) return idxA - idxB;
               if (idxA !== -1) return -1;
               if (idxB !== -1) return 1;
            }
            return a.localeCompare(b);
        });

        let categoryContent = '';
        let hasModelsInThisCat = false;

        modelsInThisCat.forEach((model, modelIndex) => {
            const items = modelsObj[model];
            items.sort((a, b) => {
                 const idxA = strItemOrder.indexOf(String(a.id));
                 const idxB = strItemOrder.indexOf(String(b.id));
                 if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                 if (idxA !== -1) return -1;
                 if (idxB !== -1) return 1;
                 return a.name.localeCompare(b.name);
            });

            let linesForThisModel = [];
            items.forEach(item => {
                const isFull = item.qty >= item.max;
                if (onlyMissing && isFull) return;

                const icon = isFull ? '🔹' : '🔸';
                let displayName = cleanItemName(model, item.name);
                linesForThisModel.push(`${icon}${displayName}: ${item.qty}/${item.max} ${item.unit}`);
            });

            if (linesForThisModel.length > 0) {
                hasModelsInThisCat = true;
                const prefix = modelIndex === 0 ? '\n' : '\n\n'; 
                categoryContent += `${prefix}◆ ${model}`; 
                linesForThisModel.forEach(line => categoryContent += `\n${line}`);
            }
        });

        if (hasModelsInThisCat) {
            hasContent = true;
            text += `\n\n📦 ${cat.name}`;
            text += categoryContent;
        }
    });

    if (!hasContent) text += `\n\n目前沒有${onlyMissing ? '需補貨' : ''}項目。`;
    text += `\n\n----------------\n系統自動生成`;
    return text;
  }, [inventory, categories, modelOrder, itemOrder, onlyMissing]);

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[90] flex items-start justify-center pt-10 px-4 animate-in fade-in" onClick={onClose}>
        <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2 border-b pb-3">
                <h3 className="text-lg font-bold text-slate-800 flex items-center"><FileText className="mr-2 text-blue-600"/> 庫存報表</h3>
                <button onClick={onClose} className="p-1.5 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"><X size={20} /></button> 
            </div>
            <div className="flex items-center gap-2 mb-3 bg-slate-50 p-2 rounded-lg border border-slate-200">
                <input type="checkbox" id="onlyMissing" checked={onlyMissing} onChange={e => setOnlyMissing(e.target.checked)} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                <label htmlFor="onlyMissing" className="text-sm font-bold text-slate-700 cursor-pointer select-none">只顯示需補貨</label>
            </div>
            <div className="flex-1 overflow-y-auto bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4 font-mono text-sm leading-relaxed whitespace-pre-wrap text-slate-700 shadow-inner">
                {reportText}
            </div>
            <button onClick={handleCopy} className={`w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center transition-all ${copied ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {copied ? <CheckCircle className="mr-2" size={20}/> : <Copy className="mr-2" size={20}/>}
                {copied ? '已複製' : '複製文字 (傳送給 LINE)'}
            </button>
        </div>
    </div>
  );
};

// --- 2. 新增與編輯視窗 ---
const EditInventoryModal = ({ isOpen, onClose, onSave, onDelete, initialItem, categories, defaultCategoryId, defaultModel }) => {
  const [formData, setFormData] = useState({ name: '', model: '', subGroup: '', qty: 0, max: 5, unit: '個', categoryId: '' });
  
  useEffect(() => {
    if (isOpen) {
      if (initialItem) {
        setFormData({ 
            ...initialItem, 
            subGroup: initialItem.subGroup || '', 
            categoryId: initialItem.categoryId || migrateCategory(initialItem.model, initialItem) 
        });
      } else {
        const targetCatId = defaultCategoryId || categories[0]?.id || 'cat_other';
        setFormData({ 
            name: '', model: defaultModel || '', subGroup: '', 
            qty: 1, max: 5, unit: '個', categoryId: targetCatId 
        });
      }
    }
  }, [isOpen, initialItem, categories, defaultCategoryId, defaultModel]);

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/60 z-[80] flex items-start justify-center pt-12 px-4 animate-in fade-in duration-200 overflow-y-auto" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl relative mb-10" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-4">
           <h3 className="text-xl font-bold text-slate-800">{initialItem ? '編輯項目' : '新增項目'}</h3>
           {initialItem && <button onClick={() => { if(window.confirm(`確定要刪除「${formData.name}」嗎？`)) onDelete(formData.id); }} className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors"><Trash2 size={20}/></button>}
        </div>
        
        <div className="space-y-4 mb-6">
           <div>
              <label className="text-sm font-bold text-slate-500 block mb-2">所屬分類</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-slate-800 font-bold text-base"
                value={formData.categoryId}
                onChange={e => setFormData({...formData, categoryId: e.target.value})}
              >
                  {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
           </div>
           <div>
             <label className="text-sm font-bold text-slate-500 block mb-2">歸屬型號 (資料夾名稱)</label>
             <input placeholder="例如: MP 3352" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none font-bold text-base" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
             <p className="text-xs text-slate-400 mt-1">相同型號的零件會自動歸類在同一個資料夾中。</p>
           </div>
           <div>
               <label className="text-sm font-bold text-slate-500 block mb-2">品名</label>
               <input placeholder="例: 黃色碳粉" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-base text-slate-800 font-bold placeholder:font-normal" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
           </div>
           <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                  <label className="text-xs font-bold text-slate-400 block mb-1.5 text-center">數量</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-center font-mono font-bold text-xl text-blue-600" value={formData.qty} onChange={e => setFormData({...formData, qty: Number(e.target.value)})} />
              </div>
              <div className="col-span-1">
                  <label className="text-xs font-bold text-slate-400 block mb-1.5 text-center">應備</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-center font-mono font-bold text-base" value={formData.max} onChange={e => setFormData({...formData, max: Number(e.target.value)})} />
              </div>
              <div className="col-span-1">
                  <label className="text-xs font-bold text-slate-400 block mb-1.5 text-center">單位</label>
                  <input placeholder="個" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-center font-bold text-base" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
              </div>
           </div>
        </div>
        <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 bg-slate-100 font-bold text-slate-500 rounded-xl hover:bg-slate-200 transition-colors text-base">取消</button>
            <button onClick={() => { if(formData.name && formData.model) onSave(formData); }} className="flex-1 py-3 bg-blue-600 font-bold text-white rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors active:scale-95 text-base">儲存</button>
        </div>
      </div>
    </div>
  );
};

// --- 3. 分類管理視窗 ---
const CategoryManagerModal = ({ isOpen, onClose, categories, onSaveCategories }) => {
    const [localCats, setLocalCats] = useState([]);
    useEffect(() => { setLocalCats(categories); }, [categories, isOpen]);

    const handleAdd = () => {
        const newCat = { id: `cat_${Date.now()}`, name: '新分類', icon: 'Box', color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' };
        setLocalCats([...localCats, newCat]);
    };
    const handleChange = (id, key, val) => {
        setLocalCats(localCats.map(c => c.id === id ? { ...c, [key]: val } : c));
    };
    const handleDelete = (id) => {
        if(window.confirm('確定刪除？商品將變為未分類。')) {
            setLocalCats(localCats.filter(c => c.id !== id));
        }
    };
    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center"><Settings className="mr-2"/> 管理分類</h3>
                <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
                    {localCats.map(cat => (
                        <div key={cat.id} className="flex items-center gap-2 p-2 border rounded-xl bg-slate-50">
                            <div className={`p-2 rounded-lg ${cat.bg} ${cat.color}`}><Box size={20}/></div>
                            <input className="flex-1 bg-transparent font-bold outline-none text-slate-700" value={cat.name} onChange={e => handleChange(cat.id, 'name', e.target.value)} />
                            <button onClick={() => handleDelete(cat.id)} className="p-2 text-rose-400 hover:bg-rose-50 rounded"><Trash2 size={18}/></button>
                        </div>
                    ))}
                    <button onClick={handleAdd} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold hover:bg-slate-50 flex items-center justify-center"><Plus size={18} className="mr-1"/> 新增分類</button>
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 bg-slate-100 font-bold text-slate-500 rounded-xl">取消</button>
                    <button onClick={() => { onSaveCategories(localCats); onClose(); }} className="flex-1 py-3 bg-blue-600 font-bold text-white rounded-xl shadow-lg">儲存變更</button>
                </div>
            </div>
        </div>
    );
};

// --- Sortable Components (已修復手機滑動問題) ---

const SortableBigCategory = ({ category, count, onClick, isActive }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });
    // 修正：移除 container 的 touchAction: 'none'
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 50 : 'auto' };
    const Icon = ICON_MAP[category.icon] || Box;
    return (
        <div ref={setNodeRef} style={style} className={`w-full bg-white p-4 rounded-2xl shadow-sm border flex items-center active:scale-[0.98] transition-all group mb-3 relative cursor-pointer ${isActive ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-100 hover:border-blue-200'}`} onClick={onClick}>
            <div className={`p-3.5 rounded-2xl mr-4 border transition-colors shadow-sm ${category.bg} ${category.color} ${category.border}`}>
                <Icon size={24} strokeWidth={2.5} />
            </div>
            <div className="flex-1 text-left min-w-0">
                <h3 className="text-base font-bold text-slate-700 truncate mb-0.5">{category.name}</h3>
                <span className="text-xs font-bold text-slate-400 mt-1 block">共 {count} 個項目</span>
            </div>
            {/* 修正：只在把手加上 touchAction: 'none' */}
            <div {...attributes} {...listeners} style={{ touchAction: 'none' }} className="text-slate-300 cursor-grab active:cursor-grabbing hover:text-slate-500 p-3" onClick={e => e.stopPropagation()}><GripVertical size={20} /></div>
        </div>
    );
};

const SortableModelRow = ({ id, title, count, lowStock, onClick }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 50 : 'auto' };
    return (
        <div ref={setNodeRef} style={style} onClick={onClick} className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-[0_1px_3px_rgb(0,0,0,0.02)] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between mb-3 hover:border-blue-200 hover:shadow-md group">
            <div className="flex items-center flex-1 min-w-0">
                <div className={`p-2.5 rounded-lg mr-3.5 shrink-0 bg-slate-50 text-slate-500`}><FolderPlus size={20} /></div>
                <div className="min-w-0">
                    <h3 className="text-base font-extrabold text-slate-800 truncate mb-0.5">{title}</h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <span>{count} 個項目</span>
                        {lowStock > 0 && <span className="text-rose-500 flex items-center bg-rose-50 px-1.5 py-0.5 rounded"><AlertTriangle size={10} className="mr-0.5"/> {lowStock} 缺</span>}
                    </div>
                </div>
            </div>
            <div className="flex items-center pl-2 gap-1">
                {/* 修正：只在把手加上 touchAction: 'none' */}
                <div {...attributes} {...listeners} style={{ touchAction: 'none' }} className="text-slate-300 cursor-grab active:cursor-grabbing hover:text-slate-500 p-2" onClick={e => e.stopPropagation()}><GripVertical size={20} /></div>
                <ChevronRight className="text-slate-300 group-hover:text-blue-400 transition-colors" size={20} />
            </div>
        </div>
    );
};

const SortableItemRow = ({ item, onEdit, onRestock, isLast }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 50 : 'auto' };
    const isOut = item.qty <= 0;
    const rowClass = isOut ? "bg-rose-50/60" : "bg-white hover:bg-slate-50";
    const textClass = isOut ? "text-rose-700" : "text-slate-700";
    const borderClass = isLast ? "" : "border-b border-slate-100";
    return (
        <div ref={setNodeRef} style={style} className={`flex items-center justify-between py-3 px-4 transition-colors ${rowClass} ${borderClass} group touch-manipulation`}>
            <div className="flex items-center flex-1 min-w-0 mr-3 cursor-pointer" onClick={() => onEdit(item)}>
                <div className="flex items-baseline truncate">
                    <span className={`text-base font-bold truncate ${textClass}`}>{item.name}</span>
                    <span className="text-sm text-slate-400 ml-1.5 shrink-0">({item.unit})</span>
                </div>
                {isOut && <span className="ml-3 px-2 py-0.5 bg-rose-200 text-rose-700 text-[10px] font-black rounded shrink-0 self-center">缺貨</span>}
            </div>
            <div className="flex items-center gap-3 shrink-0">
                <div className={`font-mono font-bold text-lg ${isOut ? 'text-rose-600' : 'text-blue-600'}`}>
                    {item.qty} <span className="text-slate-300 text-xs font-bold">/ {item.max}</span>
                </div>
                {item.qty < item.max ? (
                    <button onClick={() => onRestock(item.id, item.max)} className="p-1.5 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors shadow-sm active:scale-90"><RotateCcw size={18} /></button>
                ) : ( <div className="p-1.5 text-emerald-400"><CheckCircle size={20} /></div> )}
                {/* 修正：只在把手加上 touchAction: 'none' */}
                <div {...attributes} {...listeners} style={{ touchAction: 'none' }} className="text-slate-300 cursor-grab active:cursor-grabbing hover:text-slate-500 p-1 pl-2 border-l border-slate-100" onClick={e => e.stopPropagation()}>
                    <GripVertical size={18} />
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---
const InventoryView = ({ inventory, onUpdateInventory, onAddInventory, onDeleteInventory, onBack }) => {
  const [categories, setCategories] = useState(() => {
      try {
          const saved = JSON.parse(localStorage.getItem('inventoryCategories'));
          return saved && saved.length > 0 ? saved : DEFAULT_CATEGORIES;
      } catch { return DEFAULT_CATEGORIES; }
  });
  
  const [selectedCatId, setSelectedCatId] = useState(null); 
  const [activeModel, setActiveModel] = useState(null); 
  const [editingItem, setEditingItem] = useState(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [isCatManagerOpen, setIsCatManagerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); 
  const [showReport, setShowReport] = useState(false);

  const [modelOrder, setModelOrder] = useState(() => { try { return JSON.parse(localStorage.getItem('invModelOrder')) || []; } catch { return []; } });
  const [itemOrder, setItemOrder] = useState(() => { try { return JSON.parse(localStorage.getItem('invItemOrder')) || []; } catch { return []; } });

  useEffect(() => { localStorage.setItem('inventoryCategories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('invModelOrder', JSON.stringify(modelOrder)); }, [modelOrder]);
  useEffect(() => { localStorage.setItem('invItemOrder', JSON.stringify(itemOrder)); }, [itemOrder]);

  useEffect(() => {
      let hasChanges = false;
      const newInventory = inventory.map(item => {
          if (!item.categoryId) {
              hasChanges = true;
              return { ...item, categoryId: migrateCategory(item.model, item) };
          }
          return item;
      });
  }, [inventory]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), // 修正：加入距離限制
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const itemsInCurrentCat = useMemo(() => {
      if (!selectedCatId) return [];
      return inventory.filter(i => (i.categoryId || migrateCategory(i.model, i)) === selectedCatId);
  }, [inventory, selectedCatId]);

  const folders = useMemo(() => {
      const groups = {};
      itemsInCurrentCat.forEach(item => {
          const m = item.model || '未分類';
          if (!groups[m]) groups[m] = [];
          groups[m].push(item);
      });
      return Object.keys(groups).sort((a, b) => {
          const idxA = modelOrder.indexOf(a);
          const idxB = modelOrder.indexOf(b);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return a.localeCompare(b);
      });
  }, [itemsInCurrentCat, modelOrder]);

  const currentItems = useMemo(() => {
      let list = itemsInCurrentCat;
      if (activeModel) {
          list = list.filter(i => (i.model || '未分類') === activeModel);
      } else if (searchTerm) {
          list = inventory.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
      } else {
          return [];
      }
      
      const strItemOrder = itemOrder.map(String);
      return list.sort((a, b) => {
          const idxA = strItemOrder.indexOf(String(a.id));
          const idxB = strItemOrder.indexOf(String(b.id));
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return a.name.localeCompare(b.name);
      });
  }, [itemsInCurrentCat, activeModel, searchTerm, inventory, itemOrder]);

  const catCounts = useMemo(() => {
      const counts = {};
      inventory.forEach(i => {
          const cid = i.categoryId || migrateCategory(i.model, i);
          counts[cid] = (counts[cid] || 0) + 1;
      });
      return counts;
  }, [inventory]);

  const handleDragEnd = (event) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      if (!selectedCatId) {
          const oldIdx = categories.findIndex(c => c.id === active.id);
          const newIdx = categories.findIndex(c => c.id === over.id);
          setCategories(arrayMove(categories, oldIdx, newIdx));
      } else if (!activeModel) {
          setModelOrder(prev => {
             const newOrder = [...prev];
             folders.forEach(f => { if(!newOrder.includes(f)) newOrder.push(f); });
             const oldIdx = newOrder.indexOf(active.id);
             const newIdx = newOrder.indexOf(over.id);
             return arrayMove(newOrder, oldIdx, newIdx);
          });
      } else {
          const currentIds = currentItems.map(i => String(i.id));
          const oldIdx = currentIds.indexOf(String(active.id));
          const newIdx = currentIds.indexOf(String(over.id));
          
          if (oldIdx !== -1 && newIdx !== -1) {
              const newOrder = arrayMove(currentIds, oldIdx, newIdx);
              setItemOrder(prev => {
                  const prevStrings = prev.map(String);
                  const otherItems = prevStrings.filter(id => !currentIds.includes(id));
                  return [...otherItems, ...newOrder];
              });
          }
      }
  };

  const handleBack = () => {
      if (activeModel) setActiveModel(null);
      else if (selectedCatId) setSelectedCatId(null);
      else onBack();
      setSearchTerm('');
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24 flex flex-col font-sans">
       <div className="bg-white/95 backdrop-blur px-4 py-3 shadow-sm sticky top-0 z-30 border-b border-slate-100/50">
         <div className="flex justify-between items-center mb-3">
            <div className="flex items-center overflow-hidden flex-1">
              <button onClick={handleBack} className="p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-full mr-1 transition-colors"><ArrowLeft size={24}/></button>
              <h2 className="text-xl font-extrabold text-slate-800 tracking-wide truncate">
                  {activeModel || (selectedCatId ? categories.find(c=>c.id===selectedCatId)?.name : '庫存管理')}
              </h2>
            </div>
            <div className="flex items-center gap-2">
                {!selectedCatId && !activeModel && (
                    <>
                        <button onClick={() => setIsCatManagerOpen(true)} className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-blue-50 hover:text-blue-600" title="管理分類"><Settings size={20}/></button>
                        <button onClick={() => setShowReport(true)} className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-blue-50 hover:text-blue-600" title="報表"><FileText size={20}/></button>
                    </>
                )}
                <button onClick={() => setIsAddMode(true)} className="flex items-center text-sm font-bold bg-blue-600 text-white px-3 py-2 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"><Plus size={20} className="mr-1"/>新增</button>
            </div>
         </div>
         {!activeModel && (
             <div className="relative animate-in fade-in slide-in-from-top-1 mb-1">
                <Search size={20} className="absolute left-3 top-2.5 text-slate-400" />
                <input className="w-full bg-slate-100 border-none rounded-xl py-2 pl-10 pr-4 text-base outline-none focus:ring-2 focus:ring-blue-100 font-bold text-slate-700 transition-all placeholder-slate-400" placeholder="搜尋零件..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
             </div>
         )}
      </div>

      <div className="p-4 flex-1">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              {!selectedCatId && !searchTerm && (
                 <div className="space-y-1 animate-in slide-in-from-left-4 duration-300">
                    <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                        {categories.map(cat => (
                            <SortableBigCategory key={cat.id} category={cat} count={catCounts[cat.id] || 0} onClick={() => setSelectedCatId(cat.id)} />
                        ))}
                    </SortableContext>
                 </div>
              )}
              {selectedCatId && !activeModel && !searchTerm && (
                  <div className="animate-in slide-in-from-right-4 duration-300 space-y-1">
                      {folders.length === 0 ? (
                          <div className="col-span-full text-center text-slate-400 mt-20"><Box size={48} className="mx-auto mb-3 opacity-20"/><p className="font-bold">此分類無項目</p></div>
                      ) : (
                          <SortableContext items={folders} strategy={verticalListSortingStrategy}>
                              {folders.map(model => {
                                  const items = itemsInCurrentCat.filter(i => (i.model || '未分類') === model);
                                  const lowStock = items.filter(i => i.qty <= 0).length;
                                  return (
                                      <SortableModelRow key={model} id={model} title={model} count={items.length} lowStock={lowStock} onClick={() => setActiveModel(model)} />
                                  );
                              })}
                          </SortableContext>
                      )}
                  </div>
              )}
              {(activeModel || searchTerm) && (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm animate-in slide-in-from-right-4 duration-300">
                       {currentItems.length === 0 ? (
                           <div className="p-8 text-center text-slate-400">沒有找到項目</div>
                       ) : (
                           <SortableContext items={currentItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                                {currentItems.map((item, idx) => (
                                    <SortableItemRow key={item.id} item={item} isLast={idx === currentItems.length - 1} onEdit={setEditingItem} onRestock={(id, max) => {const i = inventory.find(x=>x.id===id); if(i) onUpdateInventory({...i, qty: max})}} />
                                ))}
                           </SortableContext>
                       )}
                  </div>
              )}
          </DndContext>
      </div>

      <EditInventoryModal isOpen={!!editingItem || isAddMode} onClose={() => { setEditingItem(null); setIsAddMode(false); }} onSave={(data) => { if (isAddMode) onAddInventory(data); else onUpdateInventory(data); setIsAddMode(false); setEditingItem(null); }} onDelete={onDeleteInventory} initialItem={editingItem} categories={categories} defaultCategoryId={selectedCatId} defaultModel={activeModel} />
      <CategoryManagerModal isOpen={isCatManagerOpen} onClose={() => setIsCatManagerOpen(false)} categories={categories} onSaveCategories={setCategories} />
      <ReportModal isOpen={showReport} onClose={() => setShowReport(false)} inventory={inventory} categories={categories} modelOrder={modelOrder} itemOrder={itemOrder} />
    </div>
  );
};

export default InventoryView;