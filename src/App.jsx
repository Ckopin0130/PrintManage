import React, { useState, useMemo, useEffect } from 'react';
import { 
  MapPin, Phone, User, Settings, FileText, Search, ClipboardList, PenTool, 
  ArrowLeft, Info, AlertTriangle, ChevronRight, Printer, Plus, Trash2, X, 
  Save, Edit, Building2, School, Tent, Users, Home, Bell, CheckCircle,
  Calendar, Clock, AlertCircle, Navigation, PhoneCall, Loader2, Database,
  Cloud, RefreshCcw, Download, ShieldAlert, Upload, RefreshCw, Zap, Camera, Briefcase, PhoneIncoming, Layers, ChevronUp, ChevronDown, RotateCcw, Box, Package
} from 'lucide-react';

// --- 引入 Firebase ---
import { auth, db, storage } from './firebaseConfig'; 
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, collection, onSnapshot, deleteDoc, writeBatch, query, orderBy, limit } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { FULL_IMPORT_DATA, MOCK_RECORDS, INITIAL_INVENTORY } from './initialData';

// --- 全局樣式 ---
const GlobalStyles = () => (
  <style>{`
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .animate-in { animation: fadeIn 0.3s ease-out forwards; }
    .slide-in-from-bottom { animation: slideUp 0.3s ease-out forwards; }
    .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `}</style>
);

// --- 修正重點：簡化資料庫路徑 ---
const COLLECTION_CUSTOMERS = 'customers'; // 直接放在根目錄
const COLLECTION_RECORDS = 'records';     // 直接放在根目錄

// --- 工具函數 ---
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.5));
      };
      img.onerror = (e) => reject(e);
    };
    reader.onerror = (e) => reject(e);
  });
};

const uploadImageToStorage = async (base64String, path) => {
  if (!storage) return base64String;
  const storageRef = ref(storage, path);
  await uploadString(storageRef, base64String, 'data_url');
  return await getDownloadURL(storageRef);
};

// --- 常數定義 ---
const SYMPTOM_CATEGORIES = {
  "進紙/傳送": ["卡紙 - 紙匣", "卡紙 - 定影部", "卡紙 - 對位輪", "卡紙 - ADF自動送稿機", "皺紙", "多張進紙", "無法進紙"],
  "影像品質": ["黑線/黑帶", "白點/白線", "列印太淡", "底灰", "全黑/全白", "定影不良/掉字", "色彩偏移"],
  "硬體/異音": ["跳故障碼 (SC Code)", "異音: 齒輪聲", "異音: 風扇聲", "異音: 雷射部", "碳粉溢出/漏碳", "廢碳粉瓶滿", "觸控螢幕無反應"],
  "其他": ["無法開機", "無法列印/網路", "驅動程式問題", "韌體更新", "例行保養"]
};
const STATUS_OPTIONS = [
  { id: 'completed', label: '完修結案', activeColor: 'bg-emerald-600 text-white', icon: CheckCircle, borderColor: 'border-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  { id: 'pending', label: '待料/擇日', activeColor: 'bg-amber-500 text-white', icon: Clock, borderColor: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-700' },
  { id: 'monitor', label: '觀察中', activeColor: 'bg-blue-600 text-white', icon: AlertCircle, borderColor: 'border-blue-200', bg: 'bg-blue-50', text: 'text-blue-700' },
];
const SOURCE_OPTIONS = [
  { id: 'invoice_check', label: '例行巡檢', desc: 'Routine', icon: ClipboardList, activeColor: 'bg-emerald-600 text-white', iconColor: 'text-emerald-600' },
  { id: 'customer_call', label: '客戶叫修', desc: 'On-Call', icon: PhoneIncoming, activeColor: 'bg-rose-600 text-white', iconColor: 'text-rose-600' },
  { id: 'company_dispatch', label: '專案派工', desc: 'Project', icon: Briefcase, activeColor: 'bg-blue-600 text-white', iconColor: 'text-blue-600' },
];

// --- UI 組件 ---
const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, isProcessing }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 animate-in" onClick={onCancel}>
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl scale-100 transition-transform" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6 leading-relaxed">{message}</p>
        <div className="flex space-x-3">
          <button onClick={onCancel} disabled={isProcessing} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold transition-colors disabled:opacity-50">取消</button>
          <button onClick={onConfirm} disabled={isProcessing} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-200 transition-colors flex items-center justify-center disabled:opacity-50">
            {isProcessing ? <Loader2 className="animate-spin mr-2" size={18}/> : <Trash2 className="mr-2" size={18}/>} 確認
          </button>
        </div>
      </div>
    </div>
  );
};

const RenameGroupModal = ({ isOpen, onClose, onRename, oldName }) => {
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

const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
  const bg = type === 'success' ? 'bg-emerald-600' : (type === 'error' ? 'bg-red-600' : 'bg-gray-800');
  const icon = type === 'success' ? <CheckCircle size={18} className="text-white"/> : <Info size={18} className="text-white"/>;
  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[80] ${bg} text-white px-4 py-3 rounded-full shadow-xl flex items-center space-x-2 animate-in`}>
      {icon} <span className="font-bold text-sm">{message}</span>
    </div>
  );
};

const PhoneActionSheet = ({ phones, onClose }) => {
  if (!phones || phones.length === 0) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-end justify-center animate-in" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-t-2xl p-4 space-y-3 pb-8" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-2"></div>
        <h3 className="text-lg font-bold text-center text-gray-700 border-b pb-3 mb-2">選擇聯絡方式</h3>
        {phones.map((p, idx) => (
          <a key={idx} href={`tel:${p.number ? p.number.replace(/[^0-9+]/g, '') : ''}`} className="w-full py-4 text-lg font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl active:scale-95 transition-all flex items-center justify-center space-x-3 no-underline">
            <PhoneCall size={20} /> <span>{p.label || '電話'}: {p.number}</span>
          </a>
        ))}
        <button type="button" onClick={onClose} className="w-full py-3 text-red-500 font-bold bg-white border border-gray-200 rounded-xl mt-2 hover:bg-gray-50">取消</button>
      </div>
    </div>
  );
};

const AddressAlertDialog = ({ customer, onClose }) => {
  if (!customer) return null;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customer.address || '')}`;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4 animate-in" onClick={onClose}>
      <div className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl transform scale-100 transition-transform" onClick={e => e.stopPropagation()}>
        <div className="flex items-center text-red-600 font-bold text-lg mb-3"><AlertTriangle className="mr-2" /> 特殊事項注意</div>
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-gray-800 text-base font-bold mb-5 leading-relaxed">{customer.addressNote}</div>
        <p className="text-xs text-gray-400 mb-5 border-t pt-3">地址：{customer.address}</p>
        <div className="flex space-x-3">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold transition-colors">取消</button>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center shadow-lg shadow-blue-200 transition-colors no-underline">
            <Navigation size={18} className="mr-1" /> 導航
          </a>
        </div>
      </div>
    </div>
  );
};

const ImageViewer = ({ src, onClose }) => {
  if (!src) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-[70] flex items-center justify-center p-2 animate-in" onClick={onClose}>
      <img src={src} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" alt="Full view" />
      <button className="absolute top-4 right-4 text-white bg-gray-800/50 p-2 rounded-full hover:bg-gray-700" onClick={onClose}><X size={24} /></button>
    </div>
  );
};

