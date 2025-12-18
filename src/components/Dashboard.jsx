import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, Users, Search, PenTool, 
  Wifi, WifiOff, Package, FileText, Settings, 
  Sun, Cloud, CloudRain, MapPin, Printer, ChevronRight, CheckCircle2
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

  // ★ 科技感模組設定：
  // 1. 移除 bgGradient (粉嫩色)
  // 2. 加入 accentColor (雷射光條顏色)
  const modules = [
    { 
      id: 'tracking', 
      title: '待辦追蹤', 
      icon: ClipboardList, 
      color: 'text-rose-600', 
      accentColor: 'bg-rose-500', // 紅色光條
      iconBg: 'bg-rose-50',
      info: pendingTasks > 0 ? `${pendingTasks} 件待辦` : '目前無案',
      badge: pendingTasks > 0 ? pendingTasks : null, 
      action: () => setCurrentView('tracking') 
    },
    { 
      id: 'roster', 
      title: '客戶名冊', 
      icon: Users, 
      color: 'text-blue-600', 
      accentColor: 'bg-blue-500', // 藍色光條
      iconBg: 'bg-blue-50',
      info: `${totalCustomers} 戶`, 
      action: () => { setActiveTab('roster'); setCurrentView('roster'); setRosterLevel('l1'); } 
    },
    { 
      id: 'records', 
      title: '維修紀錄', 
      icon: FileText, 
      color: 'text-amber-500', 
      accentColor: 'bg-amber-500', // 黃色光條
      iconBg: 'bg-amber-50',
      info: `今日 ${todayCompletedCount} 件`, 
      action: () => { setActiveTab('records'); setCurrentView('records'); } 
    },
    { 
      id: 'inventory', 
      title: '車載庫存', 
      icon: Package, 
      color: 'text-emerald-500', 
      accentColor: 'bg-emerald-500', // 綠色光條
      iconBg: 'bg-emerald-50',
      info: '零件盤點', 
      action: () => { setActiveTab('inventory'); setCurrentView('inventory'); } 
    },
    { 
      id: 'worklog', 
      title: '工作日誌', 
      icon: PenTool, 
      color: 'text-violet-500', 
      accentColor: 'bg-violet-500', // 紫色光條
      iconBg: 'bg-violet-50',
      info: '一鍵日報', 
      action: () => setCurrentView('worklog') 
    },
    { 
      id: 'settings', 
      title: '系統設定', 
      icon: Settings, 
      color: 'text-slate-600', 
      accentColor: 'bg-slate-500', // 灰色光條
      iconBg: 'bg-slate-100',
      info: '備份還原', 
      action: () => setCurrentView('settings') 
    }
  ];

  return (
    <div className="bg-slate-50 h-[100dvh] flex flex-col font-sans animate-in overflow-hidden relative">
      
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

      {/* 2. 資訊與搜尋區 (Tech Banner) */}
      <div className="px-4 py-3 shrink-0 relative z-10">
         <div className="bg-gradient-to-br from-slate-800 to-blue-950 rounded-2xl p-4 text-white shadow-xl shadow-slate-300 relative overflow-hidden ring-1 ring-white/10">
            {/* 裝飾線條 */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            
            <div className="flex justify-between items-center relative z-10 mb-3">
               <div>
                  <div className="text-[10px] font-bold text-slate-400 mb-0.5 uppercase tracking-wider">{todayWeek}</div>
                  <div className="text-2xl font-bold tracking-tight text-white">{todayDate}</div>
               </div>
               <div className="text-right">
                  <div className="flex items-center justify-end gap-1.5 mb-0.5">
                     <span className="text-xl font-bold text-white">{weather.temp}°</span>
                     {getWeatherIcon()}
                  </div>
                  <div className="flex items-center justify-end gap-1 text-[10px] font-medium text-slate-400">
                     <MapPin size={10} /> {weather.location}
                  </div>
               </div>
            </div>

            <div onClick={() => setCurrentView('search')} className="bg-white/10 backdrop-blur-md border border-white/10 rounded-lg p-2.5 flex items-center gap-2 shadow-inner cursor-text hover:bg-white/20 transition-colors active:scale-[0.98] group">
               <Search size={16} className="text-slate-300 group-hover:text-white transition-colors"/>
               <div className="text-xs font-bold text-slate-300 flex-1 group-hover:text-white transition-colors">搜尋客戶、電話或機型...</div>
               <div className="bg-white/10 p-0.5 rounded group-hover:bg-white/20 transition-colors">
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-white"/>
               </div>
            </div>
         </div>
      </div>

      {/* 分隔線 (Tech Style) */}
      <div className="px-6 my-1 flex items-center gap-4 shrink-0">
         <div className="h-px bg-slate-200 flex-1"></div>
         <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Modules</span>
         <div className="h-px bg-slate-200 flex-1"></div>
      </div>

      {/* 3. 六大宮格 (Tech Edition) */}
      <div className="px-4 flex-1 overflow-y-auto custom-scrollbar min-h-0 pb-24">
         <div className="grid grid-cols-2 gap-3"> 
            {modules.map(item => (
               <button 
                  key={item.id} 
                  onClick={item.action}
                  // 修改重點：背景純白，加上微弱的藍灰色邊框，更乾淨
                  className="bg-white p-3 rounded-xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center gap-2 h-32 active:scale-[0.98] transition-all relative group overflow-hidden"
               >
                  {/* 底部雷射光條 (Accent Bar) */}
                  <div className={`absolute bottom-0 left-0 w-full h-1 ${item.accentColor} opacity-0 group-hover:opacity-100 transition-opacity`}></div>

                  {/* 圖示容器：淡色背景，保持區分度 */}
                  <div className={`p-3 rounded-2xl ${item.iconBg} ${item.color} group-hover:scale-110 transition-transform duration-300 relative z-10`}>
                     <item.icon size={28} strokeWidth={2}/>
                  </div>
                  
                  <div className="text-center relative z-10 w-full">
                     <div className="font-bold text-slate-700 text-sm group-hover:text-slate-900">{item.title}</div>
                     <div className="text-[10px] text-slate-400 font-bold mt-1 bg-slate-50 px-2 py-0.5 rounded-full inline-block border border-slate-100">
                        {item.info}
                     </div>
                  </div>

                  {item.badge && (
                     <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm ring-2 ring-white animate-pulse z-20"></div>
                  )}
               </button>
            ))}
         </div>
      </div>

      {/* 4. 系統狀態 (★ 修改：固定在底部，扁平化設計) */}
      {/* 使用 absolute bottom-[導覽列高度] 確保它浮在導覽列上方 */}
      <div className="absolute bottom-20 left-0 w-full px-4 pb-2 z-20 pointer-events-none">
         <div className="bg-white/90 backdrop-blur-md rounded-lg border border-slate-200 py-2 px-4 flex items-center justify-between shadow-lg shadow-slate-200/50 pointer-events-auto">
            <div className="flex items-center gap-2">
               <div className="bg-emerald-100 text-emerald-600 p-1 rounded-full"><CheckCircle2 size={12}/></div>
               <span className="text-[10px] font-bold text-slate-600">系統與資料庫已同步</span>
            </div>
            <div className="flex items-center gap-1.5">
               <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
               </span>
               <span className="text-[9px] font-bold text-slate-400">Live</span>
            </div>
         </div>
      </div>

    </div>
  );
};

export default Dashboard;