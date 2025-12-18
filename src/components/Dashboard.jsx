import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, Users, Search, PenTool, 
  Wifi, WifiOff, Package, FileText, Settings, 
  Sun, Cloud, CloudRain, MapPin, Printer, ChevronRight, Activity
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

  // ★ 科技模組設定：加入 glowColor (光暈) 和 code (裝飾編號)
  const modules = [
    { 
      id: 'tracking', 
      title: '待辦追蹤', 
      code: 'A-01',
      icon: ClipboardList, 
      color: 'text-rose-500', 
      borderBot: 'border-b-rose-500', // 底部亮條
      glow: 'shadow-rose-100', // 有色光暈
      info: pendingTasks > 0 ? `${pendingTasks} 件待辦` : '無新案件',
      badge: pendingTasks > 0 ? pendingTasks : null, 
      action: () => setCurrentView('tracking') 
    },
    { 
      id: 'roster', 
      title: '客戶名冊', 
      code: 'B-02',
      icon: Users, 
      color: 'text-cyan-600', 
      borderBot: 'border-b-cyan-500',
      glow: 'shadow-cyan-100',
      info: `${totalCustomers} 戶資料`, 
      action: () => { setActiveTab('roster'); setCurrentView('roster'); setRosterLevel('l1'); } 
    },
    { 
      id: 'records', 
      title: '維修紀錄', 
      code: 'C-03',
      icon: FileText, 
      color: 'text-amber-500', 
      borderBot: 'border-b-amber-500',
      glow: 'shadow-amber-100',
      info: `今日 ${todayCompletedCount} 完成`, 
      action: () => { setActiveTab('records'); setCurrentView('records'); } 
    },
    { 
      id: 'inventory', 
      title: '車載庫存', 
      code: 'D-04',
      icon: Package, 
      color: 'text-emerald-500', 
      borderBot: 'border-b-emerald-500',
      glow: 'shadow-emerald-100',
      info: '零件管理', 
      action: () => { setActiveTab('inventory'); setCurrentView('inventory'); } 
    },
    { 
      id: 'worklog', 
      title: '工作日誌', 
      code: 'E-05',
      icon: PenTool, 
      color: 'text-violet-500', 
      borderBot: 'border-b-violet-500',
      glow: 'shadow-violet-100',
      info: '日報生成', 
      action: () => setCurrentView('worklog') 
    },
    { 
      id: 'settings', 
      title: '系統設定', 
      code: 'S-99',
      icon: Settings, 
      color: 'text-slate-500', 
      borderBot: 'border-b-slate-400',
      glow: 'shadow-slate-200',
      info: '備份還原', 
      action: () => setCurrentView('settings') 
    }
  ];

  return (
    // ★ 結構重整：使用 flex flex-col 讓內部元素自動推擠，防止重疊
    <div className="bg-slate-50 h-[100dvh] flex flex-col font-sans overflow-hidden">
      
      {/* 1. 頂部標題 (Static) */}
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

      {/* 2. 藍色面板 (Static) */}
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

      {/* 分隔線 (Static) */}
      <div className="px-6 my-1 flex items-center gap-4 shrink-0">
         <div className="h-px bg-slate-200 flex-1"></div>
         <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">MODULES</span>
         <div className="h-px bg-slate-200 flex-1"></div>
      </div>

      {/* 3. 六大宮格 (可滑動區 flex-1) */}
      {/* 關鍵修正：flex-1 讓它佔據剩下所有空間。
         min-h-0 讓 scrollbar 正常運作。
         pb-2 留一點底部緩衝。
      */}
      <div className="px-4 flex-1 overflow-y-auto custom-scrollbar min-h-0 pb-2">
         <div className="grid grid-cols-2 gap-3"> 
            {modules.map(item => (
               <button 
                  key={item.id} 
                  onClick={item.action}
                  // ★ 科技化修正：
                  // 1. border-b-4 + item.borderBot -> 底部亮色光條 (HUD感)
                  // 2. shadow-lg + item.glow -> 有色光暈，不是死黑陰影
                  // 3. active:translate-y-0.5 -> 按下回饋
                  className={`bg-white p-3 rounded-xl border border-slate-100 border-b-[3px] ${item.borderBot} shadow-lg ${item.glow} flex flex-col items-center justify-center gap-2 h-30 active:border-b-0 active:translate-y-1 transition-all relative group overflow-hidden`}
               >
                  {/* 裝飾：右上角科技編號 */}
                  <div className="absolute top-2 right-2 text-[9px] font-mono text-slate-300 font-bold group-hover:text-slate-500 transition-colors">
                     {item.code}
                  </div>

                  <div className={`p-2.5 rounded-xl bg-slate-50 group-hover:bg-white group-hover:scale-110 transition-all duration-300 relative z-10 border border-slate-100`}>
                     <item.icon size={26} strokeWidth={2} className={item.color}/>
                  </div>
                  
                  <div className="text-center relative z-10 w-full mt-1">
                     <div className="font-bold text-slate-700 text-sm group-hover:text-black">{item.title}</div>
                     <div className="text-[10px] text-slate-400 font-bold mt-1 bg-slate-50/80 px-2 py-0.5 rounded-sm inline-block border border-slate-100 font-mono">
                        {item.info}
                     </div>
                  </div>

                  {item.badge && (
                     <div className="absolute top-2 left-2 flex items-center gap-1 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-200">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                     </div>
                  )}
               </button>
            ))}
         </div>
      </div>

      {/* 4. 系統狀態列 (Static, Shrink-0) */}
      {/* 關鍵修正：這是獨立區塊，放在 flex container 的最底部。
         mb-20 是為了預留底部導覽列 (NavBar) 的空間。
         z-20 確保層級。
      */}
      <div className="px-4 pt-2 mb-20 shrink-0 z-20">
         <div className="bg-slate-900 rounded-lg border border-slate-700 py-2.5 px-4 flex items-center justify-between shadow-lg shadow-slate-400/20">
            <div className="flex items-center gap-3">
               {/* 綠色呼吸燈 */}
               <div className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
               </div>
               <div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">SYSTEM SYNC</div>
                  <div className="text-[11px] font-bold text-slate-200">系統運作正常，資料已同步</div>
               </div>
            </div>
            <Activity size={16} className="text-slate-500"/>
         </div>
      </div>

    </div>
  );
};

export default Dashboard;