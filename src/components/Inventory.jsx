import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Plus, Search, Folder, ChevronRight, ChevronDown, Edit3, 
  RotateCcw, CheckCircle, Package, Trash2, AlertTriangle, Box, Tag
} from 'lucide-react';

// --- 1. 編輯與新增視窗 (新增：次分類欄位) ---
const EditInventoryModal = ({ isOpen, onClose, onSave, onDelete, initialItem, existingModels, defaultModel }) => {
  // 新增 subGroup 欄位，用來做第二層收納
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
           {/* 主分類 */}
           <div>
             <label className="text-xs font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">主分類 (資料夾)</label>
             {!useCustomModel ? (
               <div className="flex gap-2">
                 <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-slate-700 font-bold text-base" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})}>
                   {existingModels.map(m => <option key={m} value={m}>{m}</option>)}
                 </select>
                 <button onClick={() => {setUseCustomModel(true);}} className="bg-blue-50 text-blue-600 px-3 rounded-xl text-sm font-bold whitespace-nowrap">自訂</button>
               </div>
             ) : (
                <div className="flex gap-2">
                  <input autoFocus placeholder="輸入新分類" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none font-bold text-base" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
                  <button onClick={() => setUseCustomModel(false)} className="bg-slate-100 text-slate-500 px-3 rounded-xl text-sm font-bold whitespace-nowrap">取消</button>
                </div>
             )}
           </div>

           {/* 次分類 (關鍵功能) */}
           <div>
               <label className="text-xs font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">次分類 (收攏群組)</label>
               <div className="relative">
                   <Tag size={16} className="absolute left-3 top-3.5 text-slate-400"/>
                   <input 
                      placeholder="例如: C3503 (選填)" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-9 pr-3 outline-none text-base text-slate-800 font-bold placeholder:font-normal placeholder:text-slate-400" 
                      value={formData.subGroup} 
                      onChange={e => setFormData({...formData, subGroup: e.target.value})} 
                   />
               </div>
               <p className="text-[10px] text-slate-400 mt-1 ml-1">若填寫相同名稱，列表會自動將它們收納在一起。</p>
           </div>
           
           <div>
               <label className="text-xs font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">項目名稱</label>
               <input placeholder="例: 黃色碳粉" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-lg text-slate-800 font-bold placeholder:font-normal" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
           </div>
           
           <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                  <label className="text-xs font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">目前數量</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-center font-mono font-bold text-lg text-blue-600" value={formData.qty} onChange={e => setFormData({...formData, qty: Number(e.target.value)})} />
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

// --- 2. 分類重新命名視窗 ---
const RenameGroupModal = ({ isOpen, onClose, onRename, oldName }) => {
  const [newName, setNewName] = useState(oldName || '');
  useEffect(() => { setNewName(oldName || ''); }, [oldName]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
      <div className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-800 mb-4">修改分類名稱</h3>
        <input autoFocus className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none mb-6 font-bold text-lg text-slate-700" value={newName} onChange={e => setNewName(e.target.value)} />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 bg-slate-100 font-bold text-slate-500 rounded-xl">取消</button>
          <button onClick={() => { onRename(oldName, newName); onClose(); }} className="flex-1 py-3 bg-blue-600 font-bold text-white rounded-xl shadow-lg">儲存</button>
        </div>
      </div>
    </div>
  );
};

// --- 3. 項目列表列 (List Item) - 正常化設計 ---
// 字體調整回 text-sm / text-base，不再巨大化
const InventoryRow = ({ item, onEdit, onRestock, isLast }) => {
    const isOut = item.qty === 0;
    
    // 正常化樣式：字體適中，背景乾淨
    const rowClass = isOut ? "bg-rose-50/60" : "bg-white hover:bg-slate-50";
    const textClass = isOut ? "text-rose-700" : "text-slate-700";
    const numClass = isOut ? "text-rose-600" : "text-blue-600";
    const borderClass = isLast ? "" : "border-b border-slate-100";

    return (
        <div 
            onClick={() => onEdit(item)} 
            className={`flex items-center justify-between py-3 px-4 transition-colors cursor-pointer ${rowClass} ${borderClass}`}
        >
            {/* 左側：品名 + 單位 */}
            <div className="flex items-center flex-1 min-w-0 mr-3">
                <span className={`text-[15px] font-bold truncate leading-tight ${textClass}`}>
                    {item.name}
                </span>
                <span className="text-xs font-bold text-slate-400 ml-2 shrink-0">
                    {item.unit}
                </span>
                {isOut && <span className="ml-2 px-1.5 py-0.5 bg-rose-200 text-rose-700 text-[10px] font-black rounded">缺貨</span>}
            </div>

            {/* 右側：標準大小數據 + 操作 */}
            <div className="flex items-center gap-3 shrink-0">
                <div className={`font-mono font-bold text-[15px] ${numClass}`}>
                    {item.qty} <span className="text-slate-300 text-xs font-bold">/ {item.max}</span>
                </div>
                
                <div onClick={e => e.stopPropagation()}>
                    {item.qty < item.max ? (
                        <button 
                            onClick={() => onRestock(item.id, item.max)} 
                            className="p-1.5 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
                        >
                            <RotateCcw size={18} />
                        </button>
                    ) : (
                        <div className="p-1.5 text-emerald-400">
                            <CheckCircle size={18} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- 4. 可收合的群組 (手風琴效果) ---
const AccordionGroup = ({ groupName, items, onEdit, onRestock }) => {
    const [isOpen, setIsOpen] = useState(false);
    const lowStockCount = items.filter(i => i.qty === 0).length;

    return (
        <div className="border border-slate-200 bg-white rounded-xl overflow-hidden shadow-sm mb-3">
            {/* 標題列：點擊展開/收合 */}
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`flex justify-between items-center px-4 py-3 cursor-pointer select-none transition-colors ${isOpen ? 'bg-slate-50 border-b border-slate-100' : 'bg-white hover:bg-slate-50'}`}
            >
                <div className="flex items-center gap-2">
                    {isOpen ? <ChevronDown size={18} className="text-slate-400"/> : <ChevronRight size={18} className="text-slate-400"/>}
                    <span className="text-base font-extrabold text-slate-800">{groupName}</span>
                </div>
                
                <div className="flex items-center gap-3">
                    {lowStockCount > 0 && (
                        <span className="flex items-center text-xs font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">
                            <AlertTriangle size={10} className="mr-1"/> {lowStockCount} 缺
                        </span>
                    )}
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                        {items.length} 項
                    </span>
                </div>
            </div>

            {/* 內容區域 */}
            {isOpen && (
                <div className="bg-white animate-in slide-in-from-top-1">
                    {items.map((item, idx) => (
                        <InventoryRow 
                            key={item.id} 
                            item={item} 
                            onEdit={onEdit} 
                            onRestock={onRestock}
                            isLast={idx === items.length - 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// --- 5. 分類卡片 (首頁大圖示) ---
const CategoryCard = ({ title, count, lowStock, onClick, onRename }) => {
    return (
        <div 
            onClick={onClick}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.03)] active:scale-95 transition-all cursor-pointer group relative overflow-hidden"
        >
            <div className="flex justify-between items-start mb-3">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {title.includes('碳粉') ? <Package size={24} /> : <Folder size={24} />}
                </div>
                <button 
                    onClick={(e) => { e.stopPropagation(); onRename(title); }}
                    className="p-2 text-slate-300 hover:text-blue-500 hover:bg-slate-50 rounded-lg transition-colors"
                >
                    <Edit3 size={16} />
                </button>
            </div>
            <h3 className="text-lg font-extrabold text-slate-800 mb-1 truncate">{title}</h3>
            <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                <span>{count} 個項目</span>
                {lowStock > 0 && (
                    <span className="text-rose-500 flex items-center bg-rose-50 px-1.5 py-0.5 rounded">
                        <AlertTriangle size={10} className="mr-1"/> {lowStock} 缺
                    </span>
                )}
            </div>
            <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300">
                <ChevronRight size={20} />
            </div>
        </div>
    );
};

// --- 6. 主視圖 ---
const InventoryView = ({ inventory, onUpdateInventory, onAddInventory, onDeleteInventory, onRenameGroup, onBack }) => {
  // 狀態
  const [activeCategory, setActiveCategory] = useState(null); 
  const [editingItem, setEditingItem] = useState(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [groupToRename, setGroupToRename] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); 

  // 資料處理：依 Model 分組 (主分類)
  const groupedInventory = useMemo(() => {
    const groups = {};
    inventory.forEach(item => {
      const model = item.model || '未分類';
      if (!groups[model]) groups[model] = [];
      groups[model].push(item);
    });
    return groups;
  }, [inventory]);

  const categories = useMemo(() => Object.keys(groupedInventory).sort(), [groupedInventory]);

  // 取得目前分類下的資料，並處理「次分類收攏」邏輯
  const currentCategoryData = useMemo(() => {
    if (!activeCategory) return { grouped: {}, ungrouped: [] };
    
    let list = groupedInventory[activeCategory] || [];
    // 搜尋過濾
    if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        list = list.filter(i => i.name.toLowerCase().includes(lower) || (i.subGroup && i.subGroup.toLowerCase().includes(lower)));
    }

    // 分離有 SubGroup 和沒有的
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

  // Handle Functions
  const handleRestock = (id, max) => {
    const item = inventory.find(i => i.id === id);
    if(item) onUpdateInventory({...item, qty: max});
  };

  const handleModalSave = (itemData) => {
    if (isAddMode) {
      onAddInventory(itemData);
      setIsAddMode(false);
    } else {
      onUpdateInventory(itemData);
      setEditingItem(null);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24 flex flex-col font-sans">
       
       {/* 頂部導覽列 */}
       <div className="bg-white/95 backdrop-blur px-4 py-3 shadow-sm sticky top-0 z-30 border-b border-slate-100/50">
         <div className="flex justify-between items-center">
            <div className="flex items-center overflow-hidden">
              <button 
                onClick={() => {
                    if (activeCategory) { setActiveCategory(null); setSearchTerm(''); } 
                    else onBack(); 
                }} 
                className="p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-full mr-1 transition-colors"
              >
                  <ArrowLeft size={24}/>
              </button>
              
              <div className="flex flex-col ml-1">
                  <h2 className="text-xl font-extrabold text-slate-800 tracking-wide truncate max-w-[150px]">
                      {activeCategory ? activeCategory : '庫存總覽'}
                  </h2>
                  {activeCategory && <span className="text-[10px] font-bold text-slate-400">點擊箭頭返回</span>}
              </div>
            </div>

            <button 
                onClick={() => setIsAddMode(true)} 
                className="flex items-center text-sm font-bold bg-blue-600 text-white px-3 py-2 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
            >
                <Plus size={18} className="mr-1"/>新增
            </button>
         </div>

         {/* 只有在列表項目很多時，才顯示搜尋框 */}
         {activeCategory && (currentCategoryData.totalCount > 8) && (
             <div className="mt-3 relative animate-in fade-in slide-in-from-top-1">
                <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
                <input 
                    className="w-full bg-slate-100 border-none rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-100 font-bold text-slate-700 transition-all placeholder-slate-400" 
                    placeholder={`搜尋 ${activeCategory} ...`}
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                />
             </div>
         )}
      </div>

      {/* 內容區 */}
      <div className="p-4 flex-1">
          
          {/* 模式 A: 首頁分類總覽 (Grid) */}
          {!activeCategory && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {categories.length === 0 ? (
                      <div className="col-span-full text-center text-slate-400 mt-20">
                          <Box size={48} className="mx-auto mb-3 opacity-20"/>
                          <p className="font-bold">目前沒有庫存資料</p>
                      </div>
                  ) : (
                      categories.map(cat => {
                          const items = groupedInventory[cat];
                          const lowStock = items.filter(i => i.qty === 0).length;
                          return (
                              <CategoryCard 
                                  key={cat} 
                                  title={cat} 
                                  count={items.length} 
                                  lowStock={lowStock} 
                                  onClick={() => setActiveCategory(cat)}
                                  onRename={setGroupToRename}
                              />
                          )
                      })
                  )}
              </div>
          )}

          {/* 模式 B: 分類詳細列表 (Accordion + List) */}
          {activeCategory && (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                  
                  {currentCategoryData.totalCount === 0 && (
                      <div className="text-center text-slate-400 mt-10">
                          <p className="font-bold">沒有相關項目</p>
                      </div>
                  )}

                  {/* 1. 先顯示有設定「次分類」的群組 (手風琴) */}
                  {Object.keys(currentCategoryData.grouped).sort().map(subGroupName => (
                      <AccordionGroup 
                          key={subGroupName}
                          groupName={subGroupName}
                          items={currentCategoryData.grouped[subGroupName]}
                          onEdit={setEditingItem}
                          onRestock={handleRestock}
                      />
                  ))}

                  {/* 2. 再顯示沒有次分類的散戶 (一般列表) */}
                  {currentCategoryData.ungrouped.length > 0 && (
                      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                          {Object.keys(currentCategoryData.grouped).length > 0 && (
                              <div className="bg-slate-50 px-4 py-2 text-xs font-bold text-slate-400 border-b border-slate-100">
                                  其他未分類項目
                              </div>
                          )}
                          {currentCategoryData.ungrouped.map((item, idx) => (
                              <InventoryRow 
                                  key={item.id} 
                                  item={item} 
                                  onEdit={setEditingItem} 
                                  onRestock={handleRestock}
                                  isLast={idx === currentCategoryData.ungrouped.length - 1}
                              />
                          ))}
                      </div>
                  )}

                  <div className="text-center pt-4">
                      <p className="text-[10px] text-slate-300 font-bold">
                          共 {currentCategoryData.totalCount} 筆
                      </p>
                  </div>
              </div>
          )}
      </div>

      {/* 彈出視窗 */}
      <EditInventoryModal 
        isOpen={!!editingItem || isAddMode} 
        onClose={() => { setEditingItem(null); setIsAddMode(false); }} 
        onSave={handleModalSave} 
        onDelete={(id) => { onDeleteInventory(id); setEditingItem(null); }} 
        initialItem={editingItem} 
        existingModels={categories} 
        defaultModel={activeCategory} 
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