const BottomNavigation = ({ activeTab, onTabChange }) => (
  <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-2 px-4 flex justify-between items-center z-40 safe-area-bottom shadow-[0_-5px_20px_rgba(0,0,0,0.03)] pb-safe">
    {[
      { id: 'dashboard', label: '首頁', icon: Home },
      { id: 'roster', label: '客戶', icon: Users },
      { id: 'inventory', label: '庫存', icon: Package },
      { id: 'records', label: '紀錄', icon: FileText },
      { id: 'settings', label: '設定', icon: Settings },
    ].map(tab => (
      <button type="button" key={tab.id} onClick={() => onTabChange(tab.id)} className={`flex flex-col items-center justify-center space-y-1 transition-all w-1/5 py-1 ${activeTab === tab.id ? 'text-blue-600 scale-105' : 'text-gray-400 hover:text-gray-600'}`}>
        <tab.icon size={22} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
        <span className="text-[10px] font-medium">{tab.label}</span>
      </button>
    ))}
  </div>
);

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
        if (defaultModel && !existingModels.includes(defaultModel)) {
            setUseCustomModel(true);
        } else {
            setUseCustomModel(false);
        }
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
           <div>
             <label className="text-xs font-bold text-gray-500 block mb-1">零件名稱</label>
             <input placeholder="例: 定影上爪" className="w-full bg-gray-50 border rounded-lg p-2.5 outline-none text-base text-gray-800 font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
           </div>
           <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">目前庫存</label>
                <div className="flex items-center bg-gray-50 border rounded-lg overflow-hidden">
                   <input type="number" className="w-full p-2.5 outline-none text-center font-mono font-bold text-lg bg-transparent" value={formData.qty} onChange={e => setFormData({...formData, qty: Number(e.target.value)})} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">應備量</label>
                <input type="number" className="w-full bg-gray-50 border rounded-lg p-2.5 outline-none text-center font-mono" value={formData.max} onChange={e => setFormData({...formData, max: Number(e.target.value)})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">單位</label>
                <input placeholder="個" className="w-full bg-gray-50 border rounded-lg p-2.5 outline-none text-center" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
              </div>
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

  const toggleCategory = (model) => {
    setExpandedCategories(prev => ({...prev, [model]: !prev[model]}));
  };
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
  const handleModalDelete = (id) => {
    onDeleteInventory(id);
    setEditingItem(null);
  };
  const handleGroupRenameClick = (e, oldModel) => {
    e.stopPropagation();
    setGroupToRename(oldModel);
  };
  const handleAddWithModel = (e, model) => {
    e.stopPropagation();
    setAddingToGroupModel(model);
    setIsAddMode(true);
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
            <input 
              className="w-full bg-gray-100 rounded-lg py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-100 transition placeholder-gray-400" 
              placeholder="搜尋機型或零件..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
      </div>
      
      <div className="p-4 space-y-4">
          {Object.keys(groupedInventory).length === 0 ? (
            <div className="text-center text-gray-400 mt-20 flex flex-col items-center">
                <Box size={48} className="mb-4 text-gray-200" />
                <p>找不到相關零件</p>
            </div>
          ) : (
            Object.keys(groupedInventory).sort().map(model => {
              const isExpanded = expandedCategories[model];
              const items = groupedInventory[model];
              const lowStockCount = items.filter(i => i.qty === 0).length;

              return (
              <div key={model} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden slide-in-from-bottom">
                <div 
                  className="px-4 py-3 bg-gray-50/80 flex justify-between items-center cursor-pointer select-none active:bg-gray-100 transition-colors"
                  onClick={() => toggleCategory(model)}
                >
                  <div className="flex items-center flex-1">
                    <Layers size={16} className="text-blue-500 mr-2"/>
                    <h3 className="text-sm font-bold text-gray-700 mr-2">{model}</h3>
                    <button onClick={(e) => handleGroupRenameClick(e, model)} className="p-1.5 bg-white border border-gray-200 text-gray-400 hover:text-blue-600 rounded-lg shadow-sm mr-2 active:scale-90 transition-transform"><Edit3 size={12}/></button>
                    <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-bold">{items.length}</span>
                    {lowStockCount > 0 && <span className="ml-2 bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center"><AlertCircle size={10} className="mr-1"/>{lowStockCount} 缺貨</span>}
                  </div>
                  <div className="flex items-center">
                    <button 
                      onClick={(e) => handleAddWithModel(e, model)}
                      className="mr-3 w-7 h-7 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 active:scale-90 transition-transform"
                      title="在此分類新增"
                    >
                      <Plus size={14} />
                    </button>
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
                                <div className={`text-xl font-bold font-mono ${isLowStock ? 'text-red-600' : (isWarning ? 'text-amber-600' : 'text-blue-600')}`}>
                                    {item.qty}
                                </div>
                                {item.qty < item.max ? (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleRestock(item.id, item.max); }}
                                    className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors active:scale-90"
                                    title="一鍵補滿"
                                  >
                                    <RotateCcw size={14} />
                                  </button>
                                ) : (
                                  <div className="w-8 h-8 flex items-center justify-center text-gray-300"><CheckCircle size={16}/></div>
                                )}
                            </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )})
          )}
      </div>

      <EditInventoryModal 
        isOpen={!!editingItem || isAddMode} 
        onClose={() => { setEditingItem(null); setIsAddMode(false); setAddingToGroupModel(null); }} 
        onSave={handleModalSave}
        onDelete={handleModalDelete}
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

const SearchView = ({ customers, records, onSelectCustomer, onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedQuery(searchQuery); }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const results = useMemo(() => {
    const q = debouncedQuery.toLowerCase().trim();
    if (q === '') return { customers: [], records: [] };
    const matchCust = customers.filter(c => (c.name || '').toLowerCase().includes(q) || (c.address || '').toLowerCase().includes(q) || (c.L1_group || '').toLowerCase().includes(q) || (c.L2_district || '').toLowerCase().includes(q) || (c.phones || []).some(p => (p.number || '').includes(q)) || (c.assets || []).some(a => (a.model || '').toLowerCase().includes(q)));
    const matchRec = records.filter(r => (r.fault || '').toLowerCase().includes(q) || (r.solution || '').toLowerCase().includes(q));
    return { customers: matchCust, records: matchRec };
  }, [debouncedQuery, customers, records]);
  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      <div className="bg-white px-4 py-3 shadow-sm sticky top-0 z-10 border-b border-gray-100 flex items-center">
         <button onClick={onBack} className="p-2 -ml-2 text-gray-600 mr-2 hover:bg-gray-100 rounded-full"><ArrowLeft /></button>
         <div className="flex-1 bg-gray-100 rounded-xl flex items-center px-3 py-2.5">
            <Search size={18} className="text-gray-400 mr-2"/>
            <input autoFocus className="bg-transparent outline-none flex-1 text-base text-gray-800 placeholder-gray-400" placeholder="搜尋客戶、電話、機型..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}/>
             {searchQuery && <button onClick={() => setSearchQuery('')}><X size={18} className="text-gray-400"/></button>}
         </div>
      </div>
      <div className="p-4 space-y-6">
         {debouncedQuery === '' ? (
           <div className="text-center text-gray-400 mt-20 flex flex-col items-center"><Search size={48} className="text-gray-200 mb-4" /><p>輸入關鍵字開始搜尋</p></div>
         ) : (
           <>
             {results.customers.length > 0 && (
               <div className="slide-in-from-bottom">
                 <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 ml-1">客戶 ({results.customers.length})</h3>
                 <div className="space-y-3">
                   {results.customers.map(c => (
                     <div key={c.customerID} onClick={() => onSelectCustomer(c)} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center cursor-pointer active:scale-[0.98] transition-all hover:border-blue-200">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm mr-3 flex-shrink-0">{c.name?.[0] || '?'}</div>
                        <div className="flex-1 min-w-0"><div className="font-bold text-sm text-gray-800 truncate">{c.name}</div><div className="text-xs text-gray-400 truncate">{c.address}</div></div><ChevronRight size={16} className="text-gray-300" />
                     </div>
                   ))}
                 </div>
               </div>
             )}
             {results.records.length > 0 && (
               <div className="slide-in-from-bottom" style={{animationDelay: '0.1s'}}>
                 <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 ml-1 mt-2">維修紀錄 ({results.records.length})</h3>
                 <div className="space-y-3">
                   {results.records.map(r => {
                     const cust = customers.find(c => c.customerID === r.customerID);
                     return (
                       <div key={r.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                          <div className="flex justify-between items-center mb-1"><span className="text-xs text-blue-500 font-bold bg-blue-50 px-2 py-0.5 rounded">{r.date}</span><span className="text-xs text-gray-400">{cust?.name || '未知客戶'}</span></div>
                          <div className="font-bold text-sm text-gray-800">{r.fault}</div><div className="text-xs text-gray-500 mt-1 truncate">{r.solution}</div>
                       </div>
                     )
                   })}
                 </div>
               </div>
             )}
             {results.customers.length === 0 && results.records.length === 0 && <div className="text-center text-sm text-gray-400 mt-10">找不到符合的資料</div>}
           </>
         )}
      </div>
    </div>
  );
};

const CustomerForm = ({ mode, initialData, onSubmit, onCancel, onDelete }) => {
  const isEdit = mode === 'edit';
  const [formData, setFormData] = useState({
      name: initialData.name || '',
      L1_group: initialData.L1_group || '屏東區',
      L2_district: initialData.L2_district || '',
      address: initialData.address || '',
      addressNote: initialData.addressNote || '',
      phoneLabel: initialData.phones?.[0]?.label || '主要電話',
      phoneNumber: initialData.phones?.[0]?.number || '',
      model: initialData.assets?.[0]?.model || '',
      notes: initialData.notes || ''
  });
  const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
  };
  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      <div className="bg-white px-4 py-4 flex items-center shadow-sm sticky top-0 z-10 border-b border-gray-100">
        <button onClick={onCancel} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"><X /></button>
        <h2 className="text-lg font-bold flex-1 text-center pr-8">{isEdit ? '編輯客戶資料' : '新增客戶'}</h2>
      </div>
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold block mb-1.5 text-slate-700">區域分類</label>
              <select required className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none" value={formData.L1_group} onChange={e => setFormData({...formData, L1_group: e.target.value})}>
                {['屏東區', '高雄區', '學校單位', '軍事單位'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div><label className="text-sm font-bold block mb-1.5 text-slate-700">鄉鎮市區</label><input required placeholder="例：新園鄉" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none" value={formData.L2_district} onChange={e => setFormData({...formData, L2_district: e.target.value})} /></div>
          </div>
          <div><label className="text-sm font-bold block mb-1.5 text-slate-700">客戶名稱</label><input required placeholder="輸入客戶名稱" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
          <div><label className="text-sm font-bold block mb-1.5 text-slate-700">地址</label><input required placeholder="輸入完整地址" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
          <div><label className="text-sm font-bold block mb-1.5 text-red-500 flex items-center"><AlertTriangle size={14} className="mr-1"/> 注意事項</label><input placeholder="例：後門進入..." className="w-full p-3 bg-red-50 rounded-xl border border-red-100 outline-none text-red-700" value={formData.addressNote} onChange={e => setFormData({...formData, addressNote: e.target.value})} /></div>
          <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1"><label className="text-sm font-bold block mb-1.5 text-slate-700">稱呼</label><input placeholder="電話" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none" value={formData.phoneLabel} onChange={e => setFormData({...formData, phoneLabel: e.target.value})} /></div>
              <div className="col-span-2"><label className="text-sm font-bold block mb-1.5 text-slate-700">電話號碼</label><input placeholder="08-xxxxxxx" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} /></div>
          </div>
          <div><label className="text-sm font-bold block mb-1.5 text-slate-700">機器型號</label><input placeholder="例：MP 3352" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} /></div>
          <div><label className="text-sm font-bold block mb-1.5 text-slate-700">其他備註</label><textarea rows={3} placeholder="其他客戶細節..." className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
        </div>
        <button type="submit" className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 active:scale-[0.98] transition-transform flex items-center justify-center"><Save size={20} className="mr-2"/> {isEdit ? '儲存變更' : '確認新增'}</button>
        {isEdit && <div className="text-center mt-4"><button type="button" onClick={onDelete} className="text-red-400 text-sm font-bold px-4 py-2 hover:bg-red-50 rounded-lg transition-colors">刪除此客戶</button></div>}
      </form>
    </div>
  );
};

