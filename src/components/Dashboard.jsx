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
    if (weather.condition === 'Rainy') return <CloudRain size={24} className="text-blue-500 drop-shadow-sm"/>;
    if (weather.condition === 'Cloudy') return <Cloud size={24} className="text-gray-400 drop-shadow-sm"/>;
    return <Sun size={24} className="text-amber-500 drop-shadow-sm animate-pulse-slow"/>;
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
      
      {/* ★ 整合式頂部控制台 (Unified Header Console) */}
      <div className="bg-white rounded-b-[2rem] shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] pt-3 pb-5 px-6 z-30 shrink-0 flex flex-col gap-3 relative">
         
         {/* 第一行：品牌識別 & 狀態燈 (輔助資訊，縮小字體) */}
         <div className="flex justify-between items-center opacity-80">
            <div className="flex items-center gap-1.5 text-slate-400">
               <Printer size={14} className="text-blue-500"/>
               <span className="text-[10px] font-bold tracking-wider uppercase">Printer Manager</span>
            </div>
            
            {/* 呼吸燈 (保持精緻) */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
               <div className="relative flex h-1.5 w-1.5">
                 {dbStatus === 'online' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                 <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dbStatus === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
               </div>
               <span className={`text-[9px] font-bold ${dbStatus === 'online' ? 'text-slate-500' : 'text-rose-500'}`}>
                   {dbStatus === 'online' ? '連線正常' : '離線'}
               </span>
            </div>
         </div>

         {/* 第二行：問候語、日期 & 天氣 (主要視覺) */}
         <div className="flex justify-between items-end mt-1">
            <div className="flex flex-col">
               <h1 className="text-xl font-extrabold text-slate-800 leading-tight">{greeting}</h1>
               <div className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1">
                  <span>{todayDateStr}</span>
               </div>
            </div>
            <div className="flex items-center gap-1 mb-1">
               <span className="text-2xl font-bold text-slate-700 tracking-tighter">{weather.temp}°</span>
               {getWeatherIcon()}
            </div>
         </div>

         {/* 第三行：搜尋列 (嵌入式，更有整體感) */}
         <div 
             onClick={() => setCurrentView('search')} 
             className="bg-slate-50 text-slate-600 rounded-xl p-3 flex items-center gap-3 border border-slate-100 cursor-text active:scale-[0.98] transition-all group mt-1 hover:border-blue-100"
         >
            <Search size={18} className="text-blue-500 ml-1"/>
            <div className="text-sm font-bold text-slate-400 flex-1 group-hover:text-slate-600 transition-colors">輸入客戶名稱、電話或機型...</div>
            <div className="bg-white p-1 rounded-md border border-slate-100 shadow-sm">
               <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500"/>
            </div>
         </div>

      </div>

      {/* 六大功能區 - 維持您要求的高度 (h-[9.5rem] = h-38) */}
      <div className="px-4 flex-1 overflow-y-auto custom-scrollbar min-h-0 pb-20 pt-4">
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