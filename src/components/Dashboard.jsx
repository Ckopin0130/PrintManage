import React, { useState, useEffect, useMemo } from 'react';
import { 
  ClipboardList, Users, Search, BookOpen, 
  Package, FileText, Settings, 
  Sun, Cloud, CloudRain, Printer, ChevronRight
} from 'lucide-react';

const Dashboard = ({ 
  today, dbStatus, pendingTasks, todayCompletedCount, totalCustomers, 
  setCurrentView, setActiveTab, onQuickAction
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
      action: () => { 
        sessionStorage.setItem('roster_from_home', 'true');
        setActiveTab('roster'); 
        setCurrentView('roster'); 
      } 
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
    // ★★★ 修改處：名稱改為「知識庫」，顏色改為紫色以區隔 ★★★
    { 
      id: 'error_library', 
      title: '知識庫', 
      icon: BookOpen, 
      color: 'text-violet-600', // 改為紫色
      iconBg: 'bg-violet-50',   // 改為紫色背景
      info: '故障/SP/筆記', 
      infoColor: 'text-violet-600 font-extrabold',
      action: () => setCurrentView('error_library') 
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
      
      {/* 頂部標題列 */}
      <div className="bg-white/95 backdrop-blur px-6 py-3 flex justify-between items-center shrink-0 z-30 shadow-sm border-b border-gray-100/50">
         <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-sm shadow-blue-200">
              <Printer size={18} className="text-white"/>
            </div>
            <div className="font-extrabold text-lg text-slate-800 tracking-wide">印表機管家</div>
         </div>
         
         <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-200/60">
            <div className="relative flex h-2.5 w-2.5">
              {dbStatus === 'online' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${dbStatus === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </div>
            <span className={`text-[10px] font-bold tracking-wide ${dbStatus === 'online' ? 'text-slate-600' : 'text-rose-500'}`}>
                {dbStatus === 'online' ? '連線正常' : '離線'}
            </span>
         </div>
      </div>

      {/* 資訊面板 + 搜尋列 */}
      <div className="px-4 pt-3 shrink-0 z-20 space-y-3">
         <div className="flex justify-between items-end px-2">
            <div>
               <div className="text-lg font-bold text-slate-800 leading-none mb-1.5">{greeting}</div>
               <div className="text-xs font-bold text-slate-400 flex items-center gap-2">
                  <span>{todayDateStr}</span>
               </div>
            </div>
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-xl font-bold text-slate-700 tracking-tighter">{weather.temp}°</span>
                {getWeatherIcon()}
            </div>
         </div>

         <div 
             onClick={() => setCurrentView('search')} 
             className="bg-white text-slate-600 rounded-2xl p-3.5 flex items-center gap-3 shadow-[0_4px_16px_rgb(0,0,0,0.06)] border border-white cursor-text active:scale-[0.98] transition-all group relative z-10 hover:border-blue-200 ring-1 ring-slate-100"
         >
            <Search size={20} className="text-blue-500 ml-1"/>
            <div className="text-sm font-bold text-slate-400 flex-1 group-hover:text-slate-600 transition-colors">輸入客戶名稱、電話或機型...</div>
            <div className="bg-slate-50 p-1 rounded-lg border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
               <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-500"/>
            </div>
         </div>
      </div>

      {/* 六大功能區 */}
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