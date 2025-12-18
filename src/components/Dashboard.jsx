import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, Users, Search, PenTool, 
  Wifi, WifiOff, Package, FileText, Settings, 
  Sun, Cloud, CloudRain, MapPin, Printer, ChevronRight, Clock
} from 'lucide-react';

const Dashboard = ({ 
  today, dbStatus, pendingTasks, todayCompletedCount, totalCustomers, 
  setCurrentView, setActiveTab, setRosterLevel 
}) => {

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
      info: pendingTasks > 0 ? `${pendingTasks} 件待辦` : '目前無案',
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
      info: `今日 ${todayCompletedCount} 件`, 
      action: () => { setActiveTab('records'); setCurrentView('records'); } 
    },
    { 
      id: 'inventory', 
      title: '車載庫存', 
      icon: Package, 
      color: 'text-emerald-500', 
      bgColor: 'bg-emerald-50',
      info: '零件盤點', 
      action: () => { setActiveTab('inventory'); setCurrentView('inventory'); } 
    },
    { 
      id: 'worklog', 
      title: '工作日誌', 
      icon: PenTool, 
      color: 'text-violet-500', 
      bgColor: 'bg-violet-50',
      info: '一鍵日報', 
      action: () => setCurrentView('worklog') 
    },
    { 
      id: 'settings', 
      title: '系統設定', 
      icon: Settings, 
      color: 'text-slate-500', 
      bgColor: 'bg-slate-100',
      info: '備份還原', 
      action: () => setCurrentView('settings') 
    }
  ];

  return (
    <div className="bg-gray-50 h-screen flex flex-col font-sans animate-in overflow-hidden">
      
      {/* 1. 頂部標題列 */}
      <div className="bg-white/90 backdrop-blur pl-6 pr-4 py-3 flex justify-between items-center border-b border-gray-200/60 shadow-sm z-30 shrink-0">
         <div className="flex items-center gap-2.5">
            <div className="bg-slate-800 p-1.5 rounded-lg shadow-sm">
              <Printer size={16} className="text-white"/>
            </div>
            <div className="font-extrabold text-base text-slate-800 tracking-wide">印表機管家</div>
         </div>
         
         <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${dbStatus === 'online' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-500 border-rose-100'}`}>
            {dbStatus === 'online' ? <Wifi size={12}/> : <WifiOff size={12}/>}
            <span>{dbStatus === 'online' ? '連線中' : '離線'}</span>
         </div>
      </div>

      {/* 2. 資訊與搜尋區 */}
      <div className="px-4 py-3 shrink-0 relative z-10">
         <div className="bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl p-4 text-white shadow-lg shadow-slate-300 relative overflow-hidden ring-1 ring-white/10">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

            <div className="flex justify-between items-center relative z-10 mb-3">
               <div>
                  <div className="text-[10px] font-bold text-slate-300 mb-0.5 uppercase tracking-wider">{todayWeek}</div>
                  <div className="text-2xl font-bold tracking-tight text-white">{todayDate}</div>
               </div>
               <div className="text-right">
                  <div className="flex items-center justify-end gap-1.5 mb-0.5">
                     <span className="text-xl font-bold text-white">{weather.temp}°</span>
                     {getWeatherIcon()}
                  </div>
                  <div className="flex items-center justify-end gap-1 text-[10px] font-medium text-slate-300">
                     <MapPin size={10} /> {weather.location}
                  </div>
               </div>
            </div>

            <div 
               onClick={() => setCurrentView('search')}
               className="bg-white rounded-lg p-2.5 flex items-center gap-2 shadow-md shadow-black/5 cursor-text hover:bg-blue-50 transition-colors active:scale-[0.98] group"
            >
               <Search size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors"/>
               <div className="text-xs font-bold text-gray-400 flex-1 group-hover:text-gray-500 transition-colors">搜尋客戶、電話或機型...</div>
               <div className="bg-gray-100 p-0.5 rounded group-hover:bg-blue-100 transition-colors">
                  <ChevronRight size={14} className="text-gray-400 group-hover:text-blue-600"/>
               </div>
            </div>
         </div>
      </div>

      {/* 分隔線 */}
      <div className="px-6 my-1 flex items-center gap-4 shrink-0">
         <div className="h-px bg-gray-200 flex-1"></div>
         <span className="text-[10px] font-bold text-gray-400 tracking-widest">功能選單</span>
         <div className="h-px bg-gray-200 flex-1"></div>
      </div>

      {/* 3. 六大宮格 (重點調整區) */}
      <div className="px-4 pb-2 flex-1 overflow-y-auto custom-scrollbar">
         <div className="grid grid-cols-2 gap-3"> 
            {modules.map(item => (
               <button 
                  key={item.id} 
                  onClick={item.action}
                  // 修改重點：高度改為 h-32 (拉高)，增加內部 gap
                  className="bg-white p-3 rounded-2xl border border-slate-100 border-b-[3px] border-b-slate-200 shadow-sm flex flex-col items-center justify-center gap-3 h-32 active:border-b active:translate-y-0.5 active:shadow-none relative group overflow-hidden"
               >
                  {/* 圖示底座加大 */}
                  <div className={`p-3 rounded-2xl ${item.bgColor} ${item.color} group-hover:scale-110 transition-transform duration-300 relative z-10`}>
                     {/* 圖示尺寸加大到 28 */}
                     <item.icon size={28} strokeWidth={2}/>
                  </div>
                  
                  <div className="text-center relative z-10 w-full">
                     {/* 標題字體加大到 text-base (16px) */}
                     <div className="font-bold text-gray-800 text-base">{item.title}</div>
                     {/* 說明文字也稍微放大 */}
                     <div className="text-[11px] text-gray-500 font-bold mt-1.5 bg-slate-50 px-2.5 py-0.5 rounded-full inline-block border border-slate-100 group-hover:bg-white transition-colors">
                        {item.info}
                     </div>
                  </div>

                  {item.badge && (
                     <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-rose-500 shadow-sm ring-2 ring-white animate-pulse z-20"></div>
                  )}
               </button>
            ))}
         </div>

         {/* 4. 系統狀態 (修改：增加 mt-6 下拉距離) */}
         <div className="mt-6 mb-20 bg-white rounded-xl border border-gray-100 p-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
               <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg"><Clock size={18}/></div>
               <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">System Status</div>
                  <div className="text-sm font-bold text-gray-700">系統運作正常，資料已同步</div>
               </div>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-100"></div>
         </div>
      </div>

    </div>
  );
};

export default Dashboard;