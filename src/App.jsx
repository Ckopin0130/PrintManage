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
  // --- 1. 狀態管理 ---
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
  
  // 表單初始值
  const defaultRecordForm = { 
      id: null, serviceSource: 'customer_call', symptom: '', action: '', status: 'completed', errorCode: '',
      date: new Date().toLocaleDateString('en-CA'),
  };
  const [editingRecordData, setEditingRecordData] = useState(defaultRecordForm); 

  // --- 2. 輔助函數 ---
  const showToast = (message, type = 'success') => setToast({ message, type });
  const today = new Date().toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'long' });
  const pendingTasks = records.filter(r => r.status === 'pending').length;
  
  // 歷史紀錄篩選邏輯
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

  // --- 3. Firebase 連線邏輯 ---
  useEffect(() => {
    setDbStatus('connecting');
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const custRef = collection(db, 'customers');
        const recRef = collection(db, 'records');
        const invRef = collection(db, 'inventory'); 

        // 1. 客戶資料
        const unsubCust = onSnapshot(custRef, (snapshot) => {
            if (!snapshot.empty) {
              const data = snapshot.docs.map(d => ({ ...d.data(), customerID: d.id }));
              setCustomers(data);
            } else { setCustomers(FULL_IMPORT_DATA); }
            setDbStatus('online'); 
            setIsLoading(false);
          }, 
          (err) => { 
            console.error("連線錯誤", err); 
            setDbStatus('error');
            setCustomers(FULL_IMPORT_DATA);
            setRecords(MOCK_RECORDS);
            setInventory(INITIAL_INVENTORY);
            setIsLoading(false);
          }
        );

        // 2. 維修紀錄
        const recentRecordsQuery = query(recRef, orderBy('date', 'desc'), limit(300));
        const unsubRec = onSnapshot(recentRecordsQuery, (snapshot) => {
            if (!snapshot.empty) {
                const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
                setRecords(data);
            } else { setRecords(MOCK_RECORDS); }
        });

        // 3. 庫存資料 (★這裡是你原本缺少的關鍵：自動初始化)
        const unsubInv = onSnapshot(invRef, (snapshot) => {
          if (!snapshot.empty) {
              // 如果資料庫有東西，就正常載入
              const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
              setInventory(data);
          } else { 
              // ★ 關鍵修正：如果資料庫是空的，自動寫入預設資料！
              if (currentUser) {
                  console.log("偵測到空資料庫，正在初始化庫存...");
                  const batch = writeBatch(db);
                  let opCount = 0;
                  
                  INITIAL_INVENTORY.forEach(item => {
                      // 確保每個項目都有 ID
                      const itemId = item.id || `init-${Math.random().toString(36).substr(2, 9)}`;
                      const itemRef = doc(db, 'inventory', itemId);
                      // 注意：這裡使用 set 來寫入
                      batch.set(itemRef, { ...item, id: itemId });
                      opCount++;
                  });

                  if(opCount > 0) {
                      batch.commit()
                        .then(() => console.log("庫存初始化完成"))
                        .catch(err => console.error("庫存初始化失敗", err));
                  }
              }
              // 先顯示預設值，讓畫面不要空白
              setInventory(INITIAL_INVENTORY); 
          }
        });

        return () => { unsubCust(); unsubRec(); unsubInv(); };

      } else { 
        signInAnonymously(auth).catch((error) => {
             console.error("登入失敗", error);
             setDbStatus('offline');
             setCustomers(FULL_IMPORT_DATA);
             setRecords(MOCK_RECORDS);
             setInventory(INITIAL_INVENTORY);
             setIsLoading(false);
        });
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // --- 4. 導覽切換 ---
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
    if (customer.addressNote) { 
      setTargetCustomer(customer); 
      setShowAddressAlert(true);
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customer.address)}`;
      const newWindow = window.open(url, '_blank');
      if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') window.location.href = url;
    }
  };

  // --- 5. 資料庫操作 (CRUD) Handlers ---
  
  // 更新庫存
  const updateInventory = async (item) => {
    setInventory(prev => prev.map(i => i.id === item.id ? item : i));
    if (dbStatus === 'demo' || !user) { showToast('庫存已更新 (離線)'); return; }
    try {
       await setDoc(doc(db, 'inventory', item.id), item);
       showToast('庫存資料已更新');
    } catch (e) { console.error(e); showToast('更新失敗', 'error'); }
  };

  // 新增零件
  const addInventoryItem = async (newItem) => {
    const newId = `p-${Date.now()}`;
    const itemWithId = { ...newItem, id: newId };
    setInventory(prev => [...prev, itemWithId]);

    if (dbStatus === 'demo' || !user) { showToast('新零件已加入 (離線)'); return; }
    try {
       await setDoc(doc(db, 'inventory', newId), itemWithId);
       showToast('新零件已加入');
    } catch (e) { console.error(e); showToast('新增失敗', 'error'); }
  };

  // 刪除零件
  const deleteInventoryItem = async (id) => {
    setInventory(prev => prev.filter(i => i.id !== id));

    if (dbStatus === 'demo' || !user) { showToast('零件已刪除 (離線)'); return; }
    try {
       await deleteDoc(doc(db, 'inventory', id));
       showToast('零件已刪除');
    } catch (e) { console.error(e); showToast('刪除失敗', 'error'); }
  };

  // 批次修改分類名稱
  const renameModelGroup = async (oldModel, newModel) => {
    setInventory(prev => prev.map(item => item.model === oldModel ? { ...item, model: newModel } : item));

    if (dbStatus === 'demo' || !user) { showToast(`分類已更新：${newModel} (離線)`); return; }

    try {
      const batch = writeBatch(db);
      const itemsToUpdate = inventory.filter(i => i.model === oldModel);
      
      if (itemsToUpdate.length === 0) return;

      itemsToUpdate.forEach(item => {
        const ref = doc(db, 'inventory', item.id);
        batch.update(ref, { model: newModel });
      });
      
      await batch.commit();
      showToast(`分類已更新：${newModel}`);
    } catch (e) { console.error(e); showToast('更新失敗', 'error'); }
  };

  // --- 客戶與紀錄相關操作 (保持不變) ---
  const handleResetData = async () => {
    setConfirmDialog({
        isOpen: true,
        title: '⚠️ 危險操作',
        message: '此操作將「清空」並重置所有資料。確定要執行嗎？',
        onConfirm: async () => {
            setIsProcessing(true);
            if (dbStatus === 'demo' || !db) {
                setCustomers(FULL_IMPORT_DATA);
                setRecords(MOCK_RECORDS);
                setInventory(INITIAL_INVENTORY);
                setTimeout(() => { showToast('資料已重置'); setIsProcessing(false); setConfirmDialog({...confirmDialog, isOpen: false}); }, 500);
            } else {
                try {
                    const batch = writeBatch(db);
                    customers.forEach(c => batch.delete(doc(db, 'customers', c.customerID)));
                    inventory.forEach(i => batch.delete(doc(db, 'inventory', i.id))); // 清除庫存
                    FULL_IMPORT_DATA.forEach(c => batch.set(doc(db, 'customers', c.customerID), c));
                    INITIAL_INVENTORY.forEach(i => batch.set(doc(db, 'inventory', i.id), i)); // 重置庫存
                    
                    await batch.commit();
                    showToast('系統已重置');
                } catch(e) { console.error(e); }
                setIsProcessing(false);
                setConfirmDialog({...confirmDialog, isOpen: false});
            }
        }
    });
  };

  const handleSaveRecord = async (formData) => {
    const recId = formData.id || `rec-${Date.now()}`;
    const newRecord = {
        id: recId,
        customerID: selectedCustomer ? selectedCustomer.customerID : (formData.customerID || 'unknown'),
        ...formData,
        fault: formData.symptom, 
        solution: formData.action, 
        type: 'repair', 
        isTracking: formData.status === 'pending'
    };
    
    // 扣庫存 (同步寫入 Firebase)
    if (formData.parts && formData.parts.length > 0) {
      const batch = writeBatch(db);
      let hasUpdates = false;

      formData.parts.forEach(part => {
        const item = inventory.find(i => i.name === part.name);
        if (item) {
           const newQty = Math.max(0, item.qty - part.qty);
           updateInventory({...item, qty: newQty}); 
           if (dbStatus !== 'demo' && user) {
             const ref = doc(db, 'inventory', item.id);
             batch.update(ref, { qty: newQty });
             hasUpdates = true;
           }
        }
      });
      if (hasUpdates && dbStatus !== 'demo' && user) await batch.commit();
    }

    if (dbStatus === 'demo' || !user) {
        setRecords(prev => {
            const exists = prev.find(r => r.id === recId);
            if (exists) return prev.map(r => r.id === recId ? newRecord : r);
            return [newRecord, ...prev];
        });
        showToast(formData.id ? '紀錄已更新' : '紀錄已新增');
    } else {
        try {
            await setDoc(doc(db, 'records', recId), newRecord);
            showToast(formData.id ? '紀錄已更新' : '紀錄已新增');
        } catch (err) { console.error(err); showToast('儲存失敗', 'error'); }
    }
    if (activeTab === 'records') setCurrentView('records'); else setCurrentView('detail');
  };

  const handleDeleteRecord = (e, recordId) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    setConfirmDialog({
        isOpen: true, title: '刪除維修紀錄', message: '確定要刪除這筆紀錄嗎？此動作無法復原。',
        onConfirm: async () => {
            setIsProcessing(true);
            if (dbStatus === 'demo' || !user) {
                setRecords(prev => prev.filter(r => String(r.id) !== String(recordId)));
                showToast('紀錄已刪除');
                setIsProcessing(false); setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            } else {
                try {
                    await deleteDoc(doc(db, 'records', recordId));
                    showToast('紀錄已刪除');
                } catch (err) { showToast('刪除失敗', 'error'); }
                setIsProcessing(false); setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            }
        }
    });
  };

  const handleDeleteCustomer = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!selectedCustomer) return;
    const targetId = selectedCustomer.customerID;
    setConfirmDialog({
        isOpen: true, title: '刪除客戶資料', message: `確定要刪除客戶「${selectedCustomer.name}」嗎？`,
        onConfirm: async () => {
            setIsProcessing(true);
            const goBack = () => { setRosterLevel('l1'); setCurrentView('roster'); setSelectedCustomer(null); };
            if (dbStatus === 'demo' || !user) {
                setCustomers(prev => prev.filter(c => String(c.customerID) !== String(targetId)));
                showToast('客戶已刪除');
                goBack();
                setIsProcessing(false); setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            } else {
                try {
                    await deleteDoc(doc(db, 'customers', targetId));
                    showToast('客戶已刪除');
                    goBack();
                } catch (err) { showToast('刪除失敗', 'error'); }
                setIsProcessing(false); setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            }
        }
    });
  };

  const handleEditSubmit = async (formData) => {
    if (!selectedCustomer) return;
    const existingPhones = selectedCustomer.phones || [];
    const newPhone = { label: formData.phoneLabel, number: formData.phoneNumber };
    const updatedPhones = existingPhones.length > 0 ? [newPhone, ...existingPhones.slice(1)] : [newPhone];
    const existingAssets = selectedCustomer.assets || [];
    const newAsset = { model: formData.model };
    const updatedAssets = existingAssets.length > 0 ? [newAsset, ...existingAssets.slice(1)] : [newAsset];
    const updatedEntry = {
      ...selectedCustomer,
      name: formData.name, L1_group: formData.L1_group, L2_district: formData.L2_district,
      address: formData.address, addressNote: formData.addressNote || '', notes: formData.notes || '',
      phones: updatedPhones, assets: updatedAssets
    };
    if (dbStatus === 'demo' || !user) {
        setCustomers(prev => prev.map(c => c.customerID === selectedCustomer.customerID ? updatedEntry : c));
        setSelectedCustomer(updatedEntry); setCurrentView('detail'); showToast('資料已更新');
    } else {
      try {
        await setDoc(doc(db, 'customers', selectedCustomer.customerID), updatedEntry);
        setSelectedCustomer(updatedEntry); setCurrentView('detail'); showToast('資料已更新');
      } catch (err) { showToast('更新失敗', 'error'); }
    }
  };

  const handleAddSubmit = async (formData) => {
    const newId = `cust-${Date.now()}`;
    const newEntry = {
      customerID: newId, name: formData.name, L1_group: formData.L1_group, L2_district: formData.L2_district,
      address: formData.address, addressNote: formData.addressNote || '',
      phones: [{ label: formData.phoneLabel, number: formData.phoneNumber }],
      assets: [{ model: formData.model || '未設定' }], notes: formData.notes || '', serviceCount: 0
    };
    if (dbStatus === 'demo' || !user) {
        setCustomers(prev => [...prev, newEntry]);
        showToast('新增成功');
        setSelectedCustomer(newEntry); setCurrentView('detail'); setSelectedL1(formData.L1_group); setSelectedL2(formData.L2_district); setRosterLevel('l3');
    } else {
        try {
            await setDoc(doc(db, 'customers', newId), newEntry);
            showToast('新增成功');
            setSelectedCustomer(newEntry); setCurrentView('detail'); setSelectedL1(formData.L1_group); setSelectedL2(formData.L2_district); setRosterLevel('l3');
        } catch (err) { showToast('新增失敗', 'error'); }
    }
  };

  const startEdit = () => { if (!selectedCustomer) return; setCurrentView('edit'); };
  const startAddRecord = () => { setEditingRecordData(defaultRecordForm); setHistoryFilter(''); setCurrentView('add_record'); };
  const startEditRecord = (e, r) => {
      if(e) e.stopPropagation();
      const recordCustomer = customers.find(c => c.customerID === r.customerID);
      if (recordCustomer && !selectedCustomer) setSelectedCustomer(recordCustomer);
      setEditingRecordData({ ...defaultRecordForm, ...r, parts: r.parts || [] }); 
      setHistoryFilter('');
      setCurrentView('edit_record');
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify({ customers, inventory, records }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('資料已匯出');
  };
  const handleImportData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.customers) setCustomers(data.customers);
        if (data.inventory) setInventory(data.inventory);
        if (data.records) setRecords(data.records);
        showToast('資料匯入成功');
      } catch (err) { console.error(err); showToast('匯入失敗：格式錯誤', 'error'); }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="max-w-md mx-auto bg-gray-100 min-h-screen font-sans text-gray-900 shadow-2xl relative overflow-hidden">
      <GlobalStyles />
      {isLoading && <div className="absolute inset-0 bg-white z-[60] flex flex-col items-center justify-center"><Loader2 size={48} className="text-blue-600 animate-spin mb-4" /><p className="text-gray-500 font-bold">資料同步中...</p></div>}
      
      <ImageViewer src={viewingImage} onClose={() => setViewingImage(null)} />
      <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog({...confirmDialog, isOpen: false})} isProcessing={isProcessing} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="fixed top-4 right-4 z-[55] pointer-events-none">
        <div className={`transition-all duration-500 transform ${dbStatus === 'online' ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`}><div className="w-3 h-3 bg-green-500 rounded-full shadow-lg shadow-green-200 ring-2 ring-white"></div></div>
        <div className={`transition-all duration-500 transform absolute top-0 right-0 ${dbStatus !== 'online' ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`}><div className={`w-3 h-3 rounded-full shadow-lg ring-2 ring-white ${dbStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : (dbStatus === 'demo' ? 'bg-blue-500' : 'bg-red-500')}`}></div></div>
      </div>

      {currentView === 'dashboard' && (
        <Dashboard 
          today={today} dbStatus={dbStatus} pendingTasks={pendingTasks} 
          todayCompletedCount={records.filter(r => r.date === new Date().toISOString().split('T')[0]).length}
          totalCustomers={customers.length} setCurrentView={setCurrentView} setActiveTab={setActiveTab} setRosterLevel={setRosterLevel} 
        />
      )}

      {currentView === 'roster' && (
        <CustomerRoster 
          customers={customers} rosterLevel={rosterLevel} setRosterLevel={setRosterLevel}
          selectedL1={selectedL1} setSelectedL1={setSelectedL1} selectedL2={selectedL2} setSelectedL2={setSelectedL2}
          setCurrentView={setCurrentView} setActiveTab={setActiveTab} setSelectedCustomer={setSelectedCustomer}
          setHistoryFilter={setHistoryFilter} setTargetCustomer={setTargetCustomer}
          setShowAddressAlert={setShowAddressAlert} setShowPhoneSheet={setShowPhoneSheet} showToast={showToast}
        />
      )}

      {currentView === 'detail' && (
        <CustomerDetail 
          selectedCustomer={selectedCustomer} records={records} setCurrentView={setCurrentView}
          startEdit={startEdit} handleDeleteCustomer={handleDeleteCustomer} handleNavClick={handleNavClick}
          startAddRecord={startAddRecord} startEditRecord={startEditRecord} handleDeleteRecord={handleDeleteRecord}
          setViewingImage={setViewingImage}
        />
      )}

      {currentView === 'search' && (
        <SearchView 
          customers={customers} records={records} onBack={() => setCurrentView('dashboard')}
          onSelectCustomer={(c) => {setSelectedCustomer(c); setCurrentView('detail');}} 
        />
      )}

      {(currentView === 'add' || (currentView === 'edit' && selectedCustomer)) && (
        <CustomerForm 
          mode={currentView === 'add' ? 'add' : 'edit'}
          initialData={currentView === 'add' ? { L1_group: selectedL1, L2_district: selectedL2 } : selectedCustomer}
          onSubmit={currentView === 'add' ? handleAddSubmit : handleEditSubmit}
          onDelete={handleDeleteCustomer}
          onCancel={() => setCurrentView(currentView === 'add' ? (rosterLevel === 'l1' ? 'roster' : 'detail') : 'detail')} 
        />
      )}

      {(currentView === 'add_record' || currentView === 'edit_record') && (
        <RecordForm 
           initialData={editingRecordData} historyList={historyList} filterText={historyFilter}
           onHistoryFilterChange={setHistoryFilter} onSubmit={handleSaveRecord} inventory={inventory}
           onCancel={() => setCurrentView(activeTab === 'records' ? 'records' : 'detail')}
        />
      )}

      {(currentView === 'inventory' || activeTab === 'inventory') && (
        <InventoryView 
          inventory={inventory} onUpdateInventory={updateInventory} onAddInventory={addInventoryItem}
          onDeleteInventory={deleteInventoryItem} onRenameGroup={renameModelGroup} onBack={() => setCurrentView('dashboard')} 
        />
      )}

      {(currentView === 'records' || activeTab === 'records') && (
        <RecordList 
          records={records} customers={customers} setCurrentView={setCurrentView} setActiveTab={setActiveTab}
          startEditRecord={startEditRecord} handleDeleteRecord={handleDeleteRecord} setViewingImage={setViewingImage}
        />
      )}

      {currentView === 'tracking' && (
        <TrackingView 
          records={records} customers={customers} setCurrentView={setCurrentView} startEditRecord={startEditRecord}
        />
      )}

      {currentView === 'worklog' && (
        <WorkLog records={records} customers={customers} setCurrentView={setCurrentView} showToast={showToast} />
      )}

      {currentView === 'settings' && (
        <Settings 
          dbStatus={dbStatus} customerCount={customers.length} recordCount={records.length}
          onExport={handleExportData} onImport={handleImportData} onReset={handleResetData}
        />
      )}

      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />

      {showPhoneSheet && <PhoneActionSheet phones={targetCustomer?.phones} onClose={() => setShowPhoneSheet(false)} />}
      {showAddressAlert && <AddressAlertDialog customer={targetCustomer} onClose={() => setShowAddressAlert(false)} />}
    </div>
  );
}