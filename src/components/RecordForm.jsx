import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, FileText, Zap, Trash2, Camera, Loader2, Save,
  CheckCircle, Clock, AlertCircle, ClipboardList, PhoneIncoming, Briefcase, 
  Package, Search, Wrench, AlertTriangle, Image as ImageIcon, X, Plus, ChevronDown, ChevronUp
} from 'lucide-react';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebaseConfig'; 

// --- 常數定義 ---
const SYMPTOM_CATEGORIES = {
  "卡紙/傳送": ["卡紙-紙匣", "卡紙-定影", "卡紙-ADF", "多張進紙", "無法進紙", "皺紙"],
  "影像品質": ["黑線/黑帶", "白點/白線", "太淡/太濃", "底灰", "全黑/全白", "色彩偏移"],
  "異音/硬體": ["異音-齒輪", "異音-風扇", "漏碳粉", "廢碳粉滿", "螢幕故障"],
  "系統/網路": ["無法開機", "無法列印", "掃描失敗", "驅動問題", "韌體更新"]
};

const ACTION_TAGS = ["清潔", "調整", "潤滑", "更換", "韌體更新", "驅動重裝", "測試正常"];

const STATUS_OPTIONS = [
  { id: 'completed', label: '完修', activeColor: 'bg-emerald-600 text-white', icon: CheckCircle },
  { id: 'pending', label: '待料', activeColor: 'bg-amber-500 text-white', icon: Clock },
  { id: 'monitor', label: '觀察', activeColor: 'bg-blue-600 text-white', icon: AlertCircle },
];

