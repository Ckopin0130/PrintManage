import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Building2, User, Phone, PhoneForwarded, MapPin, Navigation, Info, Printer } from 'lucide-react';

const CustomerForm = ({ mode, initialData, onSubmit, onCancel, onDelete }) => {
  const isEdit = mode === 'edit';

  const [formData, setFormData] = useState({
      name: initialData.name || '',
      L1_group: initialData.L1_group || '屏東區',
      L2_district: initialData.L2_district || '',
      address: initialData.address || '',
      phoneLabel: initialData.phones?.[0]?.label || '主要電話',
      phoneNumber: initialData.phones?.[0]?.number || '',
      model: initialData.assets?.[0]?.model || '',
      notes: (initialData.notes !== undefined && initialData.notes !== null) ? initialData.notes : '',
      contactPerson: initialData.contactPerson || ''
  });

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData({
        name: initialData.name || '',
        L1_group: initialData.L1_group || '屏東區',
        L2_district: initialData.L2_district || '',
        address: initialData.address || '',
        phoneLabel: initialData.phones?.[0]?.label || '主要電話',
        phoneNumber: initialData.phones?.[0]?.number || '',
        model: initialData.assets?.[0]?.model || '',
        notes: (initialData.notes !== undefined && initialData.notes !== null) ? initialData.notes : '',
        contactPerson: initialData.contactPerson || ''
      });
    }
  }, [initialData]);

  const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 min-h-screen pb-24 flex flex-col font-sans">
      {/* 頂部標題列 */}
      <div className="bg-white/95 backdrop-blur-md px-4 py-3 flex items-center shadow-sm sticky top-0 z-30 border-b border-slate-100/50 shrink-0">
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

      <div className="flex-1 overflow-y-auto px-4 pt-6 space-y-6">
        {/* 分類選擇區域 - 僅在新增時顯示 */}
        {!isEdit && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold block mb-2 text-slate-700">區域分類</label>
                <select 
                  required 
                  className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 outline-none text-base font-bold focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all" 
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
                  className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 outline-none text-base font-bold focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all" 
                  value={formData.L2_district} 
                  onChange={e => setFormData({...formData, L2_district: e.target.value})} 
                />
              </div>
            </div>
          </div>
        )}

        {/* 客戶名片卡區域 - 與 CustomerDetail 一致的設計 */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          {/* 頂部漸變標題區 */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 px-6 py-8 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
                  <Building2 size={24} className="text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <input
                    required
                    type="text"
                    placeholder="輸入客戶名稱"
                    className="w-full text-2xl font-extrabold text-white bg-transparent border-none outline-none placeholder:text-white/70 mb-2"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                  {isEdit && formData.L2_district && (
                    <span className="text-sm font-bold text-blue-100 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm inline-block">
                      {formData.L2_district}
                    </span>
                  )}
                  {!isEdit && (
                    <input
                      type="text"
                      placeholder="地區"
                      className="text-sm font-bold text-blue-100 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm outline-none placeholder:text-blue-100/50 w-24"
                      value={formData.L2_district}
                      onChange={e => setFormData({...formData, L2_district: e.target.value})}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 信息輸入區域 */}
          <div className="p-6 space-y-4">
            {/* 聯絡人 */}
            <div className="flex items-center gap-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 focus-within:bg-emerald-50 focus-within:border-emerald-300 transition-all">
              <div className="bg-emerald-500 p-3 rounded-xl shadow-sm">
                <User size={20} className="text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-emerald-600 mb-1">聯絡人</div>
                <input
                  type="text"
                  placeholder="輸入聯絡人姓名"
                  className="w-full text-base font-bold text-slate-800 bg-transparent border-none outline-none placeholder:text-slate-400"
                  value={formData.contactPerson}
                  onChange={e => setFormData({...formData, contactPerson: e.target.value})}
                />
              </div>
            </div>

            {/* 電話 */}
            <div className="flex items-center gap-4 p-4 bg-green-50/50 rounded-2xl border border-green-100/50 focus-within:bg-green-50 focus-within:border-green-300 transition-all">
              <div className="bg-green-500 p-3 rounded-xl shadow-sm">
                <Phone size={20} className="text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-green-600 mb-1">電話</div>
                <input
                  type="tel"
                  placeholder="輸入電話號碼"
                  className="w-full text-base font-bold text-slate-800 bg-transparent border-none outline-none placeholder:text-slate-400"
                  value={formData.phoneNumber}
                  onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                />
              </div>
              <div className="bg-green-500/20 p-3 rounded-xl">
                <PhoneForwarded size={20} className="text-green-600" />
              </div>
            </div>

            {/* 地址 */}
            <div className="flex items-center gap-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 focus-within:bg-blue-50 focus-within:border-blue-300 transition-all">
              <div className="bg-blue-500 p-3 rounded-xl shadow-sm">
                <MapPin size={20} className="text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-blue-600 mb-1">地址</div>
                <input
                  required
                  type="text"
                  placeholder="輸入完整地址"
                  className="w-full text-sm text-slate-700 bg-transparent border-none outline-none placeholder:text-slate-400"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                />
              </div>
              <div className="bg-blue-500/20 p-3 rounded-xl">
                <Navigation size={20} className="text-blue-600" />
              </div>
            </div>

            {/* 備註 */}
            <div className="flex items-start gap-4 p-4 bg-violet-50/50 rounded-2xl border border-violet-100/50 focus-within:bg-violet-50 focus-within:border-violet-300 transition-all">
              <div className="bg-violet-500 p-3 rounded-xl shadow-sm mt-0.5">
                <Info size={20} className="text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-violet-600 mb-1">備註</div>
                <textarea
                  rows={3}
                  placeholder="輸入其他備註..."
                  className="w-full text-sm text-slate-700 bg-transparent border-none outline-none placeholder:text-slate-400 resize-none leading-relaxed"
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                />
              </div>
            </div>

            {/* 機器型號 */}
            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50 focus-within:bg-amber-50 focus-within:border-amber-300 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-amber-500 p-2.5 rounded-lg shadow-sm">
                  <Printer size={18} className="text-white" strokeWidth={2.5} />
                </div>
                <div className="text-xs font-bold text-amber-600">機器型號</div>
              </div>
              <input
                type="text"
                placeholder="例：MP 3352"
                className="w-full text-base font-bold text-slate-800 bg-transparent border-none outline-none placeholder:text-slate-400"
                value={formData.model}
                onChange={e => setFormData({...formData, model: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* 儲存按鈕 */}
        <button 
          type="button"
          onClick={handleSubmit} 
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Save size={20} />
          {isEdit ? '儲存變更' : '確認新增'}
        </button>
      </div>
    </div>
  );
};

export default CustomerForm;
