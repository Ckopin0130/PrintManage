import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Plus, Search, ChevronRight, ChevronDown, Edit3, 
  RotateCcw, CheckCircle, Trash2, AlertTriangle, Box, Tag, 
  Printer, Palette, Archive, MoreHorizontal, Droplets, SortAsc, SortDesc,
  GripVertical, FileText, Copy
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

// --- 0. 全域設定與輔助函式 (移至最外層以避免定義順序錯誤) ---

const BIG_CATEGORY_CONFIG = {
  TONER: { label: '碳粉系列', icon: Droplets, color: 'bg-sky-100 text-sky-600 border-sky-200' },
  COLOR: { label: '彩色影印機', icon: Palette, color: 'bg-purple-100 text-purple-600 border-purple-200' },
  BW: { label: '黑白影印機', icon: Printer, color: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
  COMMON: { label: '共用耗材', icon: Archive, color: 'bg-orange-100 text-orange-600 border-orange-200' },
  OTHER: { label: '其他周邊', icon: MoreHorizontal, color: 'bg-blue-100 text-blue-600 border-blue-200' },
};

// 輔助：判斷大分類 (依據 item 屬性或型號名稱)
const getBigCategoryType = (modelName, item) => {
    // 1. 如果 item 本身有紀錄 categoryType，優先使用
    if (item && item.categoryType && BIG_CATEGORY_CONFIG[item.categoryType]) {
        return item.categoryType;
    }
    // 2. 否則依據型號名稱字串判斷 (相容舊資料)
    const up = (modelName || '').toUpperCase();
    if (up.includes('碳粉') || up.includes('TONER') || up.includes('INK')) return 'TONER';
    if (up.includes(' C') || up.includes('MPC') || up.includes('IMC') || up.includes('彩色')) return 'COLOR';
    if (up.includes('MP') || up.includes('IM') || up.includes('AFICIO') || up.includes('黑白')) return 'BW';
    if (up.includes('耗材') || up.includes('共用') || up.includes('COMMON')) return 'COMMON';
    return 'OTHER';
};

// --- 1. 庫存報表視窗 (LINE 格式) ---
const ReportModal = ({ isOpen, onClose, inventory }) => {
  const [copied, setCopied] = useState(false);

  const reportText = useMemo(() => {
    if (!inventory || inventory.length === 0) return '無庫存資料';
    
    // 依據型號分組
    const groups = {};
    inventory.forEach(item => {
        const m = item.model || '未分類';
        if (!groups[m]) groups[m] = [];
        groups[m].push(item);
    });

    let text = `【庫存盤點報表】${new Date().toLocaleDateString()}\n`;
    text += `----------------`;

    Object.keys(groups).sort().forEach(model => {
        const items = groups[model];
        text += `\n\n📌 ${model}`;
        items.forEach(i => {
            // 標記狀態：缺貨、低庫存、充足
            const status = i.qty <= 0 ? '❌缺' : (i.qty < i.max / 2 ? '⚠️補' : '✅');
            text += `\n${status} ${i.name}: ${i.qty}/${i.max} ${i.unit}`;
        });
    });
    
    text += `\n\n----------------\n系統自動生成`;
    return text;
  }, [inventory]);

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[80] flex items-start justify-center pt-10 px-4 animate-in fade-in" onClick={onClose}>
        <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 border-b pb-3">
                <h3 className="text-lg font-bold text-slate-800 flex items-center"><FileText className="mr-2 text-blue-600"/> 庫存報表</h3>
                <button onClick={onClose} className="p-1.5 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"><Trash2 size={16} className="rotate-45" /></button> 
            </div>
            <div className="flex-1 overflow-y-auto bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4 font-mono text-xs leading-relaxed whitespace-pre-wrap text-slate-700 shadow-inner">
                {reportText}
            </div>
            <button 
                onClick={handleCopy}
                className={`w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center transition-all ${copied ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
                {copied ? <CheckCircle className="mr-2" size={20}/> : <Copy className="mr-2" size={20}/>}
                {copied ? '已複製到剪貼簿' : '複製文字 (傳送給 LINE)'}
            </button>
        </div>
    </div>
  );
};

// --- 2. 編輯與新增視窗 ---
const EditInventoryModal = ({ isOpen, onClose, onSave, onDelete, initialItem, existingModels, defaultModel }) => {
  const [formData, setFormData] = useState({ name: '', model: '', subGroup: '', qty: 0, max: 5, unit: '個', categoryType: 'OTHER' });
  const [useCustomModel, setUseCustomModel] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      if (initialItem) {
        // 編輯模式
        setFormData({ 
            ...initialItem, 
            subGroup: initialItem.subGroup || '',
            categoryType: getBigCategoryType(initialItem.model, initialItem)
        });
        setUseCustomModel(false);
      } else {
        // 新增模式
        const targetModel = defaultModel || existingModels[0] || '共用耗材';
        setFormData({ 
            name: '', 
            model: targetModel, 
            subGroup: '', 
            qty: 1, max: 5, unit: '個',
            categoryType: getBigCategoryType(targetModel, null)
        });
        setUseCustomModel(defaultModel && !existingModels.includes(defaultModel));
      }
    }
  }, [isOpen, initialItem, existingModels, defaultModel]);

  if (!isOpen) return null;
  
  return (
    // 修改：items-start + pt-12 防止手機鍵盤遮擋
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-start justify-center pt-12 px-4 animate-in fade-in duration-200 overflow-y-auto" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl relative mb-10" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-4">
           <h3 className="text-xl font-bold text-slate-800">{initialItem ? '編輯項目' : '新增項目'}</h3>
           {initialItem && <button onClick={() => { if(window.confirm(`確定要刪除「${formData.name}」嗎？`)) onDelete(formData.id); }} className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors"><Trash2 size={20}/></button>}
        </div>
        
        <div className="space-y-4 mb-6">
           {/* 型號選擇區 */}
           <div>
             <label className="text-xs font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">歸屬型號</label>
             {!useCustomModel ? (
               <div className="flex gap-2">
                 <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-slate-700 font-bold text-base" 
                    value={formData.model} 
                    onChange={e => {
                        const val = e.target.value;
                        setFormData({...formData, model: val, categoryType: getBigCategoryType(val, null)});
                    }}>
                   {existingModels.map(m => <option key={m} value={m}>{m}</option>)}
                 </select>
                 <button onClick={() => {setUseCustomModel(true); setFormData({...formData, model: ''})}} className="bg-blue-50 text-blue-600 px-3 rounded-xl text-sm font-bold whitespace-nowrap">自訂</button>
               </div>
             ) : (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                  <div className="flex gap-2">
                    <input autoFocus placeholder="輸入新分類名稱" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none font-bold text-base" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
                    <button onClick={() => setUseCustomModel(false)} className="bg-slate-100 text-slate-500 px-3 rounded-xl text-sm font-bold whitespace-nowrap">取消</button>
                  </div>
                  {/* 自訂型號時，強制選擇大分類 */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <label className="text-xs font-bold text-slate-400 block mb-2 uppercase">此型號屬於？</label>
                      <div className="flex flex-wrap gap-2">
                          {Object.keys(BIG_CATEGORY_CONFIG).map(key => (
                              <button 
                                key={key}
                                type="button"
                                onClick={() => setFormData({...formData, categoryType: key})}
                                className={`px-2 py-1.5 rounded-lg text-xs font-bold border transition-all ${formData.categoryType === key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}
                              >
                                {BIG_CATEGORY_CONFIG[key].label}
                              </button>
                          ))}
                      </div>
                  </div>
                </div>
             )}
           </div>

           <div>
               <label className="text-xs font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">項目名稱</label>
               <input placeholder="例: 黃色碳粉" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-base text-slate-800 font-bold placeholder:font-normal" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
           </div>

           <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
               <label className="text-xs font-bold text-blue-500 block mb-1.5 uppercase tracking-wider flex items-center">
                   <Tag size={12} className="mr-1"/> 次分類 (選填：用於收納)
               </label>
               <input 
                  placeholder="例如: C3503 (相同名稱會自動分組)" 
                  className="w-full bg-white border border-blue-200 rounded-lg py-2 px-3 outline-none text-base text-slate-800 font-bold placeholder:font-normal placeholder:text-slate-400 focus:ring-2 focus:ring-blue-100" 
                  value={formData.subGroup} 
                  onChange={e => setFormData({...formData, subGroup: e.target.value})} 
               />
           </div>
           
           <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                  <label className="text-xs font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">目前數量</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-center font-mono font-bold text-xl text-blue-600" value={formData.qty} onChange={e => setFormData({...formData, qty: Number(e.target.value)})} />
              </div>
              <div className="col-span-1">
                  <label className="text-xs font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">應備量</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-center font-mono font-bold text-lg" value={formData.max} onChange={e => setFormData({...formData, max: Number(e.target.value)})} />
              </div>
              <div className="col-span-1">
                  <label className="text-xs font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">單位</label>
                  <input placeholder="個" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-center font-bold text-lg" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
              </div>
           </div>
        </div>
        <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 bg-slate-100 font-bold text-slate-500 rounded-xl hover:bg-slate-200 transition-colors">取消</button>
            <button onClick={() => { if(formData.name && formData.model) onSave(formData); }} className="flex-1 py-3 bg-blue-600 font-bold text-white rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors active:scale-95">儲存</button>
        </div>
      </div>
    </div>
  );
};

