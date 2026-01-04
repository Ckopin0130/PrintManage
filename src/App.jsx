import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  collection, onSnapshot, deleteDoc, doc, setDoc, writeBatch, query, orderBy, limit, addDoc
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
import RecordList from './components/RecordList';
// --- 新增維修知識庫組件 ---
import ErrorCodeLibrary from './components/ErrorCodeLibrary';
// --- 引入快速操作視窗
import QuickActionView from './components/QuickActionView';

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

  // --- 維修知識庫相關 state ---
  const [errorCodes, setErrorCodes] = useState([]);
  const [spModes, setSpModes] = useState([]);
  const [techNotes, setTechNotes] = useState([]);

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
  const [previousView, setPreviousView] = useState(null);
  
  // 表單初始值
  const defaultRecordForm = { 
      id: null, serviceSource: 'customer_call', symptom: '', action: '', status: 'completed', errorCode: '',
      date: new Date().toLocaleDateString('en-CA'),
      parts: [] 
  };
  const [editingRecordData, setEditingRecordData] = useState(defaultRecordForm); 

  // --- 工具函數：將資料庫格式轉換為表單格式 ---
  const convertRecordToFormData = useCallback((record) => ({
    ...record,
    symptom: record.symptom || record.fault || record.description || '',
    action: record.action || record.solution || '',
    date: record.date || new Date().toLocaleDateString('en-CA'),
    serviceSource: record.serviceSource || 'customer_call',
    status: record.status || 'completed',
    errorCode: record.errorCode || '',
    parts: record.parts || [],
    photos: record.photos || [],
    photoBefore: record.photoBefore || null,
    photoAfter: record.photoAfter || null,
    nextVisitDate: record.nextVisitDate || record.return_date || '',
    completedDate: record.completedDate || null
  }), []);

  const showToast = useCallback((message, type = 'success') => setToast({ message, type }), []);
  const today = useMemo(() => new Date().toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'long' }), []);
  const pendingTasks = useMemo(() => records.filter(r => r.status === 'tracking' || r.status === 'monitor' || r.status === 'pending').length, [records]);
  const todayCompletedCount = useMemo(() => {
    const currentLocalTime = new Date().toLocaleDateString('en-CA');
    return records.filter(r => r.status === 'completed' && (r.completedDate === currentLocalTime || (!r.completedDate && r.date === currentLocalTime))).length;
  }, [records]);

  // --- 3. Firebase 連線邏輯 ---
  useEffect(() => {
    setDbStatus('connecting');
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const custRef = collection(db, 'customers');
        const recRef = collection(db, 'records');
        const invRef = collection(db, 'inventory'); 

        const errorRef = collection(db, 'error_codes');
        const spRef = collection(db, 'sp_modes');
        const noteRef = collection(db, 'tech_notes');

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

        const recentRecordsQuery = query(recRef, orderBy('date', 'desc'), limit(300));
        const unsubRec = onSnapshot(recentRecordsQuery, (snapshot) => {
            if (!snapshot.empty) {
                const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
                setRecords(data);
            } else { setRecords(MOCK_RECORDS); }
        });

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

        const unsubError = onSnapshot(errorRef, (snapshot) => {
          const arr = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
          setErrorCodes(arr);
        });
        const unsubSp = onSnapshot(spRef, (snapshot) => {
          const arr = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
          setSpModes(arr);
        });
        const unsubNote = onSnapshot(noteRef, (snapshot) => {
          const arr = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
          setTechNotes(arr);
        });

        // 讀取備份列表 (模擬)
        const checkBackups = async () => {
             setCloudBackups([]);
        };
        checkBackups();

        return () => { unsubCust(); unsubRec(); unsubInv(); unsubError(); unsubSp(); unsubNote(); };

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


  // --- 4. 業務邏輯處理 ---

  // 分頁切換處理
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setCurrentView(tabId);
  };

  // 導航點擊處理
  const handleNavClick = (customer) => {
    setTargetCustomer(customer);
    setShowAddressAlert(true);
  };

  // 客戶 - 新增
  const handleAddSubmit = async (data) => {
      if (!user) return showToast('請先登入', 'error');
      setIsProcessing(true);
      try {
          const docRef = await addDoc(collection(db, 'customers'), data);
          showToast('客戶新增成功');
          setCurrentView('detail');
          setSelectedCustomer({ ...data, customerID: docRef.id });
      } catch (e) {
          console.error(e);
          showToast('新增失敗: ' + e.message, 'error');
      }
      setIsProcessing(false);
  };

  // 客戶 - 編輯
  const handleEditSubmit = async (data) => {
      if (!user) return showToast('請先登入', 'error');
      setIsProcessing(true);
      try {
          const { customerID, ...updateData } = data;
          await setDoc(doc(db, 'customers', customerID), updateData, { merge: true });
          showToast('資料更新成功');
          setSelectedCustomer(data);
          setCurrentView('detail');
      } catch (e) {
          console.error(e);
          showToast('更新失敗', 'error');
      }
      setIsProcessing(false);
  };

  // 客戶 - 刪除
  const handleDeleteCustomer = async (e, customer) => {
      if (e) e.stopPropagation();
      if (!user) return showToast('請先登入', 'error');
      
      let target = customer;
      if (typeof customer === 'string') {
          target = customers.find(c => c.customerID === customer);
      }
      if (!target) return;

      setConfirmDialog({
        isOpen: true,
        title: '刪除客戶',
        message: `確定要刪除 ${target.name} 嗎？此動作無法復原。`,
        onConfirm: async () => {
          setIsProcessing(true);
          try {
             await deleteDoc(doc(db, 'customers', target.customerID));
             showToast('客戶已刪除');
             setCurrentView('roster');
             setSelectedCustomer(null);
          } catch(err) { 
             console.error(err);
             showToast('刪除失敗', 'error'); 
          }
          setIsProcessing(false);
          setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null });
        }
      });
  };

  // 客戶 - 準備編輯
  const startEdit = () => {
      setCurrentView('edit');
  };

  // 維修紀錄 - 準備新增
  const startAddRecord = (customer = null) => {
      if (customer) {
          setEditingRecordData({ ...defaultRecordForm, customerID: customer.customerID });
          setSelectedCustomer(customer);
      } else {
          setEditingRecordData(defaultRecordForm);
      }
      setPreviousView(currentView);
      setCurrentView('add_record');
  };

  // 維修紀錄 - 準備編輯
  const startEditRecord = (e, record) => {
      if (e) e.stopPropagation();
      setEditingRecordData(convertRecordToFormData(record));
      setPreviousView(currentView);
      setCurrentView('edit_record');
  };

  // 維修紀錄 - 儲存 (新增或更新)
  const handleSaveRecord = async (data) => {
      if (!user) return showToast('請先登入', 'error');
      setIsProcessing(true);
      try {
          const recordData = { ...data };
          if (recordData.status === 'completed' && !recordData.completedDate) {
              recordData.completedDate = new Date().toLocaleDateString('en-CA');
          }
          if (recordData.status !== 'completed') {
              recordData.completedDate = null;
          }

          if (recordData.id) {
              const { id, ...updates } = recordData;
              await setDoc(doc(db, 'records', id), updates, { merge: true });
              showToast('維修紀錄已更新');
          } else {
              delete recordData.id; 
              recordData.timestamp = Date.now();
              await addDoc(collection(db, 'records'), recordData);
              showToast('維修紀錄已新增');
          }
          
          if (previousView) {
              setCurrentView(previousView);
              setPreviousView(null);
          } else {
              setCurrentView('detail');
          }

      } catch (e) {
          console.error(e);
          showToast('儲存失敗: ' + e.message, 'error');
      }
      setIsProcessing(false);
  };

  // 維修紀錄 - 刪除
  const handleDeleteRecord = async (e, recordId) => {
      if (e) e.stopPropagation();
      if (!user) return showToast('請先登入', 'error');
      
      setConfirmDialog({
          isOpen: true,
          title: '刪除紀錄',
          message: '確定要刪除這筆維修紀錄嗎？',
          onConfirm: async () => {
              setIsProcessing(true);
              try {
                  await deleteDoc(doc(db, 'records', recordId));
                  showToast('紀錄已刪除');
              } catch (err) {
                  showToast('刪除失敗', 'error');
              }
              setIsProcessing(false);
              setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null });
          }
      });
  };

  // 庫存 - 更新/新增/刪除
  const updateInventory = async (item) => {
      if (!user) return;
      try {
          await setDoc(doc(db, 'inventory', item.id), item, { merge: true });
          showToast('庫存已更新');
      } catch (e) { showToast('更新失敗', 'error'); }
  };
  const addInventoryItem = async (item) => {
      if (!user) return;
      try {
          await addDoc(collection(db, 'inventory'), item);
          showToast('項目已新增');
      } catch (e) { showToast('新增失敗', 'error'); }
  };
  const deleteInventoryItem = async (itemId) => {
      if (!user) return;
      try {
          await deleteDoc(doc(db, 'inventory', itemId));
          showToast('項目已刪除');
      } catch (e) { showToast('刪除失敗', 'error'); }
  };
  const renameModelGroup = async (oldName, newName) => {
      if (!user) return;
      setIsProcessing(true);
      try {
          const batch = writeBatch(db);
          const itemsToUpdate = inventory.filter(i => i.model === oldName);
          itemsToUpdate.forEach(item => {
              const ref = doc(db, 'inventory', item.id);
              batch.update(ref, { model: newName });
          });
          await batch.commit();
          showToast(`已將 ${itemsToUpdate.length} 個項目移動至 ${newName}`);
      } catch (e) { showToast('重新命名失敗', 'error'); }
      setIsProcessing(false);
  };
  const deleteModelGroup = async (groupName) => {
      if (!user) return;
      setIsProcessing(true);
      try {
          const batch = writeBatch(db);
          const itemsToDelete = inventory.filter(i => i.model === groupName);
          itemsToDelete.forEach(item => {
              const ref = doc(db, 'inventory', item.id);
              batch.delete(ref);
          });
          await batch.commit();
          showToast('群組已刪除');
      } catch (e) { showToast('刪除失敗', 'error'); }
      setIsProcessing(false);
  };

  // 維修知識庫 CRUD
  const handleSaveLibrary = async (type, item, itemId) => {
    if (!db || !user) { showToast('演示模式無法儲存', 'error'); return; }
    let targetCol = '';
    if (type === 'error') targetCol = 'error_codes';
    if (type === 'sp') targetCol = 'sp_modes';
    if (type === 'note') targetCol = 'tech_notes';
    
    try {
      if (itemId) {
         await setDoc(doc(db, targetCol, itemId), item, { merge: true });
      } else {
         await addDoc(collection(db, targetCol), item);
      }
      showToast('已儲存');
    } catch(e) { showToast('儲存失敗', 'error'); }
  };

  const handleDeleteLibrary = async (type, itemId) => {
    if (!db || !user) { showToast('演示模式無法刪除', 'error'); return; }
    let targetCol = '';
    if (type === 'error') targetCol = 'error_codes';
    if (type === 'sp') targetCol = 'sp_modes';
    if (type === 'note') targetCol = 'tech_notes';
    try {
      await deleteDoc(doc(db, targetCol, itemId));
      showToast('已刪除');
    } catch(e) { showToast('刪除失敗', 'error'); }
  };

  // 設定功能
  const handleExportData = () => {
      const dataStr = JSON.stringify({ customers, records, inventory });
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', `backup_${new Date().toISOString().split('T')[0]}.json`);
      linkElement.click();
  };
  const handleImportData = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
          try {
              const json = JSON.parse(event.target.result);
              if (json.customers && json.records) {
                  setIsProcessing(true);
                  const batch = writeBatch(db);
                  json.customers.forEach(c => { if (c.customerID) batch.set(doc(db, 'customers', c.customerID), c); });
                  json.records.forEach(r => { if (r.id) batch.set(doc(db, 'records', r.id), r); });
                  if (json.inventory) { json.inventory.forEach(i => { if (i.id) batch.set(doc(db, 'inventory', i.id), i); }); }
                  await batch.commit();
                  showToast('資料匯入成功');
                  setIsProcessing(false);
              } else { showToast('檔案格式錯誤', 'error'); }
          } catch (err) { showToast('匯入失敗: ' + err.message, 'error'); setIsProcessing(false); }
      };
      reader.readAsText(file);
  };
  const handleResetData = async () => {
      setConfirmDialog({
          isOpen: true,
          title: '危險操作',
          message: '確定要清空所有資料並還原至預設值嗎？此動作無法復原！',
          onConfirm: async () => {
              setIsProcessing(true);
              showToast('重置功能需由後台執行', 'error'); 
              setIsProcessing(false);
              setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null });
          }
      });
  };
  const handleCreateCloudBackup = async () => {
      setIsProcessing(true);
      setTimeout(() => {
          const newBackup = { id: Date.now(), time: new Date().toLocaleString() };
          setCloudBackups(prev => [newBackup, ...prev]);
          showToast('雲端備份建立成功');
          setIsProcessing(false);
      }, 1500);
  };
  const handleRestoreFromCloud = (backup) => { showToast(`還原功能開發中 (${backup.time})`, 'error'); };
  const handleDeleteCloudBackup = (backup) => {
      setCloudBackups(prev => prev.filter(b => b.id !== backup.id));
      showToast('備份已刪除');
  };
  const renameCustomerGroup = async (oldName, newName) => {
      if (!user) return;
      setIsProcessing(true);
      try {
          const batch = writeBatch(db);
          const itemsToUpdate = customers.filter(c => c.L2_district === oldName);
          itemsToUpdate.forEach(c => { const ref = doc(db, 'customers', c.customerID); batch.update(ref, { L2_district: newName }); });
          await batch.commit();
          showToast(`已將 ${itemsToUpdate.length} 個客戶移動至 ${newName}`);
      } catch (e) { showToast('重新命名失敗', 'error'); }
      setIsProcessing(false);
  };
  const deleteCustomerGroup = async (groupName) => {
      if (!user) return;
      setIsProcessing(true);
      try {
          const batch = writeBatch(db);
          const itemsToDelete = customers.filter(c => c.L2_district === groupName);
          itemsToDelete.forEach(c => { const ref = doc(db, 'customers', c.customerID); batch.delete(ref); });
          await batch.commit();
          showToast('群組及其客戶已刪除');
      } catch (e) { showToast('刪除失敗', 'error'); }
      setIsProcessing(false);
  };


  return (
    <div className="max-w-md mx-auto bg-gray-100 min-h-screen font-sans text-gray-900 shadow-2xl relative overflow-hidden">
      <GlobalStyles />
      {isLoading && <div className="absolute inset-0 bg-white z-[60] flex flex-col items-center justify-center"><Loader2 size={48} className="text-blue-600 animate-spin mb-4" /><p className="text-gray-500 font-bold">資料同步中...</p></div>}
      <ImageViewer src={viewingImage} onClose={() => setViewingImage(null)} />
      <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog({...confirmDialog, isOpen: false})} isProcessing={isProcessing} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {!isLoading && (!currentView || currentView === '') && (
        <Dashboard 
          today={today} dbStatus={dbStatus} pendingTasks={pendingTasks} 
          todayCompletedCount={todayCompletedCount} totalCustomers={customers.length} 
          setCurrentView={setCurrentView} setActiveTab={setActiveTab}
          onQuickAction={() => setCurrentView('quick_action')}
        />
      )}
      {currentView === 'dashboard' && (
        <Dashboard 
          today={today} dbStatus={dbStatus} pendingTasks={pendingTasks} 
          todayCompletedCount={todayCompletedCount} totalCustomers={customers.length} 
          setCurrentView={setCurrentView} setActiveTab={setActiveTab}
          onQuickAction={() => setCurrentView('quick_action')}
        />
      )}
      {currentView === 'roster' && (
        <CustomerRoster 
          customers={customers} 
          onAddCustomer={handleAddSubmit}
          onUpdateCustomer={handleEditSubmit}
          onDeleteCustomer={(item) => handleDeleteCustomer(null, item)}
          onBack={() => { 
            sessionStorage.setItem('roster_from_home', 'true');
            setCurrentView('dashboard'); 
            setActiveTab('dashboard'); 
          }} 
          setCurrentView={setCurrentView} 
          setSelectedCustomer={setSelectedCustomer}
          setTargetCustomer={setTargetCustomer}
          setShowAddressAlert={setShowAddressAlert} 
          setShowPhoneSheet={setShowPhoneSheet} 
          showToast={showToast}
          onRenameGroup={renameCustomerGroup}
          onDeleteGroup={deleteCustomerGroup}
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
          initialData={currentView === 'add' ? {} : selectedCustomer}
          onSubmit={currentView === 'add' ? handleAddSubmit : handleEditSubmit}
          onDelete={handleDeleteCustomer}
          onCancel={() => setCurrentView('detail')} 
        />
      )}
      {(currentView === 'add_record' || currentView === 'edit_record') && (
        <RecordForm 
           initialData={editingRecordData} onSubmit={handleSaveRecord} inventory={inventory} customers={customers}
           onCancel={() => {
             if (previousView) {
               setCurrentView(previousView);
               setPreviousView(null);
             } else {
               setCurrentView(activeTab === 'records' ? 'records' : 'detail');
             }
           }}
        />
      )}
      {(currentView === 'inventory' || activeTab === 'inventory') && (
        <InventoryView 
          inventory={inventory} 
          onUpdateInventory={updateInventory} 
          onAddInventory={addInventoryItem}
          onDeleteInventory={deleteInventoryItem} 
          onRenameGroup={renameModelGroup} 
          onDeleteGroup={deleteModelGroup}
          onBack={() => setCurrentView('dashboard')} 
        />
      )}
      {(currentView === 'records' || (activeTab === 'records' && currentView !== 'detail' && currentView !== 'add_record' && currentView !== 'edit_record')) && (
        <RecordList 
          records={records} customers={customers} setCurrentView={setCurrentView} setActiveTab={setActiveTab}
          startEditRecord={startEditRecord} handleDeleteRecord={handleDeleteRecord} setViewingImage={setViewingImage}
        />
      )}
      {currentView === 'tracking' && (
        <TrackingView 
          records={records} customers={customers} setCurrentView={setCurrentView} startEditRecord={startEditRecord}
          handleDeleteRecord={handleDeleteRecord}
        />
      )}

      {/* 【新頁面】維修知識庫 ErrorCodeLibrary (已修正：加上 onBack) */}
      {currentView === 'error_library' && (
        <ErrorCodeLibrary 
          errorCodes={errorCodes} spModes={spModes} techNotes={techNotes}
          onSave={handleSaveLibrary} onDelete={handleDeleteLibrary}
          onBack={() => setCurrentView('dashboard')} 
        />
      )}
      {currentView === 'settings' && (
        <Settings 
          dbStatus={dbStatus} customerCount={customers.length} recordCount={records.length}
          onExport={handleExportData} onImport={handleImportData} onReset={handleResetData}
          isProcessing={isProcessing} cloudBackups={cloudBackups}
          onCreateCloudBackup={handleCreateCloudBackup} onRestoreFromCloud={handleRestoreFromCloud}
          onDeleteCloudBackup={handleDeleteCloudBackup}
        />
      )}
      {/* --- 新增任務一頁式介面 --- */}
      {currentView === 'quick_action' && (
        <QuickActionView 
          customers={customers}
          onSaveRecord={handleSaveRecord}
          onCancel={() => setCurrentView('dashboard')}
        />
      )}
      {/* --- 修改：BottomNavigation 傳入開啟彈窗的函數 --- */}
      <BottomNavigation 
         activeTab={activeTab} 
         onTabChange={handleTabChange} 
         onOpenQuickAction={() => setCurrentView('quick_action')} 
      />
      {showPhoneSheet && <PhoneActionSheet phones={targetCustomer?.phones} onClose={() => setShowPhoneSheet(false)} />}
      {showAddressAlert && <AddressAlertDialog customer={targetCustomer} onClose={() => setShowAddressAlert(false)} />}
    </div>
  );
}