const SOURCE_OPTIONS = [
  { id: 'customer_call', label: '客戶叫修', icon: PhoneIncoming, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
  { id: 'company_dispatch', label: '公司派工', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { id: 'invoice_check', label: '例行巡檢', icon: ClipboardList, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
];

// --- 圖片處理函數 (保持原邏輯) ---
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

// --- 元件本體 ---
const RecordForm = ({ initialData, onSubmit, onCancel, inventory }) => {
    const [form, setForm] = useState(initialData);
    const [previews, setPreviews] = useState({ before: initialData.photoBefore || null, after: initialData.photoAfter || null });
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // UI 狀態控制
    const [hasFaultFound, setHasFaultFound] = useState(initialData.serviceSource !== 'invoice_check'); // 是否發現故障
    const [faultCategory, setFaultCategory] = useState(initialData.errorCode ? 'sc' : 'general'); // sc, general
    const [isPartModalOpen, setIsPartModalOpen] = useState(false); // 零件視窗開關
    
    // 零件搜尋狀態
    const [selectedModel, setSelectedModel] = useState('ALL');
    const [partSearch, setPartSearch] = useState('');

    const pageTitle = form.id ? '編輯紀錄' : '新增紀錄';
    
    // --- 邏輯：切換任務來源 ---
    const handleSourceChange = (sourceId) => {
        let newAction = form.action;
        let isFaulty = true;

        if (sourceId === 'invoice_check') {
            newAction = '送發票、例行性清潔保養';
            isFaulty = false; // 預設無故障
        } else {
            // 如果原本是例行保養文字，切換回叫修時清空，方便工程師輸入
            if (newAction === '送發票、例行性清潔保養') newAction = '';
            isFaulty = true; // 叫修和派工預設有故障
        }

        setForm(prev => ({ ...prev, serviceSource: sourceId, action: newAction }));
        setHasFaultFound(isFaulty);
    };

    // --- 邏輯：處理標籤點擊 ---
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

    // --- 邏輯：零件選擇 (保持原邏輯) ---
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

    const handleAddPart = (item) => {
        if (item.qty <= 0) return; 
        setForm(prev => {
            const currentParts = prev.parts || [];
            const existingIndex = currentParts.findIndex(p => p.name === item.name);
            if (existingIndex >= 0) {
                const updatedParts = [...currentParts];
                const newQty = updatedParts[existingIndex].qty + 1;
                if (newQty > item.qty) {
                    alert(`庫存不足！\n目前庫存：${item.qty}`);
                    return prev;
                }
                updatedParts[existingIndex].qty = newQty;
                return { ...prev, parts: updatedParts };
            } else {
                return { ...prev, parts: [...currentParts, { id: Date.now(), name: item.name, qty: 1, model: item.model }] };
            }
        });
        // 不關閉視窗，方便連續加入
    };

    const handleRemovePart = (index) => {
        setForm(prev => {
            const updatedParts = [...prev.parts];
            if (updatedParts[index].qty > 1) {
                updatedParts[index].qty -= 1;
            } else {
                updatedParts.splice(index, 1);
            }
            return { ...prev, parts: updatedParts };
        });
    };

    // --- 邏輯：圖片處理 (保持原邏輯，加入 capture) ---
    const handleFileChange = async (e, type) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const compressedBase64 = await compressImage(file);
                setPreviews(prev => ({ ...prev, [type]: compressedBase64 }));
                setForm(prev => ({ ...prev, [`photo${type === 'before' ? 'Before' : 'After'}`]: compressedBase64 }));
            } catch (err) { 
                console.error("圖片壓縮失敗", err); 
                alert("圖片處理失敗");
            }
        }
    };

    const handleRemovePhoto = (e, type) => {
        e.preventDefault(); e.stopPropagation();
        setPreviews(prev => ({ ...prev, [type]: null }));
        setForm(prev => ({ ...prev, [`photo${type === 'before' ? 'Before' : 'After'}`]: null }));
    };

    const handleConfirm = async () => {
        if (isSubmitting) return; 
        if (!form.symptom && !form.action && hasFaultFound) {
             alert("故障案件請輸入故障情形");
             return;
        }
        setIsSubmitting(true);
        let finalForm = { ...form };
        // 如果是例行檢查且未發現故障，確保 symptom 為空，避免資料混淆
        if (!hasFaultFound) {
            finalForm.symptom = '';
            finalForm.errorCode = '';
        }

        try {
            const uploadTasks = [];
            if (finalForm.photoBefore && finalForm.photoBefore.startsWith('data:image')) {
                const task = uploadImageToStorage(finalForm.photoBefore, `repairs/${Date.now()}_before.jpg`)
                    .then(url => { finalForm.photoBefore = url; });
                uploadTasks.push(task);
            }
            if (finalForm.photoAfter && finalForm.photoAfter.startsWith('data:image')) {
                const task = uploadImageToStorage(finalForm.photoAfter, `repairs/${Date.now()}_after.jpg`)
                    .then(url => { finalForm.photoAfter = url; });
                uploadTasks.push(task);
            }
            await Promise.all(uploadTasks);
            await onSubmit(finalForm);
        } catch (e) { 
            console.error("表單處理錯誤:", e); 
            alert(`存檔發生錯誤: ${e.message}`);
            setIsSubmitting(false); 
        }
    };

    return (
      <div className="bg-gray-100 min-h-screen pb-32 font-sans selection:bg-blue-100">
        {/* Top Bar */}
        <div className="bg-white px-4 py-3 flex items-center shadow-sm sticky top-0 z-20">
            <button onClick={onCancel} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"><ArrowLeft /></button>
            <h2 className="text-lg font-bold flex-1 text-center pr-8 text-slate-800">{pageTitle}</h2>
            <div className="text-sm font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{form.date}</div>
        </div>

        <main className="max-w-lg mx-auto p-3 space-y-4">
            
            {/* 1. 任務來源 (Task Origin) */}
            <section className="grid grid-cols-3 gap-2">
                {SOURCE_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isSelected = form.serviceSource === option.id;
                    return (
                        <button 
                            key={option.id} 
                            type="button" 
                            onClick={() => handleSourceChange(option.id)} 
                            className={`flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all ${isSelected ? `${option.bg} ${option.border} ${option.color} ring-1 ring-offset-1` : 'bg-white border-transparent text-gray-400 hover:bg-gray-50 shadow-sm'}`}
                        >
                            <Icon className="w-6 h-6 mb-1" strokeWidth={isSelected ? 2.5 : 2} />
                            <span className="text-xs font-bold">{option.label}</span>
                        </button>
                     );
                })}
            </section>

            {/* 例行巡檢的特殊開關 */}
            {form.serviceSource === 'invoice_check' && (
                <div 
                    onClick={() => setHasFaultFound(!hasFaultFound)}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all shadow-sm ${hasFaultFound ? 'bg-amber-50 border-amber-300' : 'bg-white border-white'}`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${hasFaultFound ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'}`}>
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <div className={`font-bold text-base ${hasFaultFound ? 'text-amber-800' : 'text-gray-600'}`}>發現機器故障？</div>
                            <div className="text-xs text-gray-400">開啟後可輸入故障碼與更換零件</div>
                        </div>
                    </div>
                    <div className={`w-12 h-6 rounded-full p-1 transition-colors ${hasFaultFound ? 'bg-amber-500' : 'bg-gray-200'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${hasFaultFound ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                </div>
            )}

            {/* 2. 故障類別 (動態輸入) */}
            {hasFaultFound && (
                <section className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 animate-in slide-in-from-bottom duration-300">
                    <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-lg">
                        {[
                            { id: 'sc', label: '🚨 SC代碼' },
                            { id: 'general', label: '⚙️ 一般問題' }
                        ].map(type => (
                            <button 
                                key={type.id}
                                onClick={() => setFaultCategory(type.id)}
                                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${faultCategory === type.id ? 'bg-white text-slate-800 shadow-sm' : 'text-gray-400'}`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>

                    {faultCategory === 'sc' ? (
                        <div className="flex flex-col items-center">
                            <label className="text-xs font-bold text-gray-400 mb-1 w-full text-left">SC CODE</label>
                            <input 
                                type="number" 
                                inputMode="numeric"
                                placeholder="例: 552" 
                                className="w-full text-5xl font-mono font-bold text-center text-slate-800 bg-slate-50 border-b-2 border-slate-200 focus:border-blue-500 outline-none py-4 placeholder-slate-200"
                                value={form.errorCode} 
                                onChange={(e) => setForm({...form, errorCode: e.target.value})} 
                            />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <input 
                                type="text" 
                                className="w-full text-lg font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100" 
                                placeholder="故障描述 (如: 卡紙)" 
                                value={form.symptom} 
                                onChange={(e) => setForm({...form, symptom: e.target.value})} 
                            />
                            {/* 快速標籤 (Chips) */}
                            <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
                                {Object.entries(SYMPTOM_CATEGORIES).map(([cat, items]) => (
                                    items.map(item => (
                                        <button 
                                            key={item} 
                                            onClick={() => appendText('symptom', item)}
                                            className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold whitespace-nowrap border border-slate-200 active:scale-95 active:bg-blue-100 active:text-blue-600"
                                        >
                                            {item}
                                        </button>
                                    ))
                                ))}
                            </div>
                        </div>
                    )}
                </section>
            )}

            {/* 3. 處理過程與零件 */}
            <section className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                {/* 處理過程 */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center"><Wrench size={16} className="mr-1.5 text-blue-500"/> 處理過程</label>
                    </div>
                    <textarea 
                        rows="3" 
                        className="w-full text-base text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 resize-none mb-2" 
                        placeholder="詳細維修內容..." 
                        value={form.action} 
                        onChange={(e) => setForm({...form, action: e.target.value})} 
                    ></textarea>
                    {/* 處理過程的快速標籤 */}
                    <div className="flex flex-wrap gap-2">
                        {ACTION_TAGS.map(tag => (
                             <button key={tag} onClick={() => appendText('action', tag)} className="px-2 py-1 bg-gray-50 text-gray-500 rounded text-xs border border-gray-200 font-bold active:bg-blue-50 active:text-blue-600">
                                {tag}
                             </button>
                        ))}
                    </div>
                </div>

                {/* 零件更換區塊 (只有發現故障才顯示) */}
                {(hasFaultFound || form.parts?.length > 0) && (
                    <div className="pt-4 border-t border-dashed border-gray-200">
                        <div className="flex justify-between items-center mb-3">
                             <label className="text-sm font-bold text-slate-700 flex items-center"><Package size={16} className="mr-1.5 text-orange-500"/> 更換零件</label>
                             <button 
                                onClick={() => setIsPartModalOpen(true)}
                                className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md shadow-blue-200 active:scale-95 transition-transform"
                             >
                                <Plus size={14} /> 新增零件
                             </button>
                        </div>
                        
                        {/* 已選零件列表 */}
                        {form.parts && form.parts.length > 0 ? (
                            <div className="space-y-2">
                                {form.parts.map((part, index) => (
                                    <div key={index} className="flex justify-between items-center bg-blue-50 border border-blue-100 rounded-xl p-3">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-white p-1.5 rounded-lg text-blue-500"><Package size={16}/></div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-800">{part.name}</div>
                                                <div className="text-[10px] text-slate-500">{part.model || '共用'}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono font-bold text-blue-700 text-lg">x{part.qty}</span>
                                            <button onClick={() => handleRemovePart(index)} className="p-1.5 bg-white text-rose-500 rounded-lg shadow-sm border border-rose-100"><Trash2 size={14}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400 text-xs">
                                無更換零件
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* 4. 照片紀錄 (左右並排) */}
            <section className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center mb-3 text-sm font-bold text-slate-700"><ImageIcon size={16} className="mr-1.5 text-purple-500"/> 照片紀錄</div>
                <div className="grid grid-cols-2 gap-3">
                    {/* 左：維修前 */}
                    <div className="relative group aspect-square">
                        <label className={`flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-white hover:border-blue-400 transition cursor-pointer overflow-hidden`}>
                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileChange(e, 'before')} />
                            {previews.before ? (
                                <img src={previews.before} alt="Before" className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <Camera className="w-8 h-8 mb-2 text-gray-300" />
                                    <span className="text-xs font-bold text-gray-400">維修前</span>
                                </>
                            )}
                        </label>
                        {previews.before && <button onClick={(e) => handleRemovePhoto(e, 'before')} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full"><X size={12} /></button>}
                    </div>
                    {/* 右：完修後 */}
                    <div className="relative group aspect-square">
                        <label className={`flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-white hover:border-blue-400 transition cursor-pointer overflow-hidden`}>
                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileChange(e, 'after')} />
                            {previews.after ? (
                                <img src={previews.after} alt="After" className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <Camera className="w-8 h-8 mb-2 text-gray-300" />
                                    <span className="text-xs font-bold text-gray-400">完修後</span>
                                </>
                            )}
                        </label>
                        {previews.after && <button onClick={(e) => handleRemovePhoto(e, 'after')} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full"><X size={12} /></button>}
                    </div>
                </div>
            </section>
        </main>

        {/* 5. Sticky Footer (結案與狀態) */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)] z-50 safe-area-bottom">
            <div className="max-w-lg mx-auto flex flex-col gap-3">
                {/* 狀態選擇 (縮小顯示) */}
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    {STATUS_OPTIONS.map(option => {
                        const isSelected = form.status === option.id;
                        return (
                            <button 
                                key={option.id} 
                                type="button" 
                                onClick={() => setForm({...form, status: option.id})} 
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${isSelected ? 'bg-white text-slate-800 shadow-sm' : 'text-gray-400'}`}
                            >
                                {option.label}
                            </button>
                         )
                    })}
                </div>
                
                {/* 送出按鈕 */}
                <button 
                    className={`w-full py-3.5 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center active:scale-[0.98] ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`} 
                    onClick={handleConfirm} 
                    disabled={isSubmitting}
                >
                    {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                    {isSubmitting ? '資料上傳中...' : '確認並結案'}
                </button>
            </div>
        </div>

        {/* --- 零件選擇 Modal --- */}
        {isPartModalOpen && (
            <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center animate-in fade-in" onClick={() => setIsPartModalOpen(false)}>
                <div className="bg-white w-full max-w-lg h-[85vh] sm:h-[80vh] sm:rounded-2xl rounded-t-2xl flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                    {/* Modal Header */}
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-lg text-slate-800">選擇零件</h3>
                        <button onClick={() => setIsPartModalOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-500"><X size={20}/></button>
                    </div>
                    
                    {/* Modal Search & Filter */}
                    <div className="p-4 bg-gray-50 space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                            <input 
                                type="text" 
                                className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-9 pr-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                placeholder="搜尋零件名稱..." 
                                value={partSearch}
                                onChange={(e) => setPartSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex overflow-x-auto gap-2 pb-1 no-scrollbar">
                            {uniqueModels.map(model => (
                                <button key={model} onClick={() => setSelectedModel(model)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${selectedModel === model ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-gray-500 border-gray-200'}`}>
                                    {model === 'ALL' ? '全部型號' : model}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Inventory List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {filteredInventory.map(item => {
                            const outOfStock = item.qty <= 0;
                            const isLow = item.qty < 3 && !outOfStock;
                            return (
                                <button 
                                    key={item.id} 
                                    onClick={() => handleAddPart(item)} 
                                    disabled={outOfStock} 
                                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${outOfStock ? 'bg-gray-50 border-gray-100 opacity-50' : 'bg-white border-gray-100 hover:border-blue-300 hover:shadow-md active:scale-[0.98]'}`}
                                >
                                    <div className="flex-1 mr-3 min-w-0">
                                        <div className="font-bold text-slate-800 text-sm mb-1">{item.name}</div>
                                        <div className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded w-fit">{item.model || '通用'}</div>
                                    </div>
                                    <div className={`flex flex-col items-end flex-shrink-0`}>
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${outOfStock ? 'bg-rose-100 text-rose-600' : (isLow ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600')}`}>
                                            {outOfStock ? '缺貨' : `庫存 ${item.qty}`}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                        {filteredInventory.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">找不到相關零件</div>}
                    </div>
                </div>
            </div>
        )}
      </div>
    );
};

export default RecordForm;