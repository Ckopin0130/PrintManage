import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, Trash2 } from 'lucide-react';

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
      notes: initialData.notes || '',
      contactPerson: initialData.contactPerson || ''
  });

  // 當 initialData 變化時，更新 formData
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData({
        name: initialData.name || '',
        L1_group: initialData.L1_group || '屏東區',
        L2_district: initialData.L2_district || '',
        address: initialData.address || '',
        addressNote: initialData.addressNote || '',
        phoneLabel: initialData.phones?.[0]?.label || '主要電話',
        phoneNumber: initialData.phones?.[0]?.number || '',
        model: initialData.assets?.[0]?.model || '',
        notes: initialData.notes || '',
        contactPerson: initialData.contactPerson || ''
      });
    }
  }, [initialData]);

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

export default CustomerForm;