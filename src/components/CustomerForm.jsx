import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Building2, User, Phone, PhoneForwarded, MapPin, Navigation, Info, Printer, AlertTriangle } from 'lucide-react';

// 清理函數：如果 addressNote 看起來像是錯誤的資料（例如只有數字或與 notes 相同），則清空
const cleanAddressNote = (addressNote, notes) => {
  if (!addressNote || addressNote.trim() === '') return '';
  // 如果 addressNote 與 notes 相同，則清空（可能是舊資料錯誤）
  if (notes && addressNote === notes) return '';
  // 如果 addressNote 只有數字且長度很短（可能是錯誤的資料），則清空
  if (/^\d+$/.test(addressNote.trim()) && addressNote.trim().length <= 3) return '';
  return addressNote;
};

const CustomerForm = ({ mode, initialData, onSubmit, onCancel, onDelete }) => {
  const isEdit = mode === 'edit';

  const [formData, setFormData] = useState({
      name: initialData.name || '',
      L1_group: initialData.L1_group || '屏東區',
      L2_district: initialData.L2_district || '',
      address: initialData.address || '',
      // 確保 addressNote 和 notes 完全分開，並清理錯誤的資料
      addressNote: cleanAddressNote(
        (initialData.addressNote !== undefined && initialData.addressNote !== null) ? initialData.addressNote : '',
        (initialData.notes !== undefined && initialData.notes !== null) ? initialData.notes : ''
      ),
      phoneLabel: initialData.phones?.[0]?.label || '主要電話',
      phoneNumber: initialData.phones?.[0]?.number || '',
      model: initialData.assets?.[0]?.model || '',
      // 確保 notes 和 addressNote 完全分開，只使用 notes 欄位
      notes: (initialData.notes !== undefined && initialData.notes !== null) ? initialData.notes : '',
      contactPerson: initialData.contactPerson || ''
  });

  // 當 initialData 變化時，更新 formData
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      const notes = (initialData.notes !== undefined && initialData.notes !== null) ? initialData.notes : '';
      const addressNote = (initialData.addressNote !== undefined && initialData.addressNote !== null) ? initialData.addressNote : '';
      
      setFormData({
        name: initialData.name || '',
        L1_group: initialData.L1_group || '屏東區',
        L2_district: initialData.L2_district || '',
        address: initialData.address || '',
        // 確保 addressNote 和 notes 完全分開，並清理錯誤的資料
        addressNote: cleanAddressNote(addressNote, notes),
        phoneLabel: initialData.phones?.[0]?.label || '主要電話',
        phoneNumber: initialData.phones?.[0]?.number || '',
        model: initialData.assets?.[0]?.model || '',
        // 確保 notes 和 addressNote 完全分開，只使用 notes 欄位
        notes: notes,
        contactPerson: initialData.contactPerson || ''
      });
    }
  }, [initialData]);

  const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
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

        {/* 名片卡區域 - 與 CustomerDetail 完全一致的格式 */}
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
                className="flex-1 text-base font-bold text-slate-800 bg-transparent border-none outline-none placeholder:text-slate-400"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
              {isEdit && formData.L2_district && (
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded flex-shrink-0">
                  {formData.L2_district}
                </span>
              )}
              {!isEdit && (
                <input
                  type="text"
                  placeholder="地區"
                  className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded flex-shrink-0 w-20"
                  value={formData.L2_district}
                  onChange={e => setFormData({...formData, L2_district: e.target.value})}
                />
              )}
            </div>
          </div>

          {/* 第二行：聯絡人 */}
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600 shrink-0 flex items-center justify-center">
              <User size={20} strokeWidth={2.5} />
            </div>
            <input
              type="text"
              placeholder="聯絡人"
              className="flex-1 text-base font-bold text-slate-800 bg-transparent border-none outline-none placeholder:text-slate-400"
              value={formData.contactPerson}
              onChange={e => setFormData({...formData, contactPerson: e.target.value})}
            />
          </div>

          {/* 第三行：電話 + 撥號鍵 */}
          <div className="flex items-center gap-3">
            <div className="bg-green-50 p-2.5 rounded-xl text-green-600 shrink-0 flex items-center justify-center">
              <Phone size={20} strokeWidth={2.5} />
            </div>
            <input
              type="tel"
              placeholder="電話號碼"
              className="flex-1 text-base font-bold text-slate-800 bg-transparent border-none outline-none placeholder:text-slate-400 min-w-0"
              value={formData.phoneNumber}
              onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
            />
            <div className="bg-green-50 p-2.5 rounded-xl text-green-600 shrink-0 flex items-center justify-center opacity-50">
              <PhoneForwarded size={18} strokeWidth={2.5} />
            </div>
          </div>

          {/* 第四行：地址 + 導航 */}
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 shrink-0 flex items-center justify-center">
              <MapPin size={20} strokeWidth={2.5} />
            </div>
            <input
              required
              type="text"
              placeholder="輸入完整地址"
              className="flex-1 text-base text-slate-500 bg-transparent border-none outline-none placeholder:text-slate-400"
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
            />
            <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 shrink-0 flex items-center justify-center opacity-50">
              <Navigation size={18} strokeWidth={2.5} />
            </div>
          </div>

          {/* 地址注意事項 - 獨立一行，使用較小的樣式 */}
          <div className="flex items-center gap-3 pl-12">
            <div className="bg-red-50 p-2 rounded-lg text-red-600 shrink-0 flex items-center justify-center">
              <AlertTriangle size={16} strokeWidth={2.5} />
            </div>
            <input
              type="text"
              placeholder="地址注意事項（例：後門進入...）"
              className="flex-1 text-sm text-red-700 bg-red-50 rounded-lg px-3 py-1.5 border border-red-100 outline-none placeholder:text-red-400"
              value={formData.addressNote}
              onChange={e => setFormData({...formData, addressNote: e.target.value})}
            />
          </div>

          {/* 第五行：備註 */}
          <div className="flex items-start gap-3">
            <div className="bg-violet-50 p-2.5 rounded-xl text-violet-600 shrink-0 flex items-center justify-center">
              <Info size={20} strokeWidth={2.5} />
            </div>
            <textarea
              rows={3}
              placeholder="其他備註..."
              className="flex-1 text-base text-slate-700 bg-transparent border-none outline-none placeholder:text-slate-400 resize-none leading-relaxed"
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          {/* 第六行：機器型號 */}
          <div className="flex items-center gap-3">
            <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600 shrink-0 flex items-center justify-center">
              <Printer size={20} strokeWidth={2.5} />
            </div>
            <input
              type="text"
              placeholder="機器型號（例：MP 3352）"
              className="flex-1 text-base font-bold text-slate-800 bg-transparent border-none outline-none placeholder:text-slate-400"
              value={formData.model}
              onChange={e => setFormData({...formData, model: e.target.value})}
            />
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