// --- 3. 重新命名視窗 ---
const RenameModal = ({ isOpen, onClose, onRename, oldName, title = "修改名稱" }) => {
  const [newName, setNewName] = useState(oldName || '');
  useEffect(() => { setNewName(oldName || ''); }, [oldName]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-[80] flex items-start justify-center pt-20 p-4 animate-in fade-in" onClick={onClose}>
      <div className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-800 mb-4">{title}</h3>
        <input autoFocus className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none mb-6 font-bold text-lg text-slate-700" value={newName} onChange={e => setNewName(e.target.value)} />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 bg-slate-100 font-bold text-slate-500 rounded-xl">取消</button>
          <button onClick={() => { onRename(oldName, newName); onClose(); }} className="flex-1 py-3 bg-blue-600 font-bold text-white rounded-xl shadow-lg">儲存</button>
        </div>
      </div>
    </div>
  );
};

// --- 4. 可拖曳的大分類 (Level 1) ---
const SortableBigCategory = ({ category, count, onClick, onEditLabel }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 50 : 'auto' };
    const Icon = category.icon;
    
    return (
        <div ref={setNodeRef} style={style} onClick={onClick} className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center active:scale-[0.98] transition-all hover:border-blue-200 group mb-3 relative touch-manipulation">
            <div className={`p-3.5 rounded-xl mr-4 border transition-colors shadow-sm ${category.color}`}>
                <Icon size={26} strokeWidth={2.5} />
            </div>
            <div className="flex-1 text-left min-w-0">
                <h3 className="text-lg font-extrabold text-slate-800 truncate">{category.label}</h3>
                <span className="text-xs text-slate-500 font-bold">共 {count} 個項目</span>
            </div>
            <div className="flex items-center gap-1 ml-2">
                <button onClick={(e) => { e.stopPropagation(); onEditLabel(category.id, category.label); }} className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit3 size={18} /></button>
                <div {...attributes} {...listeners} className="text-slate-300 cursor-grab active:cursor-grabbing hover:text-slate-500 p-2" onClick={(e) => e.stopPropagation()}><GripVertical size={20} /></div>
            </div>
        </div>
    );
};

