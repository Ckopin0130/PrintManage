import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, FileText, Trash2, Camera, Loader2, Save,
  CheckCircle, Clock, Eye, ClipboardList, PhoneIncoming, Briefcase, 
  Package, Search, Wrench, AlertTriangle, Image as ImageIcon, X, Plus, 
  Minus, Settings, Edit3, ChevronRight
} from 'lucide-react';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebaseConfig'; 

// --- 1. 常數定義 ---
const FAULT_TABS = [
  { id: 'sc', label: 'SC代碼', icon: AlertTriangle }, // 修正：使用 AlertTriangle
  { id: 'jam', label: '卡紙', icon: FileText },
  { id: 'quality', label: '影像', icon: ImageIcon },
  { id: 'other', label: '其他', icon: Settings },
];

const DEFAULT_SYMPTOM_DATA = {
  jam: ["卡紙-紙匣1", "卡紙-紙匣2", "卡紙-手送台", "卡紙-定影部", "卡紙-ADF", "卡紙-對位", "卡紙-雙面單元", "不進紙"],
  quality: ["黑線/黑帶", "白點/白線", "列印太淡", "底灰", "全黑/全白", "色彩偏移", "定影不良", "碳粉噴濺"],
  other: ["異音-齒輪", "異音-風扇", "漏碳粉", "廢碳粉滿", "觸控失靈", "無法開機", "網路不通", "驅動問題", "ADF磨損"]
};

const ACTION_TAGS = ["清潔", "調整", "潤滑", "更換", "韌體更新", "驅動重裝", "測試正常", "保養歸零", "更換滾輪"];

const STATUS_OPTIONS = [
  { id: 'completed', label: '完修', color: 'text-emerald-600', activeBg: 'bg-emerald-600 text-white', borderColor: 'border-emerald-600', icon: CheckCircle },
  { id: 'pending', label: '待料', color: 'text-orange-500', activeBg: 'bg-orange-500 text-white', borderColor: 'border-orange-500', icon: Clock },
  { id: 'monitor', label: '觀察', color: 'text-amber-500', activeBg: 'bg-amber-500 text-white', borderColor: 'border-amber-500', icon: Eye },
];

const SOURCE_OPTIONS = [
  { id: 'customer_call', label: '客戶叫修', icon: PhoneIncoming, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
  { id: 'company_dispatch', label: '公司派工', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { id: 'invoice_check', label: '例行巡檢', icon: ClipboardList, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
];

// --- 2. 圖片處理函數 (保留原邏輯) ---
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200; 
        const MAX_HEIGHT = 1200;
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
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = (e) => reject(e);
    };
    reader.onerror = (e) => reject(e);
  });
};

const uploadImageToStorage = async (base64String, path) => {
  if (!storage) throw new Error("Firebase Storage 未初始化");
  const storageRef = ref(storage, path);
  await uploadString(storageRef, base64String, 'data_url');
  return await getDownloadURL(storageRef);
};

