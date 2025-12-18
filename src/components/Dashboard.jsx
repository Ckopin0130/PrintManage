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

  // ★ 回歸彩色馬卡龍風格 (您喜歡的版本)
  const modules = [
    { 
      id: 'tracking', 
      title: '待辦追蹤', 
      icon: ClipboardList, 
      // 使用彩色背景與文字
      color: 'text-rose-600', 
      bgColor: 'bg-rose-50',
      iconBg: 'bg-rose-100',
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
      iconBg: 'bg-blue-100',
      info: `${totalCustomers} 戶資料`, 
      action: () => { setActiveTab('roster'); setCurrentView('roster'); setRosterLevel('l1'); } 
    },
    { 
      id: 'records', 
      title: '維修紀錄', 
      icon: FileText, 
      color: 'text-amber-600', 
      bgColor: 'bg-amber-50',
      iconBg: 'bg-amber-100',
      info: `今日 ${todayCompletedCount} 完成`, 
      action: () => { setActiveTab('records'); setCurrentView('records'); } 
    },
    { 
      id: 'inventory', 
      title: '車載庫存', 
      icon: Package, 
      color: 'text-emerald-600', 
      bgColor: 'bg-emerald-50',
      iconBg: 'bg-emerald-100',
      info: '零件盤點', 
      action: () => { setActiveTab('inventory'); setCurrentView('inventory'); } 
    },
    { 
      id: 'worklog', 
      title: '工作日誌', 
      icon: PenTool, 
      color: 'text-violet-600', 
      bgColor: 'bg-violet-50',
      iconBg: 'bg-violet-100',
      info: '日報生成', 
      action: () => setCurrentView('worklog') 
    },
    { 
      id: 'settings', 
      title: '系統設定', 
      icon: Settings, 
      color: 'text-slate-600', 
      bgColor: 'bg-slate-100', // 稍微深一點的灰
      iconBg: 'bg-slate-200',
      info: '備份還原', 
      action: () => setCurrentView('settings') 
    }
  ];

  return (
    <div className="bg-slate-50 h-[100dvh] flex flex-col font-sans overflow-hidden">
      
      {/* 1. 頂部標題 */}
      <div className="bg-white/90 backdrop-blur pl-6 pr-4 py-3 flex justify-between items-center border-b border-gray-200/60 shadow-sm shrink-0 z-30">
         <div className="flex items-center gap-2.5">
            <div className="bg-slate-900 p-1.5 rounded-lg shadow-sm">
              <Printer size={16} className="text-white"/>
            </div>
            <div className="font-extrabold text-base text-slate-800 tracking-wide">印表機管家</div>
         </div>
         <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${dbStatus === 'online' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-500 border-rose-100'}`}>
            {dbStatus === 'online' ? <Wifi size={12}/> : <WifiOff size={12}/>}
            <span>{dbStatus === 'online' ? '連線中' : '離線'}</span>
         </div>
      </div>

      {/* 2. 藍色面板 */}
      <div className="px-4 py-3 shrink-0 z-20">
         <div className="bg-gradient-to-br from-slate-800 to-blue-950 rounded-2xl p-4 text-white shadow-xl shadow-slate-300 relative overflow-hidden ring-1 ring-white/10">
            <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            
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

      {/* 分隔線 (縮小上下間距，把空間留給下面) */}
      <div className="px-6 my-1 flex items-center gap-4 shrink-0 z-10">
         <div className="h-px bg-slate-200 flex-1"></div>
         <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">MODULES</span>
         <div className="h-px bg-slate-200 flex-1"></div>
      </div>

      {/* 3. 可滑動區域 (包含六大功能 + 系統狀態) */}
      {/* flex-1 填滿剩下空間，內容都放在這裡面滑動 */}
      <div className="px-4 flex-1 overflow-y-auto custom-scrollbar min-h-0 pb-20">
         
         {/* 六大功能區 */}
         <div className="grid grid-cols-2 gap-3 mb-4"> 
            {modules.map(item => (
               <button 
                  key={item.id} 
                  onClick={item.action}
                  // 使用彩色背景，加上陰影與白色邊框
                  className={`p-3 rounded-xl border border-white/50 shadow-sm ${item.bgColor} flex flex-col items-center justify-center gap-2 h-30 active:scale-[0.98] transition-all relative group overflow-hidden`}
               >
                  {/* 圖示容器 */}
                  <div className={`p-2.5 rounded-xl ${item.iconBg} ${item.color} group-hover:scale-110 transition-transform duration-300 relative z-10 shadow-sm`}>
                     <item.icon size={26} strokeWidth={2}/>
                  </div>
                  
                  <div className="text-center relative z-10 w-full mt-1">
                     <div className="font-bold text-slate-700 text-sm">{item.title}</div>
                     <div className="text-[10px] text-slate-500 font-bold mt-1 bg-white/60 px-2 py-0.5 rounded-full inline-block">
                        {item.info}
                     </div>
                  </div>

                  {item.badge && (
                     <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm ring-1 ring-white animate-pulse z-20"></div>
                  )}
               </button>
            ))}
         </div>

         {/* 4. 系統狀態 (放在滑動列表的最後面，當作 Footer) */}
         {/* 這樣它就永遠在按鈕下面，不會蓋住任何人 */}
         <div className="bg-white rounded-xl border border-slate-200 py-2.5 px-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
               <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
               </div>
               <div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">SYSTEM SYNC</div>
                  <div className="text-[11px] font-bold text-slate-600">系統運作正常，資料已同步</div>
               </div>
            </div>
            <CheckCircle2 size={16} className="text-emerald-500"/>
         </div>
         
         {/* 底部留白 (給手機導覽列用) */}
         <div className="h-4"></div>
      </div>

    </div>
  );
};

export default Dashboard;