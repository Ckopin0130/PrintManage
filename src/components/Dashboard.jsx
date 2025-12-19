import React, { useState, useEffect, useMemo } from 'react';
import { 
  ClipboardList, Users, Search, PenTool, 
  Package, FileText, Settings, 
  Sun, Cloud, CloudRain, Printer, ChevronRight
} from 'lucide-react';

const Dashboard = ({ 
  today, dbStatus, pendingTasks, todayCompletedCount, totalCustomers, 
  setCurrentView, setActiveTab, setRosterLevel 
}) => {

  const [weather, setWeather] = useState({ temp: '--', condition: 'Sunny', location: '屏東市' });

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
    // 天氣圖示改為白色，適應藍色背景
    if (weather.condition === 'Rainy') return <CloudRain size={26} className="text-white drop-shadow-sm"/>;
    if (weather.condition === 'Cloudy') return <Cloud size={26} className="text-blue-100 drop-shadow-sm"/>;
    return <Sun size={26} className="text-yellow-300 drop-shadow-sm animate-pulse-slow"/>;
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return "早安，充滿活力的一天";
    if (hour >= 11 && hour < 14) return "午安，記得吃飽休息";
    if (hour >= 14 && hour < 18) return "下午好，喝杯水休息一下";
    return "晚安，工作辛苦了";
  }, []);

  const todayDateStr = new Date().toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric', weekday: 'short' });

  const modules = [
    { 
      id: 'tracking', 
      title: '待辦追蹤', 
      icon: ClipboardList, 
      color: 'text-rose-500', 
      iconBg: 'bg-rose-50',
      info: pendingTasks > 0 ? `${pendingTasks} 件待辦` : '無新案件',
      infoColor: pendingTasks > 0 ? 'text-rose-600 font-extrabold' : 'text-slate-400 font-bold',
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
      infoColor: 'text-blue-600 font-extrabold',
      action: () => { setActiveTab('roster'); setCurrentView('roster'); setRosterLevel('l1'); } 
    },
    { 
      id: 'records', 
      title: '維修紀錄', 
      icon: FileText, 
      color: 'text-amber-500', 
      iconBg: 'bg-amber-50',
      info: `今日 ${todayCompletedCount} 件`, 
      infoColor: todayCompletedCount > 0 ? 'text-amber-600 font-extrabold' : 'text-slate-400 font-bold',
      action: () => { setActiveTab('records'); setCurrentView('records'); } 
    },
    { 
      id: 'inventory', 
      title: '車載庫存', 
      icon: Package, 
      color: 'text-emerald-500', 
      iconBg: 'bg-emerald-50',
      info: '零件管理', 
      infoColor: 'text-emerald-600 font-extrabold',
      action: () => { setActiveTab('inventory'); setCurrentView('inventory'); } 
    },
    { 
      id: 'worklog', 
      title: '工作日誌', 
      icon: PenTool, 
      color: 'text-violet-500', 
      iconBg: 'bg-violet-50',
      info: '日報生成', 
      infoColor: 'text-violet-600 font-extrabold',
      action: () => setCurrentView('worklog') 
    },
    { 
      id: 'settings', 
      title: '系統設定', 
      icon: Settings, 
      color: 'text-slate-500', 
      iconBg: 'bg-slate-100',
      info: '備份還原', 
      infoColor: 'text-slate-500 font-bold',
      action: () => setCurrentView('settings') 
    }
  ];

  return (
    <div className="bg-slate-50 h-[100dvh] flex flex-col font-sans overflow-hidden">
      
      {/* ★ 參考「夏日旅行」風格的整合式頂部 (Blue Header Block) */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-b-[2.5rem] shadow-lg shadow-blue-200 pt-3 pb-6 px-6 z-30 shrink-0 relative overflow-hidden">
         
         {/* 裝飾背景圓 (增加層次感) */}
         <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-10 -mt-10 blur-3xl pointer-events-none"></div>

         {/* 第一行：標題與狀態 (白色文字) */}
         <div className="flex justify-between items-center mb-4 relative z-10">
            <div className="flex items-center gap-2 text-white/90">
               <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                 <Printer size={16} className="text-white"/>
               </div>
               <span className="text-sm font-bold tracking-wide text-white">印表機管家</span>
            </div>
            
            {/* 呼吸燈 (適應深色背景) */}
            <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
               <div className="relative flex h-2 w-2">
                 {dbStatus === 'online' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                 <span className={`relative inline-flex rounded-full h-2 w-2 ${dbStatus === 'online' ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
               </div>
               <span className={`text-[10px] font-bold ${dbStatus === 'online' ? 'text-emerald-50' : 'text-rose-100'}`}>
                   {dbStatus === 'online' ? '連線正常' : '離線'}
               </span>
            </div>
         </div>

         {/* 第二行：問候語、日期與天氣 (白色大標題) */}
         <div className="flex justify-between items-end mb-5 relative z-10">
            <div className="text-white">
               <h1 className="text-2xl font-extrabold leading-tight tracking-wide mb-1">{greeting}</h1>
               <div className="flex items-center gap-2 text-blue-100 font-bold text-xs">
                  <span className="bg-white/20 px-2 py-0.5 rounded backdrop-blur-sm text-white">{todayDateStr}</span>
               </div>
            </div>
            <div className="flex flex-col items-end text-white">
               <div className="flex items-center gap-1">
                   <span className="text-3xl font-bold tracking-tighter">{weather.temp}°</span>
                   {getWeatherIcon()}
               </div>
            </div>
         </div>

         {/* 第三行：白色搜尋列 (參考圖片的白色條狀) */}
         <div 
             onClick={() => setCurrentView('search')} 
             className="bg-white rounded-2xl p-3.5 flex items-center gap-3 shadow-md shadow-blue-900/10 cursor-text active:scale-[0.98] transition-all group relative z-10"
         >
            <Search size={20} className="text-blue-500 ml-1"/>
            <div className="text-sm font-bold text-slate-400 flex-1 group-hover:text-slate-600 transition-colors">搜尋客戶、電話或機型...</div>
            <div className="bg-slate-50 p-1 rounded-lg border border-slate-100">
               <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500"/>
            </div>
         </div>

      </div>

      {/* 六大功能區 - 維持高度與間距不變 (h-[9.5rem] = h-38) */}
      <div className="px-4 flex-1 overflow-y-auto custom-scrollbar min-h-0 pb-20 pt-5">
         <div className="grid grid-cols-2 gap-3 h-full content-start"> 
            {modules.map((item, index) => (
               <button 
                  key={item.id} 
                  onClick={item.action}
                  className="bg-white p-3 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgb(0,0,0,0.04)] flex flex-col items-center justify-center gap-1 h-[9.5rem] active:scale-[0.96] active:shadow-none transition-all duration-200 relative group overflow-hidden hover:shadow-[0_8px_20px_rgb(0,0,0,0.08)] hover:border-blue-50"
                  style={{ animationDelay: `${index * 50}ms` }}
               >
                  <div className={`p-3.5 rounded-2xl ${item.iconBg} ${item.color} group-hover:scale-110 transition-transform duration-300 relative z-10 shadow-sm mb-1.5`}>
                     <item.icon size={32} strokeWidth={2.5} />
                  </div>
                  
                  <div className="text-center relative z-10 w-full">
                     <div className="font-bold text-slate-700 text-base group-hover:text-blue-600 transition-colors">{item.title}</div>
                     <div className={`text-xs mt-1 ${item.infoColor}`}>
                        {item.info}
                     </div>
                  </div>

                  {item.badge && (
                     <div className="absolute top-3 right-3 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border-2 border-white"></span>
                     </div>
                  )}
               </button>
            ))}
         </div>
         <div className="h-6"></div>
      </div>

    </div>
  );
};

export default Dashboard;