import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ArrowLeft, FileText, Trash2, Camera, Loader2, Save,
  CheckCircle, Clock, Eye, ClipboardList, PhoneIncoming, Briefcase, 
  Package, Search, Wrench, AlertTriangle, Image as ImageIcon, X, Plus, 
  Minus, Settings, Edit3, ChevronRight, ChevronDown, RefreshCw, Pencil, Calendar
} from 'lucide-react';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebaseConfig'; 

// --- 1. 預設資料 (作為重置種子) ---
const INITIAL_FAULT_TAGS = {
  jam: ["卡紙-紙匣1", "卡紙-紙匣2", "卡紙-手送台", "卡紙-定影部", "卡紙-ADF", "卡紙-對位", "卡紙-雙面單元", "不進紙"],
  quality: ["黑線/黑帶", "白點/白線", "列印太淡", "底灰", "全黑/全白", "色彩偏移", "定影不良", "碳粉噴濺"],
  other: ["異音-齒輪", "異音-風扇", "漏碳粉", "廢碳粉滿", "觸控失靈", "無法開機", "網路不通", "驅動問題", "ADF磨損"]
};

const INITIAL_ACTION_TAGS = ["清潔", "調整", "潤滑", "更換", "韌體更新", "驅動重裝", "測試正常", "保養歸零", "更換滾輪"];

const FAULT_TABS = [
  { id: 'sc', label: 'SC代碼', icon: AlertTriangle },
  { id: 'jam', label: '卡紙', icon: FileText },
  { id: 'quality', label: '影像', icon: ImageIcon },
  { id: 'other', label: '其他', icon: Settings },
];

