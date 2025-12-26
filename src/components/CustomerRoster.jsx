import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Plus, Search, ChevronRight, Edit3, 
  Trash2, Box, Users, MapPin, Phone, MessageCircle,
  GripVertical, Settings, User, FileText, CheckCircle, Navigation,
  Building2, School, Tent, AlertTriangle, X, ChevronDown
} from 'lucide-react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, TouchSensor
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const ICON_MAP = { MapPin, Users, Building2, School, Tent, Box, User, Settings, CheckCircle };

const DEFAULT_CATEGORIES = [
  { id: 'cat_pingtung', name: '屏東區', icon: 'MapPin', color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' },
  { id: 'cat_kaohsiung', name: '高雄區', icon: 'Building2', color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-200' },
  { id: 'cat_school', name: '學校單位', icon: 'School', color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200' },
  { id: 'cat_military', name: '軍事單位', icon: 'Tent', color: 'text-purple-600', bg: 'bg-purple-100', border: 'border-purple-200' },
  { id: 'cat_other', name: '其他區域', icon: 'Users', color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' }
];

const migrateCategory = (item) => {
    if (item.categoryId) return item.categoryId;
    const group = (item.L1_group || '').trim();
    if (group === '屏東區') return 'cat_pingtung';
    if (group === '高雄區') return 'cat_kaohsiung';
    if (group === '學校單位' || group.includes('學校')) return 'cat_school';
    if (group === '軍事單位' || group.includes('軍事')) return 'cat_military';
    return 'cat_other'; 
};

// --- Edit Modal (修正：自訂下拉選單) ---
const EditCustomerModal = ({ isOpen, onClose, onSave, onDelete, initialItem, categories, defaultCategoryId, defaultGroup, customers }) => {
  const [formData, setFormData] = useState({ 
      name: '', L1_group: '', L2_district: '', phone: '', address: '', note: '', categoryId: '', model: ''
  });
  
  // 自訂下拉選單狀態
  const [showGroupSuggestions, setShowGroupSuggestions] = useState(false);
  
  // 計算現有的群組建議清單 (並過濾)
  const groupSuggestions = useMemo(() => {
      if (!formData.categoryId || !customers) return [];
      const inputVal = formData.L2_district || '';
      const allGroups = new Set(
          customers
            .filter(c => (c.categoryId || migrateCategory(c)) === formData.categoryId)
            .map(c => c.L2_district)
            .filter(g => g && g.trim() !== '' && g !== '未分區')
      );
      return [...allGroups].filter(g => g.includes(inputVal)).sort();
  }, [customers, formData.categoryId, formData.L2_district]);

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
            // 只使用 notes 欄位，忽略舊的 note 欄位
            note: initialItem.notes || '' 
        });
      } else {
        const targetCatId = defaultCategoryId || categories[0]?.id || 'cat_other';
        setFormData({ 
            name: '', L2_district: defaultGroup || '', phone: '', address: '', note: '', 
            categoryId: targetCatId, model: ''
        });
      }
      setShowGroupSuggestions(false);
    }
  }, [isOpen, initialItem, categories, defaultCategoryId, defaultGroup]);

  const handleSave = () => {
      const selectedCat = categories.find(c => c.id === formData.categoryId);
      const catName = selectedCat ? selectedCat.name : '未分類';
      const savedData = {
          ...initialItem, ...formData,
          L1_group: catName, 
          phones: formData.phone ? [{ label: '公司', number: formData.phone }] : [],
          assets: formData.model ? [{ model: formData.model }] : [],
          notes: formData.note || ''
      };
      // 明確刪除舊的 note 欄位，只保留 notes
      delete savedData.note;
      onSave(savedData);
  };

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-sm rounded-2xl shadow-2xl flex flex-col max-h-[85vh]"
        onClick={e => { e.stopPropagation(); setShowGroupSuggestions(false); }} // 點擊背景關閉選單
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-100 flex-shrink-0">
           <h3 className="text-xl font-bold text-slate-800">{initialItem ? '編輯客戶' : '新增客戶'}</h3>
           {initialItem && <button onClick={() => { if(window.confirm(`刪除 ${formData.name}？`)) onDelete(initialItem); }} className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100"><Trash2 size={20}/></button>}
        </div>
        
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
           <div>
              <label className="text-sm font-bold text-slate-500 block mb-2">客戶分類</label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none font-bold text-base" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
           </div>
           
           {/* 自訂下拉選單區域 */}
           <div className="relative">
               <label className="text-sm font-bold text-slate-500 block mb-2">鄉鎮 / 群組</label>
               <div className="relative">
                   <input 
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none font-bold text-base" 
                       placeholder="輸入或從下方選擇..."
                       value={formData.L2_district} 
                       onChange={e => {
                           setFormData({...formData, L2_district: e.target.value});
                           setShowGroupSuggestions(true);
                       }}
                       onFocus={() => setShowGroupSuggestions(true)}
                       onClick={(e) => { e.stopPropagation(); setShowGroupSuggestions(true); }} // 點擊時強制顯示
                   />
                   <div className="absolute right-3 top-3.5 text-slate-400 pointer-events-none"><ChevronDown size={16}/></div>
               </div>
               
               {/* 懸浮選單 */}
               {showGroupSuggestions && groupSuggestions.length > 0 && (
                   <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto animate-in fade-in slide-in-from-top-1">
                       {groupSuggestions.map(group => (
                           <div 
                               key={group}
                               className="p-3 hover:bg-blue-50 cursor-pointer text-slate-700 font-bold border-b border-slate-50 last:border-0"
                               onClick={(e) => {
                                   e.stopPropagation();
                                   setFormData({...formData, L2_district: group});
                                   setShowGroupSuggestions(false);
                               }}
                           >
                               {group}
                           </div>
                       ))}
                   </div>
               )}
           </div>

           <div><label className="text-sm font-bold text-slate-500 block mb-2">客戶名稱</label><input placeholder="輸入名稱" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none font-bold text-base" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
           <div className="grid grid-cols-2 gap-3">
               <div><label className="text-sm font-bold text-slate-500 block mb-2">電話</label><input placeholder="08-xxxxxxx" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none font-mono font-bold text-base" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
               <div><label className="text-sm font-bold text-slate-500 block mb-2">機型</label><input placeholder="MP 3352" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none font-bold text-base" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} /></div>
           </div>
           <div><label className="text-sm font-bold text-slate-500 block mb-2">地址</label><input placeholder="輸入地址" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none font-bold text-base" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
           <div><label className="text-sm font-bold text-slate-500 block mb-2">備註</label><textarea placeholder="備註..." rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none font-bold text-base resize-none" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} /></div>
        </div>

        <div className="p-5 border-t border-gray-100 flex gap-3 flex-shrink-0 bg-white rounded-b-2xl">
            <button onClick={onClose} className="flex-1 py-3 bg-slate-100 font-bold text-slate-500 rounded-xl">取消</button>
            <button onClick={() => { if(formData.name) handleSave(); }} className="flex-1 py-3 bg-blue-600 font-bold text-white rounded-xl shadow-lg">儲存</button>
        </div>
      </div>
    </div>
  );
};

