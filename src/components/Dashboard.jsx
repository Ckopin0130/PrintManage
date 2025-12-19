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

  // 設定模組 - 優化數據顏色與字重
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
      infoColor: 'text-blue-600 font-extrabold', // 強調數字顏色
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
      
      {/* 1. 頂部標題列 */}
      <div className="bg-white/90 backdrop-blur pl-5 pr-4 py-3 flex justify-between items-center shrink-0 z-30 shadow-sm border-b border-gray-100/50">
         <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-sm shadow-blue-200">
              <Printer size={16} className="text-white"/>
            </div>
            <div className="font-extrabold text-base text-slate-800 tracking-wide">印表機管家</div>
         </div>
         
         {/* 優化狀態指示燈 - 增加呼吸擴散效果 */}
         <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200/60">
            <div className="relative flex h-2.5 w-2.5">
              {dbStatus === 'online' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${dbStatus === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </div>
            <span className={`text-[10px] font-bold tracking-wide ${dbStatus === 'online' ? 'text-slate-600' : 'text-rose-500'}`}>
                {dbStatus === 'online' ? '連線正常' : '離線'}
            </span>
         </div>
      </div>

      {/* 2. 資訊面板 */}
      <div className="px-4 pt-5 pb-2 shrink-0 z-20">
         {/* 卡片優化：增加深度陰影與柔和背景 */}
         <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white relative overflow-hidden ring-1 ring-blue-50">
            
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/30 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            
            <div className="flex justify-between items-start relative z-10 mb-6">
               <div>
                  <h1 className="text-xl font-bold text-slate-800 mb-2 tracking-wide leading-tight">{greeting}</h1>
                  {/* 日期優化：加強對比度 */}
                  <div className="text-sm text-slate-500 font-bold tracking-wide flex items-center gap-2">
                    <span className="bg-white/80 px-2.5 py-1 rounded-lg text-slate-600 shadow-sm border border-slate-100">{todayDateStr}</span>
                    <span className="text-blue-500">{todayWeekStr}</span>
                  </div>
               </div>
               <div className="text-right flex flex-col items-end">
                  <div className="flex items-center gap-2 bg-white/60 p-2 rounded-2xl backdrop-blur-sm border border-white/50 shadow-sm">
                     <span className="text-3xl font-bold text-slate-800 tracking-tighter ml-1">{weather.temp}°</span>
                     {getWeatherIcon()}
                  </div>
               </div>
            </div>

            {/* 搜尋列優化：增加立體感 */}
            <div 
                onClick={() => setCurrentView('search')} 
                className="bg-white text-slate-600 rounded-2xl p-3.5 flex items-center gap-3 shadow-[0_4px_12px_rgb(0,0,0,0.03)] border border-slate-100 cursor-text active:scale-[0.98] transition-all group relative z-10 hover:border-blue-200 hover:shadow-md"
            >
               <Search size={20} className="text-slate-400 group-hover:text-blue-500 transition-colors ml-1"/>
               <div className="text-sm font-bold text-slate-400 flex-1 group-hover:text-slate-600 transition-colors">搜尋客戶、電話或機型...</div>
               <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-500"/>
               </div>
            </div>
         </div>
      </div>

      {/* 移除分隔線，增加一點空白間距 */}
      <div className="h-2"></div>

      {/* 3. 六大功能區 */}
      <div className="px-4 flex-1 overflow-y-auto custom-scrollbar min-h-0 pb-24">
         <div className="grid grid-cols-2 gap-4"> 
            {modules.map((item, index) => (
               <button 
                  key={item.id} 
                  onClick={item.action}
                  // 卡片互動優化：更細緻的按壓回饋與陰影
                  className="bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col items-center justify-center gap-2 h-36 active:scale-[0.96] active:shadow-none transition-all duration-200 relative group overflow-hidden hover:shadow-[0_8px_20px_rgb(0,0,0,0.05)] hover:border-blue-100"
                  style={{ animationDelay: `${index * 50}ms` }}
               >
                  <div className={`p-3.5 rounded-2xl ${item.iconBg} ${item.color} group-hover:scale-110 transition-transform duration-300 relative z-10 shadow-sm`}>
                     <item.icon size={30} strokeWidth={2} />
                  </div>
                  
                  <div className="text-center relative z-10 w-full mt-1">
                     <div className="font-bold text-slate-700 text-sm group-hover:text-blue-600 transition-colors">{item.title}</div>
                     {/* 數據強調：使用 font-extrabold */}
                     <div className={`text-xs mt-1.5 ${item.infoColor}`}>
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

         <div className="text-center mt-8 opacity-30 pb-4">
            <span className="text-[10px] font-bold text-slate-400 tracking-widest">SYSTEM V2.0</span>
         </div>
      </div>

    </div>
  );
};

export default Dashboard;