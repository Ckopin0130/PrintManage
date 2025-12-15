// 檔案位置: src/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// ⚠️ 重要：請去 Firebase 後台複製你的設定，換掉下方這個區塊
// 如果你找不到這段，請告訴我，我教你去哪裡複製
const firebaseConfig = {
  apiKey: "AIzaSyCdfZ7ClEtpxpazGd4naAPg9f_Sbqjp8co",
  authDomain: "printer-manager-553bc.firebaseapp.com",
  projectId: "printer-manager-553bc",
  storageBucket: "printer-manager-553bc.firebasestorage.app",
  messagingSenderId: "849259182320",
  appId: "1:849259182320:web:ab98eeed3261e448696a35",
  measurementId: "G-26MW6QK542"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// 把這些功能打包好，讓其他檔案可以用
export { auth, db, storage };