// --- Category Manager ---
const CategoryManagerModal = ({ isOpen, onClose, categories, onSaveCategories }) => {
    const [localCats, setLocalCats] = useState([]);
    useEffect(() => { setLocalCats(categories); }, [categories, isOpen]);
    const handleAdd = () => setLocalCats([...localCats, { id: `cat_${Date.now()}`, name: '新分類', icon: 'MapPin', color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' }]);
    const handleChange = (id, val) => setLocalCats(localCats.map(c => c.id === id ? { ...c, name: val } : c));
    const handleDelete = (id) => { if(window.confirm('確定刪除？')) setLocalCats(localCats.filter(c => c.id !== id)); };
    if(!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center"><Settings className="mr-2"/> 管理分類</h3>
                <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
                    {localCats.map(cat => (
                        <div key={cat.id} className="flex items-center gap-2 p-2 border rounded-xl bg-slate-50">
                            <div className={`p-2 rounded-lg ${cat.bg} ${cat.color}`}><Box size={20}/></div>
                            <input className="flex-1 bg-transparent font-bold outline-none text-slate-700" value={cat.name} onChange={e => handleChange(cat.id, e.target.value)} />
                            <button onClick={() => handleDelete(cat.id)} className="p-2 text-rose-400 hover:bg-rose-50 rounded"><Trash2 size={18}/></button>
                        </div>
                    ))}
                    <button onClick={handleAdd} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold flex items-center justify-center"><Plus size={18} className="mr-1"/> 新增分類</button>
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 bg-slate-100 font-bold text-slate-500 rounded-xl">取消</button>
                    <button onClick={() => { onSaveCategories(localCats); onClose(); }} className="flex-1 py-3 bg-blue-600 font-bold text-white rounded-xl shadow-lg">儲存</button>
                </div>
            </div>
        </div>
    );
};

// --- Group Manager (新增：管理群組) ---
const GroupManagerModal = ({ isOpen, onClose, groups, onRenameGroup, onDeleteGroup }) => {
    const [localGroups, setLocalGroups] = useState([]);
    useEffect(() => { setLocalGroups(groups.map(g => ({ name: g, originalName: g }))); }, [groups, isOpen]);
    const handleChange = (originalName, newName) => {
        setLocalGroups(localGroups.map(g => g.originalName === originalName ? { ...g, name: newName } : g));
    };
    const handleDelete = (groupName) => {
        if(window.confirm(`確定刪除群組「${groupName}」？此操作將刪除該群組下的所有客戶。`)) {
            onDeleteGroup(groupName);
            onClose();
        }
    };
    const handleSave = () => {
        localGroups.forEach(g => {
            if (g.name !== g.originalName && g.name.trim() !== '') {
                onRenameGroup(g.originalName, g.name.trim());
            }
        });
        onClose();
    };
    if(!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center"><Settings className="mr-2"/> 管理群組</h3>
                <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
                    {localGroups.map(group => (
                        <div key={group.originalName} className="flex items-center gap-2 p-2 border rounded-xl bg-slate-50">
                            <div className="p-2 rounded-lg bg-slate-100 text-slate-600"><MapPin size={20}/></div>
                            <input className="flex-1 bg-transparent font-bold outline-none text-slate-700" value={group.name} onChange={e => handleChange(group.originalName, e.target.value)} />
                            <button onClick={() => handleDelete(group.originalName)} className="p-2 text-rose-400 hover:bg-rose-50 rounded"><Trash2 size={18}/></button>
                        </div>
                    ))}
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 bg-slate-100 font-bold text-slate-500 rounded-xl">取消</button>
                    <button onClick={handleSave} className="flex-1 py-3 bg-blue-600 font-bold text-white rounded-xl shadow-lg">儲存</button>
                </div>
            </div>
        </div>
    );
};

// --- Sortable Components ---
const SortableBigCategory = ({ category, count, onClick, isActive }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });
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
            <div {...attributes} {...listeners} style={{ touchAction: 'none' }} className="text-slate-300 cursor-grab active:cursor-grabbing hover:text-slate-500 p-3" onClick={e => e.stopPropagation()}><GripVertical size={20} /></div>
        </div>
    );
};

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

