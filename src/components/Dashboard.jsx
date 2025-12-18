import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, Users, Search, PenTool, 
  Wifi, WifiOff, Package, FileText, Settings, 
  Sun, Cloud, CloudRain, MapPin, Printer, ChevronRight
} from 'lucide-react';

const Dashboard = ({ 
  today, dbStatus, pendingTasks, todayCompletedCount, totalCustomers, 
  setCurrentView, setActiveTab, setRosterLevel 
}) => {

  // --- 天氣與定位 ---
  const [weather, setWeather] = useState({ temp: '--', condition: 'Sunny', location: '定位中...' });

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
          const data = await res.json();
          const code = data.current_weather.weathercode;
          let cond = 'Sunny';
          if (code > 3) cond = 'Cloudy';
          if (code > 50) cond = 'Rainy';
          setWeather({ 
            temp: Math.round(data.current_weather.temperature), 
            condition: cond,
            location: '屏東市' 
          });
        } catch (e) { setWeather({ temp: 28, condition: 'Sunny', location: '屏東市' }); }
      }, () => setWeather({ temp: 28, condition: 'Sunny', location: '屏東市' }));
    }
  }, []);

  const getWeatherIcon = () => {
    if (weather.condition === 'Rainy') return <CloudRain size={24} className="text-white drop-shadow-md"/>;
    if (weather.condition === 'Cloudy') return <Cloud size={24} className="text-gray-300 drop-shadow-md"/>;
    return <Sun size={24} className="text-amber-400 drop-shadow-md animate-pulse-slow"/>;
  };

  const todayDate = new Date().toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' });
  const todayWeek = new Date().toLocaleDateString('zh-TW', { weekday: 'long' });

  const modules = [
    { 
      id: 'tracking', 
      title: '待辦追蹤', 
      icon: ClipboardList, 
      color: 'text-rose-500', 
      bgColor: 'bg-rose-50',
      info: '案件進度', // 補上說明
      badge: pendingTasks > 0 ? pendingTasks : null, 
      action: () => setCurrentView('tracking') 
    },
    { 
      id: 'roster', 
      title: '客戶名冊', 
      icon: Users, 
      color: 'text-blue-600', 
      bgColor: 'bg-blue-50',
      info: `${totalCustomers} 戶`, 
      action: () => { setActiveTab('roster'); setCurrentView('roster'); setRosterLevel('l1'); } 
    },
    { 
      id: 'records', 
      title: '維修紀錄', 
      icon: FileText, 
      color: 'text-amber-500', 
      bgColor: 'bg-amber-50',
      info: `今日 ${todayCompletedCount}`, 
      action: () => { setActiveTab('records'); setCurrentView('records'); } 
    },
    { 
      id: 'inventory', 
      title: '車載庫存', 
      icon: Package, 
      color: 'text-emerald-500', 
      bgColor: 'bg-emerald-50',
      info: '零件管理', // 補上說明
      action: () => { setActiveTab('inventory'); setCurrentView('inventory'); } 
    },
    { 
      id: 'worklog', 
      title: '工作日誌', 
      icon: PenTool, 
      color: 'text-violet-500', 
      bgColor: 'bg-violet-50',
      info: '日報生成', // 補上說明
      action: () => setCurrentView('worklog') 
    },
    { 
      id: 'settings', 
      title: '系統設定', 
      icon: Settings, 
      color: 'text-slate-500', 
      bgColor: 'bg-slate-100',
      info: '備份還原', // 補上說明
      action: () => setCurrentView('settings') 
    }
  ];

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col font-sans pb-24 animate-in">
      
      {/* 1. 純白頂部標題列 */}
      {/* 修改：pl-8 加大左邊距，讓標題視覺上更置中平衡 */}
      <div className="bg-white/90 backdrop-blur pl-8 pr-6 py-4 sticky top-0 z-30 flex justify-between items-center border-b border-gray-200/60 shadow-sm transition-all">
         <div className="flex items-center gap-3">
            <div className="bg-slate-800 p-1.5 rounded-lg shadow-sm">
              <Printer size={18} className="text-white"/>
            </div>
            <div className="font-extrabold text-lg text-slate-800 tracking-wide">印表機管家</div>
         </div>
         
         <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${dbStatus === 'online' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-500 border-rose-100'}`}>
            {dbStatus === 'online' ? <Wifi size={12}/> : <WifiOff size={12}/>}
            <span>{dbStatus === 'online' ? 'Online' : 'Offline'}</span>
         </div>
      </div>

      <div className="px-6 pt-6 pb-2 relative z-10">
         
         {/* 2. 資訊卡片 */}
         <div className="bg-gradient-to-br from-slate-800 to-blue-900 rounded-3xl p-5 text-white shadow-xl shadow-slate-300 relative overflow-hidden ring-1 ring-white/10">
            
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -ml-8 -mb-8 pointer-events-none"></div>

            <div className="flex justify-between items-center relative z-10 mb-5">
               <div>
                  <div className="text-xs font-bold text-slate-300 mb-0.5 uppercase tracking-wider">{todayWeek}</div>
                  <div className="text-3xl font-bold tracking-tight text-white">{todayDate}</div>
               </div>
               <div className="text-right">
                  <div className="flex items-center justify-end gap-2 mb-0.5">
                     <span className="text-2xl font-bold text-white">{weather.temp}°</span>
                     {getWeatherIcon()}
                  </div>
                  <div className="flex items-center justify-end gap-1 text-xs font-medium text-slate-300">
                     <MapPin size={10} /> {weather.location}
                  </div>
               </div>
            </div>

            {/* 純白搜尋欄 */}
            <div 
               onClick={() => setCurrentView('search')}
               className="bg-white rounded-xl p-3.5 flex items-center gap-3 shadow-lg shadow-black/5 cursor-text hover:bg-blue-50 transition-colors active:scale-[0.98] group"
            >
               <Search size={18} className="text-slate-400 group-hover:text-blue-600 transition-colors"/>
               <div className="text-sm font-bold text-gray-400 flex-1 group-hover:text-gray-500 transition-colors">搜尋客戶、電話或機型...</div>
               <div className="bg-gray-100 p-1 rounded-lg group-hover:bg-blue-100 transition-colors">
                  <ChevronRight size={14} className="text-gray-400 group-hover:text-blue-600"/>
               </div>
            </div>
         </div>
      </div>

      {/* 中文分隔線 */}
      <div className="px-6 mt-5 mb-3 flex items-center gap-4">
         <div className="h-px bg-gray-200 flex-1"></div>
         <span className="text-xs font-bold text-gray-400 tracking-widest">功能選單</span>
         <div className="h-px bg-gray-200 flex-1"></div>
      </div>

      {/* 3. 六大立體宮格 (3D Cards) */}
      <div className="px-6 pb-6">
         <div className="grid grid-cols-2 gap-4">
            {modules.map(item => (
               <button 
                  key={item.id} 
                  onClick={item.action}
                  // 修改重點：
                  // 1. shadow-[0_4px_12px...] 加深陰影，製造懸浮感
                  // 2. border-b-4 增加底部厚度，模仿實體按鍵
                  // 3. active:translate-y-1 按下時下沉，增加回饋感
                  className="bg-white p-4 rounded-2xl border border-slate-100 border-b-4 border-b-slate-200 shadow-[0_4px_12px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center gap-3 h-36 transition-all active:border-b-0 active:translate-y-1 active:shadow-none hover:border-blue-200 relative group overflow-hidden"
               >
                  <div className={`p-4 rounded-2xl ${item.bgColor} ${item.color} group-hover:scale-110 transition-transform duration-300 relative z-10`}>
                     <item.icon size={30} strokeWidth={2}/>
                  </div>
                  
                  <div className="text-center relative z-10">
                     <div className="font-bold text-gray-800 text-[15px]">{item.title}</div>
                     {/* 每個按鈕都有灰色小標籤，整齊劃一 */}
                     <div className="text-[10px] text-gray-500 font-bold mt-1.5 bg-slate-50 px-2.5 py-0.5 rounded-full inline-block border border-slate-100 group-hover:bg-white transition-colors">
                        {item.info}
                     </div>
                  </div>

                  {/* 裝飾用的微光效果 */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                  {item.badge && (
                     <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse z-20">
                        {item.badge}
                     </div>
                  )}
               </button>
            ))}
         </div>
      </div>
      
      <div className="mt-auto pt-4 text-center">
         <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-100 shadow-sm text-[10px] font-bold text-gray-400">
            <span>System Ready</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
         </div>
      </div>

    </div>
  );
};

export default Dashboard;