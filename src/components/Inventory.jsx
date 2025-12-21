import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Plus, Search, ChevronRight, ChevronDown, Edit3, 
  RotateCcw, CheckCircle, Trash2, AlertTriangle, Box, Tag, 
  Printer, Palette, Archive, MoreHorizontal, Droplets, Layers, Settings2, GripVertical 
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

// --- 1. 編輯與新增視窗 (維持不變) ---
const EditInventoryModal = ({ isOpen, onClose, onSave, onDelete, initialItem, existingModels, defaultModel }) => {
  const [formData, setFormData] = useState({ name: '', model: '', subGroup: '', qty: 0, max: 5, unit: '個' });
  const [useCustomModel, setUseCustomModel] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      if (initialItem) {
        setFormData({ ...initialItem, subGroup: initialItem.subGroup || '' });
        setUseCustomModel(false);
      } else {
        const targetModel = defaultModel || existingModels[0] || '共用耗材';
        setFormData({ name: '', model: targetModel, subGroup: '', qty: 1, max: 5, unit: '個' });
        setUseCustomModel(defaultModel && !existingModels.includes(defaultModel));
      }
    }
  }, [isOpen, initialItem, existingModels, defaultModel]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl scale-100 transition-transform" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-4">
           <h3 className="text-xl font-bold text-slate-800">{initialItem ? '編輯項目' : '新增項目'}</h3>
           {initialItem && <button onClick={() => { if(window.confirm(`確定要刪除「${formData.name}」嗎？`)) onDelete(formData.id); }} className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors"><Trash2 size={20}/></button>}
        </div>
        
        <div className="space-y-4 mb-6">
           <div>
             <label className="text-xs font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">歸屬分類 (例如: MP C3503)</label>
             {!useCustomModel ? (
               <div className="flex gap-2">
                 <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-slate-700 font-bold text-base" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})}>
                   {existingModels.map(m => <option key={m} value={m}>{m}</option>)}
                 </select>
                 <button onClick={() => {setUseCustomModel(true);}} className="bg-blue-50 text-blue-600 px-3 rounded-xl text-sm font-bold whitespace-nowrap">自訂</button>
               </div>
             ) : (
                <div className="flex gap-2">
                  <input autoFocus placeholder="輸入新分類名稱" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none font-bold text-base" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
                  <button onClick={() => setUseCustomModel(false)} className="bg-slate-100 text-slate-500 px-3 rounded-xl text-sm font-bold whitespace-nowrap">取消</button>
                </div>
             )}
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
           
           <div>
               <label className="text-xs font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">項目名稱</label>
               <input placeholder="例: 黃色碳粉" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-lg text-slate-800 font-bold placeholder:font-normal" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
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

// --- 2. 重新命名視窗 ---
const RenameModal = ({ isOpen, onClose, onRename, oldName, title = "修改名稱" }) => {
  const [newName, setNewName] = useState(oldName || '');
  useEffect(() => { setNewName(oldName || ''); }, [oldName]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
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

// --- 3. 可拖曳的項目元件 (Level 3 & Level 1 共用邏輯封裝) ---
// 這裡我們針對大分類 (Level 1) 建立專用的可拖曳組件
const SortableBigCategory = ({ category, count, onClick, onEditLabel }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: category.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 'auto',
    };

    const Icon = category.icon;
    
    return (
        <div
            ref={setNodeRef}
            style={style}
            // 點擊卡片本體 -> 進入分類 (onClick)
            onClick={onClick}
            className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center active:scale-[0.98] transition-all hover:border-blue-200 group mb-3 relative touch-manipulation"
        >
             {/* 拖曳手柄：只按這裡才能拖曳，避免誤觸點擊 */}
            <div {...attributes} {...listeners} className="mr-3 text-slate-300 cursor-grab active:cursor-grabbing hover:text-slate-500 p-1" onClick={(e) => e.stopPropagation()}>
                <GripVertical size={20} />
            </div>

            <div className={`p-3.5 rounded-xl mr-4 border transition-colors ${category.colorClass}`}>
                <Icon size={24} />
            </div>
            <div className="flex-1 text-left min-w-0">
                <h3 className="text-lg font-extrabold text-slate-800 truncate">{category.label}</h3>
                <span className="text-xs text-slate-500 font-bold">共 {count} 個項目</span>
            </div>
            
            {/* 編輯按鈕：點這裡才改名 */}
            <button 
                onClick={(e) => { e.stopPropagation(); onEditLabel(category.id, category.label); }}
                className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors mr-1"
            >
                <Edit3 size={18} />
            </button>
            
            <ChevronRight className="text-slate-300 group-hover:text-blue-400" />
        </div>
    );
};

// --- 4. 項目列表列 (Level 3 Item) ---
const InventoryRow = ({ item, onEdit, onRestock, isLast }) => {
    const isOut = item.qty === 0;
    const rowClass = isOut ? "bg-rose-50/60" : "bg-white hover:bg-slate-50";
    const textClass = isOut ? "text-rose-700" : "text-slate-700";
    const numClass = isOut ? "text-rose-600" : "text-blue-600";
    const borderClass = isLast ? "" : "border-b border-slate-100";

    return (
        <div onClick={() => onEdit(item)} className={`flex items-center justify-between py-3 px-4 transition-colors cursor-pointer ${rowClass} ${borderClass}`}>
            <div className="flex items-center flex-1 min-w-0 mr-3">
                <span className={`text-[15px] font-bold truncate leading-tight ${textClass}`}>{item.name}</span>
                <span className="text-xs font-bold text-slate-400 ml-2 shrink-0">{item.unit}</span>
                {isOut && <span className="ml-2 px-1.5 py-0.5 bg-rose-200 text-rose-700 text-[10px] font-black rounded">缺貨</span>}
            </div>
            <div className="flex items-center gap-3 shrink-0">
                <div className={`font-mono font-bold text-[15px] ${numClass}`}>
                    {item.qty} <span className="text-slate-300 text-xs font-bold">/ {item.max}</span>
                </div>
                <div onClick={e => e.stopPropagation()}>
                    {item.qty < item.max ? (
                        <button onClick={() => onRestock(item.id, item.max)} className="p-1.5 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors">
                            <RotateCcw size={18} />
                        </button>
                    ) : ( <div className="p-1.5 text-emerald-400"><CheckCircle size={18} /></div> )}
                </div>
            </div>
        </div>
    );
}

// --- 5. 可收合的群組 (Level 3 Accordion) ---
const AccordionGroup = ({ groupName, items, onEdit, onRestock }) => {
    const [isOpen, setIsOpen] = useState(false);
    const lowStockCount = items.filter(i => i.qty === 0).length;

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
                <div className="bg-white animate-in slide-in-from-top-1">
                    {items.map((item, idx) => (
                        <InventoryRow key={item.id} item={item} onEdit={onEdit} onRestock={onRestock} isLast={idx === items.length - 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

// --- 6. 新版條列式分類 (Level 2 List Item) ---
const ModelListRow = ({ title, count, lowStock, onClick, onRename, categoryType }) => {
    let icon = <Layers size={20} />;
    let iconColor = "text-slate-500";
    let iconBg = "bg-slate-100";

    if (categoryType === 'TONER') {
        icon = <Droplets size={20} />;
        iconBg = "bg-sky-50"; iconColor = "text-sky-600";
    } else if (categoryType === 'COLOR') {
        icon = <Printer size={20} />;
        iconBg = "bg-purple-50"; iconColor = "text-purple-600";
    } else if (categoryType === 'BW') {
        icon = <Printer size={20} />;
        iconBg = "bg-slate-100"; iconColor = "text-slate-600";
    } else {
        icon = <Box size={20} />;
        iconBg = "bg-slate-50"; iconColor = "text-slate-500"; // 修正：共用耗材改為中性色
    }

    return (
        <div onClick={onClick} className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-[0_1px_3px_rgb(0,0,0,0.02)] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between mb-3 hover:border-blue-200 hover:shadow-md group">
            <div className="flex items-center flex-1 min-w-0">
                <div className={`p-2.5 rounded-lg ${iconBg} ${iconColor} mr-3.5 shrink-0`}>
                    {icon}
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
                <button 
                    onClick={(e) => { e.stopPropagation(); onRename(title); }} 
                    className="p-2 text-slate-300 hover:text-blue-500 hover:bg-slate-50 rounded-lg transition-colors mr-1"
                >
                    <Edit3 size={16} />
                </button>
                <ChevronRight className="text-slate-300 group-hover:text-blue-400 transition-colors" size={20} />
            </div>
        </div>
    );
};

// --- 7. 輔助函數 ---
const getBigGroup = (modelName) => {
    const up = modelName.toUpperCase();
    if (up.includes('碳粉') || up.includes('TONER') || up.includes('INK')) return 'TONER';
    if (up.includes(' C') || up.includes('MPC') || up.includes('IM C') || up.includes('IMC') || up.includes('彩色')) return 'COLOR';
    if (up.includes('MP') || up.includes('IM') || up.includes('AFICIO') || up.includes('黑白')) return 'BW';
    if (up.includes('耗材') || up.includes('共用') || up.includes('COMMON')) return 'COMMON';
    return 'OTHER';
};

// --- 8. 主視圖 (三層式架構 + 拖曳排序) ---
const InventoryView = ({ inventory, onUpdateInventory, onAddInventory, onDeleteInventory, onRenameGroup, onBack }) => {
  const [selectedBigGroup, setSelectedBigGroup] = useState(null); 
  const [activeCategory, setActiveCategory] = useState(null); 
  
  const [editingItem, setEditingItem] = useState(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [groupToRename, setGroupToRename] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); 
  
  const [bigGroupLabels, setBigGroupLabels] = useState({
      COLOR: '彩色影印機',
      BW: '黑白影印機',
      TONER: '碳粉系列',
      COMMON: '共用耗材',
      OTHER: '其他周邊'
  });
  const [editingBigGroup, setEditingBigGroup] = useState(null);

  // --- 拖曳排序狀態 (Category Order) ---
  const [categoryOrder, setCategoryOrder] = useState(['TONER', 'COLOR', 'BW', 'COMMON', 'OTHER']);

  // Dnd Sensors (優化觸控體驗，加入延遲避免誤觸)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 }, // 長按 0.25s 才能拖曳
    })
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
          const bg = getBigGroup(model);
          counts[bg] += groupedInventory[model].length;
      });
      return counts;
  }, [groupedInventory]);

  // 大分類設定檔 (包含顏色樣式)
  const categoryConfig = {
      TONER: { icon: Droplets, colorClass: "bg-sky-50 text-sky-600 border-sky-100 group-hover:bg-sky-500 group-hover:text-white" },
      COLOR: { icon: Palette, colorClass: "bg-purple-50 text-purple-600 border-purple-100 group-hover:bg-purple-600 group-hover:text-white" },
      BW: { icon: Printer, colorClass: "bg-slate-100 text-slate-600 border-slate-200 group-hover:bg-slate-700 group-hover:text-white" },
      // 修改重點：共用耗材改成低調的藍灰色 (Slate/Blue-Gray)
      COMMON: { icon: Archive, colorClass: "bg-slate-50 text-slate-500 border-slate-200 group-hover:bg-slate-500 group-hover:text-white" },
      OTHER: { icon: MoreHorizontal, colorClass: "bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-600 group-hover:text-white" },
  };

  const currentFolders = useMemo(() => {
      if (!selectedBigGroup) return [];
      const allModels = Object.keys(groupedInventory).sort();
      return allModels.filter(model => getBigGroup(model) === selectedBigGroup);
  }, [selectedBigGroup, groupedInventory]);

  const currentItemsData = useMemo(() => {
    if (!activeCategory) return { grouped: {}, ungrouped: [], totalCount: 0 };
    let list = groupedInventory[activeCategory] || [];
    if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        list = list.filter(i => i.name.toLowerCase().includes(lower) || (i.subGroup && i.subGroup.toLowerCase().includes(lower)));
    }
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
  }, [activeCategory, groupedInventory, searchTerm]);

  const handleBackNavigation = () => {
      if (activeCategory) { setActiveCategory(null); setSearchTerm(''); } 
      else if (selectedBigGroup) { setSelectedBigGroup(null); } 
      else { onBack(); }
  };

  const getHeaderTitle = () => {
      if (activeCategory) return activeCategory;
      if (selectedBigGroup) return bigGroupLabels[selectedBigGroup];
      return '庫存管理';
  };

  const handleRestock = (id, max) => {
    const item = inventory.find(i => i.id === id);
    if(item) onUpdateInventory({...item, qty: max});
  };

  const handleModalSave = (itemData) => {
    if (isAddMode) { onAddInventory(itemData); setIsAddMode(false); } 
    else { onUpdateInventory(itemData); setEditingItem(null); }
  };

  const handleBigGroupRename = (oldId, newName) => {
      setBigGroupLabels(prev => ({ ...prev, [oldId]: newName }));
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24 flex flex-col font-sans">
       {/* 頂部導覽 */}
       <div className="bg-white/95 backdrop-blur px-4 py-3 shadow-sm sticky top-0 z-30 border-b border-slate-100/50">
         <div className="flex justify-between items-center mb-3">
            <div className="flex items-center overflow-hidden">
              <button onClick={handleBackNavigation} className="p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-full mr-1 transition-colors"><ArrowLeft size={24}/></button>
              <div className="flex flex-col ml-1">
                  <h2 className="text-xl font-extrabold text-slate-800 tracking-wide truncate max-w-[180px]">{getHeaderTitle()}</h2>
                  {(selectedBigGroup || activeCategory) && <span className="text-[10px] font-bold text-slate-400">點擊箭頭返回上一層</span>}
              </div>
            </div>
            <button onClick={() => setIsAddMode(true)} className="flex items-center text-sm font-bold bg-blue-600 text-white px-3 py-2 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"><Plus size={18} className="mr-1"/>新增</button>
         </div>
         
         {/* 搜尋欄 - 修正重點：只在最上層 (Level 1) 顯示，或是進入特定層級後需要搜尋 */}
         {/* 根據需求：其餘二三層不要顯示，搜尋欄放到大分類的上方就好 */}
         {!selectedBigGroup && (
             <div className="relative animate-in fade-in slide-in-from-top-1 mb-1">
                <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
                <input className="w-full bg-slate-100 border-none rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-100 font-bold text-slate-700 transition-all placeholder-slate-400" placeholder="全域搜尋零件..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
             </div>
         )}
      </div>

      {/* 內容區 */}
      <div className="p-4 flex-1">
          
          {/* Level 1: 五大分類 (可拖曳排序) */}
          {!selectedBigGroup && (
             <div className="space-y-1 animate-in slide-in-from-left-4 duration-300">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1 flex justify-between">
                    <span>庫存分類 (長按可排序)</span>
                </div>
                
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={categoryOrder} strategy={verticalListSortingStrategy}>
                        {categoryOrder.map(id => (
                            <SortableBigCategory 
                                key={id}
                                category={{
                                    id: id,
                                    label: bigGroupLabels[id],
                                    ...categoryConfig[id]
                                }}
                                count={bigGroupsCounts[id]}
                                onClick={() => setSelectedBigGroup(id)}
                                onEditLabel={(catId, name) => setEditingBigGroup({ id: catId, name })}
                            />
                        ))}
                    </SortableContext>
                </DndContext>
             </div>
          )}

          {/* Level 2: 型號列表 (條列式 + Icon) */}
          {selectedBigGroup && !activeCategory && (
              <div className="animate-in slide-in-from-right-4 duration-300">
                  <div className="space-y-1">
                      {currentFolders.length === 0 ? (
                          <div className="col-span-full text-center text-slate-400 mt-20"><Box size={48} className="mx-auto mb-3 opacity-20"/><p className="font-bold">此分類下尚無資料</p></div>
                      ) : (
                          currentFolders.map(model => {
                              const items = groupedInventory[model];
                              const lowStock = items.filter(i => i.qty === 0).length;
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

          {/* Level 3: 零件列表 (Accordion + List) */}
          {activeCategory && (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                  {currentItemsData.totalCount === 0 && <div className="text-center text-slate-400 mt-10"><p className="font-bold">沒有相關項目</p></div>}
                  {Object.keys(currentItemsData.grouped).sort().map(subGroupName => (
                      <AccordionGroup key={subGroupName} groupName={subGroupName} items={currentItemsData.grouped[subGroupName]} onEdit={setEditingItem} onRestock={handleRestock} />
                  ))}
                  {currentItemsData.ungrouped.length > 0 && (
                      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                          {Object.keys(currentItemsData.grouped).length > 0 && <div className="bg-slate-50 px-4 py-2 text-xs font-bold text-slate-400 border-b border-slate-100">其他未分類項目</div>}
                          {currentItemsData.ungrouped.map((item, idx) => (
                              <InventoryRow key={item.id} item={item} onEdit={setEditingItem} onRestock={handleRestock} isLast={idx === currentItemsData.ungrouped.length - 1} />
                          ))}
                      </div>
                  )}
              </div>
          )}
      </div>

      {/* 彈出視窗 */}
      <EditInventoryModal isOpen={!!editingItem || isAddMode} onClose={() => { setEditingItem(null); setIsAddMode(false); }} onSave={handleModalSave} onDelete={(id) => { onDeleteInventory(id); setEditingItem(null); }} initialItem={editingItem} existingModels={Object.keys(groupedInventory)} defaultModel={activeCategory} />
      
      {/* 分類/型號 改名視窗 */}
      <RenameModal 
          isOpen={!!groupToRename || !!editingBigGroup} 
          title={editingBigGroup ? "修改大分類名稱" : "修改型號名稱"}
          oldName={editingBigGroup ? editingBigGroup.name : groupToRename} 
          onClose={() => { setGroupToRename(null); setEditingBigGroup(null); }} 
          onRename={(old, newName) => {
              if (editingBigGroup) handleBigGroupRename(editingBigGroup.id, newName);
              else onRenameGroup(old, newName);
          }} 
      />
    </div>
  );
};

export default InventoryView;