const RecordForm = ({ initialData, onSubmit, onCancel, historyList, onHistoryFilterChange, filterText, inventory }) => {
    const [form, setForm] = useState(initialData);
    const [currentPart, setCurrentPart] = useState({ name: "", qty: 1 });
    const [previews, setPreviews] = useState({ before: initialData.photoBefore || null, after: initialData.photoAfter || null });
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleQuickSymptom = (e) => { const val = e.target.value; if (val) setForm(prev => ({ ...prev, symptom: val })); };
    const addPart = () => { if (!currentPart.name.trim()) return; setForm(prev => ({ ...prev, parts: [...(prev.parts || []), { ...currentPart, id: Date.now() }] })); setCurrentPart({ name: "", qty: 1 }); };
    const removePart = (id) => { setForm(prev => ({ ...prev, parts: prev.parts.filter(p => p.id !== id) })); };

    const handleFileChange = async (e, type) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const compressedBase64 = await compressImage(file);
                setPreviews(prev => ({ ...prev, [type]: compressedBase64 }));
                setForm(prev => ({ ...prev, [`photo${type === 'before' ? 'Before' : 'After'}`]: compressedBase64 }));
            } catch (err) { console.error("圖片壓縮失敗", err); }
        }
    };
    const handleConfirm = async () => {
        if (isSubmitting) return; 
        setIsSubmitting(true);
        let finalForm = { ...form };
        try {
            if (finalForm.photoBefore && finalForm.photoBefore.startsWith('data:image')) {
                try { const url = await uploadImageToStorage(finalForm.photoBefore, `repairs/${Date.now()}_before.jpg`); finalForm.photoBefore = url; } catch(e) { console.warn("Upload failed", e); }
            }
            if (finalForm.photoAfter && finalForm.photoAfter.startsWith('data:image')) {
                try { const url = await uploadImageToStorage(finalForm.photoAfter, `repairs/${Date.now()}_after.jpg`); finalForm.photoAfter = url; } catch(e) { console.warn("Upload failed", e); }
            }
            await onSubmit(finalForm);
        } catch (e) { console.error(e); } finally { setIsSubmitting(false); }
    };
    return (
      <div className="bg-gray-50 min-h-screen pb-24 font-sans">
        <div className="bg-white px-4 py-4 flex items-center shadow-sm sticky top-0 z-10 border-b border-gray-100">
            <button onClick={onCancel} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"><ArrowLeft /></button>
            <h2 className="text-lg font-bold flex-1 text-center pr-8">維修紀錄表</h2>
        </div>
        <main className="max-w-md mx-auto p-4 space-y-5">
            <section className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-3 text-gray-500 text-xs font-bold uppercase tracking-wider">
                    <History size={14} /> 歷史履歷快搜
                </div>
                <div className="relative">
                    <input className="w-full bg-gray-50 border border-gray-200 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="輸入零件 (如: 定影, 鼓)..." value={filterText} onChange={e => onHistoryFilterChange(e.target.value)} />
                    {filterText && <button onClick={() => onHistoryFilterChange('')} className="absolute right-3 top-2.5 text-gray-400"><X size={14}/></button>}
                </div>
                {historyList.length > 0 && (
                   <div className="mt-2 max-h-40 overflow-y-auto space-y-2 border-t border-gray-100 pt-2">
                        {historyList.map(h => (
                            <div key={h.id} className="text-xs p-2 bg-blue-50 rounded border border-blue-100">
                                <div className="flex justify-between font-bold text-blue-800 mb-1"><span>{h.date}</span><span>{h.fault || h.symptom}</span></div>
                                <div className="text-gray-600">{h.solution || h.action}</div>
                                {h.parts && h.parts.length > 0 && <div className="mt-1 text-gray-500">更換: {h.parts.map(p=>p.name).join(', ')}</div>}
                            </div>
                        ))}
                    </div>
                )}
            </section>
            <section>
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">服務類型</h2>
                <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex gap-1">
                {SOURCE_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isSelected = form.serviceSource === option.id;
                    return (
                     <button key={option.id} type="button" onClick={() => setForm({ ...form, serviceSource: option.id })} className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-md transition-all duration-200 ${isSelected ? `${option.activeColor} shadow-md transform scale-[1.02]` : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}>
                        <div className="flex items-center gap-1.5 mb-0.5"><Icon className={`w-4 h-4 ${!isSelected && option.iconColor}`} /><span className="text-xs font-bold">{option.label}</span></div>
                    </button>
                    );
                })}
                </div>
            </section>
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2"><div className="bg-blue-100 p-1 rounded text-blue-700"><FileText className="w-3.5 h-3.5" /></div><h2 className="font-bold text-gray-700 text-sm">維修紀錄表</h2></div>
                    <input type="date" className="bg-transparent text-xs font-mono text-gray-500 outline-none text-right" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                </div>
                <div className="p-5 space-y-8 relative">
                    <div className="absolute left-[34px] top-[60px] bottom-[60px] w-0.5 bg-blue-100/50"></div>
                    <div className="relative pl-10">
                        <div className="absolute left-1 top-0.5 w-7 h-7 bg-blue-600 rounded text-white flex items-center justify-center text-xs font-bold z-10 shadow-sm ring-2 ring-white">1</div>
                        <div className="flex justify-between items-center mb-2">
                             <label className="text-sm font-bold text-gray-700">故障描述</label>
                            <div className="relative">
                                <select className="absolute opacity-0 inset-0 w-full cursor-pointer z-10" onChange={handleQuickSymptom} value=""><option value="" disabled>選擇...</option>
                                     {Object.entries(SYMPTOM_CATEGORIES).map(([category, items]) => (<optgroup key={category} label={category}>{items.map(item => <option key={item} value={item}>{item}</option>)}</optgroup>))}
                                </select>
                                <button type="button" className="flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition"><Zap className="w-3 h-3 fill-current" />快速帶入</button>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <input type="text" className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-300 rounded-md py-2.5 px-3 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="請輸入故障情形..." value={form.symptom} onChange={(e) => setForm({...form, symptom: e.target.value})} />
                            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded px-2 py-1 shadow-sm w-fit"><span className="text-[10px] font-bold text-gray-500 uppercase">SC Code</span><input type="text" placeholder="---" className="w-16 bg-transparent text-sm uppercase focus:outline-none font-mono text-gray-700 font-bold" value={form.errorCode} onChange={(e) => setForm({...form, errorCode: e.target.value.toUpperCase()})} /></div>
                        </div>
                    </div>
                    
                    <div className="relative pl-10">
                        <div className="absolute left-1 top-0.5 w-7 h-7 bg-white border-2 border-blue-600 rounded text-blue-700 flex items-center justify-center text-xs font-bold z-10 shadow-sm">2</div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">處置對策</label>
                        <textarea rows="3" className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-300 rounded-md p-3 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="請詳述處理過程..." value={form.action} onChange={(e) => setForm({...form, action: e.target.value})} ></textarea>
                    </div>
                    <div className="relative pl-10">
                        <div className="absolute left-1 top-0.5 w-7 h-7 bg-white border-2 border-gray-400 rounded text-gray-500 flex items-center justify-center text-xs font-bold z-10 shadow-sm">3</div>
                        <label className="text-sm font-bold text-gray-700 mb-3 block">零件更換</label>
                        <div className="flex gap-2 mb-3">
                            <input 
                                list="part-suggestions"
                                type="text" 
                                placeholder="料號 / 品名" 
                                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                value={currentPart.name} 
                                onChange={(e) => setCurrentPart({...currentPart, name: e.target.value})} 
                             />
                            <datalist id="part-suggestions">
                                {inventory.map(item => (
                                    <option key={item.id} value={item.name}>[{item.model}] {item.name} - 庫存:{item.qty}</option>
                                ))}
                            </datalist>
                            <input type="number" className="w-14 border border-gray-300 rounded-md px-2 py-2 text-center text-sm outline-none" value={currentPart.qty} min="1" onChange={(e) => setCurrentPart({...currentPart, qty: Number(e.target.value)})} />
                            <button type="button" onClick={addPart} className="bg-gray-800 text-white w-9 h-9 rounded-md flex items-center justify-center hover:bg-black transition shadow-sm"><Plus className="w-5 h-5" /></button>
                        </div>
                        {(form.parts && form.parts.length > 0) ? (
                            <div className="border border-gray-200 rounded-md overflow-hidden shadow-sm">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase border-b border-gray-200"><tr><th className="px-3 py-2">項目</th><th className="px-3 py-2 text-right">數量</th><th className="px-3 py-2 w-8"></th></tr></thead>
                                    <tbody className="divide-y divide-gray-100">{form.parts.map((part) => (<tr key={part.id} className="bg-white"><td className="px-3 py-2 text-gray-800">{part.name}</td><td className="px-3 py-2 text-right font-mono">{part.qty}</td><td className="px-3 py-2 text-right"><button type="button" onClick={() => removePart(part.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></td></tr>))}</tbody>
                                </table>
                            </div>
                        ) : <div className="text-gray-400 text-xs text-center py-4 border border-dashed border-gray-300 rounded-md bg-gray-50">無更換零件</div>}
                    </div>
                </div>
            </section>
            <section className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <label className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-md bg-gray-50 hover:bg-white hover:border-blue-400 transition cursor-pointer relative overflow-hidden h-32">
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'before')} />
                        {previews.before ? <img src={previews.before} alt="Before" className="absolute inset-0 w-full h-full object-cover" /> : <><Camera className="w-6 h-6 mb-2 text-gray-400" /><span className="text-xs font-bold text-gray-500">維修前照片</span></>}
                    </label>
                    <label className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-md bg-gray-50 hover:bg-white hover:border-blue-400 transition cursor-pointer relative overflow-hidden h-32">
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'after')} />
                        {previews.after ? <img src={previews.after} alt="After" className="absolute inset-0 w-full h-full object-cover" /> : <><Camera className="w-6 h-6 mb-2 text-gray-400" /><span className="text-xs font-bold text-gray-500">完修測試頁</span></>}
                    </label>
                </div>
                <div className="space-y-2">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">案件狀態</h2>
                    <div className="grid grid-cols-3 gap-2">
                        {STATUS_OPTIONS.map(option => {
                            const isSelected = form.status === option.id;
                            const Icon = option.icon;
                            return (
                                <button key={option.id} type="button" onClick={() => setForm({...form, status: option.id})} className={`py-3 rounded-xl font-bold text-sm border transition-all flex flex-col items-center justify-center gap-1 ${isSelected ? option.activeColor + ' shadow-md scale-[1.02] border-transparent' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
                                    <Icon className="w-4 h-4" />{option.label}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </section>
            <button className={`w-full py-4 text-white font-bold rounded-xl shadow-lg transition-transform flex items-center justify-center ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'}`} onClick={handleConfirm} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                {isSubmitting ? '資料上傳中...' : '確認並簽名 (Sign & Close)'}
            </button>
        </main>
      </div>
    );
};

// --- 6. Main Application ---
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentView, setCurrentView] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [viewingImage, setViewingImage] = useState(null);
  
  const [customers, setCustomers] = useState([]);
  const [records, setRecords] = useState([]);
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [dbStatus, setDbStatus] = useState('offline');
  const [isLoading, setIsLoading] = useState(true);

  // New State for Dialogs
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [toast, setToast] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const showToast = (message, type = 'success') => setToast({ message, type });

  // --- 修正後的 Firebase 連線邏輯 ---
  useEffect(() => {
    setDbStatus('connecting');

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // 連線成功，開始監聽資料
        const custRef = collection(db, COLLECTION_CUSTOMERS);
        const recRef = collection(db, COLLECTION_RECORDS);
        
        const unsubCust = onSnapshot(custRef, (snapshot) => {
            if (!snapshot.empty) {
              const data = snapshot.docs.map(d => ({ ...d.data(), customerID: d.id }));
              setCustomers(data);
            } else {
              setCustomers(FULL_IMPORT_DATA);
            }
            setDbStatus('online'); 
            setIsLoading(false);
          }, 
          (err) => { 
            console.error("連線錯誤，切換至離線資料", err); 
            setDbStatus('error');
            setCustomers(FULL_IMPORT_DATA);
            setRecords(MOCK_RECORDS);
            setIsLoading(false);
          }
        );

        const recentRecordsQuery = query(recRef, orderBy('date', 'desc'), limit(300));
        const unsubRec = onSnapshot(recentRecordsQuery, (snapshot) => {
            if (!snapshot.empty) {
                const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
                setRecords(data);
            } else {
                setRecords(MOCK_RECORDS);
            }
        });
        return () => { unsubCust(); unsubRec(); };
      } else { 
        // 嘗試匿名登入
        signInAnonymously(auth).catch((error) => {
             console.error("登入失敗", error);
             setDbStatus('offline');
             setCustomers(FULL_IMPORT_DATA);
             setRecords(MOCK_RECORDS);
             setIsLoading(false);
        });
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [rosterLevel, setRosterLevel] = useState('l1');
  const [selectedL1, setSelectedL1] = useState(null);
  const [selectedL2, setSelectedL2] = useState(null);
  const [historyFilter, setHistoryFilter] = useState('');
  const [targetCustomer, setTargetCustomer] = useState(null);
  const [showPhoneSheet, setShowPhoneSheet] = useState(false);
  const [showAddressAlert, setShowAddressAlert] = useState(false);
  const defaultRecordForm = { 
      id: null, serviceSource: 'customer_call', symptom: '', action: '', status: 'completed', errorCode: '',
      date: new Date().toISOString().split('T')[0], parts: [], types: []
  };
  const [editingRecordData, setEditingRecordData] = useState(defaultRecordForm); 

  const l1Groups = useMemo(() => {
    const groups = new Set(customers.map(c => c.L1_group || '未分類'));
    return ['屏東區', '高雄區', '學校單位', '軍事單位', ...groups].filter((v, i, a) => a.indexOf(v) === i && v);
  }, [customers]);
  const today = new Date().toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'long' });
  const pendingTasks = records.filter(r => r.status === 'pending').length;

  const getCountByL1 = (group) => customers.filter(c => c.L1_group === group).length;
  const getL1Icon = (group) => {
    const safeGroup = group || '';
    if (safeGroup.includes('屏東')) return <MapPin size={24} className="text-blue-500" />;
    if (safeGroup.includes('高雄')) return <Building2 size={24} className="text-orange-500" />;
    if (safeGroup.includes('學校')) return <School size={24} className="text-green-500" />;
    if (safeGroup.includes('軍事')) return <Tent size={24} className="text-purple-500" />;
    return <Users size={24} className="text-gray-500" />;
  };
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'dashboard') setCurrentView('dashboard');
    if (tab === 'roster') { setCurrentView('roster'); setRosterLevel('l1'); }
    if (tab === 'inventory') setCurrentView('inventory');
    if (tab === 'records') setCurrentView('records');
    if (tab === 'settings') setCurrentView('settings');
  };
  const serviceCounts = useMemo(() => {
    const counts = {};
    customers.forEach(c => {
        const custRecords = records.filter(r => r.customerID === c.customerID);
        const uniqueDates = new Set(custRecords.map(r => r.date));
        counts[c.customerID] = uniqueDates.size;
    });
    return counts;
  }, [customers, records]);
  const historyList = useMemo(() => {
    if (!historyFilter || !selectedCustomer) return [];
    const term = historyFilter.toLowerCase();
    const custRecords = records.filter(r => r.customerID === selectedCustomer.customerID);
    return custRecords.filter(r => 
        (r.fault || r.symptom || '').toLowerCase().includes(term) || 
        (r.solution || r.action || '').toLowerCase().includes(term) ||
        (r.parts && r.parts.some(p => p.name.toLowerCase().includes(term)))
    ).sort((a,b) => new Date(b.date) - new Date(a.date));
  }, [historyFilter, selectedCustomer, records]);
  // --- Inventory Handlers ---
  const updateInventory = (updatedItem) => {
    setInventory(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    showToast('庫存資料已更新');
  };
  const addInventoryItem = (newItem) => {
    const id = `p-${Date.now()}`;
    setInventory(prev => [...prev, { ...newItem, id }]);
    showToast('新零件已加入');
  };
  const deleteInventoryItem = (id) => {
    setInventory(prev => prev.filter(item => item.id !== id));
    showToast('零件已刪除');
  };
  const renameModelGroup = (oldModel, newModel) => {
    setInventory(prev => prev.map(item => item.model === oldModel ? { ...item, model: newModel } : item));
    showToast(`機型分類已更新：${newModel}`);
  };
  const handleExportData = () => {
    const dataStr = JSON.stringify({ customers, inventory, records }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('資料已匯出');
  };
  const handleImportData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.customers) setCustomers(data.customers);
        if (data.inventory) setInventory(data.inventory);
        if (data.records) setRecords(data.records);
        showToast('資料匯入成功');
      } catch (err) {
        console.error(err);
        showToast('匯入失敗：格式錯誤', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };
  // --- CRUD Handlers ---
  const handleResetData = async () => {
    setConfirmDialog({
        isOpen: true,
        title: '⚠️ 危險操作',
        message: '此操作將「清空」目前所有資料，並匯入完整的預設資料表。確定要執行嗎？',
        onConfirm: async () => {
            setIsProcessing(true);
            if (dbStatus === 'demo' || !db) {
                setCustomers(FULL_IMPORT_DATA);
                setRecords(MOCK_RECORDS);
                setInventory(INITIAL_INVENTORY);
                setTimeout(() => { showToast('資料已重置'); setIsProcessing(false); setConfirmDialog({...confirmDialog, isOpen: false}); }, 500);
            } else {
                try {
                    const batch = writeBatch(db);
                    customers.forEach(c => batch.delete(doc(db, COLLECTION_CUSTOMERS, c.customerID)));
                    FULL_IMPORT_DATA.forEach(c => batch.set(doc(db, COLLECTION_CUSTOMERS, c.customerID), c));
                    await batch.commit();
                    showToast('系統已重置');
                } catch(e) { console.error(e); }
                setIsProcessing(false);
                setConfirmDialog({...confirmDialog, isOpen: false});
            }
        }
    });
  };
  const handleSaveRecord = async (formData) => {
    const recId = formData.id || `rec-${Date.now()}`;
    const newRecord = {
        id: recId,
        customerID: selectedCustomer ? selectedCustomer.customerID : (formData.customerID || 'unknown'),
        ...formData,
        fault: formData.symptom, 
        solution: formData.action, 
        type: 'repair', 
        isTracking: formData.status === 'pending'
    };
    let inventoryUpdated = false;
    if (formData.parts && formData.parts.length > 0) {
      const newInventory = [...inventory];
      formData.parts.forEach(part => {
        const itemIndex = newInventory.findIndex(i => i.name === part.name);
        if (itemIndex > -1) {
          newInventory[itemIndex].qty = Math.max(0, newInventory[itemIndex].qty - part.qty);
          inventoryUpdated = true;
        }
      });
      if (inventoryUpdated) setInventory(newInventory);
    }

    if (dbStatus === 'demo' || !user) {
        setRecords(prev => {
            const exists = prev.find(r => r.id === recId);
            if (exists) return prev.map(r => r.id === recId ? newRecord : r);
            return [newRecord, ...prev];
        });
        showToast(formData.id ? '紀錄已更新' : '紀錄已新增 (庫存已扣除)');
        if (activeTab === 'records') setCurrentView('records'); else setCurrentView('detail');
        return;
    }

    try {
        await setDoc(doc(db, COLLECTION_RECORDS, recId), newRecord);
        showToast(formData.id ? '紀錄已更新' : '紀錄已新增');
        if (activeTab === 'records') setCurrentView('records'); else setCurrentView('detail');
    } catch (err) { console.error(err); showToast('儲存失敗', 'error'); }
  };
  
  const handleDeleteRecord = (e, recordId) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      if (!recordId) return;
      setConfirmDialog({
          isOpen: true,
          title: '刪除維修紀錄',
          message: '確定要刪除這筆紀錄嗎？此動作無法復原。',
          onConfirm: async () => {
              setIsProcessing(true);
              if (dbStatus === 'demo' || !user) {
                  setRecords(prev => prev.filter(r => String(r.id) !== String(recordId)));
                  showToast('紀錄已刪除');
                  setIsProcessing(false);
                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
              } else {
                  try {
                      await deleteDoc(doc(db, COLLECTION_RECORDS, recordId));
                      showToast('紀錄已刪除');
                  } catch (err) { console.error(err); showToast('刪除失敗', 'error'); }
                  setIsProcessing(false);
                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
              }
          }
      });
  };
  
  const handleDeleteCustomer = (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      if (!selectedCustomer || !selectedCustomer.customerID) return;
      const targetId = selectedCustomer.customerID;
      const targetName = selectedCustomer.name;
      setConfirmDialog({
          isOpen: true,
          title: '刪除客戶資料',
          message: `確定要刪除客戶「${targetName}」嗎？此動作無法復原。`,
          onConfirm: async () => {
              setIsProcessing(true);
              const goBack = () => {
                 if (rosterLevel === 'l3') { setRosterLevel('l2'); setCurrentView('roster'); } 
                 else { setRosterLevel('l1'); setCurrentView('roster'); }
                 setSelectedCustomer(null); 
              };
              if (dbStatus === 'demo' || !user) {
                  setCustomers(prev => prev.filter(c => String(c.customerID) !== String(targetId)));
                  showToast('客戶已刪除');
                  goBack();
              } else {
                  try {
                      await deleteDoc(doc(db, COLLECTION_CUSTOMERS, targetId));
                      showToast('客戶已刪除');
                      goBack();
                  } catch (err) { console.error(err); showToast('刪除失敗', 'error'); }
              }
              setIsProcessing(false);
              setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          }
      });
  };
  const handleEditSubmit = async (formData) => {
      if (!selectedCustomer) return;
      const existingPhones = selectedCustomer.phones || [];
      const newPhone = { label: formData.phoneLabel, number: formData.phoneNumber };
      const updatedPhones = existingPhones.length > 0 ? [newPhone, ...existingPhones.slice(1)] : [newPhone];
      const existingAssets = selectedCustomer.assets || [];
      const newAsset = { model: formData.model };
      const updatedAssets = existingAssets.length > 0 ? [newAsset, ...existingAssets.slice(1)] : [newAsset];
      const updatedEntry = {
        ...selectedCustomer,
        name: formData.name,
        L1_group: formData.L1_group,
        L2_district: formData.L2_district,
        address: formData.address,
        addressNote: formData.addressNote || '',
        notes: formData.notes || '',
        phones: updatedPhones,
        assets: updatedAssets
      };
      if (dbStatus === 'demo' || !user) {
          setCustomers(prev => prev.map(c => c.customerID === selectedCustomer.customerID ? updatedEntry : c));
          setSelectedCustomer(updatedEntry); 
          setCurrentView('detail');
          showToast('資料已更新');
          return;
      }
      try {
        await setDoc(doc(db, COLLECTION_CUSTOMERS, selectedCustomer.customerID), updatedEntry);
        setSelectedCustomer(updatedEntry); 
        setCurrentView('detail');
        showToast('資料已更新');
      } catch (err) { showToast('更新失敗', 'error'); }
  };
  const handleAddSubmit = async (formData) => {
    const newId = `cust-${Date.now()}`;
    const newEntry = {
      customerID: newId,
      name: formData.name, 
      L1_group: formData.L1_group, 
      L2_district: formData.L2_district, 
      address: formData.address, 
      addressNote: formData.addressNote || '',
      phones: [{ label: formData.phoneLabel, number: formData.phoneNumber }], 
      assets: [{ model: formData.model || '未設定' }], 
      notes: formData.notes || '',
      serviceCount: 0 
    };
    if (dbStatus === 'demo' || !user) {
        setCustomers(prev => [...prev, newEntry]);
        showToast('新增成功');
        setSelectedCustomer(newEntry);
        setCurrentView('detail');
        setSelectedL1(formData.L1_group);
        setSelectedL2(formData.L2_district);
        setRosterLevel('l3');
        return;
    }
    try {
        await setDoc(doc(db, COLLECTION_CUSTOMERS, newId), newEntry);
        showToast('新增成功');
        setSelectedCustomer(newEntry);
        setCurrentView('detail');
        setSelectedL1(formData.L1_group);
        setSelectedL2(formData.L2_district);
        setRosterLevel('l3'); 
    } catch (err) { showToast('新增失敗', 'error'); }
  };
  const startEdit = () => { if (!selectedCustomer) return; setCurrentView('edit'); };
  const startAddRecord = () => { setEditingRecordData(defaultRecordForm); setHistoryFilter(''); setCurrentView('add_record'); };
  const startEditRecord = (e, r) => {
      if(e) e.stopPropagation();
      const recordCustomer = customers.find(c => c.customerID === r.customerID);
      if (recordCustomer && !selectedCustomer) setSelectedCustomer(recordCustomer);
      setEditingRecordData({ ...defaultRecordForm, ...r, parts: r.parts || [] }); 
      setHistoryFilter('');
      setCurrentView('edit_record');
  };
  const handleNavClick = (customer) => {
    if (!customer.address) return showToast("無地址資料", 'error');
    if (customer.addressNote) { 
      setTargetCustomer(customer); 
      setShowAddressAlert(true);
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customer.address)}`;
      const newWindow = window.open(url, '_blank');
      if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') window.location.href = url;
    }
  };
  const renderRoster = () => {
    if (rosterLevel === 'l1') {
      return (
        <div className="bg-gray-50 min-h-screen pb-24 animate-in">
          <div className="bg-white px-4 py-4 flex items-center shadow-sm sticky top-0 z-10 border-b border-gray-100">
             <button onClick={() => { setActiveTab('dashboard'); setCurrentView('dashboard'); }} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"><Home size={20}/></button>
             <h2 className="text-lg font-bold flex-1 text-center pr-6">客戶名冊</h2>
             <div className="flex -mr-2"><button onClick={() => setCurrentView('search')} className="p-2 mr-1 text-gray-500 hover:bg-gray-100 rounded-full"><Search size={20}/></button><button onClick={() => { setCurrentView('add'); }} className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"><Plus size={20} /></button></div>
          </div>
          <div className="p-4 space-y-3">
             <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">選擇區域分類</div>
             {l1Groups.map(group => (
               <button key={group} onClick={() => { setSelectedL1(group); setRosterLevel('l2'); }} className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center active:scale-[0.98] transition-all hover:border-blue-200">
                 <div className="bg-blue-50 p-3 rounded-full mr-4 text-blue-600 border border-blue-100">{getL1Icon(group)}</div>
                 <div className="flex-1 text-left"><h3 className="text-base font-bold text-gray-800">{group}</h3><span className="text-xs text-gray-500 font-medium">共 {getCountByL1(group)} 位客戶</span></div><ChevronRight className="text-gray-300" />
               </button>
             ))}
          </div>
        </div>
      );
    }
    if (rosterLevel === 'l2') {
      const l2List = [...new Set(customers.filter(c => c.L1_group === selectedL1).map(c => c.L2_district || '未分區'))].map(d => ({ name: d, count: customers.filter(c => c.L1_group === selectedL1 && (c.L2_district || '未分區') === d).length })).sort((a, b) => b.count - a.count);
      return (
        <div className="bg-gray-50 min-h-screen pb-24 animate-in">
           <div className="bg-white px-4 py-4 flex items-center shadow-sm sticky top-0 z-10 border-b border-gray-100">
             <button onClick={() => setRosterLevel('l1')} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"><ArrowLeft /></button>
             <h2 className="text-lg font-bold flex-1 text-center pr-8">{selectedL1}</h2>
             <div className="flex -mr-2"><button onClick={() => setCurrentView('search')} className="p-2 mr-1 text-gray-500 hover:bg-gray-100 rounded-full"><Search size={20}/></button><button onClick={() => { setCurrentView('add'); }} className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"><Plus size={20} /></button></div>
           </div>
          <div className="p-4 grid grid-cols-2 gap-3">
             {l2List.map(item => (
                 <button key={item.name} onClick={() => { setSelectedL2(item.name); setRosterLevel('l3'); }} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center active:scale-[0.98] transition-all h-32 hover:border-blue-300 hover:shadow-md">
                   {getL1Icon(selectedL1)}<h3 className="font-bold text-gray-800 text-base text-center">{item.name}</h3><span className="text-xs bg-gray-100 text-gray-600 font-medium px-2 py-0.5 rounded-md mt-2">{item.count} 戶</span>
                 </button>
             ))}
          </div>
        </div>
      );
    }
    if (rosterLevel === 'l3') {
      const filteredCustomers = customers.filter(c => c.L1_group === selectedL1 && (c.L2_district || '未分區') === selectedL2);
      return (
        <div className="bg-gray-50 min-h-screen pb-24 animate-in">
          <div className="bg-white px-4 py-4 flex items-center shadow-sm sticky top-0 z-10 border-b border-gray-100">
            <button onClick={() => setRosterLevel('l2')} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"><ArrowLeft /></button>
            <h2 className="text-lg font-bold flex-1 text-center pr-8">{selectedL2}</h2>
            <div className="flex -mr-2"><button onClick={() => setCurrentView('search')} className="p-2 mr-1 text-gray-500 hover:bg-gray-100 rounded-full"><Search size={20}/></button><button onClick={() => { setCurrentView('add'); }} className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"><Plus size={20} /></button></div>
          </div>
          <div className="p-4 space-y-3">
             {filteredCustomers.map(customer => (
                <div key={customer.customerID} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                   <div className="flex items-start mb-3 cursor-pointer" onClick={() => { setSelectedCustomer(customer); setHistoryFilter(''); setCurrentView('detail'); }}>
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm mr-3 flex-shrink-0">{customer.name?.substring(0, 1)}</div>
                      <div className="flex-1 min-w-0"><div className="flex justify-between items-start"><h3 className="font-bold text-gray-800 text-base truncate">{customer.name}</h3><span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-1 rounded-full font-bold ml-2 flex-shrink-0">{customer.assets?.[0]?.model || '無機型'}</span></div><div className="flex items-center text-xs text-gray-500 mt-1">{customer.addressNote && <AlertTriangle size={12} className="text-red-500 mr-1 flex-shrink-0" />}<span className={`truncate ${customer.addressNote ? 'text-red-500 font-bold' : ''}`}>{customer.address}</span></div></div>
                   </div>
                   <div className="flex space-x-2 border-t border-gray-50 pt-3">
                      {customer.addressNote ? (
                        <button type="button" onClick={(e) => { e.stopPropagation(); setTargetCustomer(customer); setShowAddressAlert(true); }} className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold flex items-center justify-center hover:bg-blue-100 transition-colors"><Navigation size={16} className="mr-1.5"/> 導航</button>
                      ) : (
                        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customer.address)}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold flex items-center justify-center hover:bg-blue-100 transition-colors no-underline"><Navigation size={16} className="mr-1.5"/> 導航</a>
                      )}
                      {customer.phones?.length === 1 ? (
                          <a href={`tel:${customer.phones[0].number ? customer.phones[0].number.replace(/[^0-9+]/g, '') : ''}`} onClick={(e) => e.stopPropagation()} className="flex-1 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-bold flex items-center justify-center hover:bg-green-100 no-underline"><Phone size={16} className="mr-1.5"/> 撥號</a>
                      ) : (
                          <button type="button" onClick={(e) => { e.stopPropagation(); if(customer.phones?.length>0) {setTargetCustomer(customer); setShowPhoneSheet(true);} else showToast('無電話資料', 'error'); }} className="flex-1 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-bold flex items-center justify-center hover:bg-green-100"><Phone size={16} className="mr-1.5"/> 撥號</button>
                      )}
                   </div>
                </div>
             ))}
          </div>
        </div>
      );
    }
  };

  const renderDashboard = () => (
    <div className="pb-24 bg-gray-50 min-h-screen animate-in">
      <div className="bg-white pt-12 pb-6 px-6 shadow-sm mb-6 rounded-b-[2rem]">
         <div className="flex justify-between items-start mb-6">
           <div><div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{today}</div><h1 className="text-3xl font-bold text-gray-800 tracking-tight">早安，工程師</h1></div>
           <div className="relative"><button className="bg-gray-100 p-2.5 rounded-full text-gray-600 hover:bg-gray-200 transition-colors shadow-sm"><Bell size={24} /></button>{pendingTasks > 0 && <span className="absolute top-0 right-0 bg-red-500 w-3.5 h-3.5 rounded-full border-2 border-white"></span>}</div>
         </div>
         <div className="grid grid-cols-3 gap-3 mb-6">
            <div onClick={() => setCurrentView('tracking')} className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-3 text-white shadow-lg shadow-blue-200 transform transition-transform hover:scale-105 active:scale-95 cursor-pointer flex flex-col justify-between h-28">
              <div className="flex justify-between items-start opacity-80"><ClipboardList size={20}/></div>
              <div><div className="text-2xl font-bold">{pendingTasks}</div><div className="text-[10px] text-blue-100 font-medium">待辦追蹤</div></div>
            </div>
            <div onClick={() => setCurrentView('worklog')} className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm transform transition-transform hover:scale-105 active:scale-95 cursor-pointer flex flex-col justify-between h-28">
               <div className="flex justify-between items-start text-green-500"><CheckCircle size={20}/></div>
               <div><div className="text-2xl font-bold text-gray-800">{records.filter(r=>r.date === new Date().toISOString().split('T')[0]).length}</div><div className="text-[10px] text-gray-400 font-medium">今日完成</div></div>
            </div>
            <div onClick={() => { setActiveTab('roster'); setCurrentView('roster'); setRosterLevel('l1'); }} className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm transform transition-transform hover:scale-105 active:scale-95 cursor-pointer flex flex-col justify-between h-28">
               <div className="flex justify-between items-start text-purple-500"><Users size={20}/></div>
               <div><div className="text-2xl font-bold text-gray-800">{customers.length}</div><div className="text-[10px] text-gray-400 font-medium">總客戶數</div></div>
            </div>
         </div>
      </div>
      <div className="px-6">
        <h2 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider pl-1">快速存取</h2>
        <div className="grid grid-cols-2 gap-4">
           {[
             { title: '客戶名冊', sub: '管理與導航', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', action: () => { setActiveTab('roster'); setCurrentView('roster'); setRosterLevel('l1'); } },
             { title: '服務紀錄', sub: '查詢歷史單', icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50', action: () => { setActiveTab('records'); setCurrentView('records'); } },
             { title: '全域搜尋', sub: '電話/機型', icon: Search, color: 'text-purple-600', bg: 'bg-purple-50', action: () => setCurrentView('search') },
             { title: '車載庫存', sub: '零件數量管理', icon: Package, color: 'text-green-600', bg: 'bg-green-50', action: () => { setActiveTab('inventory'); setCurrentView('inventory'); } },
             { title: '追蹤儀表', sub: `${pendingTasks} 件待辦`, icon: ClipboardList, color: 'text-red-600', bg: 'bg-red-50', action: () => setCurrentView('tracking') },
             { title: '工作日誌', sub: '日報表生成', icon: PenTool, color: 'text-indigo-600', bg: 'bg-indigo-50', action: () => setCurrentView('worklog') },
           ].map((item, idx) => (
             <button key={idx} onClick={item.action} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-start hover:shadow-md hover:border-blue-200 transition-all active:scale-[0.98]">
               <div className={`${item.bg} ${item.color} p-3 rounded-xl mb-3`}><item.icon size={24} /></div><span className="font-bold text-gray-800 text-lg">{item.title}</span><span className="text-xs text-gray-400 mt-1">{item.sub}</span>
             </button>
           ))}
        </div>
      </div>
    </div>
  );
  const renderTracking = () => {
    const trackingRecords = records.filter(r => r.status === 'pending' || r.status === 'monitor');
    return (
       <div className="bg-gray-50 min-h-screen pb-24 animate-in">
        <div className="bg-white px-4 py-4 flex items-center shadow-sm sticky top-0 z-10 border-b border-gray-100">
           <button onClick={() => {setCurrentView('dashboard');}} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"><ArrowLeft /></button>
           <h2 className="text-lg font-bold flex-1 text-center pr-8">待辦事項追蹤</h2>
        </div>
        <div className="p-4 space-y-4">
           {trackingRecords.length === 0 ? <div className="text-center text-gray-400 mt-10">目前無待辦事項</div> : trackingRecords.map(r => {
             const cust = customers.find(c => c.customerID === r.customerID);
             return (
               <div key={r.id} onClick={(e) => startEditRecord(e, r)} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-amber-400 cursor-pointer hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                     <span className="text-xs font-bold text-gray-500">{r.date}</span>
                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${r.status==='pending'?'bg-amber-100 text-amber-700':'bg-blue-100 text-blue-700'}`}>{r.status === 'pending' ? '待料' : '觀察中'}</span>
                  </div>
                  <h3 className="font-bold text-gray-800">{cust ? cust.name : '未知客戶'}</h3>
                  <div className="text-sm text-gray-600 mt-1">{r.fault}</div>
                  <div className="text-xs text-gray-400 mt-2 flex items-center"><AlertCircle size={12} className="mr-1"/> 點擊編輯後續處置</div>
               </div>
             )
           })}
        </div>
       </div>
    );
  };

  const renderWorkLog = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysRecords = records.filter(r => r.date === todayStr);
    const generateLogText = () => {
        return todaysRecords.map((r, i) => {
            const cust = customers.find(c => c.customerID === r.customerID);
            return `${i+1}. ${cust?.name || '未知'}\n    故障: ${r.fault}\n    處理: ${r.solution}\n    狀態: ${r.status === 'completed' ? '完修' : '待追蹤'}`;
        }).join('\n\n');
    };
    const copyLog = () => {
        const text = generateLogText();
        if (!text) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => showToast('已複製到剪貼簿')).catch(() => showToast('複製失敗', 'error'));
        } else {
             const textArea = document.createElement("textarea");
             textArea.value = text;
             document.body.appendChild(textArea);
             textArea.select();
             document.execCommand("Copy");
             textArea.remove();
             showToast('已複製到剪貼簿');
        }
    };
    return (
       <div className="bg-gray-50 min-h-screen pb-24 animate-in">
        <div className="bg-white px-4 py-4 flex items-center shadow-sm sticky top-0 z-10 border-b border-gray-100">
           <button onClick={() => {setCurrentView('dashboard');}} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"><ArrowLeft /></button>
           <h2 className="text-lg font-bold flex-1 text-center pr-8">今日工作日誌</h2>
           <button onClick={copyLog} className="text-blue-600 font-bold text-sm bg-blue-50 px-3 py-1.5 rounded-lg active:scale-95 transition-transform">複製</button>
        </div>
        <div className="p-4">
           <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm font-mono text-sm text-gray-700 whitespace-pre-wrap min-h-[300px]">
              {todaysRecords.length > 0 ? generateLogText() : "今日尚無維修紀錄..."}
           </div>
        </div>
       </div>
    );
};

  const renderRecords = () => {
    return (
      <div className="bg-gray-50 min-h-screen pb-24 animate-in">
        <div className="bg-white px-4 py-4 flex items-center shadow-sm sticky top-0 z-10 border-b border-gray-100">
           <button onClick={() => {setCurrentView('dashboard'); setActiveTab('dashboard');}} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"><ArrowLeft /></button>
           <h2 className="text-lg font-bold flex-1 text-center pr-8">服務紀錄總覽 (Top 300)</h2>
        </div>
        <div className="p-4 space-y-4">
            {records.length === 0 ? <div className="text-center text-gray-400 mt-10">尚無任何紀錄</div> : records.map(r => {
             const cust = customers.find(c => c.customerID === r.customerID);
             let statusColor = "bg-emerald-100 text-emerald-700";
             if(r.status === 'pending') statusColor = "bg-amber-100 text-amber-700";
             if(r.status === 'monitor') statusColor = "bg-blue-100 text-blue-700";
             return (
               <div key={r.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                     <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded flex items-center"><Calendar size={12} className="mr-1"/>{r.date}</span>
                     <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusColor}`}>{r.status === 'pending' ? '待料' : (r.status === 'monitor' ? '觀察' : '結案')}</span>
                        <button onClick={(e) => startEditRecord(e, r)} className="text-gray-400 hover:text-blue-600 p-1"><Edit size={16}/></button>
                        <button onClick={(e) => handleDeleteRecord(e, r.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={16}/></button>
                     </div>
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg mb-1 flex items-center">
                      {cust ? cust.name : '未知客戶'}
                  </h3>
                  <div className="text-sm text-gray-600 line-clamp-1 mb-1 font-bold">{r.fault || r.symptom}</div>
                  <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">{r.solution || r.action}</div>
                  
                  {(r.photoBefore || r.photoAfter) && (
                      <div className="mt-3 flex gap-2 overflow-x-auto">
                         {r.photoBefore && <img src={r.photoBefore} onClick={(e) => { e.stopPropagation(); setViewingImage(r.photoBefore); }} className="h-20 w-20 object-cover rounded-lg border border-gray-200 cursor-pointer" />}
                         {r.photoAfter && <img src={r.photoAfter} onClick={(e) => { e.stopPropagation(); setViewingImage(r.photoAfter); }} className="h-20 w-20 object-cover rounded-lg border border-gray-200 cursor-pointer" />}
                      </div>
                  )}
               </div>
             )
           })}
        </div>
      </div>
    );
};

  const renderDetail = () => {
    if (!selectedCustomer) return null;
    let custRecords = records.filter(r => r.customerID === selectedCustomer.customerID).sort((a,b) => new Date(b.date) - new Date(a.date));
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedCustomer.address)}`;
    return (
    <div className="bg-gray-50 min-h-screen pb-24 animate-in">
      <div className="bg-white px-4 py-4 flex items-center shadow-sm sticky top-0 z-10 border-b border-gray-100">
        <button onClick={() => setCurrentView('roster')} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"><ArrowLeft /></button>
        <h2 className="text-lg font-bold flex-1 text-center pl-8">客戶詳情</h2>
        <div className="flex -mr-2">
          <button onClick={startEdit} className="p-2 text-blue-600 mr-1 hover:bg-blue-50 rounded-full"><Edit size={20} /></button>
          <button onClick={handleDeleteCustomer} className="p-2 text-red-500 hover:bg-red-50 rounded-full"><Trash2 size={20} /></button>
        </div>
      </div>
      <div className="p-4 space-y-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start"><h1 className="text-2xl font-bold text-gray-800 mb-1">{selectedCustomer.name}</h1><span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded font-mono">{selectedCustomer.L2_district}</span></div>
            <div className="mt-2 flex items-start justify-between">
                <div className="flex-1 mr-3 group">
                   <p className="text-gray-500 text-sm flex items-start cursor-pointer hover:text-blue-600 transition-colors" 
                      onClick={() => {
                        if(selectedCustomer.addressNote) handleNavClick(selectedCustomer);
                        else window.open(mapUrl, '_blank');
                      }}
                   >
                      <MapPin size={16} className="mr-1.5 flex-shrink-0 mt-0.5 text-blue-500" /> 
                      <span className="leading-relaxed underline decoration-dotted decoration-gray-300 underline-offset-4 group-active:opacity-50">{selectedCustomer.address}</span>
                   </p>
                </div>
                {selectedCustomer.addressNote ? (
                    <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); handleNavClick(selectedCustomer); }} 
                        className="flex-shrink-0 bg-red-50 text-red-600 border border-red-100 p-2.5 rounded-xl shadow-sm active:scale-90 transition-transform flex items-center justify-center"
                    >
                        <ShieldAlert size={18} />
                    </button>
                ) : (
                    <a 
                        href={mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()} 
                        className="flex-shrink-0 bg-blue-600 text-white p-2.5 rounded-xl shadow-md shadow-blue-200 active:scale-90 transition-transform hover:bg-blue-700 flex items-center justify-center"
                    >
                        <Navigation size={18} />
                    </a>
                )}
            </div>
            {selectedCustomer.addressNote && <div className="mt-3 text-sm bg-red-50 text-red-700 p-3 rounded-lg border border-red-100 flex items-start"><ShieldAlert size={16} className="mr-2 mt-0.5 flex-shrink-0" /><span className="font-bold">{selectedCustomer.addressNote}</span></div>}
            {selectedCustomer.notes && <div className="mt-3 text-sm bg-yellow-50 text-yellow-800 p-3 rounded-lg border border-yellow-100 flex items-start"><Info size={16} className="mr-2 mt-0.5 flex-shrink-0" /><span>{selectedCustomer.notes}</span></div>}
            <div className="mt-6 pt-5 border-t border-gray-100"><h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">聯絡人</h3>
               {selectedCustomer.phones?.map((p, idx) => (
                   <div key={idx} className="flex justify-between items-center mb-3 last:mb-0 bg-gray-50 p-2 rounded-xl">
                       <div className="flex items-center text-sm font-bold text-gray-700 ml-1"><User size={16} className="mr-2 text-gray-400" />{p.label || '電話'}</div>
                       <a href={`tel:${p.number ? p.number.replace(/[^0-9+]/g, '') : ''}`} className="bg-white text-green-600 border border-gray-200 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center shadow-sm no-underline"><Phone size={14} className="mr-1.5"/> {p.number}</a>
                   </div>
               ))}
            </div>
        </div>
         <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center"><div className="bg-blue-50 p-3 rounded-xl mr-4 text-blue-600"><Printer size={24}/></div><div><div className="text-xs text-gray-400 font-bold uppercase">機器型號</div><div className="font-bold text-gray-800 text-lg">{selectedCustomer.assets?.[0]?.model || '無'}</div></div></div>
            <div className="text-right"><div className="text-xs text-gray-400 font-bold uppercase">累計服務</div><div className="font-bold text-slate-800 text-2xl">{serviceCounts[selectedCustomer.customerID] || 0} <span className="text-xs text-gray-400 font-normal">次</span></div></div>
         </div>
         <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-slate-50 px-5 py-4 border-b border-gray-200 flex justify-between items-center">
               <h3 className="font-bold text-gray-700 flex items-center"><History size={18} className="mr-2 text-blue-500"/> 維修履歷</h3>
               <button onClick={startAddRecord} className="flex items-center text-blue-600 text-sm font-bold bg-white px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm active:scale-95 transition-transform hover:bg-blue-50"><Plus size={16} className="mr-1"/> 新增紀錄</button>
            </div>
            <div className="p-5">
               {custRecords.length === 0 ? <div className="text-center py-6 text-gray-400 flex flex-col items-center"><FileText size={32} className="mb-2 opacity-20"/>尚無紀錄</div> : (
                 <div className="relative border-l-2 border-slate-100 pl-6 space-y-6">
                    {custRecords.map(record => {
                       let statusColor = "text-emerald-600 bg-emerald-50";
                       if(record.status === 'pending') statusColor = "text-amber-600 bg-amber-50";
                       return (
                       <div key={record.id} className="relative group">
                          <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-4 border-white shadow-sm ring-1 ring-gray-100 bg-gray-200`}></div>
                          <div className="text-xs font-bold text-slate-400 mb-1 flex justify-between items-center">
                              <div className="flex items-center"><span>{record.date}</span><span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${statusColor}`}>{record.status === 'pending' ? '待料' : '結案'}</span></div>
                              <div className="flex space-x-2"><button onClick={(e) => startEditRecord(e, record)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"><Edit size={14}/></button><button onClick={(e) => handleDeleteRecord(e, record.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"><Trash2 size={14}/></button></div>
                          </div>
                          <div className="flex items-start mb-1">
                              <span className="font-bold text-gray-800 text-sm">{record.fault || record.symptom}</span>
                          </div>
                          <div className={`text-sm bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed`}>{record.solution || record.action}</div>
                          {record.parts && record.parts.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{record.parts.map(p => <span key={p.id} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100">{p.name} x{p.qty}</span>)}</div>}
                          
                          {(record.photoBefore || record.photoAfter) && (
                              <div className="mt-3 flex gap-2">
                                  {record.photoBefore && (
                                      <div onClick={(e) => {e.stopPropagation(); setViewingImage(record.photoBefore)}} className="relative group cursor-pointer">
                                          <img src={record.photoBefore} className="h-20 w-20 object-cover rounded-lg border border-gray-200 shadow-sm" alt="Before" />
                                      </div>
                                  )}
                                  {record.photoAfter && (
                                      <div onClick={(e) => {e.stopPropagation(); setViewingImage(record.photoAfter)}} className="relative group cursor-pointer">
                                          <img src={record.photoAfter} className="h-20 w-20 object-cover rounded-lg border border-gray-200 shadow-sm" alt="After" />
                                      </div>
                                  )}
                              </div>
                          )}
                       </div>
                    )})}
                 </div>
               )}
            </div>
         </div>
      </div>
    </div>
  )};
  const renderSettings = () => (
    <div className="bg-gray-50 min-h-screen pb-24 p-6 animate-in">
       <h2 className="text-2xl font-bold text-gray-800 mb-6">設定</h2>
       <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <h3 className="font-bold text-gray-700 mb-4 flex items-center border-b pb-2"><Database size={20} className="mr-2 text-blue-500"/> 資料庫狀態</h3>
          <div className="space-y-4 text-sm text-gray-600">
             <div className="flex justify-between items-center"><span>連線狀態</span><span className={`font-bold flex items-center px-3 py-1 rounded-full text-xs ${dbStatus === 'online' ? 'bg-green-100 text-green-700' : (dbStatus === 'demo' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700')}`}>{dbStatus === 'online' ? '線上模式' : (dbStatus === 'demo' ? '離線演示' : '離線')}</span></div>
             <div className="flex justify-between"><span>客戶總數</span><span className="font-bold text-lg">{customers.length}</span></div>
             <div className="flex justify-between"><span>維修總數 (顯示)</span><span className="font-bold text-lg">{records.length}</span></div>
             <div className="flex justify-between"><span>版本</span><span className="font-mono text-gray-400">v11.17 (Stable)</span></div>
          </div>
       </div>
       
       <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <h3 className="font-bold text-gray-700 mb-4 flex items-center border-b pb-2"><Save size={20} className="mr-2 text-green-500"/> 資料管理</h3>
          <div className="space-y-3">
             <button onClick={handleExportData} className="w-full py-3 bg-green-50 border border-green-100 text-green-600 rounded-xl font-bold hover:bg-green-100 active:scale-95 transition-all flex items-center justify-center">
                 <Download size={18} className="mr-2" /> 匯出目前資料 (JSON)
              </button>
             <label className="w-full py-3 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl font-bold hover:bg-blue-100 active:scale-95 transition-all flex items-center justify-center cursor-pointer">
                 <Upload size={18} className="mr-2" /> 匯入資料 (JSON)
                 <input type="file" accept=".json" className="hidden" onChange={handleImportData} />
             </label>
           </div>
       </div>

       <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <h3 className="font-bold text-gray-700 mb-4 flex items-center border-b pb-2"><RefreshCcw size={20} className="mr-2 text-red-500"/> 資料救援</h3>
          <button onClick={handleResetData} className="w-full py-3 bg-red-50 border-2 border-red-100 text-red-500 rounded-xl font-bold hover:bg-red-100 active:scale-95 transition-all flex items-center justify-center"><RefreshCw size={18} className="mr-2" />重置並匯入完整資料庫</button>
       </div>
       <div className="text-center text-xs text-gray-300 mt-10">Designed for Engineers</div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-gray-100 min-h-screen font-sans text-gray-900 shadow-2xl relative overflow-hidden">
      <GlobalStyles />
      {isLoading && <div className="absolute inset-0 bg-white z-[60] flex flex-col items-center justify-center"><Loader2 size={48} className="text-blue-600 animate-spin mb-4" /><p className="text-gray-500 font-bold">資料同步中...</p></div>}
      
      <ImageViewer src={viewingImage} onClose={() => setViewingImage(null)} />
      <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog({...confirmDialog, isOpen: false})} isProcessing={isProcessing} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="fixed top-4 right-4 z-[55] pointer-events-none">
        <div className={`transition-all duration-500 transform ${dbStatus === 'online' ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`}><div className="w-3 h-3 bg-green-500 rounded-full shadow-lg shadow-green-200 ring-2 ring-white"></div></div>
        <div className={`transition-all duration-500 transform absolute top-0 right-0 ${dbStatus !== 'online' ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`}><div className={`w-3 h-3 rounded-full shadow-lg ring-2 ring-white ${dbStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : (dbStatus === 'demo' ? 'bg-blue-500' : 'bg-red-500')}`}></div></div>
      </div>

      {currentView === 'dashboard' && renderDashboard()}
      {currentView === 'roster' && renderRoster()}
      {currentView === 'detail' && renderDetail()}
      
      {currentView === 'add' && (
        <CustomerForm 
          mode="add"
          initialData={{ L1_group: selectedL1, L2_district: selectedL2 }}
          onSubmit={handleAddSubmit}
          onCancel={() => setCurrentView(rosterLevel === 'l1' ? 'roster' : 'detail')} 
        />
      )}
      
      {currentView === 'edit' && selectedCustomer && (
        <CustomerForm 
          mode="edit"
          initialData={selectedCustomer}
          onSubmit={handleEditSubmit}
          onDelete={handleDeleteCustomer}
          onCancel={() => setCurrentView('detail')} 
        />
      )}

      {(currentView === 'add_record' || currentView === 'edit_record') && (
        <RecordForm 
           initialData={editingRecordData}
           historyList={historyList}
           filterText={historyFilter}
           onHistoryFilterChange={setHistoryFilter}
           onSubmit={handleSaveRecord}
           inventory={inventory}
           onCancel={() => setCurrentView(activeTab === 'records' ? 'records' : 'detail')}
        />
      )}

      {(currentView === 'inventory' || activeTab === 'inventory') && <InventoryView inventory={inventory} onUpdateInventory={updateInventory} onAddInventory={addInventoryItem} onDeleteInventory={deleteInventoryItem} onRenameGroup={renameModelGroup} onBack={() => setCurrentView('dashboard')} />}
      {(currentView === 'records' || activeTab === 'records') && renderRecords()}
      {currentView === 'search' && <SearchView customers={customers} records={records} onSelectCustomer={(c) => {setSelectedCustomer(c); setCurrentView('detail');}} onBack={() => setCurrentView('dashboard')} />}
      {currentView === 'tracking' && renderTracking()}
      {currentView === 'worklog' && renderWorkLog()}
      {currentView === 'settings' && renderSettings()}
      
      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      {showPhoneSheet && <PhoneActionSheet phones={targetCustomer?.phones} onClose={() => setShowPhoneSheet(false)} />}
      {showAddressAlert && <AddressAlertDialog customer={targetCustomer} onClose={() => setShowAddressAlert(false)} />}
    </div>
  );
}