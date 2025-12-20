import React, { useState, useEffect } from 'react';
import { 
  collection, onSnapshot, deleteDoc, doc, setDoc, writeBatch, query, orderBy, limit 
} from 'firebase/firestore';
import { 
  ref, uploadString, listAll, getDownloadURL, deleteObject, getMetadata 
} from 'firebase/storage'; 
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

// --- 引入設定與資料 ---
import { auth, db, storage } from './firebaseConfig'; 
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
  
  // 雲端備份列表
  const [cloudBackups, setCloudBackups] = useState([]);

  // 資料篩選與暫存狀態
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [targetCustomer, setTargetCustomer] = useState(null);
  const [rosterLevel, setRosterLevel] = useState('l1');
  const [selectedL1, setSelectedL1] = useState(null);
  const [selectedL2, setSelectedL2] = useState(null);
  
  // 表單初始值
  const defaultRecordForm = { 
      id: null, serviceSource: 'customer_call', symptom: '', action: '', status: 'completed', errorCode: '',
      date: new Date().toLocaleDateString('en-CA'),
      parts: [] // 確保零件陣列初始存在
  };
  const [editingRecordData, setEditingRecordData] = useState(defaultRecordForm); 

  // --- 2. 輔助函數 ---
  const showToast = (message, type = 'success') => setToast({ message, type });
  const today = new Date().toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'long' });
  const pendingTasks = records.filter(r => r.status === 'pending').length;

  // 🔴【修正重點】：改成使用本地時間格式 (YYYY-MM-DD) 來計算今日單量
  const currentLocalTime = new Date().toLocaleDateString('en-CA'); 
  const todayCompletedCount = records.filter(r => r.date === currentLocalTime).length;
  
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

        // 3. 庫存資料
        const unsubInv = onSnapshot(invRef, (snapshot) => {
          if (!snapshot.empty) {
              const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
              setInventory(data);
          } else { 
              if (currentUser) {
                  const batch = writeBatch(db);
                  INITIAL_INVENTORY.forEach(item => {
                      const itemId = item.id || `init-${Math.random().toString(36).substr(2, 9)}`;
                      const itemRef = doc(db, 'inventory', itemId);
                      batch.set(itemRef, { ...item, id: itemId });
                  });
                  batch.commit().catch(err => console.error("Init failed", err));
              }
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
    if (tab === 'settings') { 
        setCurrentView('settings');
        fetchCloudBackups(); 
    }
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

  // --- 頁面跳轉函式 ---
  const startEdit = () => {
    setCurrentView('edit');
  };

  const startAddRecord = (customer) => {
    if (!customer) return;
    setEditingRecordData({ ...defaultRecordForm, customerID: customer.customerID });
    setCurrentView('add_record');
  };

  const startEditRecord = (e, record) => {
    if (e) e.stopPropagation();
    setEditingRecordData(record);
    setCurrentView('edit_record');
  };

  // --- 5. 資料庫操作 (CRUD) ---
  const updateInventory = async (item) => {
    setInventory(prev => prev.map(i => i.id === item.id ? item : i));
    if (dbStatus === 'demo' || !user) { showToast('庫存已更新 (離線)'); return; }
    try {
       await setDoc(doc(db, 'inventory', item.id), item);
       showToast('庫存資料已更新');
    } catch (e) { console.error(e); showToast('更新失敗', 'error'); }
  };

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

  const deleteInventoryItem = async (id) => {
    setInventory(prev => prev.filter(i => i.id !== id));
    if (dbStatus === 'demo' || !user) { showToast('零件已刪除 (離線)'); return; }
    try {
       await deleteDoc(doc(db, 'inventory', id));
       showToast('零件已刪除');
    } catch (e) { console.error(e); showToast('刪除失敗', 'error'); }
  };

  const renameModelGroup = async (oldModel, newModel) => {
    setInventory(prev => prev.map(item => item.model === oldModel ? { ...item, model: newModel } : item));
    if (dbStatus === 'demo' || !user) { showToast(`分類已更新：${newModel} (離線)`); return; }
    try {
      const batch = writeBatch(db);
      const itemsToUpdate = inventory.filter(i => i.model === oldModel);
      if (itemsToUpdate.length === 0) return;
      itemsToUpdate.forEach(item => { const ref = doc(db, 'inventory', item.id); batch.update(ref, { model: newModel }); });
      await batch.commit(); showToast(`分類已更新：${newModel}`);
    } catch (e) { console.error(e); showToast('更新失敗', 'error'); }
  };

  const handleResetData = async () => {
    setConfirmDialog({
        isOpen: true, title: '⚠️ 危險操作', message: '清空並重置所有資料？這將刪除雲端資料庫所有內容並回復預設值。',
        onConfirm: async () => {
            setIsProcessing(true);
            if (dbStatus === 'demo' || !db) {
                setCustomers(FULL_IMPORT_DATA); setRecords(MOCK_RECORDS); setInventory(INITIAL_INVENTORY);
                setTimeout(() => { showToast('資料已重置'); setIsProcessing(false); setConfirmDialog({...confirmDialog, isOpen: false}); }, 500);
            } else {
                try {
                    const batch = writeBatch(db);
                    customers.forEach(c => batch.delete(doc(db, 'customers', c.customerID)));
                    inventory.forEach(i => batch.delete(doc(db, 'inventory', i.id)));
                    records.slice(0, 400).forEach(r => batch.delete(doc(db, 'records', r.id)));

                    FULL_IMPORT_DATA.forEach(c => batch.set(doc(db, 'customers', c.customerID), c));
                    INITIAL_INVENTORY.forEach(i => batch.set(doc(db, 'inventory', i.id), i));
                    await batch.commit(); 
                    showToast('系統已重置');
                } catch(e) { console.error(e); showToast('重置部分失敗 (Batch Limit)', 'error'); }
                setIsProcessing(false); setConfirmDialog({...confirmDialog, isOpen: false});
            }
        }
    });
  };

  const handleSaveRecord = async (formData) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const recId = formData.id || `rec-${Date.now()}`;
    const finalCustomerID = selectedCustomer?.customerID || formData.customerID || 'unknown';

    const newRecord = {
        ...formData, 
        id: recId,
        customerID: finalCustomerID,
        fault: formData.symptom || '',
        solution: formData.action || '',
        type: 'repair', 
        isTracking: formData.status === 'pending'
    };

    Object.keys(newRecord).forEach(key => newRecord[key] === undefined && delete newRecord[key]);
    
    try {
        if (formData.parts && formData.parts.length > 0) {
          const batch = writeBatch(db); let hasUpdates = false;
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
            showToast(formData.id ? '紀錄已更新' : '紀錄已新增');
        } else {
            await setDoc(doc(db, 'records', recId), newRecord); 
            showToast(formData.id ? '紀錄已更新' : '紀錄已新增');
        }
        
        if (activeTab === 'records') setCurrentView('records'); else setCurrentView('detail');

    } catch (err) { 
        console.error("儲存詳細錯誤:", err); 
        if (err.code === 'resource-exhausted' || (err.message && err.message.includes('larger than'))) {
            showToast('存檔失敗：檔案過大，請減少照片或文字', 'error');
        } else if (err.code === 'permission-denied') {
            showToast('存檔失敗：權限不足 (Firebase Rules)', 'error');
        } else if (err.message && err.message.includes('undefined')) {
            showToast('存檔失敗：資料格式錯誤 (Undefined)', 'error');
        } else {
            showToast(`儲存失敗: ${err.message}`, 'error'); 
        }
    } finally {
        setIsProcessing(false);
    }
  };

  const handleDeleteRecord = (e, recordId) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    setConfirmDialog({
        isOpen: true, title: '刪除維修紀錄', message: '確定要刪除這筆紀錄嗎？',
        onConfirm: async () => {
            if (isProcessing) return;
            setIsProcessing(true);
            try {
                if (dbStatus === 'demo' || !user) {
                    setRecords(prev => prev.filter(r => String(r.id) !== String(recordId)));
                    showToast('紀錄已刪除'); 
                } else {
                    await deleteDoc(doc(db, 'records', recordId)); 
                    showToast('紀錄已刪除'); 
                }
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            } catch (err) { 
                showToast('刪除失敗', 'error'); 
            } finally {
                setIsProcessing(false);
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
            if (isProcessing) return;
            setIsProcessing(true);
            const goBack = () => { setRosterLevel('l1'); setCurrentView('roster'); setSelectedCustomer(null); };
            try {
                if (dbStatus === 'demo' || !user) {
                    setCustomers(prev => prev.filter(c => String(c.customerID) !== String(targetId)));
                    showToast('客戶已刪除'); goBack(); 
                } else {
                    await deleteDoc(doc(db, 'customers', targetId)); 
                    showToast('客戶已刪除'); goBack(); 
                }
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            } catch (err) { 
                showToast('刪除失敗', 'error'); 
            } finally {
                setIsProcessing(false);
            }
        }
    });
  };

  const handleEditSubmit = async (formData) => {
    if (!selectedCustomer) return;
    if (isProcessing) return;
    setIsProcessing(true);
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
    try {
        if (dbStatus === 'demo' || !user) {
            setCustomers(prev => prev.map(c => c.customerID === selectedCustomer.customerID ? updatedEntry : c));
            setSelectedCustomer(updatedEntry); setCurrentView('detail'); showToast('資料已更新 (離線)');
        } else {
            await setDoc(doc(db, 'customers', selectedCustomer.customerID), updatedEntry);
            setSelectedCustomer(updatedEntry); setCurrentView('detail'); showToast('資料已更新');
        }
    } catch (err) { showToast('更新失敗', 'error'); } finally { setIsProcessing(false); }
  };

  const handleAddSubmit = async (formData) => {
    if (isProcessing) return;
    setIsProcessing(true);
    const newId = `cust-${Date.now()}`;
    const newEntry = {
      customerID: newId, name: formData.name, L1_group: formData.L1_group, L2_district: formData.L2_district,
      address: formData.address, addressNote: formData.addressNote || '',
      phones: [{ label: formData.phoneLabel, number: formData.phoneNumber }],
      assets: [{ model: formData.model || '未設定' }], notes: formData.notes || '', serviceCount: 0
    };
    try {
        if (dbStatus === 'demo' || !user) {
            setCustomers(prev => [...prev, newEntry]);
            showToast('新增成功 (離線)');
            setSelectedCustomer(newEntry); setCurrentView('detail'); setSelectedL1(formData.L1_group); setSelectedL2(formData.L2_district); setRosterLevel('l3');
        } else {
            await setDoc(doc(db, 'customers', newId), newEntry);
            showToast('新增成功');
            setSelectedCustomer(newEntry); setCurrentView('detail'); setSelectedL1(formData.L1_group); setSelectedL2(formData.L2_district); setRosterLevel('l3');
        }
    } catch (err) { showToast('新增失敗', 'error'); } finally { setIsProcessing(false); }
  };

  // --- 通用還原核心邏輯 (共用) ---
  const restoreDataToFirestore = async (data) => {
    if (!data) throw new Error("無資料");
    if (data.customers) setCustomers(data.customers);
    if (data.inventory) setInventory(data.inventory);
    if (data.records) setRecords(data.records);

    if (dbStatus !== 'demo' && user) {
        const batch = writeBatch(db);
        let count = 0;
        const safeBatchSet = (ref, val) => {
            if (count < 480) { batch.set(ref, val); count++; }
        };

        if (data.customers) data.customers.forEach(c => safeBatchSet(doc(db, 'customers', c.customerID), c));
        if (data.inventory) data.inventory.forEach(i => safeBatchSet(doc(db, 'inventory', i.id), i));
        if (data.records) data.records.forEach(r => safeBatchSet(doc(db, 'records', r.id), r));

        await batch.commit();
        showToast('還原成功！資料已寫入雲端');
    } else {
        showToast('已匯入預覽 (離線模式)');
    }
  };

  // --- 本機檔案操作 ---
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
    showToast('備份檔案已下載');
  };

  const handleImportData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setIsProcessing(true);
        const data = JSON.parse(e.target.result);
        await restoreDataToFirestore(data);
      } catch (err) { console.error(err); showToast('檔案匯入失敗', 'error'); }
      finally { setIsProcessing(false); }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // --- 雲端備份操作 ---
  const fetchCloudBackups = async () => {
      if (!user || dbStatus === 'demo') return;
      try {
          const listRef = ref(storage, 'backups/');
          const res = await listAll(listRef);
          const filePromises = res.items.map(async (itemRef) => {
              try {
                  const metadata = await getMetadata(itemRef);
                  return { 
                      name: itemRef.name, 
                      fullPath: itemRef.fullPath,
                      time: new Date(metadata.timeCreated).toLocaleString(),
                      ref: itemRef 
                  };
              } catch (e) {
                  return { name: itemRef.name, fullPath: itemRef.fullPath, time: 'Unknown', ref: itemRef };
              }
          });
          const files = await Promise.all(filePromises);
          files.sort((a, b) => new Date(b.time) - new Date(a.time));
          setCloudBackups(files);
      } catch (err) {
          console.error("List backups failed", err);
      }
  };

  const handleCreateCloudBackup = async () => {
      if (isProcessing) return;
      if (dbStatus === 'demo' || !user) return showToast('請先登入', 'error');
      
      setIsProcessing(true);
      try {
          const dataStr = JSON.stringify({ customers, inventory, records });
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const backupRef = ref(storage, `backups/backup_${timestamp}.json`);
          
          await uploadString(backupRef, dataStr);
          showToast('雲端還原點已建立');
          fetchCloudBackups(); 
      } catch (err) {
          console.error(err);
          showToast('建立備份失敗', 'error');
      } finally {
          setIsProcessing(false);
      }
  };

  const handleRestoreFromCloud = async (backupItem) => {
      if (isProcessing) return;
      setConfirmDialog({
          isOpen: true, 
          title: '確認還原', 
          message: `確定要使用「${backupItem.time}」的備份覆蓋目前資料嗎？目前的資料將會消失。`,
          onConfirm: async () => {
              setIsProcessing(true);
              setConfirmDialog(prev => ({...prev, isOpen: false}));
              try {
                  const url = await getDownloadURL(backupItem.ref);
                  const response = await fetch(url);
                  const data = await response.json();
                  await restoreDataToFirestore(data);
              } catch (err) {
                  console.error(err);
                  showToast('還原失敗：無法讀取檔案', 'error');
              } finally {
                  setIsProcessing(false);
              }
          }
      });
  };

  const handleDeleteCloudBackup = async (backupItem) => {
      if (isProcessing) return;
      if (!window.confirm(`確定要刪除 ${backupItem.time} 的備份嗎？`)) return;
      
      setIsProcessing(true);
      try {
          await deleteObject(backupItem.ref);
          showToast('備份檔已刪除');
          fetchCloudBackups();
      } catch (err) {
          console.error(err);
          showToast('刪除失敗', 'error');
      } finally {
          setIsProcessing(false);
      }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-100 min-h-screen font-sans text-gray-900 shadow-2xl relative overflow-hidden">
      <GlobalStyles />
      {isLoading && <div className="absolute inset-0 bg-white z-[60] flex flex-col items-center justify-center"><Loader2 size={48} className="text-blue-600 animate-spin mb-4" /><p className="text-gray-500 font-bold">資料同步中...</p></div>}
      
      <ImageViewer src={viewingImage} onClose={() => setViewingImage(null)} />
      <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog({...confirmDialog, isOpen: false})} isProcessing={isProcessing} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* 頁面路由區塊 */}
      {currentView === 'dashboard' && (
        <Dashboard 
          today={today} dbStatus={dbStatus} pendingTasks={pendingTasks} 
          todayCompletedCount={todayCompletedCount} // 🔴 使用已修正的變數
          totalCustomers={customers.length} setCurrentView={setCurrentView} setActiveTab={setActiveTab} setRosterLevel={setRosterLevel} 
        />
      )}

      {currentView === 'roster' && (
        <CustomerRoster 
          customers={customers} rosterLevel={rosterLevel} setRosterLevel={setRosterLevel}
          selectedL1={selectedL1} setSelectedL1={setSelectedL1} selectedL2={selectedL2} setSelectedL2={setSelectedL2}
          setCurrentView={setCurrentView} setActiveTab={setActiveTab} setSelectedCustomer={setSelectedCustomer}
          setTargetCustomer={setTargetCustomer}
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
           initialData={editingRecordData} onSubmit={handleSaveRecord} inventory={inventory}
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
          isProcessing={isProcessing}
          cloudBackups={cloudBackups}
          onCreateCloudBackup={handleCreateCloudBackup}
          onRestoreFromCloud={handleRestoreFromCloud}
          onDeleteCloudBackup={handleDeleteCloudBackup}
        />
      )}

      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />

      {showPhoneSheet && <PhoneActionSheet phones={targetCustomer?.phones} onClose={() => setShowPhoneSheet(false)} />}
      {showAddressAlert && <AddressAlertDialog customer={targetCustomer} onClose={() => setShowAddressAlert(false)} />}
    </div>
  );
}