import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, History, X, FileText, Zap, Trash2, Camera, Loader2, Save,
  CheckCircle, Clock, AlertCircle, ClipboardList, PhoneIncoming, Briefcase, 
  Package, Search, Filter, Wrench, AlertTriangle, Image as ImageIcon
} from 'lucide-react';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebaseConfig'; 

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

// --- 圖片處理函數 ---
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

// --- 元件本體 ---
const RecordForm = ({ initialData, onSubmit, onCancel, historyList, onHistoryFilterChange, filterText, inventory }) => {
    const [form, setForm] = useState(initialData);
    const [previews, setPreviews] = useState({ before: initialData.photoBefore || null, after: initialData.photoAfter || null });
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // 零件選擇器狀態
    const [selectedModel, setSelectedModel] = useState('ALL');
    const [partSearch, setPartSearch] = useState('');

    const handleQuickSymptom = (e) => { const val = e.target.value; if (val) setForm(prev => ({ ...prev, symptom: val })); };
    
    // --- 零件選擇邏輯 ---
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
                    alert(`庫存不足！\n目前庫存：${item.qty}\n您已選取：${updatedParts[existingIndex].qty}`);
                    return prev;
                }
                updatedParts[existingIndex].qty = newQty;
                return { ...prev, parts: updatedParts };
            } else {
                return { ...prev, parts: [...currentParts, { id: Date.now(), name: item.name, qty: 1, model: item.model }] };
            }
        });
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
                try { const url = await uploadImageToStorage(finalForm.photoBefore, `repairs/${Date.now()}_before.jpg`);
                finalForm.photoBefore = url; } catch(e) { console.warn("Upload failed", e); }
            }
            if (finalForm.photoAfter && finalForm.photoAfter.startsWith('data:image')) {
                try { const url = await uploadImageToStorage(finalForm.photoAfter, `repairs/${Date.now()}_after.jpg`);
                finalForm.photoAfter = url; } catch(e) { console.warn("Upload failed", e); }
            }
            await onSubmit(finalForm);
        } catch (e) { console.error(e); } finally { setIsSubmitting(false); }
    };

    return (
      <div className="bg-gray-50 min-h-screen pb-24 font-sans">
        {/* 頂部導覽列 */}
        <div className="bg-white px-4 py-4 flex items-center shadow-sm sticky top-0 z-10 border-b border-gray-100">
            <button onClick={onCancel} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"><ArrowLeft /></button>
            <h2 className="text-lg font-bold flex-1 text-center pr-8">維修紀錄表</h2>
        </div>

        <main className="max-w-md mx-auto p-4 space-y-5">
            
            {/* 1. 歷史快搜卡片 */}
            <section className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-3 text-gray-400 text-xs font-bold uppercase tracking-wider">
                    <History size={14} /> 歷史履歷參考
                </div>
                <div className="relative">
                    <input className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-100 transition-shadow placeholder-gray-400" placeholder="輸入關鍵字查詢..." value={filterText} onChange={e => onHistoryFilterChange(e.target.value)} />
                    {filterText && <button onClick={() => onHistoryFilterChange('')} className="absolute right-3 top-3 text-gray-400"><X size={16}/></button>}
                </div>
                {historyList.length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-dashed border-gray-100 pt-3">
                        {historyList.map(h => (
                            <div key={h.id} className="text-xs p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                                <div className="flex justify-between font-bold text-blue-800 mb-1"><span>{h.date}</span><span>{h.fault || h.symptom}</span></div>
                                <div className="text-gray-600 leading-relaxed">{h.solution || h.action}</div>
                                {h.parts && h.parts.length > 0 && <div className="mt-1.5 text-gray-500 bg-white/60 px-2 py-1 rounded w-fit border border-blue-50">更換: {h.parts.map(p=>p.name).join(', ')}</div>}
                            </div>
                        ))}
                  </div>
                )}
            </section>

            {/* 2. 基本資訊卡片 (服務類型 + 日期) */}
            <section className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-gray-700 flex items-center"><ClipboardList size={18} className="mr-2 text-blue-500"/> 基本資訊</h3>
                    <input type="date" className="bg-gray-50 px-3 py-1 rounded-lg text-base font-mono text-gray-600 outline-none border border-transparent focus:border-blue-300" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                </div>
                <div className="flex gap-2">
                {SOURCE_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isSelected = form.serviceSource === option.id;
                    return (
                        <button key={option.id} type="button" onClick={() => setForm({ ...form, serviceSource: option.id })} className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all duration-200 border ${isSelected ? `${option.activeColor} border-transparent shadow-md transform scale-[1.02]` : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100'}`}>
                            <div className="flex items-center gap-1.5 mb-0.5"><Icon className={`w-4 h-4 ${!isSelected && option.iconColor}`} /><span className="text-xs font-bold">{option.label}</span></div>
                        </button>
                     );
                })}
                </div>
            </section>

            {/* 3. 故障與處理 (合併卡片) */}
            <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-5">
                
                {/* 故障描述 */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                         <label className="text-sm font-bold text-gray-700 flex items-center"><AlertTriangle size={18} className="mr-2 text-amber-500"/> 故障情形</label>
                        <div className="relative">
                            <select className="absolute opacity-0 inset-0 w-full cursor-pointer z-10 text-base" onChange={handleQuickSymptom} value=""><option value="" disabled>選擇...</option>
                                  {Object.entries(SYMPTOM_CATEGORIES).map(([category, items]) => (<optgroup key={category} label={category}>{items.map(item => <option key={item} value={item}>{item}</option>)}</optgroup>))}
                            </select>
                            <button type="button" className="flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg hover:bg-blue-100 transition"><Zap className="w-3 h-3 fill-current" />快速帶入</button>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <input type="text" className="w-full text-base text-gray-800 bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none transition-all" placeholder="描述故障狀況..." value={form.symptom} onChange={(e) => setForm({...form, symptom: e.target.value})} />
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-fit"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">SC Code</span>
                            <input type="text" placeholder="---" className="w-20 bg-transparent text-base uppercase focus:outline-none font-mono text-gray-700 font-bold placeholder-gray-300" value={form.errorCode} onChange={(e) => setForm({...form, errorCode: e.target.value.toUpperCase()})} />
                        </div>
                    </div>
                </div>

                {/* 虛線分隔 */}
                <div className="border-t border-dashed border-gray-200"></div>

                {/* 處置對策 */}
                <div>
                    <label className="text-sm font-bold text-gray-700 mb-2 flex items-center"><Wrench size={18} className="mr-2 text-purple-500"/> 處理過程</label>
                    <textarea rows="3" className="w-full text-base text-gray-800 bg-gray-50 border border-gray-200 rounded-xl p-4 focus:bg-white focus:ring-2 focus:ring-purple-100 focus:border-purple-300 outline-none resize-none transition-all" placeholder="輸入處理方式或更換項目..." value={form.action} onChange={(e) => setForm({...form, action: e.target.value})} ></textarea>
                </div>
            </section>

            {/* 4. 零件更換 (新版清單設計) */}
            <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <label className="text-sm font-bold text-gray-700 mb-3 flex items-center justify-between">
                    <div className="flex items-center"><Package size={18} className="mr-2 text-blue-600"/> 零件更換</div>
                    <span className="text-xs font-normal text-gray-400">點擊下方列表加入</span>
                </label>
                
                {/* 已選零件列表 (置頂) */}
                {form.parts && form.parts.length > 0 && (
                        <div className="mb-4 space-y-2">
                        {form.parts.map((part, index) => (
                            <div key={index} className="flex justify-between items-center bg-blue-50 border border-blue-200 rounded-xl p-3 animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm flex-shrink-0"><Package size={16}/></div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-bold text-blue-900 truncate">{part.name}</span>
                                        <span className="text-[10px] text-blue-500 font-medium truncate">{part.model || '通用'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <span className="font-mono font-bold text-blue-800 text-lg">x{part.qty}</span>
                                    <button onClick={() => handleRemovePart(index)} className="p-2 bg-white text-red-500 rounded-lg border border-red-100 shadow-sm hover:bg-red-50 active:scale-95 transition-all">
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            </div>
                        ))}
                        </div>
                )}

                {/* 零件選擇器 (清單式) */}
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-3">
                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                        <input 
                            type="text" 
                            className="w-full bg-white border border-gray-200 rounded-lg py-2 pl-9 pr-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" 
                            placeholder="搜尋零件..." 
                            value={partSearch}
                            onChange={(e) => setPartSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex overflow-x-auto gap-2 pb-2 mb-2 scrollbar-hide">
                        {uniqueModels.map(model => (
                            <button key={model} onClick={() => setSelectedModel(model)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${selectedModel === model ? 'bg-gray-800 text-white border-gray-800 shadow-sm scale-105' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'}`}>
                                {model === 'ALL' ? '全部' : model}
                            </button>
                        ))}
                    </div>

                    <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2">
                        {filteredInventory.map(item => {
                            const outOfStock = item.qty <= 0;
                            const lowStock = item.qty < 3 && !outOfStock;
                            return (
                                <button key={item.id} onClick={() => handleAddPart(item)} disabled={outOfStock} className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${outOfStock ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed' : 'bg-white border-gray-200 hover:border-blue-400 hover:shadow-sm active:scale-[0.98]'}`}>
                                    <div className="flex-1 mr-3 min-w-0">
                                        <div className="font-bold text-gray-800 text-sm mb-1 truncate">{item.name}</div>
                                        <div className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md w-fit truncate max-w-[120px]">{item.model}</div>
                                    </div>
                                    <div className={`flex flex-col items-end flex-shrink-0`}>
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${outOfStock ? 'bg-red-100 text-red-600' : (lowStock ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600')}`}>
                                            {outOfStock ? '缺貨' : `剩 ${item.qty}`}
                                            </span>
                                    </div>
                                </button>
                            );
                        })}
                        {filteredInventory.length === 0 && <div className="text-center py-8 text-gray-400 text-xs flex flex-col items-center"><Package size={24} className="mb-2 opacity-20"/>找不到符合的零件...</div>}
                    </div>
                </div>
            </section>

            {/* 5. 照片與結案狀態 */}
            <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center mb-4 text-sm font-bold text-gray-700"><ImageIcon size={18} className="mr-2 text-pink-500"/> 照片紀錄</div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <label className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-xl bg-gray-50 hover:bg-white hover:border-blue-400 transition cursor-pointer relative overflow-hidden h-32 group">
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'before')} />
                        {previews.before ? <img src={previews.before} alt="Before" className="absolute inset-0 w-full h-full object-cover" /> : <><Camera className="w-8 h-8 mb-2 text-gray-300 group-hover:text-blue-400 transition-colors" /><span className="text-xs font-bold text-gray-400 group-hover:text-blue-500">維修前</span></>}
                    </label>
                    <label className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-xl bg-gray-50 hover:bg-white hover:border-blue-400 transition cursor-pointer relative overflow-hidden h-32 group">
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'after')} />
                        {previews.after ? <img src={previews.after} alt="After" className="absolute inset-0 w-full h-full object-cover" /> : <><Camera className="w-8 h-8 mb-2 text-gray-300 group-hover:text-blue-400 transition-colors" /><span className="text-xs font-bold text-gray-400 group-hover:text-blue-500">完修後</span></>}
                    </label>
                </div>
                
                <div className="border-t border-dashed border-gray-200 my-5"></div>

                <div className="space-y-3">
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">案件狀態</h2>
                    <div className="grid grid-cols-3 gap-2">
                        {STATUS_OPTIONS.map(option => {
                            const isSelected = form.status === option.id;
                            const Icon = option.icon;
                            return (
                                <button key={option.id} type="button" onClick={() => setForm({...form, status: option.id})} className={`py-3 rounded-xl font-bold text-sm border transition-all flex flex-col items-center justify-center gap-1 ${isSelected ? option.activeColor + ' shadow-md scale-[1.02] border-transparent' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
                                    <Icon className="w-5 h-5" />{option.label}
                                </button>
                             )
                        })}
                    </div>
                </div>
            </section>

            <button className={`w-full py-4 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 transition-transform flex items-center justify-center ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'}`} onClick={handleConfirm} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                {isSubmitting ? '資料上傳中...' : '確認並結案'}
            </button>
        </main>
      </div>
    );
};

export default RecordForm;