const SortableCustomerRow = ({ item, onClick }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.customerID });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 50 : 'auto' };
    const model = item.assets?.[0]?.model || '無機型';
    const nameFirstChar = item.name ? item.name.charAt(0) : '無';
    return (
        <div ref={setNodeRef} style={style} className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-[0_1px_3px_rgb(0,0,0,0.02)] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between mb-3 hover:border-blue-200 hover:shadow-md group">
            <div className="flex items-center flex-1 min-w-0" onClick={() => onClick(item)}>
                <div className="p-2.5 rounded-lg mr-3.5 shrink-0 bg-slate-50 text-slate-500 flex items-center justify-center font-bold text-base w-10 h-10">
                    {nameFirstChar}
                </div>
                <div className="min-w-0">
                    <h3 className="text-base font-extrabold text-slate-800 truncate mb-0.5">{item.name}</h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <span>{model}</span>
                        {item.addressNote && <AlertTriangle size={12} className="text-rose-500 flex-shrink-0"/>}
                        <span className="truncate">{item.address || '無地址'}</span>
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

// --- Main ---
const CustomerRoster = ({ customers, onAddCustomer, onUpdateCustomer, onDeleteCustomer, onBack, setTargetCustomer, setShowAddressAlert, setShowPhoneSheet, showToast, setCurrentView, setSelectedCustomer, onRenameGroup, onDeleteGroup }) => {
  const [categories, setCategories] = useState(() => { try { return JSON.parse(localStorage.getItem('customerCategories')) || DEFAULT_CATEGORIES; } catch { return DEFAULT_CATEGORIES; } });
  const [selectedCatId, setSelectedCatId] = useState(() => { try { return localStorage.getItem('rosterSelectedCatId') || null; } catch { return null; } }); 
  const [activeGroup, setActiveGroup] = useState(() => { try { return localStorage.getItem('rosterActiveGroup') || null; } catch { return null; } }); 
  const [editingItem, setEditingItem] = useState(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [isCatManagerOpen, setIsCatManagerOpen] = useState(false);
  const [isGroupManagerOpen, setIsGroupManagerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); 
  const [groupOrder, setGroupOrder] = useState(() => { try { return JSON.parse(localStorage.getItem('custGroupOrder')) || []; } catch { return []; } });
  const [customerOrder, setCustomerOrder] = useState(() => { try { return JSON.parse(localStorage.getItem('custOrder')) || []; } catch { return []; } });

  useEffect(() => { localStorage.setItem('customerCategories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('custGroupOrder', JSON.stringify(groupOrder)); }, [groupOrder]);
  useEffect(() => { localStorage.setItem('custOrder', JSON.stringify(customerOrder)); }, [customerOrder]);
  useEffect(() => { if (selectedCatId) localStorage.setItem('rosterSelectedCatId', selectedCatId); else localStorage.removeItem('rosterSelectedCatId'); }, [selectedCatId]);
  useEffect(() => { if (activeGroup) localStorage.setItem('rosterActiveGroup', activeGroup); else localStorage.removeItem('rosterActiveGroup'); }, [activeGroup]);

  // 自動遷移
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
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
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
          return a.localeCompare(b);
      });
  }, [itemsInCurrentCat, groupOrder]);

  const currentItems = useMemo(() => {
      let list = itemsInCurrentCat;
      if (activeGroup) {
          list = list.filter(i => (i.L2_district || '未分區') === activeGroup);
          // 第三層搜尋功能
          if (searchTerm) {
              const searchLower = searchTerm.toLowerCase();
              list = list.filter(i => {
                  const name = (i.name || '').toLowerCase();
                  const phone = (i.phones?.[0]?.number || '').toLowerCase();
                  const address = (i.address || '').toLowerCase();
                  return name.includes(searchLower) || phone.includes(searchLower) || address.includes(searchLower);
              });
          }
      } else if (selectedCatId && !activeGroup) {
          // 第二層搜尋功能
          if (searchTerm) {
              const searchLower = searchTerm.toLowerCase();
              list = list.filter(i => {
                  const name = (i.name || '').toLowerCase();
                  const phone = (i.phones?.[0]?.number || '').toLowerCase();
                  const address = (i.address || '').toLowerCase();
                  return name.includes(searchLower) || phone.includes(searchLower) || address.includes(searchLower);
              });
          } else {
              return [];
          }
      } else if (searchTerm) {
          list = customers.filter(i => {
              const searchLower = searchTerm.toLowerCase();
              const name = (i.name || '').toLowerCase();
              const phone = (i.phones?.[0]?.number || '').toLowerCase();
              const address = (i.address || '').toLowerCase();
              return name.includes(searchLower) || phone.includes(searchLower) || address.includes(searchLower);
          });
      } else return [];
      
      const strOrder = customerOrder.map(String);
      return list.sort((a, b) => {
          const idxA = strOrder.indexOf(String(a.customerID));
          const idxB = strOrder.indexOf(String(b.customerID));
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          return a.name.localeCompare(b.name);
      });
  }, [itemsInCurrentCat, activeGroup, searchTerm, customers, customerOrder, selectedCatId]);

  const catCounts = useMemo(() => {
      const counts = {};
      customers.forEach(i => { const cid = i.categoryId || migrateCategory(i); counts[cid] = (counts[cid] || 0) + 1; });
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
             return arrayMove(newOrder, newOrder.indexOf(active.id), newOrder.indexOf(over.id));
          });
      } else {
          const currentIds = currentItems.map(i => String(i.customerID));
          if (currentIds.includes(String(active.id))) {
              setCustomerOrder(prev => {
                  const newOrder = arrayMove(currentIds, currentIds.indexOf(String(active.id)), currentIds.indexOf(String(over.id)));
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
      else if (onBack) onBack(); 
      setSearchTerm('');
  };

  const handleCall = (item) => {
      if (item.phones?.length > 0) {
          if (item.phones.length === 1) window.location.href = `tel:${item.phones[0].number}`;
          else { setTargetCustomer(item); setShowPhoneSheet(true); }
      } else showToast('無電話資料', 'error');
  };

  const handleNav = (item) => {
      if (!item.address) return showToast('無地址資料', 'error');
      if (item.addressNote) { setTargetCustomer(item); setShowAddressAlert(true); }
      else window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address)}`, '_blank');
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
                    <button onClick={() => setIsCatManagerOpen(true)} className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-blue-50 hover:text-blue-600"><Settings size={20}/></button>
                )}
                {selectedCatId && !activeGroup && (
                    <button onClick={() => setIsGroupManagerOpen(true)} className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-blue-50 hover:text-blue-600"><Settings size={20}/></button>
                )}
                {activeGroup && (
                    <button onClick={() => setIsGroupManagerOpen(true)} className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-blue-50 hover:text-blue-600"><Settings size={20}/></button>
                )}
                <button onClick={() => setIsAddMode(true)} className="flex items-center text-sm font-bold bg-blue-600 text-white px-3 py-2 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"><Plus size={20} className="mr-1"/>新增</button>
            </div>
         </div>
         <div className="relative animate-in fade-in slide-in-from-top-1 mb-1">
            <Search size={20} className="absolute left-3 top-2.5 text-slate-400" />
            <input className="w-full bg-slate-100 border-none rounded-xl py-2 pl-10 pr-4 text-base outline-none focus:ring-2 focus:ring-blue-100 font-bold text-slate-700 transition-all placeholder-slate-400" placeholder="搜尋客戶、電話或地址..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
         </div>
      </div>

      <div className="p-4 flex-1">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              {!selectedCatId && !searchTerm && (
                 <div className="space-y-1 animate-in slide-in-from-left-4 duration-300">
                    <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                        {categories.map(cat => <SortableBigCategory key={cat.id} category={cat} count={catCounts[cat.id] || 0} onClick={() => setSelectedCatId(cat.id)} />)}
                    </SortableContext>
                 </div>
              )}
              {selectedCatId && !activeGroup && !searchTerm && (
                  <div className="animate-in slide-in-from-right-4 duration-300 space-y-1">
                      {groups.length === 0 ? <div className="col-span-full text-center text-slate-400 mt-20"><Box size={48} className="mx-auto mb-3 opacity-20"/><p className="font-bold">此分類無客戶</p></div> : (
                          <SortableContext items={groups} strategy={verticalListSortingStrategy}>
                              {groups.map(gName => <SortableGroupRow key={gName} id={gName} title={gName} count={itemsInCurrentCat.filter(i => (i.L2_district || '未分區') === gName).length} onClick={() => setActiveGroup(gName)} />)}
                          </SortableContext>
                      )}
                  </div>
              )}
              {(activeGroup || (selectedCatId && searchTerm) || (!selectedCatId && searchTerm)) && (
                  <div className="animate-in slide-in-from-right-4 duration-300 space-y-1">
                       {currentItems.length === 0 ? <div className="p-8 text-center text-slate-400">沒有找到相符的客戶</div> : (
                           <SortableContext items={currentItems.map(i => i.customerID)} strategy={verticalListSortingStrategy}>
                                {currentItems.map((item) => <SortableCustomerRow key={item.customerID} item={item} onClick={handleCustomerClick} />)}
                           </SortableContext>
                       )}
                  </div>
              )}
          </DndContext>
      </div>

      <EditCustomerModal isOpen={!!editingItem || isAddMode} onClose={() => { setEditingItem(null); setIsAddMode(false); }} onSave={(data) => { if (isAddMode) onAddCustomer(data); else onUpdateCustomer(data); setIsAddMode(false); setEditingItem(null); }} onDelete={onDeleteCustomer} initialItem={editingItem} categories={categories} defaultCategoryId={selectedCatId} defaultGroup={activeGroup} customers={customers} />
      <CategoryManagerModal isOpen={isCatManagerOpen} onClose={() => setIsCatManagerOpen(false)} categories={categories} onSaveCategories={setCategories} />
      <GroupManagerModal isOpen={isGroupManagerOpen} onClose={() => setIsGroupManagerOpen(false)} groups={groups} onRenameGroup={onRenameGroup} onDeleteGroup={onDeleteGroup} />
    </div>
  );
};

export default CustomerRoster;