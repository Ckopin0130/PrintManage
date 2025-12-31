import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Building2, User, Smartphone, MapPin, Info, Printer, Plus } from 'lucide-react';

const CustomerForm = ({ mode, initialData, onSubmit, onCancel, onDelete }) => {
  const isEdit = mode === 'edit';

  // 使用函数形式初始化 state，根据 mode 决定初始值
  const [formData, setFormData] = useState(() => {
    // 如果是编辑模式且有数据，使用传入的数据
    if (isEdit && initialData && Object.keys(initialData).length > 0) {
      return {
        name: initialData.name || '',
        L1_group: initialData.L1_group || '屏東區',
        L2_district: initialData.L2_district || '',
        address: initialData.address || '',
        phoneLabel: initialData.phones?.[0]?.label || '主要電話',
        phoneNumber: initialData.phones?.[0]?.number || '',
        assets: initialData.assets && initialData.assets.length > 0 ? initialData.assets : [{ model: '' }],
        notes: (initialData.notes !== undefined && initialData.notes !== null) ? initialData.notes : '',
        contactPerson: initialData.contactPerson || ''
      };
    }
    // 新增模式的默认值
    return {
      name: '',
      L1_group: '屏東區',
      L2_district: '',
      address: '',
      phoneLabel: '主要電話',
      phoneNumber: '',
      assets: [{ model: '' }],
      notes: '',
      contactPerson: ''
    };
  });

  // 當 initialData 或 mode 變化時，更新 formData
  useEffect(() => {
    if (isEdit && initialData && Object.keys(initialData).length > 0) {
      setFormData({
        name: initialData.name || '',
        L1_group: initialData.L1_group || '屏東區',
        L2_district: initialData.L2_district || '',
        address: initialData.address || '',
        phoneLabel: initialData.phones?.[0]?.label || '主要電話',
        phoneNumber: initialData.phones?.[0]?.number || '',
        assets: initialData.assets && initialData.assets.length > 0 ? initialData.assets : [{ model: '' }],
        notes: (initialData.notes !== undefined && initialData.notes !== null) ? initialData.notes : '',
        contactPerson: initialData.contactPerson || ''
      });
    } else if (!isEdit) {
      // 新增模式：重置为默认值
      setFormData({
        name: '',
        L1_group: '屏東區',
        L2_district: '',
        address: '',
        phoneLabel: '主要電話',
        phoneNumber: '',
        assets: [{ model: '' }],
        notes: '',
        contactPerson: ''
      });
    }
  }, [initialData, isEdit]);

  const handleSubmit = (e) => {
      e.preventDefault();
      // 過濾掉空的機型
      const filteredAssets = formData.assets.filter(asset => asset.model && asset.model.trim() !== '');
      onSubmit({
        ...formData,
        assets: filteredAssets.length > 0 ? filteredAssets : []
      });
  };

  const handleAddAsset = () => {
    setFormData({
      ...formData,
      assets: [...formData.assets, { model: '' }]
    });
  };

  const handleRemoveAsset = (index) => {
    if (formData.assets.length > 1) {
      setFormData({
        ...formData,
        assets: formData.assets.filter((_, i) => i !== index)
      });
    }
  };

  const handleAssetChange = (index, value) => {
    const newAssets = [...formData.assets];
    newAssets[index] = { model: value };
    setFormData({
      ...formData,
      assets: newAssets
    });
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24 flex flex-col font-sans">
      {/* 頂部標題列 - 與 CustomerDetail 風格一致 */}
      <div className="bg-white/95 backdrop-blur px-4 py-3 flex items-center shadow-sm sticky top-0 z-30 border-b border-slate-100/50 shrink-0">
        <button onClick={onCancel} className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
          <X size={24} />
        </button>
        <h2 className="text-lg font-extrabold flex-1 text-center text-slate-800 tracking-wide">
          {isEdit ? '編輯客戶資料' : '新增客戶'}
        </h2>
        {isEdit && (
          <button onClick={onDelete} className="p-2 -mr-2 text-red-500 hover:bg-red-50 rounded-full transition-colors">
            <Trash2 size={20} />
          </button>
        )}
        {!isEdit && <div className="w-10" />}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 space-y-4">
        {/* 分類選擇區域 - 僅在新增時顯示 */}
        {!isEdit && (
          <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] border border-slate-100 p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold block mb-2 text-slate-700">區域分類</label>
                <select 
                  required 
                  className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none text-base font-bold" 
                  value={formData.L1_group} 
                  onChange={e => setFormData({...formData, L1_group: e.target.value})}
                >
                  {['屏東區', '高雄區', '學校單位', '軍事單位'].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-bold block mb-2 text-slate-700">鄉鎮市區</label>
                <input 
                  required 
                  placeholder="例：新園鄉" 
                  className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none text-base font-bold" 
                  value={formData.L2_district} 
                  onChange={e => setFormData({...formData, L2_district: e.target.value})} 
                />
              </div>
            </div>
          </div>
        )}

        {/* 名片卡區域 - 與 CustomerDetail 完全一致的格式和順序 */}
        <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] border border-slate-100 p-5 space-y-4">
          {/* 第一行：客戶名稱 + 地區 */}
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 shrink-0 flex items-center justify-center">
              <Building2 size={20} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <input
                required
                type="text"
                placeholder="輸入客戶名稱"
                className="flex-1 text-base font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
              {isEdit && formData.L2_district && (
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                  {formData.L2_district}
                </span>
              )}
            </div>
          </div>

          {/* 第二行：聯絡人（獨立一行） */}
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600 shrink-0 flex items-center justify-center">
              <User size={20} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                placeholder="聯絡人"
                className="w-full text-base font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300"
                value={formData.contactPerson}
                onChange={e => setFormData({...formData, contactPerson: e.target.value})}
              />
            </div>
          </div>

          {/* 第三行：電話（獨立一行） */}
          <div className="flex items-center gap-3">
            <div className="bg-green-50 p-2.5 rounded-xl text-green-600 shrink-0 flex items-center justify-center">
              <Smartphone size={20} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <input
                type="tel"
                placeholder="電話號碼"
                className="w-full text-base font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-100 focus:border-green-300"
                value={formData.phoneNumber}
                onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
              />
            </div>
          </div>

          {/* 第四行：地址 */}
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 shrink-0 flex items-center justify-center">
              <MapPin size={20} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <input
                required
                type="text"
                placeholder="輸入完整地址"
                className="w-full text-base text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
              />
            </div>
          </div>

          {/* 第五行：備註 */}
          <div className="flex items-start gap-3">
            <div className="bg-violet-50 p-2.5 rounded-xl text-violet-600 shrink-0 flex items-center justify-center">
              <Info size={20} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <textarea
                rows={3}
                placeholder="其他備註..."
                className="w-full text-base text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-300 resize-none"
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
              />
            </div>
          </div>

          {/* 第六行：機器型號（支援多台） */}
          <div className="flex items-start gap-3">
            <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600 shrink-0 flex items-center justify-center">
              <Printer size={20} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              {formData.assets.map((asset, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`機器型號 ${index + 1}（例：MP 3352）`}
                    className="flex-1 text-base font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-300"
                    value={asset.model || ''}
                    onChange={e => handleAssetChange(index, e.target.value)}
                  />
                  {formData.assets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAsset(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddAsset}
                className="w-full py-2 text-amber-600 text-sm font-bold bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                新增機型
              </button>
            </div>
          </div>
        </div>

        {/* 儲存按鈕 */}
        <button 
          type="button"
          onClick={handleSubmit} 
          className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          <Save size={20} />
          {isEdit ? '儲存變更' : '確認新增'}
        </button>
      </div>
    </div>
  );
};

export default CustomerForm;
