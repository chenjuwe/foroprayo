import React, { useState, useEffect } from 'react';
import { useFirebaseAvatar } from '@/hooks/useFirebaseAvatar';
import { storage } from '@/integrations/firebase/client';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { log } from '@/lib/logger';
import { toast } from 'sonner';

export default function TestFirebaseStorage() {
  const { user } = useFirebaseAvatar();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [firebaseStatus, setFirebaseStatus] = useState<string>('檢查中...');

  // 檢查 Firebase 連接狀態
  useEffect(() => {
    const checkFirebaseConnection = () => {
      try {
        const storageInstance = storage();
        const config = storageInstance.app.options;
        
        log.debug('Firebase 配置檢查', {
          projectId: config.projectId,
          storageBucket: config.storageBucket,
          appId: config.appId,
          authDomain: config.authDomain
        }, 'TestFirebaseStorage');

        setFirebaseStatus('✅ Firebase 配置正常');
      } catch (error) {
        log.error('Firebase 配置檢查失敗', error, 'TestFirebaseStorage');
        setFirebaseStatus('❌ Firebase 配置錯誤');
      }
    };

    checkFirebaseConnection();
  }, []);

  const handleTestUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!user?.uid) {
      toast.error('用戶未登入');
      return;
    }

    setIsUploading(true);
    
    try {
      console.log('=== 開始測試上傳 ===');
      console.log('文件信息:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      console.log('用戶ID:', user.uid);

      // 檢查 Firebase Storage 實例
      const storageInstance = storage();
      console.log('Firebase Storage 實例:', {
        bucket: storageInstance.app.options.storageBucket,
        projectId: storageInstance.app.options.projectId
      });

      // 創建存儲引用
      const fileName = `test_${Date.now()}_${file.name}`;
      const storageRef = ref(storageInstance, `test/${user.uid}/${fileName}`);
      
      console.log('存儲引用:', {
        fileName,
        path: storageRef.fullPath,
        bucket: storageRef.bucket
      });

      console.log('開始上傳...');
      
      // 簡單上傳，不使用超時
      const uploadResult = await uploadBytes(storageRef, file);
      
      console.log('上傳成功:', uploadResult);
      console.log('開始獲取下載 URL...');

      // 獲取下載 URL
      const downloadURL = await getDownloadURL(uploadResult.ref);
      
      console.log('下載 URL:', downloadURL);
      console.log('=== 測試完成 ===');
      
      setUploadedUrl(downloadURL);
      toast.success('測試上傳成功！');
      
    } catch (error) {
      console.error('上傳失敗:', error);
      log.error('測試上傳失敗', error, 'TestFirebaseStorage');
      
      toast.error('測試上傳失敗', { 
        description: error instanceof Error ? error.message : '未知錯誤' 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSimpleTextUpload = async () => {
    if (!user?.uid) {
      toast.error('用戶未登入');
      return;
    }

    setIsUploading(true);
    
    try {
      console.log('=== 開始簡單文本上傳測試 ===');
      
      // 創建一個簡單的文本文件
      const textContent = '這是一個測試文件，創建於 ' + new Date().toISOString();
      const textBlob = new Blob([textContent], { type: 'text/plain' });
      
      console.log('文本內容:', textContent);
      console.log('Blob 大小:', textBlob.size);

      const storageInstance = storage();
      const fileName = `simple_test_${Date.now()}.txt`;
      const storageRef = ref(storageInstance, `test/${user.uid}/${fileName}`);
      
      console.log('存儲引用:', storageRef.fullPath);
      console.log('開始上傳文本文件...');
      
      const uploadResult = await uploadBytes(storageRef, textBlob);
      console.log('文本文件上傳成功:', uploadResult);
      
      const downloadURL = await getDownloadURL(uploadResult.ref);
      console.log('文本文件下載 URL:', downloadURL);
      
      setUploadedUrl(downloadURL);
      toast.success('文本文件上傳成功！');
      
    } catch (error) {
      console.error('文本文件上傳失敗:', error);
      toast.error('文本文件上傳失敗', { 
        description: error instanceof Error ? error.message : '未知錯誤' 
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: '#FFE5D9' }}>
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Firebase Storage 測試</h1>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Firebase 狀態：</p>
          <p className="text-sm">{firebaseStatus}</p>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">用戶狀態：</p>
          <p className="text-sm">
            {user ? (
              <>
                ✅ 已登入<br/>
                ID: {user.uid}<br/>
                郵箱: {user.email}
              </>
            ) : (
              '❌ 未登入'
            )}
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            選擇測試文件（建議小於 1MB）：
          </label>
          <input
            type="file"
            onChange={handleTestUpload}
            disabled={!user || isUploading}
            accept="image/*,.pdf,.txt"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <div className="mb-4">
          <button
            onClick={handleSimpleTextUpload}
            disabled={!user || isUploading}
            className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上傳簡單文本文件測試
          </button>
        </div>

        {isUploading && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">正在上傳中...</p>
            <p className="text-xs text-blue-600 mt-1">請查看瀏覽器控制台獲取詳細信息</p>
          </div>
        )}

        {uploadedUrl && (
          <div className="mb-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700 mb-2">✅ 上傳成功！</p>
            <p className="text-xs text-gray-600 break-all">{uploadedUrl}</p>
            {uploadedUrl.includes('image') && (
              <img 
                src={uploadedUrl} 
                alt="上傳的圖片" 
                className="mt-2 max-w-full h-auto rounded"
                style={{ maxHeight: '200px' }}
              />
            )}
          </div>
        )}

        <div className="text-xs text-gray-500">
          <p>此測試將文件上傳到 Firebase Storage 的 test 目錄</p>
          <p>用於驗證 Firebase 配置是否正確</p>
          <p className="mt-2 text-red-500">請打開瀏覽器控制台查看詳細日誌</p>
        </div>
      </div>
    </div>
  );
} 