const STATUS_OPTIONS = [
  { id: 'completed', label: '完修', color: 'text-emerald-600', activeBg: 'bg-emerald-600 text-white', icon: CheckCircle },
  { id: 'tracking', label: '追蹤', color: 'text-orange-600', activeBg: 'bg-orange-500 text-white', icon: Clock },
  { id: 'monitor', label: '觀察', color: 'text-blue-600', activeBg: 'bg-blue-500 text-white', icon: Eye },
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
const RecordForm = ({ initialData, onSubmit, onCancel, inventory, customers }) => {
    // --- State 定義 ---
    const [form, setForm] = useState(initialData);
    const [previews, setPreviews] = useState({ 
        before: initialData.photosBefore || (initialData.photoBefore ? [initialData.photoBefore] : []), 
        after: initialData.photosAfter || (initialData.photoAfter ? [initialData.photoAfter] : [])
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // 新增：維修前/後照片的 input ref
    const beforeFileInputRef = useRef(null);
    const afterFileInputRef = useRef(null);
    
    // UI 控制 State
    const [isSourceSelected, setIsSourceSelected] = useState(!!initialData.id); 
    const [hasFaultFound, setHasFaultFound] = useState(initialData.serviceSource !== 'invoice_check');
    const [activeFaultTab, setActiveFaultTab] = useState(initialData.errorCode ? 'sc' : 'jam');
    
    // --- 標籤系統 State (載入 LocalStorage 或 預設值) ---
    const [allTags, setAllTags] = useState(() => {
        try {
            const saved = localStorage.getItem('app_tags_v2');
            if (saved) return JSON.parse(saved);
        } catch(e) { console.error(e); }
        return {
            jam: INITIAL_FAULT_TAGS.jam,
            quality: INITIAL_FAULT_TAGS.quality,
            other: INITIAL_FAULT_TAGS.other,
            action: INITIAL_ACTION_TAGS
        };
    });

    // 彈出視窗 State
    const [isPartModalOpen, setIsPartModalOpen] = useState(false);
    
    // 標籤管理視窗 State
    const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
    const [managingCategory, setManagingCategory] = useState(null); 
    const [newTagInput, setNewTagInput] = useState('');
    const [editingTagIndex, setEditingTagIndex] = useState(-1); 
    const [editTagInput, setEditTagInput] = useState('');

    // 回訪日期 State
    const [nextVisitDate, setNextVisitDate] = useState('');
    const [showVisitDateModal, setShowVisitDateModal] = useState(false);
    
    // 零件搜尋 State
    const [selectedModel, setSelectedModel] = useState('ALL');
    const [partSearch, setPartSearch] = useState('');
    
    // 🌟 修改：預設 Tab 改為 'main' (主件)
    const [activeTab, setActiveTab] = useState('main'); 

    // 日期計算函數
    const getFutureDate = (days) => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString().split('T')[0];
    };

    // 初始化資料
    useEffect(() => {
        if (initialData) {
            setForm({
                ...initialData,
                parts: initialData.parts || [],
                status: initialData.status === 'pending' ? 'tracking' : (initialData.status || 'completed')
            });
            if (initialData.nextVisitDate) {
                setNextVisitDate(initialData.nextVisitDate);
            } else if (initialData.return_date) {
                setNextVisitDate(initialData.return_date);
            } else {
                setNextVisitDate('');
            }
            const beforePhotos = initialData.photosBefore || (initialData.photoBefore ? [initialData.photoBefore] : []);
            const afterPhotos = initialData.photosAfter || (initialData.photoAfter ? [initialData.photoAfter] : []);
            setPreviews({ before: beforePhotos, after: afterPhotos });
        }
    }, [initialData]);

    const pageTitle = form.id ? '編輯維修紀錄' : '新增維修紀錄';
    
    const customer = useMemo(() => {
        if (!form.customerID || !customers) return null;
        return customers.find(c => c.customerID === form.customerID);
    }, [form.customerID, customers]);
    
    const customerMachineModel = customer?.assets?.[0]?.model || '';

    // 當 Modal 打開時自動設置型號篩選
    useEffect(() => {
        if (isPartModalOpen && customerMachineModel) {
            setSelectedModel(customerMachineModel);
            setActiveTab('main'); // 確保打開時也是主件
        } else if (isPartModalOpen && !customerMachineModel) {
            setSelectedModel('ALL');
            setActiveTab('main');
        }
    }, [isPartModalOpen, customerMachineModel]);

    // --- 4. 邏輯處理區 ---

    const saveTags = (newTagsState) => {
        setAllTags(newTagsState);
        localStorage.setItem('app_tags_v2', JSON.stringify(newTagsState));
    };

    const resetTagsToDefault = () => {
        if(!window.confirm('確定要重置所有標籤設定嗎？您的自訂修改將會消失。')) return;
        const defaultState = {
            jam: INITIAL_FAULT_TAGS.jam,
            quality: INITIAL_FAULT_TAGS.quality,
            other: INITIAL_FAULT_TAGS.other,
            action: INITIAL_ACTION_TAGS
        };
        saveTags(defaultState);
        setIsTagManagerOpen(false);
    };

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

    const openTagManager = (category) => {
        setManagingCategory(category);
        setNewTagInput('');
        setEditingTagIndex(-1);
        setIsTagManagerOpen(true);
    };

    const handleAddTag = () => {
        if (!newTagInput.trim()) return;
        const currentList = allTags[managingCategory] || [];
        const newList = [...currentList, newTagInput.trim()];
        saveTags({ ...allTags, [managingCategory]: newList });
        setNewTagInput('');
    };

    const handleDeleteTag = (index) => {
        if (!window.confirm('確定刪除此標籤？')) return;
        const currentList = allTags[managingCategory] || [];
        const newList = currentList.filter((_, i) => i !== index);
        saveTags({ ...allTags, [managingCategory]: newList });
    };

    const startEditingTag = (index, text) => {
        setEditingTagIndex(index);
        setEditTagInput(text);
    };

    const saveEditedTag = (index) => {
        if (!editTagInput.trim()) return;
        const currentList = allTags[managingCategory] || [];
        const newList = [...currentList];
        newList[index] = editTagInput.trim();
        saveTags({ ...allTags, [managingCategory]: newList });
        setEditingTagIndex(-1);
    };

    const handleSCTyping = (e) => {
        const val = e.target.value;
        setForm({
            ...form, 
            errorCode: val, 
            symptom: val ? `故障碼 ${val}` : '' 
        });
    };

    const updatePartQty = (index, delta) => {
        setForm(prev => {
            const updatedParts = [...prev.parts];
            const part = updatedParts[index];
            const newQty = part.qty + delta;
            
            if (newQty <= 0) {
                if(window.confirm('確定要移除此零件嗎？')) updatedParts.splice(index, 1);
            } else {
                if (delta > 0) {
                    const originalItem = inventory.find(i => i.name === part.name);
                    if (originalItem) {
                        const currentInForm = updatedParts
                            .filter((p, i) => i !== index && p.name === part.name)
                            .reduce((sum, p) => sum + p.qty, 0);
                        const effectiveStock = originalItem.qty - currentInForm;
                        
                        if (newQty > effectiveStock) {
                            alert(`庫存不足！目前僅剩 ${effectiveStock} 個（原始庫存：${originalItem.qty}）`);
                            return prev;
                        }
                    }
                }
                updatedParts[index].qty = newQty;
            }
            return { ...prev, parts: updatedParts };
        });
    };

    const handleAdjustQtyInModal = (item, delta) => {
        setForm(prev => {
            const currentParts = prev.parts || [];
            const existingIndex = currentParts.findIndex(p => p.name === item.name);
            
            if (existingIndex >= 0) {
                const updatedParts = [...currentParts];
                const part = updatedParts[existingIndex];
                const newQty = part.qty + delta;
                
                if (newQty <= 0) {
                    updatedParts.splice(existingIndex, 1);
                } else {
                    if (delta > 0) {
                        const originalItem = inventory.find(i => i.name === item.name);
                        if (originalItem) {
                            const currentInForm = updatedParts
                                .filter((p, i) => i !== existingIndex && p.name === item.name)
                                .reduce((sum, p) => sum + p.qty, 0);
                            const effectiveStock = originalItem.qty - currentInForm;
                            
                            if (newQty > effectiveStock) {
                                alert(`庫存不足！目前僅剩 ${effectiveStock} 個（原始庫存：${originalItem.qty}）`);
                                return prev;
                            }
                        }
                    }
                    updatedParts[existingIndex].qty = newQty;
                }
                return { ...prev, parts: updatedParts };
            } else {
                if (delta > 0) {
                    const currentInForm = currentParts
                        .filter(p => p.name === item.name)
                        .reduce((sum, p) => sum + p.qty, 0);
                    const remainingStock = item.qty - currentInForm;
                    
                    if (remainingStock <= 0) {
                        alert('庫存已用盡！(包含已加入清單的數量)');
                        return prev;
                    }
                    
                    return { 
                        ...prev, 
                        parts: [...currentParts, { id: Date.now(), name: item.name, qty: 1, model: item.model }] 
                    };
                }
                return prev;
            }
        });
    };

    const handleFileChange = async (e, type) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const newPhotos = [];
        const newPreviews = [];

        for (const file of files) {
            if (file.size > 5 * 1024 * 1024) {
                alert(`${file.name} 圖片過大，請選擇小於 5MB 的圖片`);
                continue;
            }

            try {
                const compressedBase64 = await compressImage(file);
                newPhotos.push(compressedBase64);
                newPreviews.push(compressedBase64);
            } catch (err) {
                console.error("圖片壓縮失敗", err);
                alert(`圖片處理失敗: ${file.name}`);
            }
        }

        if (newPhotos.length > 0) {
            setPreviews(prev => ({
                ...prev,
                [type]: [...prev[type], ...newPreviews]
            }));
            const fieldName = type === 'before' ? 'photosBefore' : 'photosAfter';
            setForm(prev => ({
                ...prev,
                [fieldName]: [...(prev[fieldName] || []), ...newPhotos],
                [`photo${type === 'before' ? 'Before' : 'After'}`]: newPhotos[0]
            }));
        }

        if (e.target) {
            e.target.value = '';
        }
    };
    
    const handleRemovePhoto = (e, type, index) => {
        e.preventDefault(); 
        e.stopPropagation();
        setPreviews(prev => {
            const newPhotos = prev[type].filter((_, i) => i !== index);
            return { ...prev, [type]: newPhotos };
        });
        const fieldName = type === 'before' ? 'photosBefore' : 'photosAfter';
        setForm(prev => {
            const newPhotos = (prev[fieldName] || []).filter((_, i) => i !== index);
            return {
                ...prev,
                [fieldName]: newPhotos,
                [`photo${type === 'before' ? 'Before' : 'After'}`]: newPhotos.length > 0 ? newPhotos[0] : null
            };
        });
    };

    const executeSubmit = async (finalData) => {
        setIsSubmitting(true);
        try {
            const uploadTasks = [];
            let dataToSubmit = { ...finalData };

            if (dataToSubmit.photosBefore && Array.isArray(dataToSubmit.photosBefore) && dataToSubmit.photosBefore.length > 0) {
                for (let i = 0; i < dataToSubmit.photosBefore.length; i++) {
                    const photo = dataToSubmit.photosBefore[i];
                    if (photo && photo.startsWith('data:image')) {
                        const task = uploadImageToStorage(photo, `repairs/${Date.now()}_before_${i}.jpg`)
                            .then(url => {
                                dataToSubmit.photosBefore[i] = url;
                            });
                        uploadTasks.push(task);
                    }
                }
                if (dataToSubmit.photosBefore[0]) {
                    dataToSubmit.photoBefore = dataToSubmit.photosBefore[0];
                }
            } else if (dataToSubmit.photoBefore && dataToSubmit.photoBefore.startsWith('data:image')) {
                const task = uploadImageToStorage(dataToSubmit.photoBefore, `repairs/${Date.now()}_before.jpg`)
                    .then(url => { dataToSubmit.photoBefore = url; });
                uploadTasks.push(task);
            }

            if (dataToSubmit.photosAfter && Array.isArray(dataToSubmit.photosAfter) && dataToSubmit.photosAfter.length > 0) {
                for (let i = 0; i < dataToSubmit.photosAfter.length; i++) {
                    const photo = dataToSubmit.photosAfter[i];
                    if (photo && photo.startsWith('data:image')) {
                        const task = uploadImageToStorage(photo, `repairs/${Date.now()}_after_${i}.jpg`)
                            .then(url => {
                                dataToSubmit.photosAfter[i] = url;
                            });
                        uploadTasks.push(task);
                    }
                }
                if (dataToSubmit.photosAfter[0]) {
                    dataToSubmit.photoAfter = dataToSubmit.photosAfter[0];
                }
            } else if (dataToSubmit.photoAfter && dataToSubmit.photoAfter.startsWith('data:image')) {
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

        if (form.status === 'tracking' || form.status === 'monitor') {
            setShowVisitDateModal(true);
            return;
        }

        executeSubmit({...form, status: 'completed'}); 
    };

    const handleConfirmVisitDate = () => {
        if (!nextVisitDate) {
            alert('請設定預計回訪日期');
            return;
        }
        if (form.status === 'tracking') {
            executeSubmit({...form, status: 'tracking', nextVisitDate});
        } else if (form.status === 'monitor') {
            executeSubmit({...form, status: 'monitor', nextVisitDate});
        }
        setShowVisitDateModal(false);
    };

    // --- 輔助計算 ---
    const PART_CATEGORIES = [
        { id: 'cat_toner', name: '碳粉', color: 'bg-purple-100 text-purple-700' },
        { id: 'cat_color', name: '彩色', color: 'bg-pink-100 text-pink-700' },
        { id: 'cat_bw', name: '黑白', color: 'bg-gray-100 text-gray-700' },
        { id: 'cat_common', name: '共用耗材', color: 'bg-blue-100 text-blue-700' },
        { id: 'cat_other', name: '其他', color: 'bg-slate-100 text-slate-700' }
    ];
    
    const migrateCategory = (modelName, item) => {
        if (item.categoryId) return item.categoryId;
        const up = (modelName || '').toUpperCase();
        if (item.categoryType === 'TONER' || up.includes('碳粉') || up.includes('TONER') || up.includes('INK')) return 'cat_toner';
        if (item.categoryType === 'COLOR' || up.includes(' C') || up.includes('MPC') || up.includes('IMC') || up.includes('彩色')) return 'cat_color';
        if (item.categoryType === 'BW' || up.includes('MP') || up.includes('IM') || up.includes('AFICIO') || up.includes('黑白')) return 'cat_bw';
        if (item.categoryType === 'COMMON' || up.includes('耗材') || up.includes('共用') || up.includes('COMMON')) return 'cat_common';
        return 'cat_other';
    };
    
    const uniqueModels = useMemo(() => {
        const models = new Set(inventory.map(i => i.model).filter(Boolean));
        return ['ALL', ...Array.from(models).sort()];
    }, [inventory]);

    const isModelMatch = (itemModel, targetModel) => {
        if (!itemModel || !targetModel || targetModel === 'ALL') return false;
        
        if (itemModel === targetModel) return true;
        
        const normalizeModel = (model) => {
            const cleaned = model.trim().toUpperCase();
            const match = cleaned.match(/^([A-Z]+\s*\d+)/);
            return match ? match[1].replace(/\s+/g, ' ') : cleaned;
        };
        
        const baseTarget = normalizeModel(targetModel);
        const baseItem = normalizeModel(itemModel);
        
        if (baseItem === baseTarget) return true;
        if (baseItem.startsWith(baseTarget + ' ') || baseItem.startsWith(baseTarget + '/')) return true;
        if (baseTarget.startsWith(baseItem + ' ') || baseTarget.startsWith(baseItem + '/')) return true;
        
        return false;
    };

    const filteredInventory = useMemo(() => {
        let items = inventory.filter(item => {
            const isUniversal = !item.model || item.model === '通用' || item.model === '未分類';
            const isCurrentModel = selectedModel !== 'ALL' && isModelMatch(item.model, selectedModel);
            
            const itemCategoryId = item.categoryId || migrateCategory(item.model, item);
            const isToner = itemCategoryId === 'cat_toner' || 
                           (item.name || '').includes('碳粉') || 
                           (item.name || '').includes('感光鼓');

            const matchSearch = partSearch === '' || 
                                item.name.toLowerCase().includes(partSearch.toLowerCase()) || 
                                (item.model || '').toLowerCase().includes(partSearch.toLowerCase());
            if (!matchSearch) return false;

            if (selectedModel === 'ALL') {
                switch (activeTab) {
                    case 'main': 
                        return !isToner && !isUniversal;
                    case 'toner': 
                        return isToner && !isUniversal;
                    case 'backup': 
                        return isUniversal;
                    case 'all': 
                    default:
                        return true;
                }
            } else {
                if (!isCurrentModel && !isUniversal) return false;

                switch (activeTab) {
                    case 'main':
                        return isCurrentModel && !isToner;
                    case 'toner':
                        return isCurrentModel && isToner;
                    case 'backup':
                        return isUniversal;
                    case 'all':
                    default:
                        return true;
                }
            }
        });
        
        if (customerMachineModel && selectedModel !== 'ALL') {
            items = items.sort((a, b) => {
                const aMatch = isModelMatch(a.model, customerMachineModel);
                const bMatch = isModelMatch(b.model, customerMachineModel);

                if (a.model === customerMachineModel && b.model !== customerMachineModel) return -1;
                if (a.model !== customerMachineModel && b.model === customerMachineModel) return 1;
                if (aMatch && !bMatch) return -1;
                if (!aMatch && bMatch) return 1;
                if ((!a.model || a.model === '通用' || a.model === '未分類') && b.model && b.model !== '通用' && b.model !== '未分類') return -1;
                if (a.model && a.model !== '通用' && a.model !== '未分類' && (!b.model || b.model === '通用' || b.model === '未分類')) return 1;
                return 0;
            });
        }
        
        return items;
    }, [inventory, selectedModel, partSearch, customerMachineModel, activeTab]);
    
    const selectedPartsCount = useMemo(() => {
        return form.parts?.reduce((sum, part) => sum + part.qty, 0) || 0;
    }, [form.parts]);

    const inventoryByCategory = useMemo(() => {
        const grouped = {};
        filteredInventory.forEach(item => {
            const categoryId = item.categoryId || migrateCategory(item.model, item);
            if (!grouped[categoryId]) {
                grouped[categoryId] = [];
            }
            grouped[categoryId].push(item);
        });
        return grouped;
    }, [filteredInventory]);

    const getCurrentTabTags = () => {
        if (activeFaultTab === 'sc') return [];
        return allTags[activeFaultTab] || [];
    };

    const getActionTags = () => {
        return allTags['action'] || [];
    }

    const getEffectiveStock = (item) => {
        const inFormQty = form.parts?.find(p => p.name === item.name)?.qty || 0;
        return Math.max(0, item.qty - inFormQty);
    };

    // --- 6. UI Render (Style: Slate Theme) ---
    return (
      <div className="bg-slate-50 min-h-screen pb-24 font-sans selection:bg-blue-100 flex flex-col">
        {/* Top Navigation */}
        <div className="bg-white/95 backdrop-blur px-4 py-3 flex items-center shadow-sm sticky top-0 z-40 shrink-0 border-b border-slate-100">
            <button onClick={onCancel} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"><ArrowLeft strokeWidth={2.5}/></button>
            <h2 className="text-lg font-bold flex-1 text-center pr-8 text-slate-800">{pageTitle}</h2>
            <div className="flex items-center gap-2">
                {customerMachineModel && (
                    <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                        {customerMachineModel}
                    </div>
                )}
                <div className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">{form.date}</div>
            </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
            
            {/* 1. 任務來源 */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300">
                {!isSourceSelected ? (
                    <div className="p-3 grid grid-cols-3 gap-2 animate-in fade-in slide-in-from-top-2">
                        {SOURCE_OPTIONS.map((option) => {
                            const Icon = option.icon;
                            return (
                                <button 
                                    key={option.id} 
                                    type="button" 
                                    onClick={() => handleSourceChange(option.id)} 
                                    className={`flex flex-col items-center justify-center py-3 rounded-xl border-2 transition-all active:scale-95 outline-none focus:outline-none focus:ring-2 focus:ring-blue-100 ${form.serviceSource === option.id ? `${option.bg} ${option.border} ${option.color}` : 'bg-white border-transparent text-slate-400 hover:bg-slate-50 shadow-sm'}`}
                                >
                                    <Icon className="w-6 h-6 mb-1" strokeWidth={2.5} />
                                    <span className="text-xs font-bold">{option.label}</span>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex items-center justify-between p-3 bg-blue-50/50 cursor-pointer hover:bg-blue-100/50 transition-colors" onClick={() => setIsSourceSelected(false)}>
                        <div className="flex items-center gap-2">
                            {SOURCE_OPTIONS.find(o => o.id === form.serviceSource)?.icon && 
                                React.createElement(SOURCE_OPTIONS.find(o => o.id === form.serviceSource).icon, { className: "w-5 h-5 text-blue-600", strokeWidth: 2.5 })
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
                        <div onClick={() => setHasFaultFound(!hasFaultFound)} className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${hasFaultFound ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-transparent'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${hasFaultFound ? 'bg-amber-100 text-amber-600' : 'bg-white text-slate-400'}`}><AlertTriangle size={20} strokeWidth={2.5} /></div>
                                <div><div className={`font-bold text-sm ${hasFaultFound ? 'text-amber-800' : 'text-slate-600'}`}>發現故障？</div></div>
                            </div>
                            <div className={`w-10 h-5 rounded-full p-1 transition-colors ${hasFaultFound ? 'bg-amber-500' : 'bg-slate-300'}`}>
                                <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${hasFaultFound ? 'translate-x-5' : 'translate-x-0'}`}></div>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* 2. 故障類別 */}
            {hasFaultFound && (
                <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in slide-in-from-bottom duration-300">
                    <div className="flex border-b border-slate-100">
                        {FAULT_TABS.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeFaultTab === tab.id;
                            return (
                                <button key={tab.id} onClick={() => setActiveFaultTab(tab.id)} className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-bold transition-colors outline-none focus:outline-none ${isActive ? 'text-blue-600 bg-blue-50/50 border-b-2 border-blue-600' : 'text-slate-400 hover:bg-slate-50'}`}>
                                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2}/> {tab.label}
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
                                    className="flex-1 text-4xl font-mono font-bold text-slate-800 bg-transparent outline-none placeholder-slate-300"
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
                                        <button key={item} onClick={() => appendText('symptom', item)} className="px-3 py-1.5 bg-white text-slate-600 rounded-full text-xs font-bold border border-slate-200 shadow-sm active:scale-95 active:bg-blue-50 active:text-blue-600 outline-none focus:outline-none">
                                            {item}
                                        </button>
                                    ))}
                                    <button onClick={() => openTagManager(activeFaultTab)} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-100 flex items-center gap-1 active:bg-blue-100 outline-none focus:outline-none">
                                        <Settings size={12}/>管理標籤
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
                        <label className="text-sm font-bold text-slate-700 flex items-center"><Wrench size={16} strokeWidth={2.5} className="mr-1.5 text-blue-500"/> 處理過程</label>
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
                             <button key={tag} onClick={() => appendText('action', tag)} className="px-2 py-1 bg-slate-50 text-slate-500 rounded text-xs border border-slate-200 font-bold active:bg-blue-50 active:text-blue-600 outline-none focus:outline-none">
                                {tag}
                             </button>
                        ))}
                        <button onClick={() => openTagManager('action')} className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs border border-blue-100 font-bold flex items-center gap-1 active:bg-blue-100 outline-none focus:outline-none">
                            <Settings size={10}/>管理標籤
                        </button>
                    </div>
                </div>

                <div className="pt-4 border-t border-dashed border-slate-200">
                    <button onClick={() => setIsPartModalOpen(true)} className="w-full py-3 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors outline-none focus:outline-none focus:ring-2 focus:ring-blue-100">
                        <Package size={18} strokeWidth={2.5} /> 新增更換零件
                    </button>
                        {form.parts && form.parts.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {form.parts.map((part, index) => (
                                    <div key={index} className="flex justify-between items-center bg-white border border-slate-200 rounded-xl p-2 shadow-sm">
                                        <div className="flex items-center gap-2 pl-1 flex-1 min-w-0">
                                            <div className="bg-slate-100 p-1.5 rounded-lg text-slate-500 shrink-0">
                                                <Package size={16}/>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-sm font-bold text-slate-800 truncate">{part.name}</div>
                                                {part.model && (
                                                    <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                                                        {part.model}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1 border border-slate-100 shrink-0">
                                            <button onClick={() => updatePartQty(index, -1)} className="p-1 text-slate-400 hover:text-rose-500 active:scale-90 outline-none focus:outline-none"><Minus size={16}/></button>
                                            <span className="font-mono font-bold text-slate-800 w-6 text-center">{part.qty}</span>
                                            <button onClick={() => updatePartQty(index, 1)} className="p-1 text-slate-400 hover:text-blue-500 active:scale-90 outline-none focus:outline-none"><Plus size={16}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
            </section>

            {/* 4. 照片紀錄 */}
            <section className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center mb-3 text-sm font-bold text-slate-700"><ImageIcon size={16} strokeWidth={2.5} className="mr-1.5 text-purple-500"/> 現場照片</div>
                
                <div className="space-y-4 mb-4">
                    {['before', 'after'].map(type => (
                        <div key={type} className="space-y-2">
                            <div className="text-xs font-bold text-slate-500 flex items-center">
                                {type === 'before' ? '維修前照片' : '完修後照片'}
                                <span className="ml-2 text-slate-400 font-normal">({previews[type].length} 張)</span>
                            </div>
                            {previews[type].length === 0 ? (
                                <button 
                                    onClick={() => type === 'before' ? beforeFileInputRef.current?.click() : afterFileInputRef.current?.click()}
                                    className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold flex flex-col items-center justify-center hover:bg-slate-50 transition-colors outline-none focus:outline-none focus:border-blue-300"
                                >
                                    <Camera size={24} className="mb-2 opacity-50"/>
                                    <span className="text-xs">點擊上傳多張{type === 'before' ? '維修前' : '完修後'}照片</span>
                                </button>
                            ) : (
                                <div className="grid grid-cols-3 gap-2">
                                    {previews[type].map((preview, index) => (
                                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                                            <img src={preview} alt={`${type} ${index + 1}`} className="w-full h-full object-cover" />
                                            <button 
                                                onClick={(e) => handleRemovePhoto(e, type, index)}
                                                className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full backdrop-blur-sm hover:bg-black/70 outline-none"
                                            >
                                                <X size={12}/>
                                            </button>
                                        </div>
                                    ))}
                                    <button 
                                        onClick={() => type === 'before' ? beforeFileInputRef.current?.click() : afterFileInputRef.current?.click()}
                                        className="aspect-square border-2 border-dashed border-slate-200 rounded-lg text-slate-400 flex flex-col items-center justify-center hover:bg-slate-50 transition-colors outline-none focus:border-blue-300"
                                    >
                                        <Camera size={20} className="opacity-50"/>
                                    </button>
                                </div>
                            )}
                            <input 
                                type="file" 
                                accept="image/*"
                                multiple
                                className="hidden" 
                                ref={type === 'before' ? beforeFileInputRef : afterFileInputRef}
                                onChange={(e) => handleFileChange(e, type)}
                            />
                        </div>
                    ))}
                </div>
            </section>

            {/* 5. Footer */}
            <div className="bg-white border-t border-slate-200 p-3 pb-5 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.05)] mt-4 rounded-t-2xl">
                <div className="max-w-lg mx-auto flex gap-3 h-14">
                    <div className="w-1/2 grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                        {STATUS_OPTIONS.map(option => {
                            const isSelected = form.status === option.id;
                            return (
                                <button 
                                    key={option.id} 
                                    type="button" 
                                    onClick={() => setForm({...form, status: option.id})} 
                                    className={`flex flex-col items-center justify-center rounded-lg text-xs font-bold transition-all outline-none focus:outline-none ${isSelected ? `bg-white text-slate-800 shadow-sm border border-slate-200` : 'text-slate-400'}`}
                                >
                                    <option.icon size={16} strokeWidth={2.5} className={`mb-0.5 ${isSelected ? option.color : ''}`}/>
                                    {option.label}
                                </button>
                             )
                        })}
                    </div>
                    <button 
                        className={`w-1/2 rounded-xl shadow-lg transition-all flex items-center justify-center font-bold text-white text-lg active:scale-[0.98] outline-none focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            form.status === 'tracking' ? 'bg-orange-500 shadow-orange-200 focus:ring-orange-500' : 
                            form.status === 'monitor' ? 'bg-blue-500 shadow-blue-200 focus:ring-blue-500' : 
                            'bg-emerald-600 shadow-emerald-200 focus:ring-emerald-600'
                        } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={handlePreSubmit} 
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 
                         form.status === 'tracking' ? <span className="flex items-center">建立追蹤 <ChevronRight size={20}/></span> :
                         form.status === 'monitor' ? <span className="flex items-center">建立觀察 <ChevronRight size={20}/></span> :
                         <span className="flex items-center"><Save className="mr-2" size={20}/>確認結案</span>
                        }
                    </button>
                </div>
            </div>
        </div>

        {/* --- Modals 區塊 --- */}

        {/* 0. 標籤管理 Modal */}
        {isTagManagerOpen && (
            <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 animate-in fade-in" onClick={() => setIsTagManagerOpen(false)}>
                <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-xl flex flex-col max-h-[70vh]" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-2 border-b border-slate-100 pb-2">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center">
                            <Settings size={18} className="mr-2 text-blue-600"/> 
                            標籤管理
                        </h3>
                        <button onClick={resetTagsToDefault} className="text-xs text-rose-500 font-bold flex items-center gap-1 bg-rose-50 px-2 py-1 rounded hover:bg-rose-100 outline-none focus:outline-none">
                            <RefreshCw size={10}/> 還原預設
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1">
                        {(allTags[managingCategory] || []).map((tag, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100 group">
                                {editingTagIndex === idx ? (
                                    <div className="flex flex-1 gap-2">
                                        <input 
                                            autoFocus
                                            type="text"
                                            className="flex-1 min-w-0 bg-white border border-blue-400 rounded-lg px-2 py-1 text-sm font-bold outline-none"
                                            value={editTagInput}
                                            onChange={(e) => setEditTagInput(e.target.value)}
                                        />
                                        <button onClick={() => saveEditedTag(idx)} className="p-1.5 bg-blue-500 text-white rounded-lg"><CheckCircle size={16}/></button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="font-bold text-slate-700 text-sm ml-2">{tag}</span>
                                        <div className="flex gap-1">
                                            <button onClick={() => startEditingTag(idx, tag)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-white rounded-lg"><Pencil size={14}/></button>
                                            <button onClick={() => handleDeleteTag(idx)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white rounded-lg"><Trash2 size={14}/></button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <input 
                            type="text" 
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
                            placeholder="新增標籤..."
                            value={newTagInput}
                            onChange={(e) => setNewTagInput(e.target.value)}
                        />
                        <button onClick={handleAddTag} className="bg-blue-600 text-white px-4 rounded-xl font-bold shadow-md shadow-blue-200 active:scale-95 outline-none focus:outline-none">新增</button>
                    </div>
                    <button onClick={() => setIsTagManagerOpen(false)} className="mt-3 w-full py-2 bg-slate-100 text-slate-500 font-bold rounded-xl outline-none focus:outline-none">關閉</button>
                </div>
            </div>
        )}

        {/* 1. 零件選擇 Modal (庫存即時連動版 - 風格修正) */}
        {isPartModalOpen && (
            <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center animate-in fade-in" onClick={() => setIsPartModalOpen(false)}>
                <div className="bg-white w-full max-w-lg h-[80vh] rounded-t-2xl flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                        <h3 className="font-bold text-lg text-slate-800">選擇零件</h3>
                        <button onClick={() => setIsPartModalOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors outline-none focus:outline-none">
                            <X size={20}/>
                        </button>
                    </div>
                    
                    {/* Top Bar: 搜尋與型號 */}
                    <div className="p-4 bg-slate-50 shrink-0 border-b border-slate-100">
                        <div className="flex gap-3 items-center">
                            {/* 左側：搜尋輸入框 */}
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                                <input 
                                    type="text" 
                                    className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 font-bold text-slate-700" 
                                    placeholder="搜尋零件..." 
                                    value={partSearch} 
                                    onChange={(e) => setPartSearch(e.target.value)}
                                />
                            </div>
                            {/* 右側：型號下拉選單 */}
                            <div className="relative shrink-0">
                                <select
                                    value={selectedModel}
                                    onChange={(e) => setSelectedModel(e.target.value)}
                                    className="appearance-none bg-white border border-slate-200 rounded-xl py-2 pl-3 pr-8 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 cursor-pointer min-w-[100px]"
                                >
                                    {uniqueModels.map(model => (
                                        <option key={model} value={model}>
                                            {model === 'ALL' ? '全部型號' : model}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-2.5 text-slate-400 w-4 h-4 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                    
                    {/* Tabs: 快速分類切換 (預設改為 main) */}
                    <div className="px-4 py-3 bg-white border-b border-slate-100 shrink-0">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setActiveTab('main')}
                                className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-colors outline-none focus:outline-none ${
                                    activeTab === 'main'
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                🔧 主件
                            </button>
                            <button
                                onClick={() => setActiveTab('toner')}
                                className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-colors outline-none focus:outline-none ${
                                    activeTab === 'toner'
                                        ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                💧 碳粉
                            </button>
                            <button
                                onClick={() => setActiveTab('backup')}
                                className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-colors outline-none focus:outline-none ${
                                    activeTab === 'backup'
                                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                📦 備用
                            </button>
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-colors outline-none focus:outline-none ${
                                    activeTab === 'all'
                                        ? 'bg-slate-600 text-white shadow-md shadow-slate-200'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                🗃️ 全部
                            </button>
                        </div>
                    </div>
                    
                    {/* Content Area: 分組零件列表 */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                        {PART_CATEGORIES.map(category => {
                            const itemsInCategory = inventoryByCategory[category.id] || [];
                            if (itemsInCategory.length === 0) return null;
                            
                            return (
                                <div key={category.id} className="space-y-2">
                                    {/* 分類標題 */}
                                    <div className={`text-xs font-bold px-2 py-1 rounded ${category.color} w-fit`}>
                                        {category.name}
                                    </div>
                                    {/* 零件列表 */}
                                    {itemsInCategory.map(item => {
                                        const effectiveStock = getEffectiveStock(item);
                                        const outOfStock = effectiveStock <= 0;
                                        const isMatchingModel = customerMachineModel && item.model === customerMachineModel;
                                        const currentQtyInForm = form.parts?.find(p => p.name === item.name)?.qty || 0;
                                        const hasSelected = currentQtyInForm > 0;
                                        
                                        return (
                                            <div 
                                                key={item.id} 
                                                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors ${
                                                    outOfStock 
                                                        ? 'bg-slate-50 opacity-50 border-slate-200' 
                                                        : hasSelected
                                                            ? 'bg-blue-50 border-blue-300 shadow-sm'
                                                            : isMatchingModel 
                                                                ? 'bg-blue-50/50 border-blue-200 hover:border-blue-300' 
                                                                : 'bg-white border-slate-200 hover:border-blue-300'
                                                }`}
                                            >
                                                {/* 左側：零件資訊 */}
                                                <div className="flex-1 mr-3 min-w-0">
                                                    <div className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-2">
                                                        {item.name}
                                                        {isMatchingModel && (
                                                            <span className="text-[9px] bg-blue-200 text-blue-700 px-1.5 py-0.5 rounded font-bold">匹配</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded w-fit border border-slate-100">
                                                            {item.model || '通用'}
                                                        </div>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                            outOfStock ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                                                        }`}>
                                                            {outOfStock ? '已用盡' : `庫存 ${effectiveStock}`}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                {/* 右側：數量控制 (🌟已修正 -1 邏輯) */}
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button
                                                        onClick={() => handleAdjustQtyInModal(item, -1)}
                                                        disabled={currentQtyInForm === 0}
                                                        className={`p-2 rounded-lg transition-colors outline-none focus:outline-none ${
                                                            currentQtyInForm === 0
                                                                ? 'text-slate-300 cursor-not-allowed'
                                                                : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50 active:scale-90'
                                                        }`}
                                                    >
                                                        <Minus size={18} strokeWidth={2.5}/>
                                                    </button>
                                                    <div className={`min-w-[2rem] text-center font-mono font-bold text-base px-2 ${
                                                        hasSelected ? 'text-blue-600' : 'text-slate-400'
                                                    }`}>
                                                        {currentQtyInForm}
                                                    </div>
                                                    <button
                                                        onClick={() => handleAdjustQtyInModal(item, 1)}
                                                        disabled={outOfStock}
                                                        className={`p-2 rounded-lg transition-colors outline-none focus:outline-none ${
                                                            outOfStock
                                                                ? 'text-slate-300 cursor-not-allowed'
                                                                : 'text-slate-400 hover:text-blue-500 hover:bg-blue-50 active:scale-90'
                                                        }`}
                                                    >
                                                        <Plus size={18} strokeWidth={2.5}/>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                    
                    {/* Bottom Bar: 確認列 */}
                    <div className="border-t border-slate-200 bg-white p-4 shrink-0 sticky bottom-0">
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-sm font-bold text-slate-600">
                                已選擇 <span className="text-blue-600 text-base">{selectedPartsCount}</span> 個項目
                            </div>
                        </div>
                        <button
                            onClick={() => setIsPartModalOpen(false)}
                            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-base shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 outline-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            <CheckCircle size={20} strokeWidth={2.5}/>
                            確認並返回
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* 回訪日期選擇 Modal (Style Fix) */}
        {showVisitDateModal && (
            <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center">
                        <Calendar className="mr-2 text-blue-600" size={20}/> 
                        設定回訪日期
                    </h3>
                    
                    <div className="flex gap-2">
                        {[1, 3, 5].map(days => (
                            <button 
                                key={days}
                                onClick={() => setNextVisitDate(getFutureDate(days))}
                                className="flex-1 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 shadow-sm active:bg-blue-50 active:text-blue-600 transition-colors outline-none focus:outline-none focus:ring-2 focus:ring-blue-100"
                            >
                                {days}天
                            </button>
                        ))}
                        <button 
                            onClick={() => setNextVisitDate('')}
                            className="flex-1 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 shadow-sm outline-none focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                            自訂
                        </button>
                    </div>

                    <input 
                        type="date" 
                        value={nextVisitDate}
                        onChange={e => setNextVisitDate(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                    
                    {form.status === 'tracking' && (
                        <p className="text-xs text-orange-600 font-bold flex items-center">
                            <AlertTriangle size={12} className="mr-1"/> 案件將進入「待辦追蹤」列表
                        </p>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button 
                            onClick={() => { setShowVisitDateModal(false); setNextVisitDate(''); }} 
                            className="flex-1 py-3 bg-slate-100 font-bold text-slate-500 rounded-xl outline-none focus:outline-none"
                        >
                            取消
                        </button>
                        <button 
                            onClick={handleConfirmVisitDate}
                            className={`flex-1 py-3 text-white font-bold rounded-xl shadow-lg outline-none focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                form.status === 'tracking' 
                                    ? 'bg-orange-500 shadow-orange-200 focus:ring-orange-500' 
                                    : 'bg-blue-500 shadow-blue-200 focus:ring-blue-500'
                            }`}
                        >
                            建立{form.status === 'tracking' ? '追蹤' : '觀察'}
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
};

export default RecordForm;