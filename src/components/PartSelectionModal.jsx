import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, Search, ChevronDown, Wrench, Droplet, Archive, Layers, 
  Plus, Minus, CheckCircle
} from 'lucide-react';

// 零件分類定義
const PART_CATEGORIES = [
  { id: 'cat_toner', name: '碳粉', color: 'bg-purple-100 text-purple-700' },
  { id: 'cat_color', name: '彩色', color: 'bg-pink-100 text-pink-700' },
  { id: 'cat_bw', name: '黑白', color: 'bg-gray-100 text-gray-700' },
  { id: 'cat_common', name: '共用耗材', color: 'bg-blue-100 text-blue-700' },
  { id: 'cat_other', name: '其他', color: 'bg-slate-100 text-slate-700' }
];

// 分類遷移函數
const migrateCategory = (modelName, item) => {
  if (item.categoryId) return item.categoryId;
  const up = (modelName || '').toUpperCase();
  if (item.categoryType === 'TONER' || up.includes('碳粉') || up.includes('TONER') || up.includes('INK')) return 'cat_toner';
  if (item.categoryType === 'COLOR' || up.includes(' C') || up.includes('MPC') || up.includes('IMC') || up.includes('彩色')) return 'cat_color';
  if (item.categoryType === 'BW' || up.includes('MP') || up.includes('IM') || up.includes('AFICIO') || up.includes('黑白')) return 'cat_bw';
  if (item.categoryType === 'COMMON' || up.includes('耗材') || up.includes('共用') || up.includes('COMMON')) return 'cat_common';
  return 'cat_other';
};

// 型號匹配函數
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

const PartSelectionModal = ({
  isOpen,
  onClose,
  inventory,
  selectedParts = [],
  onUpdateParts,
  customerModel = ''
}) => {
  // 本地狀態
  const [partSearch, setPartSearch] = useState('');
  const [selectedModel, setSelectedModel] = useState('ALL');
  const [activeTab, setActiveTab] = useState('main');

  // 當 Modal 打開時自動設置型號篩選
  useEffect(() => {
    if (isOpen && customerModel) {
      setSelectedModel(customerModel);
      setActiveTab('main');
    } else if (isOpen && !customerModel) {
      setSelectedModel('ALL');
      setActiveTab('main');
    }
  }, [isOpen, customerModel]);

  // 計算可用型號列表
  const uniqueModels = useMemo(() => {
    const models = new Set(inventory.map(i => i.model).filter(Boolean));
    return ['ALL', ...Array.from(models).sort()];
  }, [inventory]);

  // 計算有效庫存
  const getEffectiveStock = (item) => {
    const inFormQty = selectedParts?.find(p => p.name === item.name)?.qty || 0;
    return Math.max(0, item.qty - inFormQty);
  };

  // 篩選庫存
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
    
    if (customerModel && selectedModel !== 'ALL') {
      items = items.sort((a, b) => {
        const aMatch = isModelMatch(a.model, customerModel);
        const bMatch = isModelMatch(b.model, customerModel);

        if (a.model === customerModel && b.model !== customerModel) return -1;
        if (a.model !== customerModel && b.model === customerModel) return 1;
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        if ((!a.model || a.model === '通用' || a.model === '未分類') && b.model && b.model !== '通用' && b.model !== '未分類') return -1;
        if (a.model && a.model !== '通用' && a.model !== '未分類' && (!b.model || b.model === '通用' || b.model === '未分類')) return 1;
        return 0;
      });
    }
    
    return items;
  }, [inventory, selectedModel, partSearch, customerModel, activeTab]);

  // 按分類分組
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

  // 計算已選擇的零件數量
  const selectedPartsCount = useMemo(() => {
    return selectedParts?.reduce((sum, part) => sum + part.qty, 0) || 0;
  }, [selectedParts]);

  // 調整數量
  const handleAdjustQty = (item, delta) => {
    const currentParts = [...(selectedParts || [])];
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
              return;
            }
          }
        }
        updatedParts[existingIndex].qty = newQty;
      }
      onUpdateParts(updatedParts);
    } else {
      if (delta > 0) {
        const currentInForm = currentParts
          .filter(p => p.name === item.name)
          .reduce((sum, p) => sum + p.qty, 0);
        const remainingStock = item.qty - currentInForm;
        
        if (remainingStock <= 0) {
          alert('庫存已用盡！(包含已加入清單的數量)');
          return;
        }
        
        onUpdateParts([...currentParts, { 
          id: item.id, 
          name: item.name, 
          qty: 1,
          model: item.model 
        }]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center animate-in fade-in" 
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-lg h-[80vh] rounded-t-2xl flex flex-col shadow-2xl" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-lg text-slate-800">選擇零件</h3>
          <button 
            onClick={onClose} 
            className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors outline-none focus:outline-none" 
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
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
        
        {/* Tabs: 快速分類切換 */}
        <div className="px-4 py-3 bg-white border-b border-slate-100 shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('main')}
              className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-colors outline-none focus:outline-none flex flex-col items-center justify-center gap-1 ${
                activeTab === 'main'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Wrench size={18} />
              主件
            </button>
            <button
              onClick={() => setActiveTab('toner')}
              className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-colors outline-none focus:outline-none flex flex-col items-center justify-center gap-1 ${
                activeTab === 'toner'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Droplet size={18} />
              碳粉
            </button>
            <button
              onClick={() => setActiveTab('backup')}
              className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-colors outline-none focus:outline-none flex flex-col items-center justify-center gap-1 ${
                activeTab === 'backup'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Archive size={18} />
              備用
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-colors outline-none focus:outline-none flex flex-col items-center justify-center gap-1 ${
                activeTab === 'all'
                  ? 'bg-slate-600 text-white shadow-md shadow-slate-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Layers size={18} />
              全部
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
                  const isMatchingModel = customerModel && item.model === customerModel;
                  const currentQtyInForm = selectedParts?.find(p => p.name === item.name)?.qty || 0;
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
                      
                      {/* 右側：數量控制 */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleAdjustQty(item, -1)}
                          disabled={currentQtyInForm === 0}
                          className={`p-2 rounded-lg transition-colors outline-none focus:outline-none ${
                            currentQtyInForm === 0
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50 active:scale-90'
                          }`}
                          style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                          <Minus size={18} strokeWidth={2.5}/>
                        </button>
                        <div className={`min-w-[2rem] text-center font-mono font-bold text-base px-2 ${
                          hasSelected ? 'text-blue-600' : 'text-slate-400'
                        }`}>
                          {currentQtyInForm}
                        </div>
                        <button
                          onClick={() => handleAdjustQty(item, 1)}
                          disabled={outOfStock}
                          className={`p-2 rounded-lg transition-colors outline-none focus:outline-none ${
                            outOfStock
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-slate-400 hover:text-blue-500 hover:bg-blue-50 active:scale-90'
                          }`}
                          style={{ WebkitTapHighlightColor: 'transparent' }}
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
            onClick={onClose}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-base shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 outline-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <CheckCircle size={20} strokeWidth={2.5}/>
            確認並返回
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartSelectionModal;