// --- 5. 項目列表列 (Level 3 Item) ---
const InventoryRow = ({ item, onEdit, onRestock, isLast }) => {
    const isOut = item.qty <= 0;
    const rowClass = isOut ? "bg-rose-50/60" : "bg-white hover:bg-slate-50";
    const textClass = isOut ? "text-rose-700" : "text-slate-700";
    const borderClass = isLast ? "" : "border-b border-slate-100";

    return (
        <div className={`flex items-center justify-between py-3 px-4 transition-colors ${rowClass} ${borderClass}`}>
            <div className="flex items-center flex-1 min-w-0 mr-3 cursor-pointer" onClick={() => onEdit(item)}>
                <div className="flex flex-col">
                    <span className={`text-[15px] font-bold truncate leading-tight ${textClass}`}>{item.name}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{item.unit}</span>
                </div>
                {isOut && <span className="ml-2 px-1.5 py-0.5 bg-rose-200 text-rose-700 text-[10px] font-black rounded shrink-0">缺貨</span>}
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
                <div className={`font-mono font-bold text-[15px] ${isOut ? 'text-rose-600' : 'text-blue-600'}`}>
                    {item.qty} <span className="text-slate-300 text-xs font-bold">/ {item.max}</span>
                </div>
                {item.qty < item.max ? (
                    <button onClick={() => onRestock(item.id, item.max)} className="p-1.5 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors">
                        <RotateCcw size={18} />
                    </button>
                ) : ( <div className="p-1.5 text-emerald-400"><CheckCircle size={18} /></div> )}
            </div>
        </div>
    );
}

