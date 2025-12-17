import React, { useState, useMemo, useEffect } from 'react';
import { 
  collection, onSnapshot, deleteDoc, doc, setDoc, writeBatch, query, orderBy, limit 
} from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

// --- 引入設定與資料 ---
import { auth, db } from './firebaseConfig';
import { FULL_IMPORT_DATA, MOCK_RECORDS, INITIAL_INVENTORY } from './initialData';

// --- 引入元件 ---
import { 
  ConfirmDialog, Toast, PhoneActionSheet, AddressAlertDialog, ImageViewer, GlobalStyles 
} from './components/SharedUI';
import BottomNavigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import InventoryView from './components/Inventory';
import CustomerForm from './components/CustomerForm';
import RecordForm from './components/RecordForm';
import SearchView from './components/SearchView';
import CustomerRoster from './components/CustomerRoster';
import CustomerDetail from './components/CustomerDetail';
import TrackingView from './components/TrackingView';
import WorkLog from './components/WorkLog';
import RecordList from './components/RecordList';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentView, setCurrentView] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [records, setRecords] = useState([]);
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [dbStatus, setDbStatus] = useState('offline');
  const [isLoading, setIsLoading] = useState(true);

  // UI 狀態
  const [viewingImage, setViewingImage] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPhoneSheet, setShowPhoneSheet] = useState(false);
  const [showAddressAlert, setShowAddressAlert] = useState(false);
  
  // 資料篩選與暫存狀態
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [targetCustomer, setTargetCustomer] = useState(null);
  const [rosterLevel, setRosterLevel] = useState('l1');
  const [selectedL1, setSelectedL1] = useState(null);
  const [selectedL2, setSelectedL2] = useState(null);
  const [historyFilter, setHistoryFilter] = useState('');
  
  const defaultRecordForm = { 
      id: null, serviceSource: 'customer_call', symptom: '', action: '', status: 'completed', errorCode: '',
      date: new Date().toLocaleDateString('en-CA'),
  };
  const [editingRecordData, setEditingRecordData] = useState(defaultRecordForm); 

  const showToast = (message, type = 'success') => setToast({ message, type });
  const today = new Date().toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'long' });
  const pendingTasks = records.filter(r => r.status === 'pending').length;
  
  const historyList = useMemo(() => {
    if (!historyFilter || !selectedCustomer) return [];
    const term = historyFilter.toLowerCase();
    const custRecords = records.filter(r => r.customerID === selectedCustomer.customerID);
    return custRecords.filter(r => 
        (r.fault || r.symptom || '').toLowerCase().includes(term) || 
        (r.solution || r.action || '').toLowerCase().includes(term) ||
        (r.parts && r.parts.some(p => p.name.toLowerCase().includes(term)))
    ).sort((a,b) => new Date(b.date) - new Date(a.date));
  }, [historyFilter, selectedCustomer, records]);

  // --- Firebase 連線邏輯 ---
  useEffect(() => {
    setDbStatus('connecting');
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const custRef = collection(db, 'customers');
        const recRef = collection(db, 'records');
        const invRef = collection(db, 'inventory'); 

        const unsubCust = onSnapshot(custRef, (snapshot) => {
            if (!snapshot.empty) {
              const data = snapshot.docs.map(d => ({ ...d.data(), customerID: d.id }));
              setCustomers(data);
            } else { setCustomers(FULL_IMPORT_DATA); }
            setDbStatus('online'); 
            setIsLoading(false);
          }, 
          (err) => { console.error(err); setDbStatus('error'); setIsLoading(false); }
        );

        const recentRecordsQuery = query(recRef, orderBy('date', 'desc'), limit(300));
        const unsubRec = onSnapshot(recentRecordsQuery, (snapshot) => {
            if (!snapshot.empty) {
                const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
                setRecords(data);
            } else { setRecords(MOCK_RECORDS); }
        });

        // ★ 庫存連線 + 自動初始化邏輯
        const unsubInv = onSnapshot(invRef, (snapshot) => {
          if (!snapshot.empty) {
              const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
              setInventory(data);
          } else { 
              // 如果資料庫是空的，自動寫入預設資料
              if (currentUser) {
                  console.log("初始化庫存...");
                  const batch = writeBatch(db);
                  INITIAL_INVENTORY.forEach(item => {
                      const itemId = item.id || `init-${Math.random().toString(36).substr(2, 9)}`;
                      const itemRef = doc(db, 'inventory', itemId);
                      batch.set(itemRef, { ...item, id: itemId });
                  });
                  batch.commit().catch(e => console.error("Init failed", e));
              }
              setInventory(INITIAL_INVENTORY); 
          }
        });

        return () => { unsubCust(); unsubRec(); unsubInv(); };
      } else { 
        signInAnonymously(auth).catch((error) => {
             console.error(error); setDbStatus('offline'); setIsLoading(false);
        });
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'dashboard') setCurrentView('dashboard');
    if (tab === 'roster') { setCurrentView('roster'); setRosterLevel('l1'); }
    if (tab === 'inventory') setCurrentView('inventory');
    if (tab === 'records') setCurrentView('records');
    if (tab === 'settings') setCurrentView('settings');
  };

  const handleNavClick = (customer) => {
    if (!customer.address) return showToast("無地址資料", 'error');
    if (customer.addressNote) { setTargetCustomer(customer); setShowAddressAlert(true); } 
    else { window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customer.address)}`, '_blank'); }
  };

  // --- CRUD Operations ---
  const updateInventory = async (item) => {
    setInventory(prev => prev.map(i => i.id === item.id ? item : i));
    if (dbStatus === 'demo' || !user) return;
    try { await setDoc(doc(db, 'inventory', item.id), item); showToast('庫存已更新'); } catch (e) { console.error(e); }
  };

  const addInventoryItem = async (newItem) => {
    const newId = `p-${Date.now()}`;
    const itemWithId = { ...newItem, id: newId };
    setInventory(prev => [...prev, itemWithId]);
    if (dbStatus === 'demo' || !user) return;
    try { await setDoc(doc(db, 'inventory', newId), itemWithId); showToast('已新增'); } catch (e) { console.error(e); }
  };

  const deleteInventoryItem = async (id) => {
    setInventory(prev => prev.filter(i => i.id !== id));
    if (dbStatus === 'demo' || !user) return;
    try { await deleteDoc(doc(db, 'inventory', id)); showToast('已刪除'); } catch (e) { console.error(e); }
  };

  const renameModelGroup = async (oldModel, newModel) => {
    setInventory(prev => prev.map(item => item.model === oldModel ? { ...item, model: newModel } : item));
    if (dbStatus === 'demo' || !user) return;
    try {
      const batch = writeBatch(db);
      const itemsToUpdate = inventory.filter(i => i.model === oldModel);
      if (itemsToUpdate.length === 0) return;
      itemsToUpdate.forEach(item => { const ref = doc(db, 'inventory', item.id); batch.update(ref, { model: newModel }); });
      await batch.commit(); showToast(`已更新為：${newModel}`);
    } catch (e) { console.error(e); }
  };

  const handleSaveRecord = async (formData) => {
    const recId = formData.id || `rec-${Date.now()}`;
    const newRecord = { id: recId, customerID: selectedCustomer ? selectedCustomer.customerID : (formData.customerID || 'unknown'), ...formData, fault: formData.symptom, solution: formData.action, type: 'repair', isTracking: formData.status === 'pending' };
    
    if (formData.parts && formData.parts.length > 0) {
      const batch = writeBatch(db);
      let hasUpdates = false;
      formData.parts.forEach(part => {
        const item = inventory.find(i => i.name === part.name);
        if (item) {
           const newQty = Math.max(0, item.qty - part.qty);
           updateInventory({...item, qty: newQty}); 
           if (dbStatus !== 'demo' && user) { const ref = doc(db, 'inventory', item.id); batch.update(ref, { qty: newQty }); hasUpdates = true; }
        }
      });
      if (hasUpdates && dbStatus !== 'demo' && user) await batch.commit();
    }
    if (dbStatus === 'demo' || !user) {
        setRecords(prev => { const exists = prev.find(r => r.id === recId); if (exists) return prev.map(r => r.id === recId ? newRecord : r); return [newRecord, ...prev]; });
    } else { try { await setDoc(doc(db, 'records', recId), newRecord); showToast('儲存成功'); } catch (err) { console.error(err); } }
    if (activeTab === 'records') setCurrentView('records'); else setCurrentView('detail');
  };

  const handleDeleteRecord = (e, recordId) => {
     if (e) { e.stopPropagation(); }
     if (window.confirm('確定刪除？')) {
         if (dbStatus !== 'demo' && user) deleteDoc(doc(db, 'records', recordId));
         setRecords(prev => prev.filter(r => r.id !== recordId));
     }
  };

  // --- 其他必要的 Props (縮減版以節省空間，功能不變) ---
  const handleDeleteCustomer = (e) => { if(e) e.stopPropagation(); if(window.confirm('刪除客戶？')) { if(dbStatus!=='demo') deleteDoc(doc(db,'customers',selectedCustomer.customerID)); setCustomers(prev=>prev.filter(c=>c.customerID!==selectedCustomer.customerID)); setRosterLevel('l1'); setCurrentView('roster'); }};
  const handleAddSubmit = async (d) => { const id=`cust-${Date.now()}`; const n={customerID:id, name:d.name, L1_group:d.L1_group, L2_district:d.L2_district, address:d.address, addressNote:d.addressNote||'', phones:[{label:d.phoneLabel,number:d.phoneNumber}], assets:[{model:d.model}], notes:d.notes||''}; if(dbStatus!=='demo') await setDoc(doc(db,'customers',id),n); setCustomers(p=>[...p,n]); setSelectedCustomer(n); setCurrentView('detail'); };
  const handleEditSubmit = async (d) => { if(!selectedCustomer)return; const n={...selectedCustomer, name:d.name, L1_group:d.L1_group, L2_district:d.L2_district, address:d.address, addressNote:d.addressNote, phones:[{label:d.phoneLabel,number:d.phoneNumber}], assets:[{model:d.model}], notes:d.notes}; if(dbStatus!=='demo') await setDoc(doc(db,'customers',selectedCustomer.customerID),n); setCustomers(p=>p.map(c=>c.customerID===n.customerID?n:c)); setSelectedCustomer(n); setCurrentView('detail'); };
  const startEdit = () => setCurrentView('edit');
  const startAddRecord = () => { setEditingRecordData(defaultRecordForm); setHistoryFilter(''); setCurrentView('add_record'); };
  const startEditRecord = (e, r) => { e.stopPropagation(); setEditingRecordData({...defaultRecordForm, ...r, parts:r.parts||[]}); setHistoryFilter(''); setCurrentView('edit_record'); };
  const handleExportData = () => { const b=new Blob([JSON.stringify({customers,inventory,records})],{type:"application/json"}); const u=URL.createObjectURL(b); const a=document.createElement('a'); a.href=u; a.download='backup.json'; a.click(); };
  const handleImportData = (e) => { const r=new FileReader(); r.onload=ev=>{ const d=JSON.parse(ev.target.result); if(d.customers)setCustomers(d.customers); if(d.inventory)setInventory(d.inventory); if(d.records)setRecords(d.records); }; r.readAsText(e.target.files[0]); };
  const handleResetData = () => { if(window.confirm('重置資料？')) { const b=writeBatch(db); customers.forEach(c=>b.delete(doc(db,'customers',c.customerID))); inventory.forEach(i=>b.delete(doc(db,'inventory',i.id))); FULL_IMPORT_DATA.forEach(c=>b.set(doc(db,'customers',c.customerID),c)); INITIAL_INVENTORY.forEach(i=>b.set(doc(db,'inventory',i.id),i)); b.commit(); setInventory(INITIAL_INVENTORY); }};

  return (
    <div className="max-w-md mx-auto bg-gray-100 min-h-screen font-sans text-gray-900 shadow-2xl relative overflow-hidden">
      <GlobalStyles />
      {isLoading && <div className="absolute inset-0 bg-white z-[60] flex flex-col items-center justify-center"><Loader2 size={48} className="text-blue-600 animate-spin mb-4" /><p className="text-gray-500 font-bold">資料同步中...</p></div>}
      <ImageViewer src={viewingImage} onClose={() => setViewingImage(null)} />
      <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog({...confirmDialog, isOpen: false})} isProcessing={isProcessing} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="fixed top-4 right-4 z-[55] pointer-events-none"><div className={`w-3 h-3 rounded-full shadow-lg ring-2 ring-white ${dbStatus==='online'?'bg-green-500':(dbStatus==='connecting'?'bg-yellow-400 animate-pulse':'bg-red-500')}`}></div></div>
      
      {currentView === 'dashboard' && <Dashboard today={today} dbStatus={dbStatus} pendingTasks={pendingTasks} todayCompletedCount={records.filter(r => r.date === new Date().toISOString().split('T')[0]).length} totalCustomers={customers.length} setCurrentView={setCurrentView} setActiveTab={setActiveTab} setRosterLevel={setRosterLevel} />}
      {currentView === 'roster' && <CustomerRoster customers={customers} rosterLevel={rosterLevel} setRosterLevel={setRosterLevel} selectedL1={selectedL1} setSelectedL1={setSelectedL1} selectedL2={selectedL2} setSelectedL2={setSelectedL2} setCurrentView={setCurrentView} setActiveTab={setActiveTab} setSelectedCustomer={setSelectedCustomer} setHistoryFilter={setHistoryFilter} setTargetCustomer={setTargetCustomer} setShowAddressAlert={setShowAddressAlert} setShowPhoneSheet={setShowPhoneSheet} showToast={showToast} />}
      {currentView === 'detail' && <CustomerDetail selectedCustomer={selectedCustomer} records={records} setCurrentView={setCurrentView} startEdit={startEdit} handleDeleteCustomer={handleDeleteCustomer} handleNavClick={handleNavClick} startAddRecord={startAddRecord} startEditRecord={startEditRecord} handleDeleteRecord={handleDeleteRecord} setViewingImage={setViewingImage} />}
      {currentView === 'search' && <SearchView customers={customers} records={records} onBack={() => setCurrentView('dashboard')} onSelectCustomer={(c) => {setSelectedCustomer(c); setCurrentView('detail');}} />}
      {(currentView === 'add' || (currentView === 'edit' && selectedCustomer)) && <CustomerForm mode={currentView === 'add' ? 'add' : 'edit'} initialData={currentView === 'add' ? { L1_group: selectedL1, L2_district: selectedL2 } : selectedCustomer} onSubmit={currentView === 'add' ? handleAddSubmit : handleEditSubmit} onDelete={handleDeleteCustomer} onCancel={() => setCurrentView(currentView === 'add' ? (rosterLevel === 'l1' ? 'roster' : 'detail') : 'detail')} />}
      {(currentView === 'add_record' || currentView === 'edit_record') && <RecordForm initialData={editingRecordData} historyList={historyList} filterText={historyFilter} onHistoryFilterChange={setHistoryFilter} onSubmit={handleSaveRecord} inventory={inventory} onCancel={() => setCurrentView(activeTab === 'records' ? 'records' : 'detail')} />}
      {(currentView === 'inventory' || activeTab === 'inventory') && <InventoryView inventory={inventory} onUpdateInventory={updateInventory} onAddInventory={addInventoryItem} onDeleteInventory={deleteInventoryItem} onRenameGroup={renameModelGroup} onBack={() => setCurrentView('dashboard')} />}
      {(currentView === 'records' || activeTab === 'records') && <RecordList records={records} customers={customers} setCurrentView={setCurrentView} setActiveTab={setActiveTab} startEditRecord={startEditRecord} handleDeleteRecord={handleDeleteRecord} setViewingImage={setViewingImage} />}
      {currentView === 'tracking' && <TrackingView records={records} customers={customers} setCurrentView={setCurrentView} startEditRecord={startEditRecord} />}
      {currentView === 'worklog' && <WorkLog records={records} customers={customers} setCurrentView={setCurrentView} showToast={showToast} />}
      {currentView === 'settings' && <Settings dbStatus={dbStatus} customerCount={customers.length} recordCount={records.length} onExport={handleExportData} onImport={handleImportData} onReset={handleResetData} />}
      
      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      {showPhoneSheet && <PhoneActionSheet phones={targetCustomer?.phones} onClose={() => setShowPhoneSheet(false)} />}
      {showAddressAlert && <AddressAlertDialog customer={targetCustomer} onClose={() => setShowAddressAlert(false)} />}
    </div>
  );
}