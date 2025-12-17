import React from 'react';
import { 
  ClipboardList, CheckCircle, Users, FileText, Search, Package, PenTool, 
  Cloud, CloudOff, Loader2 
} from 'lucide-react';

const Dashboard = ({ 
  today, dbStatus, pendingTasks, todayCompletedCount, totalCustomers, 
  setCurrentView, setActiveTab, setRosterLevel 
}) => {
  return (
    <div className="pb-24 bg-gray-50 min-h-screen animate-in">
      <div className="bg-white pt-12 pb-6 px-6 shadow-sm mb-6 rounded-b-[2rem]">
         <div className="flex justify-between items-start mb-6">
           <div><div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{today}</div><h1 className="text-3xl font-bold text-gray-800 tracking-tight">早安，工程師</h1></div>
           <div className="relative"><button onClick={() => setCurrentView('settings')} className={`p-2.5 rounded-full transition-colors shadow-sm border ${dbStatus === 'online' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : (dbStatus === 'connecting' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-red-600 border-red-100')}`}>{dbStatus === 'online' ? <Cloud size={24} /> : (dbStatus === 'connecting' ? <Loader2 size={24} className="animate-spin" /> : <CloudOff size={24} />)}</button></div>
         </div>
         <div className="grid grid-cols-3 gap-3 mb-6">
            <div onClick={() => setCurrentView('tracking')} className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-3 text-white shadow-lg shadow-blue-200 transform transition-transform hover:scale-105 active:scale-95 cursor-pointer flex flex-col justify-between h-28">
              <div className="flex justify-between items-start opacity-80"><ClipboardList size={20}/></div>
              <div><div className="text-2xl font-bold">{pendingTasks}</div><div className="text-[10px] text-blue-100 font-medium">待辦追蹤</div></div>
            </div>
            <div onClick={() => setCurrentView('worklog')} className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm transform transition-transform hover:scale-105 active:scale-95 cursor-pointer flex flex-col justify-between h-28">
               <div className="flex justify-between items-start text-green-500"><CheckCircle size={20}/></div>
               <div><div className="text-2xl font-bold text-gray-800">{todayCompletedCount}</div><div className="text-[10px] text-gray-400 font-medium">今日完成</div></div>
            </div>
            <div onClick={() => { setActiveTab('roster'); setCurrentView('roster'); setRosterLevel('l1'); }} className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm transform transition-transform hover:scale-105 active:scale-95 cursor-pointer flex flex-col justify-between h-28">
               <div className="flex justify-between items-start text-purple-500"><Users size={20}/></div>
               <div><div className="text-2xl font-bold text-gray-800">{totalCustomers}</div><div className="text-[10px] text-gray-400 font-medium">總客戶數</div></div>
            </div>
         </div>
      </div>
      <div className="px-6">
        <h2 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider pl-1">快速存取</h2>
        <div className="grid grid-cols-2 gap-4">
           {[
             { title: '客戶名冊', sub: '管理與導航', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', action: () => { setActiveTab('roster'); setCurrentView('roster'); setRosterLevel('l1'); } },
             { title: '服務紀錄', sub: '查詢歷史單', icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50', action: () => { setActiveTab('records'); setCurrentView('records'); } },
             { title: '全域搜尋', sub: '電話/機型', icon: Search, color: 'text-purple-600', bg: 'bg-purple-50', action: () => setCurrentView('search') },
             { title: '車載庫存', sub: '零件數量管理', icon: Package, color: 'text-green-600', bg: 'bg-green-50', action: () => { setActiveTab('inventory'); setCurrentView('inventory'); } },
             { title: '追蹤儀表', sub: `${pendingTasks} 件待辦`, icon: ClipboardList, color: 'text-red-600', bg: 'bg-red-50', action: () => setCurrentView('tracking') },
             { title: '工作日誌', sub: '日報表生成', icon: PenTool, color: 'text-indigo-600', bg: 'bg-indigo-50', action: () => setCurrentView('worklog') },
           ].map((item, idx) => (
             <button key={idx} onClick={item.action} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-start hover:shadow-md hover:border-blue-200 transition-all active:scale-[0.98]">
               <div className={`${item.bg} ${item.color} p-3 rounded-xl mb-3`}><item.icon size={24} /></div><span className="font-bold text-gray-800 text-lg">{item.title}</span><span className="text-xs text-gray-400 mt-1">{item.sub}</span>
             </button>
           ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;