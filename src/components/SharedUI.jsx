import React, { useEffect, useState } from 'react';
import { 
  CheckCircle, Info, Loader2, Trash2, PhoneCall, AlertTriangle, 
  Navigation, X 
} from 'lucide-react';

// 1. 確認對話框
export const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, isProcessing }) => {
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

// 2. 提示訊息 (Toast)
export const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
  const bg = type === 'success' ? 'bg-emerald-600' : (type === 'error' ? 'bg-red-600' : 'bg-gray-800');
  const icon = type === 'success' ? <CheckCircle size={18} className="text-white"/> : <Info size={18} className="text-white"/>;
  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[80] ${bg} text-white px-4 py-3 rounded-full shadow-xl flex items-center space-x-2 animate-in`}>
      {icon} <span className="font-bold text-sm">{message}</span>
    </div>
  );
};

// 3. 電話選單
export const PhoneActionSheet = ({ phones, onClose }) => {
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

// 4. 地址警告框
export const AddressAlertDialog = ({ customer, onClose }) => {
  if (!customer) return null;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=$?q=${encodeURIComponent(customer.address || '')}`;
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

// 5. 圖片檢視器
export const ImageViewer = ({ src, onClose }) => {
  if (!src) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-[70] flex items-center justify-center p-2 animate-in" onClick={onClose}>
      <img src={src} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" alt="Full view" />
      <button className="absolute top-4 right-4 text-white bg-gray-800/50 p-2 rounded-full hover:bg-gray-700" onClick={onClose}><X size={24} /></button>
    </div>
  );
};

// 6. 全局樣式
export const GlobalStyles = () => (
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