// --- 6. 可收合的群組 (Level 3 Accordion) ---
const AccordionGroup = ({ groupName, items, onEdit, onRestock }) => {
    const [isOpen, setIsOpen] = useState(true); // 預設展開
    const lowStockCount = items.filter(i => i.qty <= 0).length;

    return (
        <div className="border border-slate-200 bg-white rounded-xl overflow-hidden shadow-sm mb-3">
            <div onClick={() => setIsOpen(!isOpen)} className={`flex justify-between items-center px-4 py-3 cursor-pointer select-none transition-colors ${isOpen ? 'bg-slate-50 border-b border-slate-100' : 'bg-white hover:bg-slate-50'}`}>
                <div className="flex items-center gap-2">
                    {isOpen ? <ChevronDown size={18} className="text-slate-400"/> : <ChevronRight size={18} className="text-slate-400"/>}
                    <span className="text-base font-extrabold text-slate-800">{groupName}</span>
                </div>
                <div className="flex items-center gap-3">
                    {lowStockCount > 0 && <span className="flex items-center text-xs font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full"><AlertTriangle size={10} className="mr-1"/> {lowStockCount} 缺</span>}
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{items.length} 項</span>
                </div>
            </div>
            {isOpen && (
                <div className="bg-white">
                    {items.map((item, idx) => (
                        <InventoryRow key={item.id} item={item} onEdit={onEdit} onRestock={onRestock} isLast={idx === items.length - 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

// --- 7. 型號列表 (Level 2 List Item) ---
const ModelListRow = ({ title, count, lowStock, onClick, onRename, categoryType }) => {
    const config = BIG_CATEGORY_CONFIG[categoryType] || BIG_CATEGORY_CONFIG.OTHER;
    const Icon = config.icon;

    return (
        <div onClick={onClick} className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-[0_1px_3px_rgb(0,0,0,0.02)] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between mb-3 hover:border-blue-200 hover:shadow-md group">
            <div className="flex items-center flex-1 min-w-0">
                <div className={`p-2.5 rounded-lg mr-3.5 shrink-0 bg-slate-50 text-slate-500`}>
                    <Icon size={20} />
                </div>
                <div className="min-w-0">
                    <h3 className="text-base font-extrabold text-slate-800 truncate mb-0.5">{title}</h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <span>{count} 個項目</span>
                        {lowStock > 0 && <span className="text-rose-500 flex items-center bg-rose-50 px-1.5 rounded"><AlertTriangle size={10} className="mr-0.5"/> {lowStock} 缺</span>}
                    </div>
                </div>
            </div>
            
            <div className="flex items-center pl-2">
                <button onClick={(e) => { e.stopPropagation(); onRename(title); }} className="p-2 text-slate-300 hover:text-blue-500 hover:bg-slate-50 rounded-lg transition-colors mr-1">
                    <Edit3 size={16} />
                </button>
                <ChevronRight className="text-slate-300 group-hover:text-blue-400 transition-colors" size={20} />
            </div>
        </div>
    );
};

// --- 8. 主視圖 (Main Component) ---
const InventoryView = ({ inventory, onUpdateInventory, onAddInventory, onDeleteInventory, onRenameGroup, onBack }) => {
  const [selectedBigGroup, setSelectedBigGroup] = useState(null); 
  const [activeCategory, setActiveCategory] = useState(null); 
  
  const [editingItem, setEditingItem] = useState(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [groupToRename, setGroupToRename] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); 
  const [showReport, setShowReport] = useState(false);
  
  const [sortMode, setSortMode] = useState('name'); 

  // 大分類名稱 (顯示用)
  const [bigGroupLabels, setBigGroupLabels] = useState({
      COLOR: '彩色影印機', BW: '黑白影印機', TONER: '碳粉系列', COMMON: '共用耗材', OTHER: '其他周邊'
  });
  const [editingBigGroup, setEditingBigGroup] = useState(null);

  // 拖曳排序持久化 (localStorage)
  const [categoryOrder, setCategoryOrder] = useState(() => {
    try {
      const saved = localStorage.getItem('inventoryLevel1Order');
      return saved ? JSON.parse(saved) : ['TONER', 'COLOR', 'BW', 'COMMON', 'OTHER'];
    } catch {
      return ['TONER', 'COLOR', 'BW', 'COMMON', 'OTHER'];
    }
  });

  useEffect(() => {
    localStorage.setItem('inventoryLevel1Order', JSON.stringify(categoryOrder));
  }, [categoryOrder]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setCategoryOrder((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // 資料運算
  const groupedInventory = useMemo(() => {
    const groups = {};
    inventory.forEach(item => {
      const model = item.model || '未分類';
      if (!groups[model]) groups[model] = [];
      groups[model].push(item);
    });
    return groups;
  }, [inventory]);

  const bigGroupsCounts = useMemo(() => {
      const counts = { COLOR: 0, BW: 0, TONER: 0, COMMON: 0, OTHER: 0 };
      Object.keys(groupedInventory).forEach(model => {
          const sampleItem = groupedInventory[model][0];
          const bg = getBigCategoryType(model, sampleItem);
          if (counts[bg] !== undefined) counts[bg] += groupedInventory[model].length;
          else counts.OTHER += groupedInventory[model].length;
      });
      return counts;
  }, [groupedInventory]);

  const currentFolders = useMemo(() => {
      if (!selectedBigGroup) return [];
      const allModels = Object.keys(groupedInventory);
      const filtered = allModels.filter(model => {
          const sampleItem = groupedInventory[model][0];
          return getBigCategoryType(model, sampleItem) === selectedBigGroup;
      });
      return filtered.sort((a, b) => {
          if (sortMode === 'qty') {
             const countA = groupedInventory[a].length;
             const countB = groupedInventory[b].length;
             return countB - countA;
          }
          return a.localeCompare(b);
      });
  }, [selectedBigGroup, groupedInventory, sortMode]);

  const currentItemsData = useMemo(() => {
    if (!activeCategory) return { grouped: {}, ungrouped: [], totalCount: 0 };
    let list = groupedInventory[activeCategory] || [];
    
    if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        list = list.filter(i => i.name.toLowerCase().includes(lower) || (i.subGroup && i.subGroup.toLowerCase().includes(lower)));
    }

    list.sort((a, b) => {
        if (sortMode === 'qty') return a.qty - b.qty; 
        return a.name.localeCompare(b.name);
    });

    const grouped = {};
    const ungrouped = [];
    list.forEach(item => {
        if (item.subGroup) {
            if (!grouped[item.subGroup]) grouped[item.subGroup] = [];
            grouped[item.subGroup].push(item);
        } else {
            ungrouped.push(item);
        }
    });
    return { grouped, ungrouped, totalCount: list.length };
  }, [activeCategory, groupedInventory, searchTerm, sortMode]);

  // 操作邏輯
  const handleSelectBigGroup = (groupId) => {
    setSelectedBigGroup(groupId);
    // 自動進入唯一資料夾
    const allModels = Object.keys(groupedInventory);
    const folders = allModels.filter(model => getBigCategoryType(model, groupedInventory[model][0]) === groupId);
    if (folders.length === 1) setActiveCategory(folders[0]);
  };

  const handleBackNavigation = () => {
    if (activeCategory) { 
        setActiveCategory(null); setSearchTerm(''); 
        // 檢查是否要直接退回首頁
        const allModels = Object.keys(groupedInventory);
        const folders = allModels.filter(model => getBigCategoryType(model, groupedInventory[model][0]) === selectedBigGroup);
        if (folders.length === 1) setSelectedBigGroup(null);
    } 
    else if (selectedBigGroup) { setSelectedBigGroup(null); } 
    else { onBack(); }
  };

  const getHeaderTitle = () => {
      if (activeCategory) return activeCategory;
      if (selectedBigGroup) return bigGroupLabels[selectedBigGroup];
      return '庫存管理';
  };

  const handleModalSave = (itemData) => {
    if (isAddMode) { onAddInventory(itemData); setIsAddMode(false); } 
    else { onUpdateInventory(itemData); setEditingItem(null); }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24 flex flex-col font-sans">
       {/* 頂部導覽 */}
       <div className="bg-white/95 backdrop-blur px-4 py-3 shadow-sm sticky top-0 z-30 border-b border-slate-100/50">
         <div className="flex justify-between items-center mb-3">
            <div className="flex items-center overflow-hidden flex-1">
              <button onClick={handleBackNavigation} className="p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-full mr-1 transition-colors"><ArrowLeft size={24}/></button>
              <h2 className="text-xl font-extrabold text-slate-800 tracking-wide truncate">{getHeaderTitle()}</h2>
            </div>
            
            <div className="flex items-center gap-2">
                {!selectedBigGroup && (
                    <button onClick={() => setShowReport(true)} className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <FileText size={20}/>
                    </button>
                )}
                {selectedBigGroup && (
                    <button onClick={() => setSortMode(prev => prev === 'name' ? 'qty' : 'name')} className="p-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs flex items-center">
                        {sortMode === 'name' ? <SortAsc size={18} className="mr-1"/> : <SortDesc size={18} className="mr-1"/>}
                        {sortMode === 'name' ? '名稱' : '數量'}
                    </button>
                )}
                <button onClick={() => setIsAddMode(true)} className="flex items-center text-sm font-bold bg-blue-600 text-white px-3 py-2 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"><Plus size={18} className="mr-1"/>新增</button>
            </div>
         </div>
         
         {!selectedBigGroup && (
             <div className="relative animate-in fade-in slide-in-from-top-1 mb-1">
                <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
                <input 
                    className="w-full bg-slate-100 border-none rounded-xl py-2 pl-10 pr-4 text-base outline-none focus:ring-2 focus:ring-blue-100 font-bold text-slate-700 transition-all placeholder-slate-400" 
                    placeholder="搜尋零件..." 
                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)} 
                />
             </div>
         )}
      </div>

      {/* 內容區 */}
      <div className="p-4 flex-1">
          {/* Level 1 */}
          {!selectedBigGroup && (
             <div className="space-y-1 animate-in slide-in-from-left-4 duration-300">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={categoryOrder} strategy={verticalListSortingStrategy}>
                        {categoryOrder.map(id => (
                            <SortableBigCategory 
                                key={id}
                                category={{ id: id, label: bigGroupLabels[id], ...BIG_CATEGORY_CONFIG[id] }}
                                count={bigGroupsCounts[id]}
                                onClick={() => handleSelectBigGroup(id)}
                                onEditLabel={(catId, name) => setEditingBigGroup({ id: catId, name })}
                            />
                        ))}
                    </SortableContext>
                </DndContext>
             </div>
          )}

          {/* Level 2 */}
          {selectedBigGroup && !activeCategory && (
              <div className="animate-in slide-in-from-right-4 duration-300">
                  <div className="space-y-1">
                      {currentFolders.length === 0 ? (
                          <div className="col-span-full text-center text-slate-400 mt-20"><Box size={48} className="mx-auto mb-3 opacity-20"/><p className="font-bold">無資料</p></div>
                      ) : (
                          currentFolders.map(model => {
                              const items = groupedInventory[model];
                              const lowStock = items.filter(i => i.qty <= 0).length;
                              return (
                                  <ModelListRow 
                                      key={model} 
                                      title={model} 
                                      count={items.length} 
                                      lowStock={lowStock} 
                                      categoryType={selectedBigGroup}
                                      onClick={() => setActiveCategory(model)} 
                                      onRename={setGroupToRename} 
                                  />
                              );
                          })
                      )}
                  </div>
              </div>
          )}

          {/* Level 3 */}
          {activeCategory && (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                  {currentItemsData.totalCount === 0 && <div className="text-center text-slate-400 mt-10"><p className="font-bold">無項目</p></div>}
                  {Object.keys(currentItemsData.grouped).sort().map(subGroupName => (
                      <AccordionGroup key={subGroupName} groupName={subGroupName} items={currentItemsData.grouped[subGroupName]} onEdit={setEditingItem} onRestock={(id, max) => {const i = inventory.find(x=>x.id===id); if(i) onUpdateInventory({...i, qty: max})}} />
                  ))}
                  {currentItemsData.ungrouped.length > 0 && (
                      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                          {Object.keys(currentItemsData.grouped).length > 0 && <div className="bg-slate-50 px-4 py-2 text-xs font-bold text-slate-400 border-b border-slate-100">其他</div>}
                          {currentItemsData.ungrouped.map((item, idx) => (
                              <InventoryRow key={item.id} item={item} onEdit={setEditingItem} onRestock={(id, max) => {const i = inventory.find(x=>x.id===id); if(i) onUpdateInventory({...i, qty: max})}} isLast={idx === currentItemsData.ungrouped.length - 1} />
                          ))}
                      </div>
                  )}
              </div>
          )}
      </div>

      <EditInventoryModal 
        isOpen={!!editingItem || isAddMode} 
        onClose={() => { setEditingItem(null); setIsAddMode(false); }} 
        onSave={handleModalSave} 
        onDelete={(id) => { onDeleteInventory(id); setEditingItem(null); }} 
        initialItem={editingItem} 
        existingModels={Object.keys(groupedInventory)} 
        defaultModel={activeCategory} 
      />
      
      <RenameModal 
          isOpen={!!groupToRename || !!editingBigGroup} 
          title={editingBigGroup ? "修改大分類名稱" : "修改型號名稱"}
          oldName={editingBigGroup ? editingBigGroup.name : groupToRename} 
          onClose={() => { setGroupToRename(null); setEditingBigGroup(null); }} 
          onRename={(old, newName) => {
              if (editingBigGroup) setBigGroupLabels(prev => ({ ...prev, [editingBigGroup.id]: newName }));
              else onRenameGroup(old, newName);
          }} 
      />

      <ReportModal isOpen={showReport} onClose={() => setShowReport(false)} inventory={inventory} />
    </div>
  );
};

export default InventoryView;