// --- 3. 元件本體 ---
const RecordForm = ({ initialData, onSubmit, onCancel, inventory }) => {
    // --- State 定義 ---
    const [form, setForm] = useState(initialData);
    const [previews, setPreviews] = useState({ before: initialData.photoBefore || null, after: initialData.photoAfter || null });
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // UI 控制 State
    const [isSourceSelected, setIsSourceSelected] = useState(!!initialData.id); 
    const [hasFaultFound, setHasFaultFound] = useState(initialData.serviceSource !== 'invoice_check');
    const [activeFaultTab, setActiveFaultTab] = useState(initialData.errorCode ? 'sc' : 'jam');
    
    // 自訂標籤 State (讀取 LocalStorage)
    const [customTags, setCustomTags] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('my_custom_tags')) || {};
        } catch { return {}; }
    });

    // 彈出視窗 State
    const [isPartModalOpen, setIsPartModalOpen] = useState(false);
    const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
    const [isMonitorModalOpen, setIsMonitorModalOpen] = useState(false);
    
    // 攔截資料暫存 State
    const [pendingData, setPendingData] = useState({ parts_needed: '', return_date: '' });
    const [monitorData, setMonitorData] = useState({ tracking_days: '3' });
    
    // 零件搜尋 State
    const [selectedModel, setSelectedModel] = useState('ALL');
    const [partSearch, setPartSearch] = useState('');

    const pageTitle = form.id ? '編輯紀錄' : '新增紀錄';

    // --- 4. 邏輯處理區 ---

    // 任務來源切換與自動收合
    const handleSourceChange = (sourceId) => {
        let newAction = form.action;
        let isFaulty = true;

        if (sourceId === 'invoice_check') {
            newAction = '送發票、例行性清潔保養';
            isFaulty = false; 
        } else {
            if (newAction === '送發票、例行性清潔保養') newAction = '';
            isFaulty = true;
        }

        setForm(prev => ({ ...prev, serviceSource: sourceId, action: newAction }));
        setHasFaultFound(isFaulty);
        setIsSourceSelected(true); 
    };

    // 標籤追加邏輯 (逗號分隔)
    const appendText = (field, text) => {
        setForm(prev => {
            const currentVal = prev[field] || '';
            const separator = currentVal.length > 0 ? '、' : '';
            if (!currentVal.includes(text)) {
                return { ...prev, [field]: currentVal + separator + text };
            }
            return prev;
        });
    };

    // 新增自訂標籤邏輯
    const handleAddCustomTag = (category) => {
        const newTag = window.prompt("請輸入新的標籤名稱：");
        if (newTag && newTag.trim() !== "") {
            const trimmedTag = newTag.trim();
            const currentCategoryTags = customTags[category] || [];
            if (!currentCategoryTags.includes(trimmedTag)) {
                const updatedTags = { ...customTags, [category]: [...currentCategoryTags, trimmedTag] };
                setCustomTags(updatedTags);
                localStorage.setItem('my_custom_tags', JSON.stringify(updatedTags)); // 儲存到手機
                // 自動選取剛新增的標籤
                appendText(category === 'action' ? 'action' : 'symptom', trimmedTag);
            }
        }
    };

    // SC 代碼輸入邏輯
    const handleSCTyping = (e) => {
        const val = e.target.value;
        setForm({
            ...form, 
            errorCode: val, 
            symptom: val ? `故障碼 ${val}` : '' 
        });
    };

    // 零件邏輯
    const updatePartQty = (index, delta) => {
        setForm(prev => {
            const updatedParts = [...prev.parts];
            const newQty = updatedParts[index].qty + delta;
            
            if (newQty <= 0) {
                if(window.confirm('確定要移除此零件嗎？')) updatedParts.splice(index, 1);
            } else {
                if (delta > 0) {
                    const originalItem = inventory.find(i => i.name === updatedParts[index].name);
                    if (originalItem && newQty > originalItem.qty) {
                        alert(`庫存不足！目前僅剩 ${originalItem.qty}`);
                        return prev;
                    }
                }
                updatedParts[index].qty = newQty;
            }
            return { ...prev, parts: updatedParts };
        });
    };

    const handleAddPart = (item) => {
        if (item.qty <= 0) return;
        setForm(prev => {
            const currentParts = prev.parts || [];
            const existingIndex = currentParts.findIndex(p => p.name === item.name);
            if (existingIndex >= 0) {
                const updatedParts = [...currentParts];
                if (updatedParts[existingIndex].qty + 1 > item.qty) {
                    alert('庫存不足');
                    return prev;
                }
                updatedParts[existingIndex].qty += 1;
                return { ...prev, parts: updatedParts };
            } else {
                return { ...prev, parts: [...currentParts, { id: Date.now(), name: item.name, qty: 1, model: item.model }] };
            }
        });
    };

    // 圖片邏輯
    const handleFileChange = async (e, type) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const compressedBase64 = await compressImage(file);
                setPreviews(prev => ({ ...prev, [type]: compressedBase64 }));
                setForm(prev => ({ ...prev, [`photo${type === 'before' ? 'Before' : 'After'}`]: compressedBase64 }));
            } catch (err) { console.error("圖片壓縮失敗", err); alert("圖片處理失敗"); }
        }
    };
    const handleRemovePhoto = (e, type) => {
        e.preventDefault(); e.stopPropagation();
        setPreviews(prev => ({ ...prev, [type]: null }));
        setForm(prev => ({ ...prev, [`photo${type === 'before' ? 'Before' : 'After'}`]: null }));
    };

    // --- 5. 核心送出邏輯 (包含攔截) ---

    const executeSubmit = async (finalData) => {
        setIsSubmitting(true);
        try {
            const uploadTasks = [];
            let dataToSubmit = { ...finalData };

            if (dataToSubmit.photoBefore && dataToSubmit.photoBefore.startsWith('data:image')) {
                const task = uploadImageToStorage(dataToSubmit.photoBefore, `repairs/${Date.now()}_before.jpg`)
                    .then(url => { dataToSubmit.photoBefore = url; });
                uploadTasks.push(task);
            }
            if (dataToSubmit.photoAfter && dataToSubmit.photoAfter.startsWith('data:image')) {
                const task = uploadImageToStorage(dataToSubmit.photoAfter, `repairs/${Date.now()}_after.jpg`)
                    .then(url => { dataToSubmit.photoAfter = url; });
                uploadTasks.push(task);
            }

            await Promise.all(uploadTasks);
            await onSubmit(dataToSubmit);
        } catch (e) {
            console.error("存檔錯誤:", e);
            alert(`錯誤: ${e.message}`);
            setIsSubmitting(false);
        }
    };

    const handlePreSubmit = () => {
        if (isSubmitting) return;

        if (!form.symptom && !form.action && hasFaultFound) {
            alert("請輸入故障情形或處理過程");
            return;
        }

        if (form.status === 'pending') {
            setIsPendingModalOpen(true);
            return;
        }
        if (form.status === 'monitor') {
            setIsMonitorModalOpen(true);
            return;
        }

        executeSubmit(form);
    };

    const confirmPendingSubmit = () => {
        if (!pendingData.parts_needed) { alert('請輸入缺料名稱'); return; }
        const mergedData = { ...form, ...pendingData };
        setIsPendingModalOpen(false);
        executeSubmit(mergedData);
    };

    const confirmMonitorSubmit = () => {
        const mergedData = { ...form, ...monitorData };
        setIsMonitorModalOpen(false);
        executeSubmit(mergedData);
    };

    // --- 輔助計算 ---
    const uniqueModels = useMemo(() => {
        const models = new Set(inventory.map(i => i.model).filter(Boolean));
        return ['ALL', ...Array.from(models).sort()];
    }, [inventory]);

    const filteredInventory = useMemo(() => {
        return inventory.filter(item => {
            const matchModel = selectedModel === 'ALL' || item.model === selectedModel;
            const matchSearch = partSearch === '' || 
                                item.name.toLowerCase().includes(partSearch.toLowerCase()) || 
                                item.model.toLowerCase().includes(partSearch.toLowerCase());
            return matchModel && matchSearch;
        });
    }, [inventory, selectedModel, partSearch]);

    // 取得當前類別的所有標籤 (預設 + 自訂)
    const getCurrentTabTags = () => {
        if (activeFaultTab === 'sc') return [];
        const defaultTags = DEFAULT_SYMPTOM_DATA[activeFaultTab] || [];
        const userTags = customTags[activeFaultTab] || [];
        return [...defaultTags, ...userTags];
    };

    const getActionTags = () => {
        const userTags = customTags['action'] || [];
        return [...ACTION_TAGS, ...userTags];
    }

    // --- 6. UI Render ---
    return (
      <div className="bg-gray-100 min-h-screen pb-28 font-sans selection:bg-blue-100 flex flex-col">
        {/* Top Navigation */}
        <div className="bg-white px-4 py-3 flex items-center shadow-sm sticky top-0 z-40 shrink-0">
            <button onClick={onCancel} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"><ArrowLeft /></button>
            <h2 className="text-lg font-bold flex-1 text-center pr-8 text-slate-800">{pageTitle}</h2>
            <div className="text-sm font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{form.date}</div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
            
            {/* 1. 任務來源 */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300">
                {!isSourceSelected ? (
                    <div className="p-4 grid grid-cols-3 gap-2 animate-in fade-in slide-in-from-top-2">
                        {SOURCE_OPTIONS.map((option) => {
                            const Icon = option.icon;
                            return (
                                <button 
                                    key={option.id} 
                                    type="button" 
                                    onClick={() => handleSourceChange(option.id)} 
                                    className={`flex flex-col items-center justify-center py-6 rounded-xl border-2 transition-all active:scale-95 ${form.serviceSource === option.id ? `${option.bg} ${option.border} ${option.color}` : 'bg-white border-transparent text-gray-400 hover:bg-gray-50 shadow-sm'}`}
                                >
                                    <Icon className="w-8 h-8 mb-2" strokeWidth={2} />
                                    <span className="text-sm font-bold">{option.label}</span>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex items-center justify-between p-3 bg-blue-50/50 cursor-pointer" onClick={() => setIsSourceSelected(false)}>
                        <div className="flex items-center gap-2">
                            {SOURCE_OPTIONS.find(o => o.id === form.serviceSource)?.icon && 
                                React.createElement(SOURCE_OPTIONS.find(o => o.id === form.serviceSource).icon, { className: "w-5 h-5 text-blue-600" })
                            }
                            <span className="font-bold text-slate-700">{SOURCE_OPTIONS.find(o => o.id === form.serviceSource)?.label || '選擇任務'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-blue-500 font-bold">
                            變更 <Edit3 size={12}/>
                        </div>
                    </div>
                )}

                {form.serviceSource === 'invoice_check' && isSourceSelected && (
                    <div className="px-4 py-3 border-t border-slate-100">
                        <div onClick={() => setHasFaultFound(!hasFaultFound)} className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${hasFaultFound ? 'bg-amber-50 border-amber-300' : 'bg-gray-50 border-transparent'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${hasFaultFound ? 'bg-amber-100 text-amber-600' : 'bg-white text-gray-400'}`}><AlertTriangle size={20} /></div> {/* 修正：使用 AlertTriangle */}
                                <div><div className={`font-bold text-sm ${hasFaultFound ? 'text-amber-800' : 'text-gray-600'}`}>發現故障？</div></div>
                            </div>
                            <div className={`w-10 h-5 rounded-full p-1 transition-colors ${hasFaultFound ? 'bg-amber-500' : 'bg-gray-300'}`}>
                                <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${hasFaultFound ? 'translate-x-5' : 'translate-x-0'}`}></div>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* 2. 故障類別 (Tabs 分類) */}
            {hasFaultFound && (
                <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in slide-in-from-bottom duration-300">
                    <div className="flex border-b border-gray-100">
                        {FAULT_TABS.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeFaultTab === tab.id;
                            return (
                                <button key={tab.id} onClick={() => setActiveFaultTab(tab.id)} className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-bold transition-colors ${isActive ? 'text-blue-600 bg-blue-50/50 border-b-2 border-blue-600' : 'text-gray-400 hover:bg-gray-50'}`}>
                                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2}/> {tab.label}
                                </button>
                            )
                        })}
                    </div>

                    <div className="p-4">
                        {activeFaultTab === 'sc' ? (
                            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <label className="font-bold text-slate-500 whitespace-nowrap text-lg">輸入代碼</label>
                                <div className="h-8 w-px bg-slate-300 mx-1"></div>
                                <input 
                                    type="number" 
                                    inputMode="numeric"
                                    placeholder="552" 
                                    className="flex-1 text-4xl font-mono font-bold text-slate-800 bg-transparent outline-none placeholder-slate-200"
                                    value={form.errorCode} 
                                    onChange={handleSCTyping} 
                                />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <textarea 
                                    rows={4}
                                    className="w-full text-lg font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 resize-none min-h-[120px]" 
                                    placeholder="描述故障狀況..." 
                                    value={form.symptom} 
                                    onChange={(e) => setForm({...form, symptom: e.target.value})} 
                                />
                                <div className="flex flex-wrap gap-2">
                                    {getCurrentTabTags().map(item => (
                                        <button key={item} onClick={() => appendText('symptom', item)} className="px-3 py-1.5 bg-white text-slate-600 rounded-full text-xs font-bold border border-slate-200 shadow-sm active:scale-95 active:bg-blue-50 active:text-blue-600">
                                            {item}
                                        </button>
                                    ))}
                                    <button onClick={() => handleAddCustomTag(activeFaultTab)} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-100 flex items-center gap-1">
                                        <Plus size={12}/>自訂
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* 3. 處理過程 */}
            <section className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center"><Wrench size={16} className="mr-1.5 text-blue-500"/> 處理過程</label>
                    </div>
                    <textarea 
                        rows={4}
                        className="w-full text-base text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 resize-none mb-2 min-h-[120px]" 
                        placeholder="詳細維修內容..." 
                        value={form.action} 
                        onChange={(e) => setForm({...form, action: e.target.value})} 
                    ></textarea>
                    <div className="flex flex-wrap gap-2">
                        {getActionTags().map(tag => (
                             <button key={tag} onClick={() => appendText('action', tag)} className="px-2 py-1 bg-gray-50 text-gray-500 rounded text-xs border border-gray-200 font-bold active:bg-blue-50 active:text-blue-600">
                                {tag}
                             </button>
                        ))}
                        <button onClick={() => handleAddCustomTag('action')} className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs border border-blue-100 font-bold flex items-center gap-1">
                            <Plus size={10}/>自訂
                        </button>
                    </div>
                </div>

                {(hasFaultFound || form.parts?.length > 0) && (
                    <div className="pt-4 border-t border-dashed border-gray-200">
                        <button onClick={() => setIsPartModalOpen(true)} className="w-full py-3 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors">
                            <Package size={18} /> 新增更換零件
                        </button>
                        {form.parts && form.parts.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {form.parts.map((part, index) => (
                                    <div key={index} className="flex justify-between items-center bg-white border border-slate-200 rounded-xl p-2 shadow-sm">
                                        <div className="flex items-center gap-2 pl-1">
                                            <div className="bg-slate-100 p-1.5 rounded-lg text-slate-500"><Package size={16}/></div>
                                            <div className="min-w-0 max-w-[120px]">
                                                <div className="text-sm font-bold text-slate-800 truncate">{part.name}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1 border border-slate-100">
                                            <button onClick={() => updatePartQty(index, -1)} className="p-1 text-slate-400 hover:text-rose-500 active:scale-90"><Minus size={16}/></button>
                                            <span className="font-mono font-bold text-slate-800 w-6 text-center">{part.qty}</span>
                                            <button onClick={() => updatePartQty(index, 1)} className="p-1 text-slate-400 hover:text-blue-500 active:scale-90"><Plus size={16}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* 4. 照片紀錄 */}
            <section className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center mb-3 text-sm font-bold text-slate-700"><ImageIcon size={16} className="mr-1.5 text-purple-500"/> 現場照片</div>
                <div className="grid grid-cols-2 gap-3">
                    {['before', 'after'].map(type => (
                        <div key={type} className="relative group aspect-[4/3]">
                            <label className={`flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-white hover:border-blue-400 transition cursor-pointer overflow-hidden`}>
                                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileChange(e, type)} />
                                {previews[type] ? (
                                    <img src={previews[type]} alt={type} className="w-full h-full object-cover" />
                                ) : (
                                    <>
                                        <Camera className="w-8 h-8 mb-2 text-gray-300" />
                                        <span className="text-xs font-bold text-gray-400">{type === 'before' ? '維修前' : '完修後'}</span>
                                    </>
                                )}
                            </label>
                            {previews[type] && <button onClick={(e) => handleRemovePhoto(e, type)} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full"><X size={12} /></button>}
                        </div>
                    ))}
                </div>
            </section>
        </div>

        {/* 5. Sticky Footer (左右 50/50 分割) */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 pb-5 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)] z-50">
            <div className="max-w-lg mx-auto flex gap-3 h-14">
                
                {/* 左邊 50%：狀態選擇 */}
                <div className="w-1/2 grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-xl">
                    {STATUS_OPTIONS.map(option => {
                        const isSelected = form.status === option.id;
                        return (
                            <button 
                                key={option.id} 
                                type="button" 
                                onClick={() => setForm({...form, status: option.id})} 
                                className={`flex flex-col items-center justify-center rounded-lg text-xs font-bold transition-all ${isSelected ? `bg-white text-slate-800 shadow-sm border border-gray-200` : 'text-gray-400'}`}
                            >
                                <option.icon size={16} className={`mb-0.5 ${isSelected ? option.color : ''}`}/>
                                {option.label}
                            </button>
                         )
                    })}
                </div>
                
                {/* 右邊 50%：送出按鈕 */}
                <button 
                    className={`w-1/2 rounded-xl shadow-lg transition-all flex items-center justify-center font-bold text-white text-lg active:scale-[0.98] ${
                        form.status === 'pending' ? 'bg-orange-500 shadow-orange-200' : 
                        form.status === 'monitor' ? 'bg-amber-500 shadow-amber-200' : 
                        'bg-emerald-600 shadow-emerald-200'
                    } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={handlePreSubmit} 
                    disabled={isSubmitting}
                >
                    {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 
                     form.status === 'pending' ? <span className="flex items-center">下一步 <ChevronRight size={20}/></span> :
                     form.status === 'monitor' ? <span className="flex items-center">下一步 <ChevronRight size={20}/></span> :
                     <span className="flex items-center"><Save className="mr-2" size={20}/>確認結案</span>
                    }
                </button>
            </div>
        </div>

        {/* --- Modals 區塊 --- */}
        {isPartModalOpen && (
            <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center animate-in fade-in" onClick={() => setIsPartModalOpen(false)}>
                <div className="bg-white w-full max-w-lg h-[80vh] rounded-t-2xl flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-lg text-slate-800">選擇零件</h3>
                        <button onClick={() => setIsPartModalOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-500"><X size={20}/></button>
                    </div>
                    <div className="p-4 bg-gray-50 space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                            <input type="text" className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-9 pr-3 text-sm outline-none" placeholder="搜尋零件..." value={partSearch} onChange={(e) => setPartSearch(e.target.value)}/>
                        </div>
                        <div className="flex overflow-x-auto gap-2 pb-1 no-scrollbar">
                            {uniqueModels.map(model => (
                                <button key={model} onClick={() => setSelectedModel(model)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border ${selectedModel === model ? 'bg-slate-800 text-white' : 'bg-white text-gray-500'}`}>{model === 'ALL' ? '全部' : model}</button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {filteredInventory.map(item => {
                            const outOfStock = item.qty <= 0;
                            return (
                                <button key={item.id} onClick={() => handleAddPart(item)} disabled={outOfStock} className={`w-full flex items-center justify-between p-3 rounded-xl border text-left active:scale-[0.98] ${outOfStock ? 'bg-gray-50 opacity-50' : 'bg-white hover:border-blue-300'}`}>
                                    <div className="flex-1 mr-3 min-w-0">
                                        <div className="font-bold text-slate-800 text-sm mb-1">{item.name}</div>
                                        <div className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded w-fit">{item.model || '通用'}</div>
                                    </div>
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${outOfStock ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>{outOfStock ? '缺貨' : `庫存 ${item.qty}`}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        )}

        {isPendingModalOpen && (
            <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center"><Clock className="mr-2 text-orange-500"/> 待料登記</h3>
                    <div>
                        <label className="text-sm font-bold text-slate-600 mb-1 block">缺料名稱</label>
                        <input type="text" className="w-full border border-gray-300 rounded-lg p-2 font-bold" autoFocus placeholder="請輸入缺什麼零件..." value={pendingData.parts_needed} onChange={e => setPendingData({...pendingData, parts_needed: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-sm font-bold text-slate-600 mb-1 block">預計回訪日 (選填)</label>
                        <input type="date" className="w-full border border-gray-300 rounded-lg p-2" value={pendingData.return_date} onChange={e => setPendingData({...pendingData, return_date: e.target.value})} />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button onClick={() => setIsPendingModalOpen(false)} className="flex-1 py-3 bg-gray-100 font-bold text-gray-500 rounded-xl">取消</button>
                        <button onClick={confirmPendingSubmit} className="flex-1 py-3 bg-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-200">確認並送出</button>
                    </div>
                </div>
            </div>
        )}

        {isMonitorModalOpen && (
            <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center"><Eye className="mr-2 text-amber-500"/> 設定觀察期</h3>
                    <div>
                        <label className="text-sm font-bold text-slate-600 mb-1 block">追蹤天數</label>
                        <div className="flex gap-2">
                            {['1','3','7','14'].map(d => (
                                <button key={d} onClick={() => setMonitorData({...monitorData, tracking_days: d})} className={`flex-1 py-2 rounded-lg font-bold border ${monitorData.tracking_days === d ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-600 border-gray-200'}`}>{d}天</button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button onClick={() => setIsMonitorModalOpen(false)} className="flex-1 py-3 bg-gray-100 font-bold text-gray-500 rounded-xl">取消</button>
                        <button onClick={confirmMonitorSubmit} className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-200">確認並送出</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
};

export default RecordForm;