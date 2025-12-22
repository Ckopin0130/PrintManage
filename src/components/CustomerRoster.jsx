import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Plus, Search, ChevronRight, Edit3, 
  Trash2, Box, Users, MapPin, Phone, MessageCircle,
  GripVertical, Settings, User, FileText, CheckCircle, Navigation,
  Building2, School, Tent, AlertTriangle, X
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
  MapPin, Users, Building2, School, Tent, Box, User, Settings, CheckCircle
};

const DEFAULT_CATEGORIES = [
  { id: 'cat_pingtung', name: '屏東區', icon: 'MapPin', color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' },
  { id: 'cat_kaohsiung', name: '高雄區', icon: 'Building2', color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-200' },
  { id: 'cat_school', name: '學校單位', icon: 'School', color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200' },
  { id: 'cat_military', name: '軍事單位', icon: 'Tent', color: 'text-purple-600', bg: 'bg-purple-100', border: 'border-purple-200' },
  { id: 'cat_other', name: '其他區域', icon: 'Users', color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' }
];

// 資料遷移 (相容舊資料)
const migrateCategory = (item) => {
    if (item.categoryId) return item.categoryId;
    const group = (item.L1_group || '').trim();
    if (group === '屏東區') return 'cat_pingtung';
    if (group === '高雄區') return 'cat_kaohsiung';
    if (group === '學校單位' || group.includes('學校')) return 'cat_school';
    if (group === '軍事單位' || group.includes('軍事')) return 'cat_military';
    return 'cat_other'; 
};

// --- 1. 編輯與新增視窗 ---
const EditCustomerModal = ({ isOpen, onClose, onSave, onDelete, initialItem, categories, defaultCategoryId, defaultGroup }) => {
  const [formData, setFormData] = useState({ 
      name: '', L1_group: '', L2_district: '', 
      phone: '', address: '', note: '', categoryId: '', model: ''
  });
  
  useEffect(() => {
    if (isOpen) {
      if (initialItem) {
        const firstPhone = initialItem.phones && initialItem.phones.length > 0 ? initialItem.phones[0].number : '';
        const firstModel = initialItem.assets && initialItem.assets.length > 0 ? initialItem.assets[0].model : '';
        
        setFormData({ 
            ...initialItem, 
            L2_district: initialItem.L2_district || '', 
            categoryId: initialItem.categoryId || migrateCategory(initialItem),
            phone: firstPhone,
            model: firstModel,
            note: initialItem.notes || ''
        });
      } else {
        const targetCatId = defaultCategoryId || categories[0]?.id || 'cat_other';
        setFormData({ 
            name: '', L2_district: defaultGroup || '', 
            phone: '', address: '', note: '', 
            categoryId: targetCatId, model: ''
        });
      }
    }
  }, [isOpen, initialItem, categories, defaultCategoryId, defaultGroup]);

  const handleSave = () => {
      const selectedCat = categories.find(c => c.id === formData.categoryId);
      const catName = selectedCat ? selectedCat.name : '未分類';

      const submissionData = {
          ...initialItem, 
          ...formData,
          L1_group: catName, 
          phones: formData.phone ? [{ label: '公司', number: formData.phone }] : [],
          assets: formData.model ? [{ model: formData.model }] : [],
          notes: formData.note
      };
      onSave(submissionData);
  };

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/60 z-[80] flex items-start justify-center pt-12 px-4 animate-in fade-in duration-200 overflow-y-auto" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl relative mb-10" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-4">
           <h3 className="text-xl font-bold text-slate-800">{initialItem ? '編輯客戶' : '新增客戶'}</h3>
           {initialItem && <button onClick={() => { if(window.confirm(`確定要刪除「${formData.name}」嗎？`)) onDelete(formData); }} className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors"><Trash2 size={20}/></button>}
        </div>
        
        <div className="space-y-4 mb-6">
           <div>
              <label className="text-sm font-bold text-slate-500 block mb-2">客戶分類 (區域)</label>
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
             <label className="text-sm font-bold text-slate-500 block mb-2">鄉鎮市區 / 群組</label>
             <input placeholder="例如: 屏東市" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none font-bold text-base" value={formData.L2_district} onChange={e => setFormData({...formData, L2_district: e.target.value})} />
           </div>
           <div>
               <label className="text-sm font-bold text-slate-500 block mb-2">客戶名稱</label>
               <input placeholder="輸入客戶名稱" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-base text-slate-800 font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
           </div>
           <div className="grid grid-cols-2 gap-3">
               <div>
                   <label className="text-sm font-bold text-slate-500 block mb-2">電話</label>
                   <input placeholder="08-xxxxxxx" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-base font-mono text-slate-700 font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
               </div>
               <div>
                   <label className="text-sm font-bold text-slate-500 block mb-2">機型</label>
                   <input placeholder="MP 3352" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-base text-slate-700 font-bold" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
               </div>
           </div>
           <div>
               <label className="text-sm font-bold text-slate-500 block mb-2">地址</label>
               <input placeholder="輸入完整地址" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-base text-slate-700 font-bold" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
           </div>
           <div>
               <label className="text-sm font-bold text-slate-500 block mb-2">備註</label>
               <textarea placeholder="其他備註..." rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-base text-slate-700 font-bold resize-none" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} />
           </div>
        </div>
        <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 bg-slate-100 font-bold text-slate-500 rounded-xl hover:bg-slate-200 transition-colors text-base">取消</button>
            <button onClick={() => { if(formData.name) handleSave(); }} className="flex-1 py-3 bg-blue-600 font-bold text-white rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors active:scale-95 text-base">儲存</button>
        </div>
      </div>
    </div>
  );
};

// --- 2. 分類管理視窗 ---
const CategoryManagerModal = ({ isOpen, onClose, categories, onSaveCategories }) => {
    const [localCats, setLocalCats] = useState([]);
    useEffect(() => { setLocalCats(categories); }, [categories, isOpen]);

    const handleAdd = () => {
        const newCat = { id: `cat_${Date.now()}`, name: '新分類', icon: 'MapPin', color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' };
        setLocalCats([...localCats, newCat]);
    };
    const handleChange = (id, key, val) => {
        setLocalCats(localCats.map(c => c.id === id ? { ...c, [key]: val } : c));
    };
    const handleDelete = (id) => {
        if(window.confirm('確定刪除？')) {
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
                    <button onClick={() => { onSaveCategories(localCats); onClose(); }} className="flex-1 py-3 bg-blue-600 font-bold text-white rounded-xl shadow-lg">儲存</button>
                </div>
            </div>
        </div>
    );
};

// --- Sortable Components (已修復手機滑動問題) ---

// Level 1
const SortableBigCategory = ({ category, count, onClick, isActive }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });
    // 注意：這裡移除了 touchAction: 'none'，讓容器可以滑動
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 50 : 'auto' };
    const Icon = ICON_MAP[category.icon] || MapPin;
    
    return (
        <div ref={setNodeRef} style={style} className={`w-full bg-white p-4 rounded-2xl shadow-sm border flex items-center active:scale-[0.98] transition-all group mb-3 relative cursor-pointer ${isActive ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-100 hover:border-blue-200'}`} onClick={onClick}>
            <div className={`p-3.5 rounded-2xl mr-4 border transition-colors shadow-sm ${category.bg} ${category.color} ${category.border}`}>
                <Icon size={24} strokeWidth={2.5} />
            </div>
            <div className="flex-1 text-left min-w-0">
                <h3 className="text-base font-bold text-slate-700 truncate mb-0.5">{category.name}</h3>
                <span className="text-xs font-bold text-slate-400 mt-1 block">共 {count} 戶</span>
            </div>
            {/* 只在把手上加上 touchAction: 'none'，限制拖曳只在把手上生效 */}
            <div {...attributes} {...listeners} style={{ touchAction: 'none' }} className="text-slate-300 cursor-grab active:cursor-grabbing hover:text-slate-500 p-3" onClick={e => e.stopPropagation()}><GripVertical size={20} /></div>
        </div>
    );
};

// Level 2
const SortableGroupRow = ({ id, title, count, onClick }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 50 : 'auto' };

    return (
        <div ref={setNodeRef} style={style} onClick={onClick} className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-[0_1px_3px_rgb(0,0,0,0.02)] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between mb-3 hover:border-blue-200 hover:shadow-md group">
            <div className="flex items-center flex-1 min-w-0">
                <div className={`p-2.5 rounded-lg mr-3.5 shrink-0 bg-slate-50 text-slate-500`}><MapPin size={20} /></div>
                <div className="min-w-0">
                    <h3 className="text-base font-extrabold text-slate-800 truncate mb-0.5">{title}</h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <span>{count} 戶</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center pl-2 gap-1">
                <div {...attributes} {...listeners} style={{ touchAction: 'none' }} className="text-slate-300 cursor-grab active:cursor-grabbing hover:text-slate-500 p-2" onClick={e => e.stopPropagation()}><GripVertical size={20} /></div>
                <ChevronRight className="text-slate-300 group-hover:text-blue-400 transition-colors" size={20} />
            </div>
        </div>
    );
};

// Level 3
const SortableCustomerRow = ({ item, onClick, onCall, onNav }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.customerID });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 50 : 'auto' };
    const phone = item.phones && item.phones.length > 0 ? item.phones[0].number : null;
    const model = item.assets && item.assets.length > 0 ? item.assets[0].model : '無機型';

    return (
        <div ref={setNodeRef} style={style} className={`flex items-center justify-between py-3 px-4 transition-colors bg-white hover:bg-slate-50 border-b border-slate-100 group touch-manipulation`}>
            <div className="flex items-center flex-1 min-w-0 mr-3 cursor-pointer" onClick={() => onClick(item)}>
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm mr-3 flex-shrink-0">
                    {item.name?.substring(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                        <span className={`text-base font-bold truncate text-slate-800`}>{item.name}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded ml-2 font-bold flex-shrink-0">{model}</span>
                    </div>
                    <div className="flex items-center text-xs text-slate-400 truncate">
                        {item.addressNote && <AlertTriangle size={12} className="text-rose-500 mr-1 flex-shrink-0" />}
                        <span className={`truncate ${item.addressNote ? 'text-rose-500 font-bold' : ''}`}>{item.address || '無地址'}</span>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-1 shrink-0">
                <button onClick={(e) => { e.stopPropagation(); onNav(item); }} className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 active:scale-90 transition-all">
                    <Navigation size={18} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onCall(item); }} className={`p-2 rounded-full transition-all active:scale-90 ${phone ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-gray-50 text-gray-300'}`}>
                    <Phone size={18} />
                </button>
                {/* 只有這裡才有 touchAction: none */}
                <div {...attributes} {...listeners} style={{ touchAction: 'none' }} className="text-slate-300 cursor-grab active:cursor-grabbing hover:text-slate-500 p-2 border-l border-slate-100 ml-1" onClick={e => e.stopPropagation()}>
                    <GripVertical size={18} />
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---
const CustomerRoster = ({ customers, onAddCustomer, onUpdateCustomer, onDeleteCustomer, onBack, setTargetCustomer, setShowAddressAlert, setShowPhoneSheet, showToast, setCurrentView, setSelectedCustomer }) => {
  const [categories, setCategories] = useState(() => {
      try {
          const saved = JSON.parse(localStorage.getItem('customerCategories'));
          return saved && saved.length > 0 ? saved : DEFAULT_CATEGORIES;
      } catch { return DEFAULT_CATEGORIES; }
  });
  
  const [selectedCatId, setSelectedCatId] = useState(null); 
  const [activeGroup, setActiveGroup] = useState(null); 
  const [editingItem, setEditingItem] = useState(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [isCatManagerOpen, setIsCatManagerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); 

  // 排序 State
  const [groupOrder, setGroupOrder] = useState(() => { try { return JSON.parse(localStorage.getItem('custGroupOrder')) || []; } catch { return []; } });
  const [customerOrder, setCustomerOrder] = useState(() => { try { return JSON.parse(localStorage.getItem('custOrder')) || []; } catch { return []; } });

  useEffect(() => { localStorage.setItem('customerCategories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('custGroupOrder', JSON.stringify(groupOrder)); }, [groupOrder]);
  useEffect(() => { localStorage.setItem('custOrder', JSON.stringify(customerOrder)); }, [customerOrder]);

  // 自動遷移舊資料
  useEffect(() => {
      let hasChanges = false;
      const newCustomers = customers.map(item => {
          if (!item.categoryId) {
              hasChanges = true;
              return { ...item, categoryId: migrateCategory(item) };
          }
          return item;
      });
  }, [customers]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), // 修正：加入距離限制，讓普通滑動更容易
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const itemsInCurrentCat = useMemo(() => {
      if (!selectedCatId) return [];
      return customers.filter(i => (i.categoryId || migrateCategory(i)) === selectedCatId);
  }, [customers, selectedCatId]);

  const groups = useMemo(() => {
      const g = {};
      itemsInCurrentCat.forEach(item => {
          const groupName = item.L2_district || '未分區';
          if (!g[groupName]) g[groupName] = [];
          g[groupName].push(item);
      });
      return Object.keys(g).sort((a, b) => {
          const idxA = groupOrder.indexOf(a);
          const idxB = groupOrder.indexOf(b);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return a.localeCompare(b);
      });
  }, [itemsInCurrentCat, groupOrder]);

  const currentItems = useMemo(() => {
      let list = itemsInCurrentCat;
      if (activeGroup) {
          list = list.filter(i => (i.L2_district || '未分區') === activeGroup);
      } else if (searchTerm) {
          list = customers.filter(i => 
              i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
              (i.phone && i.phones && i.phones.some(p => p.number.includes(searchTerm))) ||
              (i.address && i.address.includes(searchTerm))
          );
      } else {
          return [];
      }
      
      const strOrder = customerOrder.map(String);
      return list.sort((a, b) => {
          const idxA = strOrder.indexOf(String(a.customerID));
          const idxB = strOrder.indexOf(String(b.customerID));
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return a.name.localeCompare(b.name);
      });
  }, [itemsInCurrentCat, activeGroup, searchTerm, customers, customerOrder]);

  const catCounts = useMemo(() => {
      const counts = {};
      customers.forEach(i => {
          const cid = i.categoryId || migrateCategory(i);
          counts[cid] = (counts[cid] || 0) + 1;
      });
      return counts;
  }, [customers]);

  const handleDragEnd = (event) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      if (!selectedCatId) {
          const oldIdx = categories.findIndex(c => c.id === active.id);
          const newIdx = categories.findIndex(c => c.id === over.id);
          setCategories(arrayMove(categories, oldIdx, newIdx));
      } else if (!activeGroup) {
          setGroupOrder(prev => {
             const newOrder = [...prev];
             groups.forEach(f => { if(!newOrder.includes(f)) newOrder.push(f); });
             const oldIdx = newOrder.indexOf(active.id);
             const newIdx = newOrder.indexOf(over.id);
             return arrayMove(newOrder, oldIdx, newIdx);
          });
      } else {
          const currentIds = currentItems.map(i => String(i.customerID));
          const oldIdx = currentIds.indexOf(String(active.id));
          const newIdx = currentIds.indexOf(String(over.id));
          if (oldIdx !== -1 && newIdx !== -1) {
              const newOrder = arrayMove(currentIds, oldIdx, newIdx);
              setCustomerOrder(prev => {
                  const prevStrings = prev.map(String);
                  const otherItems = prevStrings.filter(id => !currentIds.includes(id));
                  return [...otherItems, ...newOrder];
              });
          }
      }
  };

  const handleBackNav = () => {
      if (activeGroup) setActiveGroup(null);
      else if (selectedCatId) setSelectedCatId(null);
      else onBack(); 
      setSearchTerm('');
  };

  const handleCall = (item) => {
      if (item.phones && item.phones.length > 0) {
          if (item.phones.length === 1) {
              window.location.href = `tel:${item.phones[0].number}`;
          } else {
              setTargetCustomer(item);
              setShowPhoneSheet(true);
          }
      } else {
          showToast('無電話資料', 'error');
      }
  };

  const handleNav = (item) => {
      if (!item.address) return showToast('無地址資料', 'error');
      if (item.addressNote) {
          setTargetCustomer(item);
          setShowAddressAlert(true);
      } else {
          window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address)}`, '_blank');
      }
  };

  const handleCustomerClick = (item) => {
      if (setSelectedCustomer) setSelectedCustomer(item);
      if (setCurrentView) setCurrentView('detail');
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24 flex flex-col font-sans">
       <div className="bg-white/95 backdrop-blur px-4 py-3 shadow-sm sticky top-0 z-30 border-b border-slate-100/50">
         <div className="flex justify-between items-center mb-3">
            <div className="flex items-center overflow-hidden flex-1">
              <button onClick={handleBackNav} className="p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-full mr-1 transition-colors"><ArrowLeft size={24}/></button>
              <h2 className="text-xl font-extrabold text-slate-800 tracking-wide truncate">
                  {activeGroup || (selectedCatId ? categories.find(c=>c.id===selectedCatId)?.name : '客戶名冊')}
              </h2>
            </div>
            <div className="flex items-center gap-2">
                {!selectedCatId && !activeGroup && (
                    <button onClick={() => setIsCatManagerOpen(true)} className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-blue-50 hover:text-blue-600" title="管理分類"><Settings size={20}/></button>
                )}
                <button onClick={() => setIsAddMode(true)} className="flex items-center text-sm font-bold bg-blue-600 text-white px-3 py-2 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"><Plus size={20} className="mr-1"/>新增</button>
            </div>
         </div>
         {!activeGroup && (
             <div className="relative animate-in fade-in slide-in-from-top-1 mb-1">
                <Search size={20} className="absolute left-3 top-2.5 text-slate-400" />
                <input className="w-full bg-slate-100 border-none rounded-xl py-2 pl-10 pr-4 text-base outline-none focus:ring-2 focus:ring-blue-100 font-bold text-slate-700 transition-all placeholder-slate-400" placeholder="搜尋客戶、電話或地址..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
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
              {selectedCatId && !activeGroup && !searchTerm && (
                  <div className="animate-in slide-in-from-right-4 duration-300 space-y-1">
                      {groups.length === 0 ? (
                          <div className="col-span-full text-center text-slate-400 mt-20"><Box size={48} className="mx-auto mb-3 opacity-20"/><p className="font-bold">此分類無客戶</p></div>
                      ) : (
                          <SortableContext items={groups} strategy={verticalListSortingStrategy}>
                              {groups.map(gName => {
                                  const items = itemsInCurrentCat.filter(i => (i.L2_district || '未分區') === gName);
                                  return (
                                      <SortableGroupRow key={gName} id={gName} title={gName} count={items.length} onClick={() => setActiveGroup(gName)} />
                                  );
                              })}
                          </SortableContext>
                      )}
                  </div>
              )}
              {(activeGroup || searchTerm) && (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm animate-in slide-in-from-right-4 duration-300">
                       {currentItems.length === 0 ? (
                           <div className="p-8 text-center text-slate-400">沒有找到相符的客戶</div>
                       ) : (
                           <SortableContext items={currentItems.map(i => i.customerID)} strategy={verticalListSortingStrategy}>
                                {currentItems.map((item) => (
                                    <SortableCustomerRow key={item.customerID} item={item} onClick={handleCustomerClick} onCall={handleCall} onNav={handleNav} />
                                ))}
                           </SortableContext>
                       )}
                  </div>
              )}
          </DndContext>
      </div>

      <EditCustomerModal isOpen={!!editingItem || isAddMode} onClose={() => { setEditingItem(null); setIsAddMode(false); }} onSave={(data) => { if (isAddMode) onAddCustomer(data); else onUpdateCustomer(data); setIsAddMode(false); setEditingItem(null); }} onDelete={onDeleteCustomer} initialItem={editingItem} categories={categories} defaultCategoryId={selectedCatId} defaultGroup={activeGroup} />
      <CategoryManagerModal isOpen={isCatManagerOpen} onClose={() => setIsCatManagerOpen(false)} categories={categories} onSaveCategories={setCategories} />
    </div>
  );
};

export default CustomerRoster;