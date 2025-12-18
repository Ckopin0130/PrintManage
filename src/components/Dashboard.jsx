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

  // ★ 模組設定：回歸清爽配色 (淡色背景 + 深色圖示)
  const modules = [
    { 
      id: 'tracking', 
      title: '待辦追蹤', 
      icon: ClipboardList, 
      color: 'text-rose-600', 
      bgColor: 'bg-rose-50', // 淡紅背景
      info: pendingTasks > 0 ? `${pendingTasks} 件待辦` : '目前無案',
      badge: pendingTasks > 0 ? pendingTasks : null, 
      action: () => setCurrentView('tracking') 
    },
    { 
      id: 'roster', 
      title: '客戶名冊', 
      icon: Users, 
      color: 'text-blue-600', 
      bgColor: 'bg-blue-50', // 淡藍背景
      info: `${totalCustomers} 戶`, 
      action: () => { setActiveTab('roster'); setCurrentView('roster'); setRosterLevel('l1'); } 
    },
    { 
      id: 'records', 
      title: '維修紀錄', 
      icon: FileText, 
      color: 'text-amber-600', 
      bgColor: 'bg-amber-50', // 淡黃背景
      info: `今日 ${todayCompletedCount} 件`, 
      action: () => { setActiveTab('records'); setCurrentView('records'); } 
    },
    { 
      id: 'inventory', 
      title: '車載庫存', 
      icon: Package, 
      color: 'text-emerald-600', 
      bgColor: 'bg-emerald-50', // 淡綠背景
      info: '零件盤點', 
      action: () => { setActiveTab('inventory'); setCurrentView('inventory'); } 
    },
    { 
      id: 'worklog', 
      title: '工作日誌', 
      icon: PenTool, 
      color: 'text-violet-600', 
      bgColor: 'bg-violet-50', // 淡紫背景
      info: '一鍵日報', 
      action: () => setCurrentView('worklog') 
    },
    { 
      id: 'settings', 
      title: '系統設定', 
      icon: Settings, 
      color: 'text-slate-600', 
      bgColor: 'bg-slate-100', // 淡灰背景
      info: '備份還原', 
      action: () => setCurrentView('settings') 
    }
  ];

  return (
    // 使用 h-[100dvh] 確保填滿手機螢幕
    <div className="bg-slate-50 h-[100dvh] flex flex-col font-sans overflow-hidden">
      
      {/* 1. 頂部標題 */}
      <div className="bg-white/90 backdrop-blur pl-6 pr-4 py-3 flex justify-between items-center border-b border-gray-200/60 shadow-sm shrink-0 z-30">
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

      {/* 2. 資訊與搜尋區 (深色漸層面板，保留專業感) */}
      <div className="px-4 py-4 shrink-0 relative z-10">
         <div className="bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl p-5 text-white shadow-xl shadow-slate-300 relative overflow-hidden ring-1 ring-white/10">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            
            <div className="flex justify-between items-center relative z-10 mb-4">
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

            <div onClick={() => setCurrentView('search')} className="bg-white rounded-xl p-3 flex items-center gap-2 shadow-md cursor-text hover:bg-blue-50 transition-colors active:scale-[0.98] group">
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
         <div className="h-px bg-slate-200 flex-1"></div>
         <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">功能選單</span>
         <div className="h-px bg-slate-200 flex-1"></div>
      </div>

      {/* 3. 六大宮格 (重點調整：滿版、無狀態列) */}
      <div className="px-4 flex-1 overflow-y-auto custom-scrollbar pb-24">
         <div className="grid grid-cols-2 gap-3 h-full content-start"> 
            {modules.map(item => (
               <button 
                  key={item.id} 
                  onClick={item.action}
                  // ★ 修改重點：
                  // 1. h-36 (144px)：拉高方塊，讓它看起來更從容大氣，並自然填滿移除狀態列後的空間。
                  // 2. 風格：純白底 + 灰色微邊框 + 軟陰影，最乾淨耐看。
                  className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-3 h-36 active:scale-[0.98] transition-all relative group"
               >
                  {/* 圖示區域：加大底座，使用舒服的淡色背景 */}
                  <div className={`p-3.5 rounded-2xl ${item.bgColor} ${item.color} group-hover:scale-110 transition-transform duration-300 relative z-10`}>
                     <item.icon size={32} strokeWidth={2}/>
                  </div>
                  
                  <div className="text-center relative z-10 w-full">
                     <div className="font-bold text-slate-700 text-[15px]">{item.title}</div>
                     <div className="text-[11px] text-slate-400 font-bold mt-1.5 bg-slate-50 px-2.5 py-0.5 rounded-full inline-block">
                        {item.info}
                     </div>
                  </div>

                  {item.badge && (
                     <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm ring-2 ring-white animate-pulse z-20"></div>
                  )}
               </button>
            ))}
         </div>
      </div>

    </div>
  );
};

export default Dashboard;