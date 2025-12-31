import React, { useState, useEffect } from 'react';
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
import WorkLog from './components/WorkLog';
import RecordList from './components/RecordList';

// [新增] 引入快速操作視窗
import QuickActionModal from './components/QuickActionModal';
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

  // UI 狀態
  const [viewingImage, setViewingImage] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPhoneSheet, setShowPhoneSheet] = useState(false);
  const [showAddressAlert, setShowAddressAlert] = useState(false);
  
  // [新增] 快速操作選單狀態 - 改為一頁式介面
  const [showQuickAction, setShowQuickAction] = useState(false);
  
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

  // --- 2. 輔助函數 ---
  const showToast = (message, type = 'success') => setToast({ message, type });
  const today = new Date().toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'long' });
  const pendingTasks = records.filter(r => r.status === 'tracking' || r.status === 'monitor' || r.status === 'pending').length;
  const currentLocalTime = new Date().toLocaleDateString('en-CA'); 
  // 修復：今日完成統計應檢查完成日期，而非創建日期
  const todayCompletedCount = records.filter(r => 
    r.status === 'completed' && 
    (r.completedDate === currentLocalTime || (!r.completedDate && r.date === currentLocalTime))
  ).length;
  
  // --- 3. Firebase 連線邏輯 ---
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

  // --- 3.5. 页面可见性监听（从外部应用返回时恢复视图）---
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isLoading) {
        // 检查是否是从 Google Maps 返回
        const navigatingToMaps = sessionStorage.getItem('navigatingToMaps');
        
        if (navigatingToMaps === 'true') {
          // 清除标记
          sessionStorage.removeItem('navigatingToMaps');
          
          // 强制设置为 dashboard
          setTimeout(() => {
            setCurrentView('dashboard');
            setActiveTab('dashboard');
            setSelectedCustomer(null);
            setPreviousView(null);
          }, 100);
          return;
        }
        
        // 延迟执行，确保状态已更新
        setTimeout(() => {
          // 检查当前状态是否正确
          // 如果 currentView 是 detail 但没有 selectedCustomer，返回 dashboard
          if (currentView === 'detail' && !selectedCustomer) {
            setCurrentView('dashboard');
            setActiveTab('dashboard');
            return;
          }
          
          // 如果 currentView 不在有效范围内，重置为 dashboard
          const validViews = ['dashboard', 'roster', 'inventory', 'records', 'settings', 'detail', 'search', 'add', 'edit', 'add_record', 'edit_record', 'tracking', 'worklog', 'quick_action'];
          if (currentView && !validViews.includes(currentView)) {
            setCurrentView('dashboard');
            setActiveTab('dashboard');
            return;
          }
          
          // 如果 currentView 为空或未定义，设置为 dashboard
          if (!currentView) {
            setCurrentView('dashboard');
            setActiveTab('dashboard');
          }
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    window.addEventListener('pageshow', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      window.removeEventListener('pageshow', handleVisibilityChange);
    };
  }, [currentView, selectedCustomer, isLoading]);

  // --- 3.6. 确保视图状态一致性 ---
  useEffect(() => {
    // 如果 currentView 是 detail 但没有 selectedCustomer，且不是正在加载，则返回 dashboard
    if (currentView === 'detail' && !selectedCustomer && !isLoading) {
      setCurrentView('dashboard');
      setActiveTab('dashboard');
    }
  }, [currentView, selectedCustomer, isLoading]);

  // --- 4. 導覽切換 ---
  const handleTabChange = (tab) => {
    // 清除可能影响视图的状态
    setSelectedCustomer(null);
    setPreviousView(null);
    
    setActiveTab(tab);
    
    // 根据 tab 设置对应的视图
    const viewMap = {
      'dashboard': 'dashboard',
      'roster': 'roster',
      'inventory': 'inventory',
      'records': 'records',
      'settings': 'settings'
    };
    
    if (viewMap[tab]) {
      setCurrentView(viewMap[tab]);
      if (tab === 'settings') {
        fetchCloudBackups();
      }
    }
  };

  const handleNavClick = (customer) => {
    if (!customer.address) return showToast("無地址資料", 'error');
    if (customer.addressNote) { 
      setTargetCustomer(customer); 
      setShowAddressAlert(true);
    } else {
      // 设置标记，表示即将跳转到外部应用
      sessionStorage.setItem('navigatingToMaps', 'true');
      
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customer.address)}`;
      
      // 检测是否是移动设备
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // 移动设备：直接在当前窗口打开，避免打开多个标签页
        window.location.href = url;
      } else {
        // 桌面设备：尝试在新标签页打开
        try {
          const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
          // 如果 newWindow 为 null，说明被阻止了，使用当前窗口
          if (!newWindow) {
            window.location.href = url;
          }
        } catch (e) {
          // 如果出错，使用当前窗口
          window.location.href = url;
        }
      }
    }
  };

  const startEdit = () => { setCurrentView('edit'); };
  const startAddRecord = (customer) => {
    if (!customer) return;
    setEditingRecordData({ ...defaultRecordForm, customerID: customer.customerID });
    // 記錄當前視圖作為前一個視圖，以便取消時能正確返回
    setPreviousView(currentView);
    setCurrentView('add_record');
  };
  const startEditRecord = (e, record) => {
    if (e) e.stopPropagation();
    // 修復：將資料庫格式轉換為表單格式
    const formData = {
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
      // 保留 nextVisitDate 和 return_date（RecordForm 會處理）
      nextVisitDate: record.nextVisitDate || record.return_date || '',
      // 保留完成日期
      completedDate: record.completedDate || null
    };
    setEditingRecordData(formData);
    // 記錄當前視圖作為前一個視圖，以便取消時能正確返回
    setPreviousView(currentView);
    setCurrentView('edit_record');
  };

  // --- [新增] 處理快速新增任務 (從 + 號彈窗來的) ---
  const handleQuickAddRecord = (customer, symptom) => {
    if (!customer) return;
    
    // 設定表單預設值，並帶入彈窗輸入的故障描述
    setEditingRecordData({ 
        ...defaultRecordForm, 
        customerID: customer.customerID,
        symptom: symptom || '',
        serviceSource: 'customer_call' // 預設為客戶來電
    });

    // 關鍵：設定當前選中客戶，確保 RecordForm 取消時能回到正確的 Detail
    setSelectedCustomer(customer); 

    // 記錄當前視圖作為前一個視圖，以便取消時能正確返回
    setPreviousView(currentView);

    // 切換視窗
    setCurrentView('add_record');
    setShowQuickAction(false);
  };

  // --- [新增] 處理快速編輯紀錄 (從 + 號彈窗來的) ---
  const handleQuickEditRecord = (record) => {
    // 修復：將資料庫格式轉換為表單格式（與 startEditRecord 相同的轉換邏輯）
    const formData = {
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
      // 保留 nextVisitDate 和 return_date（RecordForm 會處理）
      nextVisitDate: record.nextVisitDate || record.return_date || '',
      // 保留完成日期
      completedDate: record.completedDate || null
    };
    setEditingRecordData(formData);
    
    // 關鍵：找出這筆紀錄的客戶並設定為 selectedCustomer
    const parentCustomer = customers.find(c => c.customerID === record.customerID);
    if (parentCustomer) {
        setSelectedCustomer(parentCustomer);
    } else {
        // 如果找不到客戶 (極端情況)，至少不讓程式掛掉
        console.warn('找不到該紀錄對應的客戶資料');
    }

    // 切換視窗
    setCurrentView('edit_record');
    setShowQuickAction(false);
  };

  // --- 5. 資料庫操作 (CRUD) ---
  
  // 更新庫存
  const updateInventory = async (item) => {
    setInventory(prev => prev.map(i => i.id === item.id ? item : i));
    if (dbStatus === 'demo' || !user) { showToast('庫存已更新 (離線)'); return; }
    try { await setDoc(doc(db, 'inventory', item.id), item); showToast('庫存資料已更新'); } 
    catch (e) { console.error(e); showToast('更新失敗', 'error'); }
  };

  // 新增庫存
  const addInventoryItem = async (newItem) => {
    const newId = `p-${Date.now()}`;
    const itemWithId = { ...newItem, id: newId };
    setInventory(prev => [...prev, itemWithId]);
    if (dbStatus === 'demo' || !user) { showToast('新零件已加入 (離線)'); return; }
    try { await setDoc(doc(db, 'inventory', newId), itemWithId); showToast('新零件已加入'); } 
    catch (e) { console.error(e); showToast('新增失敗', 'error'); }
  };

  // 刪除庫存 (單筆)
  const deleteInventoryItem = async (id) => {
    setInventory(prev => prev.filter(i => i.id !== id));
    if (dbStatus === 'demo' || !user) { showToast('零件已刪除 (離線)'); return; }
    try { await deleteDoc(doc(db, 'inventory', id)); showToast('零件已刪除'); } 
    catch (e) { console.error(e); showToast('刪除失敗', 'error'); }
  };

  // 重新命名庫存群組 (Batch Update)
  const renameModelGroup = async (oldModel, newModel, categoryId) => {
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

  // 刪除整個庫存群組 (Batch Delete)
  const deleteModelGroup = async (modelName) => {
      const itemsToDelete = inventory.filter(i => i.model === modelName);
      if (itemsToDelete.length === 0) return;
      if(dbStatus === 'demo' || !user) {
          setInventory(prev => prev.filter(i => i.model !== modelName));
          showToast(`群組 ${modelName} 已刪除 (離線)`);
          return;
      }
      try {
          const batch = writeBatch(db);
          itemsToDelete.forEach(item => { const ref = doc(db, 'inventory', item.id); batch.delete(ref); });
          await batch.commit(); showToast(`群組 ${modelName} 已刪除`);
      } catch (e) { console.error(e); showToast('刪除失敗', 'error'); }
  };

  // 重新命名客戶群組 (Batch Update)
  const renameCustomerGroup = async (oldGroup, newGroup) => {
      setCustomers(prev => prev.map(c => c.L2_district === oldGroup ? { ...c, L2_district: newGroup } : c));
      if (dbStatus === 'demo' || !user) { showToast(`群組已更新 (離線)`); return; }
      try {
          const batch = writeBatch(db);
          const itemsToUpdate = customers.filter(c => c.L2_district === oldGroup);
          itemsToUpdate.forEach(item => { const ref = doc(db, 'customers', item.customerID); batch.update(ref, { L2_district: newGroup }); });
          await batch.commit(); showToast(`群組名稱已更新`);
      } catch (e) { console.error(e); showToast('更新失敗', 'error'); }
  };

  // 刪除整個客戶群組 (Batch Delete)
  const deleteCustomerGroup = async (groupName) => {
      const itemsToDelete = customers.filter(c => c.L2_district === groupName);
      if (itemsToDelete.length === 0) return;
      if (dbStatus === 'demo' || !user) {
          setCustomers(prev => prev.filter(c => c.L2_district !== groupName));
          showToast(`群組已刪除 (離線)`);
          return;
      }
      try {
          const batch = writeBatch(db);
          itemsToDelete.forEach(item => { const ref = doc(db, 'customers', item.customerID); batch.delete(ref); });
          await batch.commit(); showToast(`群組 ${groupName} 已刪除`);
      } catch (e) { console.error(e); showToast('刪除失敗', 'error'); }
  };

  // 重置資料
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

  // 儲存維修紀錄
  const handleSaveRecord = async (formData) => {
    if (isProcessing) return;
    setIsProcessing(true);
    const recId = formData.id || `rec-${Date.now()}`;
    const finalCustomerID = selectedCustomer?.customerID || formData.customerID || 'unknown';
    const newRecord = {
        ...formData, id: recId, customerID: finalCustomerID,
        fault: formData.symptom || formData.description || '', 
        solution: formData.action || '',
        type: formData.type || 'repair', 
        isTracking: formData.status === 'tracking' || formData.status === 'monitor',
        // 確保 tracking 和 monitor 狀態正確處理
        status: formData.status || 'completed',
        nextVisitDate: formData.nextVisitDate || formData.return_date || '',
        // 修復：如果狀態是 completed，記錄完成日期
        completedDate: formData.status === 'completed' 
            ? new Date().toLocaleDateString('en-CA') 
            : (formData.completedDate || null)
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
        // 修復：使用 previousView 來決定跳轉目標，如果沒有 previousView 則根據 activeTab 和 selectedCustomer 判斷
        if (previousView) {
            setCurrentView(previousView);
            setPreviousView(null);
        } else if (activeTab === 'records') {
            setCurrentView('records');
        } else if (selectedCustomer) {
            setCurrentView('detail');
        } else {
            setCurrentView('dashboard');
        }
    } catch (err) { console.error("儲存詳細錯誤:", err); showToast(`儲存失敗: ${err.message}`, 'error'); } 
    finally { setIsProcessing(false); }
  };

  // 刪除維修紀錄
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
                } else {
                    await deleteDoc(doc(db, 'records', recordId)); 
                }
                showToast('紀錄已刪除'); setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            } catch (err) { showToast('刪除失敗', 'error'); } finally { setIsProcessing(false); }
        }
    });
  };

  // 刪除客戶
  const handleDeleteCustomer = (e, customerToDelete = null) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const target = customerToDelete || selectedCustomer;
    if (!target) return;
    
    setConfirmDialog({
        isOpen: true, title: '刪除客戶資料', message: `確定要刪除客戶「${target.name}」嗎？`,
        onConfirm: async () => {
            if (isProcessing) return;
            setIsProcessing(true);
            const goBack = () => { setCurrentView('roster'); setSelectedCustomer(null); };
            try {
                if (dbStatus === 'demo' || !user) {
                    setCustomers(prev => prev.filter(c => String(c.customerID) !== String(target.customerID)));
                } else {
                    await deleteDoc(doc(db, 'customers', target.customerID)); 
                }
                showToast('客戶已刪除'); goBack(); 
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            } catch (err) { showToast('刪除失敗', 'error'); } finally { setIsProcessing(false); }
        }
    });
  };

  // 編輯客戶
  const handleEditSubmit = async (formData) => {
    if (isProcessing) return;
    setIsProcessing(true);
    const sourceCustomer = selectedCustomer || (formData.customerID ? customers.find(c => c.customerID === formData.customerID) : null);
    if (!sourceCustomer && !formData.customerID) { setIsProcessing(false); showToast('找不到客戶資料', 'error'); return; }

    const customerId = sourceCustomer?.customerID || formData.customerID;
    const baseCustomer = sourceCustomer || formData;

    let updatedPhones = formData.phones;
    if (!updatedPhones && (formData.phoneNumber || formData.phone)) { updatedPhones = [{ label: formData.phoneLabel || '公司', number: formData.phoneNumber || formData.phone }]; }
    // 修復：優先使用 assets 數組，如果沒有則嘗試使用 model（向後兼容）
    let updatedAssets = formData.assets;
    if (!updatedAssets || (Array.isArray(updatedAssets) && updatedAssets.length === 0)) {
      if (formData.model) { updatedAssets = [{ model: formData.model }]; }
    }

    const updatedEntry = {
      ...baseCustomer,
      customerID: customerId,
      name: formData.name !== undefined ? formData.name : baseCustomer.name,
      L1_group: formData.L1_group !== undefined ? formData.L1_group : baseCustomer.L1_group,
      L2_district: formData.L2_district !== undefined ? formData.L2_district : baseCustomer.L2_district,
      address: formData.address !== undefined ? formData.address : baseCustomer.address,
      addressNote: '',
      contactPerson: formData.contactPerson !== undefined ? formData.contactPerson : (baseCustomer.contactPerson || ''),
      phones: updatedPhones || baseCustomer.phones || [],
      assets: updatedAssets || baseCustomer.assets || [],
      notes: formData.notes !== undefined ? formData.notes : (baseCustomer.notes !== undefined ? baseCustomer.notes : '')
    };
    delete updatedEntry.note;

    try {
        if (dbStatus === 'demo' || !user) {
            setCustomers(prev => prev.map(c => c.customerID === customerId ? updatedEntry : c));
            if (selectedCustomer && selectedCustomer.customerID === customerId) setSelectedCustomer(updatedEntry);
        } else {
            const firestoreData = { ...updatedEntry };
            if (baseCustomer.note !== undefined) firestoreData.note = deleteField();
            await setDoc(doc(db, 'customers', customerId), firestoreData);
            if (selectedCustomer && selectedCustomer.customerID === customerId) setSelectedCustomer(updatedEntry);
            setCustomers(prev => prev.map(c => c.customerID === customerId ? updatedEntry : c));
        }
        if (selectedCustomer) setCurrentView('detail'); 
        showToast('資料已更新');
    } catch (err) { console.error('更新失敗:', err); showToast('更新失敗', 'error'); } finally { setIsProcessing(false); }
  };

  // 新增客戶
  const handleAddSubmit = async (formData) => {
    if (isProcessing) return;
    setIsProcessing(true);
    const newId = `cust-${Date.now()}`;
    let phones = formData.phones;
    if (!phones && (formData.phoneNumber || formData.phone)) { phones = [{ label: formData.phoneLabel || '公司', number: formData.phoneNumber || formData.phone }]; }
    // 修復：優先使用 assets 數組，如果沒有則嘗試使用 model（向後兼容）
    let assets = formData.assets;
    if (!assets || (Array.isArray(assets) && assets.length === 0)) {
      if (formData.model) { assets = [{ model: formData.model }]; }
    }

    const newEntry = {
      customerID: newId, name: formData.name, L1_group: formData.L1_group || '未分類', L2_district: formData.L2_district || '未分區',
      address: formData.address || '', addressNote: formData.addressNote || '', phones: phones || [],
      assets: assets || [], notes: formData.notes || '', categoryId: formData.categoryId || '', serviceCount: 0
    };

    try {
        if (dbStatus === 'demo' || !user) setCustomers(prev => [...prev, newEntry]);
        else await setDoc(doc(db, 'customers', newId), newEntry);
        showToast('新增成功');
        setSelectedCustomer(newEntry); setCurrentView('detail');
    } catch (err) { showToast('新增失敗', 'error'); } finally { setIsProcessing(false); }
  };

  // 雲端備份與還原功能...
  const restoreDataToFirestore = async (data) => {
    if (!data) throw new Error("無資料");
    setIsProcessing(true);
    if (data.customers) setCustomers(data.customers);
    if (data.inventory) setInventory(data.inventory);
    if (data.records) setRecords(data.records);
    if (dbStatus !== 'demo' && user) {
        try {
            const batch = writeBatch(db); 
            let count = 0; 
            const safeBatchSet = (ref, val) => { if (count < 480) { batch.set(ref, val); count++; } };
            if (data.customers) data.customers.forEach(c => safeBatchSet(doc(db, 'customers', c.customerID), c));
            if (data.inventory) data.inventory.forEach(i => safeBatchSet(doc(db, 'inventory', i.id), i));
            if (data.records) data.records.forEach(r => safeBatchSet(doc(db, 'records', r.id), r));
            await batch.commit(); 
            showToast('資料還原成功！');
        } catch (e) { console.error("還原失敗", e); showToast('還原部分失敗，請檢查 Log', 'error'); }
    } else { showToast('已匯入預覽 (離線模式)'); }
    setIsProcessing(false);
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify({ customers, records, inventory }, null, 2);
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

  const handleImportData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try { const data = JSON.parse(event.target.result); await restoreDataToFirestore(data); } 
      catch (err) { console.error(err); showToast('檔案格式錯誤', 'error'); }
    };
    reader.readAsText(file);
  };

  const fetchCloudBackups = async () => {
    if (dbStatus === 'demo') return;
    try {
      const listRef = ref(storage, 'backups/');
      const res = await listAll(listRef);
      const backups = await Promise.all(res.items.map(async (itemRef) => {
        try {
            const metadata = await getMetadata(itemRef);
            return { name: itemRef.name, time: new Date(metadata.timeCreated).toLocaleString(), fullPath: itemRef.fullPath, size: (metadata.size / 1024).toFixed(2) + ' KB' };
        } catch (e) { return null; }
      }));
      setCloudBackups(backups.filter(b => b).sort((a, b) => new Date(b.time) - new Date(a.time)));
    } catch (error) { console.error("List backups failed", error); }
  };

  const handleCreateCloudBackup = async () => {
    if (dbStatus === 'demo') return showToast('演示模式無法備份', 'error');
    setIsProcessing(true);
    try {
      const dataStr = JSON.stringify({ customers, records, inventory });
      const fileName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      const backupRef = ref(storage, `backups/${fileName}`);
      await uploadString(backupRef, dataStr);
      showToast('雲端備份建立成功');
      fetchCloudBackups();
    } catch (error) { console.error(error); showToast('備份失敗', 'error'); } finally { setIsProcessing(false); }
  };

  const handleRestoreFromCloud = async (backupItem) => {
      if (!window.confirm(`確定要從「${backupItem.time}」還原資料嗎？目前的資料將被覆蓋。`)) return;
      setIsProcessing(true);
      try {
          const backupRef = ref(storage, backupItem.fullPath);
          const url = await getDownloadURL(backupRef);
          const response = await fetch(url);
          const data = await response.json();
          await restoreDataToFirestore(data);
      } catch (error) { console.error("Restore failed", error); showToast('還原失敗', 'error'); setIsProcessing(false); }
  };

  const handleDeleteCloudBackup = async (backupItem) => {
      if (!window.confirm('確定要刪除此備份檔嗎？')) return;
      try {
          const backupRef = ref(storage, backupItem.fullPath);
          await deleteObject(backupRef);
          showToast('備份檔已刪除');
          setCloudBackups(prev => prev.filter(b => b.name !== backupItem.name));
      } catch (error) { showToast('刪除失敗', 'error'); }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-100 min-h-screen font-sans text-gray-900 shadow-2xl relative overflow-hidden">
      <GlobalStyles />
      {isLoading && <div className="absolute inset-0 bg-white z-[60] flex flex-col items-center justify-center"><Loader2 size={48} className="text-blue-600 animate-spin mb-4" /><p className="text-gray-500 font-bold">資料同步中...</p></div>}
      
      <ImageViewer src={viewingImage} onClose={() => setViewingImage(null)} />
      <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog({...confirmDialog, isOpen: false})} isProcessing={isProcessing} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Fallback: 如果 currentView 为空或无效，显示 dashboard */}
      {!isLoading && (!currentView || currentView === '') && (
        <Dashboard 
          today={today} dbStatus={dbStatus} pendingTasks={pendingTasks} 
          todayCompletedCount={todayCompletedCount} totalCustomers={customers.length} 
          setCurrentView={setCurrentView} setActiveTab={setActiveTab}
          onQuickAction={() => setShowQuickAction(true)}
        />
      )}
      
      {currentView === 'dashboard' && (
        <Dashboard 
          today={today} dbStatus={dbStatus} pendingTasks={pendingTasks} 
          todayCompletedCount={todayCompletedCount} totalCustomers={customers.length} 
          setCurrentView={setCurrentView} setActiveTab={setActiveTab}
          onQuickAction={() => setShowQuickAction(true)}
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
           initialData={editingRecordData} onSubmit={handleSaveRecord} inventory={inventory}
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
          // 傳入新功能
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

      {currentView === 'worklog' && (
        <WorkLog records={records} customers={customers} setCurrentView={setCurrentView} showToast={showToast} />
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