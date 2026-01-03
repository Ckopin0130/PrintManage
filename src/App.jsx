import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  collection, onSnapshot, deleteDoc, doc, setDoc, writeBatch, query, orderBy, limit, deleteField
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
    // 將 fault 轉換為 symptom（如果 symptom 不存在）
    symptom: record.symptom || record.fault || record.description || '',
    // 將 solution 轉換為 action（如果 action 不存在）
    action: record.action || record.solution || '',
    // 確保日期格式正確
    date: record.date || new Date().toLocaleDateString('en-CA'),
    // 確保其他必要欄位存在
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

        // [新增] error_codes, sp_modes, tech_notes
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

        // --- [新增] 維修知識庫監聽 ---
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

  // [原有內容不變...]

  // 新增維修知識庫 CRUD
  const handleSaveLibrary = async (type, item, itemId) => {
    if (!db || !user) { showToast('演示模式無法儲存', 'error'); return; }
    let targetCol = '';
    if (type === 'error') targetCol = 'error_codes';
    if (type === 'sp') targetCol = 'sp_modes';
    if (type === 'note') targetCol = 'tech_notes';
    const thisId = itemId || `ec-${Date.now()}`;
    try {
      await setDoc(doc(db, targetCol, thisId), { ...item });
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

  // [其餘 UI 狀態與功能略...]

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
      {/* ---  [已廢棄] worklog --- */}

      {/* 【新頁面】維修知識庫 ErrorCodeLibrary */}
      {currentView === 'error_library' && (
        <ErrorCodeLibrary 
          errorCodes={errorCodes} spModes={spModes} techNotes={techNotes}
          onSave={handleSaveLibrary} onDelete={handleDeleteLibrary} 
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
