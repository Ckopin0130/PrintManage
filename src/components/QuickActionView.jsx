import React, { useState, useMemo, useRef } from 'react';
import { 
  ArrowLeft, Search, Camera, Check, User, MapPin, 
  Phone, ClipboardList, X
} from 'lucide-react';

const QuickActionView = ({ customers, onSaveRecord, onCancel }) => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('call'); // 'call', 'dispatch', 'patrol'
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  
  const fileInputRef = useRef(null);

  const handlePhotoChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newPhotos = [];
    const newPreviews = [];

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} 圖片過大，請選擇小於 5MB 的圖片`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_SIZE = 1024;
          if (width > height) {
            if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
          } else {
            if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          newPhotos.push(compressedDataUrl);
          newPreviews.push(compressedDataUrl);
          
          if (newPhotos.length === files.length) {
            setPhotos(prev => [...prev, ...newPhotos]);
            setPhotoPreviews(prev => [...prev, ...newPreviews]);
          }
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
    
    // 重置 input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const filteredCustomers = useMemo(() => {
    if (!searchText) return [];
    const lower = searchText.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(lower) || 
      (c.phones && c.phones.some(p => p.number.includes(lower))) ||
      (c.address && c.address.includes(lower))
    ).slice(0, 5);
  }, [customers, searchText]);

  const handleSubmit = () => {
    if (!selectedCustomer) {
      alert('請先選擇客戶');
      return;
    }
    if (!description) {
      alert('請輸入任務內容');
      return;
    }

    const newRecord = {
      id: Date.now().toString(),
      customerID: selectedCustomer.customerID,
      customerName: selectedCustomer.name,
      type: 'general',
      status: 'tracking',
      description: description,
      source: source,
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      photos: photos,
      parts: [],
      isQuickAction: true
    };

    onSaveRecord(newRecord);
    
    resetForm();
    onCancel();
  };

  const resetForm = () => {
    setSelectedCustomer(null);
    setSearchText('');
    setDescription('');
    setSource('call');
    setPhotos([]);
    setPhotoPreviews([]);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24 flex flex-col font-sans">
      {/* Top Navigation */}
      <div className="bg-white/95 backdrop-blur px-4 py-3 flex items-center shadow-sm sticky top-0 z-30 border-b border-slate-100/50 shrink-0">
        <button onClick={onCancel} className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-lg font-extrabold flex-1 text-center text-slate-800 tracking-wide">新增任務</h2>
        <div className="w-10"></div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 space-y-4">
        
        {/* 1. 任務來源 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <label className="text-sm font-bold text-slate-500 flex items-center mb-3">
            <Phone size={16} className="mr-1"/> 來源
          </label>
          <div className="flex gap-2">
            {[
              { id: 'call', label: '客戶叫修' },
              { id: 'dispatch', label: '公司派工' },
              { id: 'patrol', label: '例行巡檢' }
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setSource(opt.id)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${
                  source === opt.id 
                    ? 'bg-blue-100 text-blue-600 border-blue-300' 
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. 選擇客戶 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <label className="text-sm font-bold text-slate-500 flex items-center mb-3">
            <User size={16} className="mr-1"/> 客戶
          </label>
          
          {!selectedCustomer ? (
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                autoFocus
                placeholder="搜尋客戶名稱、電話..." 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
              />
              
              {searchText && filteredCustomers.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 shadow-xl rounded-xl z-10 overflow-hidden">
                  {filteredCustomers.map(c => (
                    <div 
                      key={c.customerID} 
                      onClick={() => { setSelectedCustomer(c); setSearchText(''); }}
                      className="p-3 border-b border-slate-50 last:border-0 active:bg-blue-50 cursor-pointer"
                    >
                      <div className="font-bold text-slate-800">{c.name}</div>
                      <div className="text-xs text-slate-400">{c.phones?.[0]?.number}</div>
                    </div>
                  ))}
                </div>
              )}
              
              {searchText && filteredCustomers.length === 0 && (
                 <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-white border border-slate-100 shadow-xl rounded-xl text-center text-slate-400 text-sm">
                   無相符客戶
                 </div>
              )}
            </div>
          ) : (
            <div className="flex justify-between items-center bg-blue-50 border border-blue-100 p-3 rounded-xl animate-in fade-in">
              <div>
                 <div className="font-bold text-blue-800 text-lg">{selectedCustomer.name}</div>
                 <div className="text-xs text-blue-600 flex items-center mt-1">
                   <MapPin size={12} className="mr-1"/> 
                   {selectedCustomer.address || '無地址'}
                 </div>
              </div>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="p-2 text-blue-400 hover:bg-blue-100 rounded-lg"
              >
                <X size={20}/>
              </button>
            </div>
          )}
        </div>

        {/* 3. 任務內容 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <label className="text-sm font-bold text-slate-500 flex items-center mb-3">
            <ClipboardList size={16} className="mr-1"/> 任務內容
          </label>
          <textarea 
            rows={3}
            placeholder="例：送耗材、定期檢查、卡紙、異音..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 resize-none"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        {/* 4. 照片 (選填) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <label className="text-sm font-bold text-slate-500 flex items-center mb-3">
            <Camera size={16} className="mr-1"/> 照片 (選填)
          </label>
          
          {photoPreviews.length === 0 ? (
             <button 
               onClick={() => fileInputRef.current?.click()}
               className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold flex flex-col items-center justify-center hover:bg-slate-50 transition-colors"
             >
               <Camera size={20} className="mb-1 opacity-50"/>
               <span className="text-xs">點擊拍攝或上傳檔案</span>
             </button>
          ) : (
             <div className="grid grid-cols-3 gap-2">
               {photoPreviews.map((preview, index) => (
                 <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                   <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                   <button 
                     onClick={() => removePhoto(index)}
                     className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full backdrop-blur-sm"
                   >
                     <X size={12}/>
                   </button>
                 </div>
               ))}
               {photoPreviews.length < 9 && (
                 <button 
                   onClick={() => fileInputRef.current?.click()}
                   className="aspect-square border-2 border-dashed border-slate-200 rounded-lg text-slate-400 flex flex-col items-center justify-center hover:bg-slate-50 transition-colors"
                 >
                   <Camera size={20} className="opacity-50"/>
                 </button>
               )}
             </div>
          )}
          <input 
            type="file" 
            accept="image/*"
            multiple
            className="hidden" 
            ref={fileInputRef}
            onChange={handlePhotoChange}
          />
        </div>

        {/* 5. 建立任務表單按鈕 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <label className="text-sm font-bold text-slate-500 flex items-center mb-3">
            <Check size={16} className="mr-1"/> 建立任務表單
          </label>
          <button 
            onClick={handleSubmit}
            className={`w-full py-3 rounded-xl flex items-center justify-center font-bold text-base active:scale-[0.98] transition-all ${
              selectedCustomer && description
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            disabled={!selectedCustomer || !description}
          >
            <Check size={18} className="mr-2" />
            建立任務表單
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickActionView;

