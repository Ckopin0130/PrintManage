import React, { useState, useEffect, useMemo } from 'react';
import { 
  ClipboardList, Users, Search, PenTool, 
  Wifi, WifiOff, Package, FileText, Settings, 
  Sun, Cloud, CloudRain, MapPin, Printer, ChevronRight, Bell
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
    if (weather.condition === 'Rainy') return <CloudRain size={28} className="text-blue-500 drop-shadow-sm"/>;
    if (weather.condition === 'Cloudy') return <Cloud size={28} className="text-gray-400 drop-shadow-sm"/>;
    return <Sun size={28} className="text-amber-500 drop-shadow-sm animate-pulse-slow"/>;
  };

  const greeting = useMemo(() => {
    if (todayCompletedCount >= 5) return `今日效率驚人，已完成 ${todayCompletedCount} 件！`;
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return "早安，充滿活力的一天";
    if (hour >= 11 && hour < 14) return "午安，記得吃飽休息";
    if (hour >= 14 && hour < 18) return "下午好，喝杯水休息一下";
    return "晚安，工作辛苦了";
  }, [todayCompletedCount]);

  const todayDateStr = new Date().toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });
  const todayWeekStr = new Date().toLocaleDateString('zh-TW', { weekday: 'long' });

  // 設定模組
  const modules = [
    { 
      id: 'tracking', 
      title: '待辦追蹤', 
      icon: ClipboardList, 
      color: 'text-rose-500', 
      iconBg: 'bg-rose-50',
      info: pendingTasks > 0 ? `${pendingTasks} 件待辦` : '無新案件',
      infoColor: pendingTasks > 0 ? 'text-rose-600 font-bold' : 'text-gray-400',
      badge: pendingTasks > 0 ? pendingTasks : null, 
      action: () => setCurrentView('tracking') 
    },
    { 
      id: 'roster', 
      title: '客戶名冊', 
      icon: Users, 
      color: 'text-blue-600', 
      iconBg: 'bg-blue-50',
      info: `${totalCustomers} 戶資料`, 
      infoColor: 'text-gray-500',
      action: () => { setActiveTab('roster'); setCurrentView('roster'); setRosterLevel('l1'); } 
    },
    { 
      id: 'records', 
      title: '維修紀錄', 
      icon: FileText, 
      color: 'text-amber-500', 
      iconBg: 'bg-amber-50',
      info: `今日 ${todayCompletedCount} 件`, 
      infoColor: todayCompletedCount > 0 ? 'text-amber-600 font-bold' : 'text-gray-500',
      action: () => { setActiveTab('records'); setCurrentView('records'); } 
    },
    { 
      id: 'inventory', 
      title: '車載庫存', 
      icon: Package, 
      color: 'text-emerald-500', 
      iconBg: 'bg-emerald-50',
      info: '零件管理', 
      infoColor: 'text-gray-500',
      action: () => { setActiveTab('inventory'); setCurrentView('inventory'); } 
    },
    { 
      id: 'worklog', 
      title: '工作日誌', 
      icon: PenTool, 
      color: 'text-violet-500', 
      iconBg: 'bg-violet-50',
      info: '日報生成', 
      infoColor: 'text-gray-500',
      action: () => setCurrentView('worklog') 
    },
    { 
      id: 'settings', 
      title: '系統設定', 
      icon: Settings, 
      color: 'text-slate-500', 
      iconBg: 'bg-slate-100',
      info: '備份還原', 
      infoColor: 'text-gray-400',
      action: () => setCurrentView('settings') 
    }
  ];

  return (
    <div className="bg-slate-50 h-[100dvh] flex flex-col font-sans overflow-hidden">
      
      {/* 1. 頂部標題列 */}
      <div className="bg-white/80 backdrop-blur pl-5 pr-4 py-3 flex justify-between items-center shrink-0 z-30">
         <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-sm shadow-blue-200">
              <Printer size={16} className="text-white"/>
            </div>
            <div className="font-extrabold text-base text-slate-800 tracking-wide">印表機管家</div>
         </div>
         <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-full border border-gray-200 shadow-sm">
            <div className={`w-2 h-2 rounded-full shadow-sm ${dbStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
            <span className={`text-[10px] font-bold ${dbStatus === 'online' ? 'text-slate-600' : 'text-rose-500'}`}>
                {dbStatus === 'online' ? '連線正常' : '離線'}
            </span>
         </div>
      </div>

      {/* 2. 資訊面板 */}
      <div className="px-4 pt-4 pb-2 shrink-0 z-20">
         {/* 白底+淡藍漸層風格 */}
         <div className="bg-gradient-to-br from-white to-blue-50 rounded-[1.8rem] p-5 shadow-sm border border-blue-100/50 relative overflow-hidden">
            
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/40 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
            
            <div className="flex justify-between items-start relative z-10 mb-4">
               <div>
                  <h1 className="text-lg font-bold text-slate-800 mb-1 tracking-wide leading-tight">{greeting}</h1>
                  <div className="text-xs text-slate-400 font-bold tracking-wide flex items-center gap-2">
                    <span className="bg-white px-2 py-0.5 rounded text-slate-500 shadow-sm border border-slate-100">{todayDateStr}</span>
                    <span>{todayWeekStr}</span>
                  </div>
               </div>
               <div className="text-right flex flex-col items-end">
                  <div className="flex items-center gap-1.5">
                     <span className="text-3xl font-bold text-slate-800 tracking-tighter">{weather.temp}°</span>
                     {getWeatherIcon()}
                  </div>
               </div>
            </div>

            <div 
                onClick={() => setCurrentView('search')} 
                className="bg-white text-slate-600 rounded-xl p-3 flex items-center gap-3 shadow-md shadow-slate-200/50 border border-slate-100 cursor-text active:scale-[0.98] transition-all group relative z-10"
            >
               <Search size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors"/>
               <div className="text-sm font-bold text-slate-400 flex-1 group-hover:text-slate-600 transition-colors">搜尋客戶、電話或機型...</div>
               <div className="bg-slate-50 p-1 rounded-md border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                  <ChevronRight size={14} className="text-slate-400 group-hover:text-blue-500"/>
               </div>
            </div>
         </div>
      </div>

      {/* 分隔線 + 中文標題 */}
      <div className="px-8 my-3 flex items-center gap-4 shrink-0 z-10 opacity-40">
         <div className="h-px bg-slate-300 flex-1"></div>
         {/* 這裡改成中文了 */}
         <span className="text-[10px] font-bold text-slate-400 tracking-widest">功能選單</span>
         <div className="h-px bg-slate-300 flex-1"></div>
      </div>

      {/* 3. 六大功能區 */}
      <div className="px-4 flex-1 overflow-y-auto custom-scrollbar min-h-0 pb-24">
         <div className="grid grid-cols-2 gap-3.5"> 
            {modules.map((item, index) => (
               <button 
                  key={item.id} 
                  onClick={item.action}
                  className="bg-white p-3 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col items-center justify-center gap-2 h-32 active:scale-[0.98] active:border-blue-200 transition-all relative group overflow-hidden hover:shadow-md"
                  style={{ animationDelay: `${index * 50}ms` }}
               >
                  <div className={`p-3 rounded-full ${item.iconBg} ${item.color} group-hover:scale-110 transition-transform duration-300 relative z-10`}>
                     <item.icon size={28} strokeWidth={2} />
                  </div>
                  
                  <div className="text-center relative z-10 w-full">
                     <div className="font-bold text-slate-700 text-sm group-hover:text-blue-600 transition-colors">{item.title}</div>
                     <div className={`text-[10px] mt-1 font-bold ${item.infoColor}`}>
                        {item.info}
                     </div>
                  </div>

                  {item.badge && (
                     <div className="absolute top-2 right-2 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                     </div>
                  )}
               </button>
            ))}
         </div>

         <div className="text-center mt-6 opacity-40">
            <span className="text-[10px] font-bold text-slate-400">System v2.0</span>
         </div>
      </div>

    </div>
  );
};

export default Dashboard;