import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useFirebaseAvatar } from '@/hooks/useFirebaseAvatar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CameraIcon } from 'lucide-react';
import LoadingIcon from '@/assets/icons/LoadingIcon.svg?react';
import { Skeleton } from '@/components/ui/skeleton';
import { log } from '@/lib/logger';
import { getStorage, ref, uploadBytes, getDownloadURL, uploadString } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { auth, storage } from '@/integrations/firebase/client';
import { toast } from 'sonner';
import heic2any from 'heic2any';
import { useFirebaseAuthStore } from '@/stores/firebaseAuthStore';
import { FirebaseUserService } from '@/services/auth/FirebaseUserService';

interface FirebaseProfileAvatarProps {
  userId: string;
}

// 定義不同尺寸和用途
const AVATAR_SIZES = [
  { size: 96, suffix: 'large', description: '/profile 頁面的頭像' }, 
  { size: 48, suffix: 'medium', description: '/prayers 頁面，代禱卡片和回應卡片的頭像' },
  { size: 30, suffix: 'small', description: 'Header 上的登入後小頭像，好友訊息卡片的頭像' }
];

export function FirebaseProfileAvatar({ userId }: FirebaseProfileAvatarProps) {
  const queryClient = useQueryClient();
  const { avatarUrl, refreshAvatar } = useFirebaseAvatar(userId);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 取得目前登入者（僅用於判斷是否本人）
  const currentUser = useFirebaseAuthStore(state => state.user);

  const handleAvatarClick = () => {
    log.debug('頭像點擊事件觸發', {
      userId,
      hasFileInput: !!fileInputRef.current,
      isUploading,
      fileInputValue: fileInputRef.current?.value
    }, 'FirebaseProfileAvatar');
    if (isUploading) return;
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    log.debug('文件選擇事件觸發', { 
      hasFiles: !!event.target.files, 
      filesLength: event.target.files?.length,
      eventTarget: event.target,
      eventType: event.type
    }, 'FirebaseProfileAvatar');
    
    const file = event.target.files?.[0];
    if (!file) {
      log.warn('沒有選擇文件', { event: '文件選擇取消' }, 'FirebaseProfileAvatar');
      return;
    }
    
    // 僅允許本人更換自己的頭像
    if (!userId || !currentUser || userId !== currentUser.uid) {
      log.error('缺少用戶ID或用戶未登入', { 
        hasUserId: !!userId, 
        hasUser: !!currentUser, 
        userId, 
        userUid: currentUser?.uid,
        userEmail: currentUser?.email
      }, 'FirebaseProfileAvatar');
      toast.error('無法上傳頭像', { description: '未找到用戶或未登入' });
      return;
    }

    setIsUploading(true);
    log.debug('開始頭像更換流程', { 
      fileName: file.name, 
      fileType: file.type || '未知類型', 
      fileSize: `${(file.size / 1024).toFixed(2)}KB` 
    }, 'FirebaseProfileAvatar');

    // 立即創建本地預覽 URL，提供即時視覺反饋
    const localPreviewUrl = URL.createObjectURL(file);
    
    // 立即觸發預覽更新事件
    window.dispatchEvent(new CustomEvent('avatar-preview-updated', { 
      detail: { 
        userId,
        timestamp: Date.now(),
        previewURL: localPreviewUrl
      }
    }));

    try {
      log.debug('開始處理文件', { 
        fileName: file.name, 
        fileType: file.type, 
        fileSize: file.size 
      }, 'FirebaseProfileAvatar');
      
      // 檢查文件類型
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];
      
      const fileTypeOK = validTypes.some(type => file.type === type) || 
                         validExtensions.some(ext => fileExtension === ext);
      
      log.debug('文件類型檢查', { 
        fileType: file.type, 
        fileExtension, 
        fileTypeOK 
      }, 'FirebaseProfileAvatar');
      
      if (!fileTypeOK) {
        throw new Error(`不支持的文件類型: ${file.type || fileExtension || '未知類型'}`);
      }

      // 處理 HEIC 格式
      let processedFile = file;
      const isHeic = file.type === 'image/heic' || 
                    file.type === 'image/heif' || 
                    fileExtension === 'heic' || 
                    fileExtension === 'heif';
      
      if (isHeic) {
        try {
          log.debug('檢測到 HEIC/HEIF 格式，開始轉換', { fileName: file.name }, 'FirebaseProfileAvatar');
          const blob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.85
          }) as Blob;
          
          // 將 blob 轉換為 File 對象
          processedFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
            type: 'image/jpeg',
            lastModified: new Date().getTime()
          });
          
          log.debug('HEIC 轉換成功', { 
            originalSize: `${(file.size / 1024).toFixed(1)}KB`,
            convertedSize: `${(processedFile.size / 1024).toFixed(1)}KB`
          }, 'FirebaseProfileAvatar');
        } catch (heicError) {
          log.error('HEIC 轉換失敗', heicError, 'FirebaseProfileAvatar');
          // 繼續使用原始文件
        }
      }

      log.debug('開始載入圖片', { 
        processedFileName: processedFile.name, 
        processedFileType: processedFile.type, 
        processedFileSize: processedFile.size 
      }, 'FirebaseProfileAvatar');
      
      // 載入圖片以準備處理不同尺寸
      const img = document.createElement('img');
      
      // 轉換檔案為 URL
      const fileUrl = URL.createObjectURL(processedFile);
      
      log.debug('創建圖片 URL', { fileUrl }, 'FirebaseProfileAvatar');
      
      // 等待圖片載入
      await new Promise((resolve, reject) => {
        img.onload = () => {
          log.debug('圖片載入成功', { 
            width: img.width, 
            height: img.height 
          }, 'FirebaseProfileAvatar');
          resolve(null);
        };
        img.onerror = (error) => {
          log.error('圖片載入失敗', error, 'FirebaseProfileAvatar');
          reject(error);
        };
        img.src = fileUrl;
      });
      
      log.debug('開始計算裁切區域', { 
        imgWidth: img.width, 
        imgHeight: img.height 
      }, 'FirebaseProfileAvatar');
      
      // 計算保持縱橫比的裁切區域（正方形）
      const aspectRatio = img.width / img.height;
      let sourceWidth, sourceHeight, sourceX, sourceY;
      
      if (aspectRatio > 1) {
        // 圖片較寬
        sourceHeight = img.height;
        sourceWidth = sourceHeight;
        sourceX = (img.width - sourceWidth) / 2;
        sourceY = 0;
      } else {
        // 圖片較高
        sourceWidth = img.width;
        sourceHeight = sourceWidth;
        sourceX = 0;
        sourceY = (img.height - sourceHeight) / 2;
      }
      
      log.debug('裁切區域計算完成', { 
        aspectRatio, 
        sourceWidth, 
        sourceHeight, 
        sourceX, 
        sourceY 
      }, 'FirebaseProfileAvatar');
      
      // 建立時間戳記作為檔案名稱基礎
      const timestamp = Date.now();
      const fileBaseName = `avatar_${timestamp}`;
      
      // 優化：只先上傳大尺寸頭像，其他尺寸在背景處理
      const largeSize = AVATAR_SIZES.find(s => s.size === 96);
      if (!largeSize) {
        throw new Error('找不到大尺寸頭像配置');
      }
      
      // 只處理大尺寸頭像
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('無法創建 Canvas 上下文');
      }
      
      // 設定 canvas 尺寸
      canvas.width = largeSize.size;
      canvas.height = largeSize.size;
      
      // 繪製圖片到 canvas (裁剪為正方形)
      ctx.drawImage(
        img, 
        sourceX, sourceY, sourceWidth, sourceHeight, // 源圖片裁剪
        0, 0, largeSize.size, largeSize.size // 目標 canvas 尺寸
      );
      
      log.debug('開始轉換 Canvas 為 Blob', { 
        size: largeSize.size 
      }, 'FirebaseProfileAvatar');
      
      // 將 canvas 轉換為 WebP blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => {
            if (result) {
              log.debug('Canvas 轉換為 Blob 成功', { 
                blobSize: result.size,
                blobType: result.type
              }, 'FirebaseProfileAvatar');
              resolve(result);
            } else {
              log.error('Canvas 轉換為 Blob 失敗', null, 'FirebaseProfileAvatar');
              reject(new Error(`生成 ${largeSize.size}x${largeSize.size} 的 WebP 圖片失敗`));
            }
          }, 
          'image/webp', 
          0.85 // WebP 格式使用較高壓縮率也能保持良好質量
        );
      });
      
      // 創建存儲引用
      const fileName = `${fileBaseName}_${largeSize.suffix}.webp`;
      
      log.debug('開始創建存儲引用', { 
        fileName, 
        userId 
      }, 'FirebaseProfileAvatar');
      
      const avatarRef = ref(storage(), `avatars/${userId}/${fileName}`);
      
      log.debug('開始上傳文件到 Firebase Storage', { 
        fileName, 
        blobSize: blob.size,
        contentType: 'image/webp'
      }, 'FirebaseProfileAvatar');
      
      // 上傳文件
      const uploadResult = await uploadBytes(avatarRef, blob, {
        contentType: 'image/webp'
      });
      
      log.debug('文件上傳成功', { 
        uploadResult,
        ref: uploadResult.ref.fullPath
      }, 'FirebaseProfileAvatar');
      
      // 獲取下載 URL
      const downloadURL = await getDownloadURL(uploadResult.ref);
      
      log.debug('獲取下載 URL 成功', { 
        downloadURL 
      }, 'FirebaseProfileAvatar');
      
      log.debug(`${largeSize.size}x${largeSize.size} 頭像上傳成功`, { 
        size: `${largeSize.size}x${largeSize.size}`,
        url: downloadURL,
        blobSize: `${(blob.size / 1024).toFixed(2)}KB`
      }, 'FirebaseProfileAvatar');
      
      // 移除這行，避免預覽 URL 被過早清理導致的閃爍
      // URL.revokeObjectURL(fileUrl);
      
      const largeAvatarUrl = downloadURL;
      
      if (!largeAvatarUrl) {
        throw new Error('無法獲取大尺寸頭像 URL');
      }
      
      log.debug('大尺寸頭像上傳完成', { 
        size: largeSize.size,
        url: largeAvatarUrl
      }, 'FirebaseProfileAvatar');
      
      // 更新用戶資料
      if (currentUser) {
        try {
          // 優化：只更新必要的緩存和查詢
          await updateProfile(currentUser, {
            photoURL: largeAvatarUrl
          });
          
          // 同時更新 Firestore 中的 photoURL（確保跨瀏覽器同步）
          await FirebaseUserService.setUserData(currentUser.uid, {
            photoURL: largeAvatarUrl
          });
          
          log.debug('用戶資料更新成功', { userId, photoURL: largeAvatarUrl }, 'FirebaseProfileAvatar');
          
          toast.success('頭像上傳成功');
          
          // 立即使頭像相關查詢失效，但不等待完成，避免阻塞
          queryClient.invalidateQueries({ queryKey: ['avatar', currentUser.uid] }).catch(error => {
            log.warn('查詢失效失敗，但不影響主要功能', error, 'FirebaseProfileAvatar');
          });
          
          // 立即觸發全局事件，通知其他組件頭像已更新
          window.dispatchEvent(new CustomEvent('avatar-updated', { 
            detail: { 
              userId: currentUser.uid,
              timestamp: Date.now(),
              newPhotoURL: largeAvatarUrl, // 傳遞新的 photoURL 以實現即時更新
              source: 'FirebaseProfileAvatar'
            }
          }));
          
          // 觸發最終更新事件，確保平滑過渡
          window.dispatchEvent(new CustomEvent('avatar-final-updated', { 
            detail: { 
              userId: currentUser.uid,
              timestamp: Date.now(),
              newPhotoURL: largeAvatarUrl
            }
          }));
          
          // 在最終頭像更新完成後才清理預覽 URL，確保平滑過渡
          setTimeout(() => {
            URL.revokeObjectURL(fileUrl);
            log.debug('預覽 URL 已清理', { fileUrl }, 'FirebaseProfileAvatar');
          }, 1000); // 延遲 1 秒清理，確保新頭像已完全載入
        } catch (error) {
          log.error('更新用戶資料失敗', error, 'FirebaseProfileAvatar');
          throw error; // 重新拋出錯誤以便外層 catch 處理
        }
        
        // 在背景處理其他尺寸的頭像，不阻塞主流程
        setTimeout(async () => {
          try {
            // 處理其他尺寸的頭像（中尺寸和小尺寸）
            const otherSizes = AVATAR_SIZES.filter(s => s.size !== 96);
            
            for (const { size, suffix } of otherSizes) {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              
              if (!ctx) continue;
              
              canvas.width = size;
              canvas.height = size;
              
              ctx.drawImage(
                img, 
                sourceX, sourceY, sourceWidth, sourceHeight,
                0, 0, size, size
              );
              
              const blob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob(
                  (result) => result ? resolve(result) : reject(new Error(`生成 ${size}x${size} 圖片失敗`)),
                  'image/webp', 
                  0.85
                );
              });
              
              const fileName = `${fileBaseName}_${suffix}.webp`;
              const avatarRef = ref(storage(), `avatars/${userId}/${fileName}`);
              
              await uploadBytes(avatarRef, blob, { contentType: 'image/webp' });
              
              log.debug(`背景處理 ${size}x${size} 頭像完成`, { size }, 'FirebaseProfileAvatar');
            }
          } catch (error) {
            log.warn('背景處理其他尺寸頭像失敗', error, 'FirebaseProfileAvatar');
          }
        }, 50); // 減少背景處理延遲
      } else {
        throw new Error('用戶未登入或登入狀態已過期');
      }
    } catch (error) {
      log.error('頭像更換流程失敗', error, 'FirebaseProfileAvatar');
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      toast.error('頭像上傳失敗', { description: errorMessage });
    } finally {
      setIsUploading(false);
      // 重置 file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 取得顯示用的名稱（可由父層傳入，這裡簡化只用 userId）
  const getInitial = (): string => {
    return userId.charAt(0).toUpperCase();
  };

  if (!userId) {
    log.debug('缺少 userId', { userId }, 'FirebaseProfileAvatar');
    return <Skeleton className="h-24 w-24 rounded-full" />;
  }

  // 相機按鈕樣式
  const cameraButtonStyle = {
    position: 'absolute' as const,
    bottom: 0,
    right: 0,
    zIndex: 20,
    width: '32px',
    height: '32px',
    padding: 0,
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: isUploading ? 'not-allowed' : 'pointer',
    border: 'none',
    outline: 'none',
    opacity: isUploading ? 0.6 : 1,
    transition: 'opacity 0.2s ease-in-out',
    pointerEvents: isUploading ? 'none' as const : 'auto' as const
  };

  // 相機圖標樣式
  const cameraIconStyle = {
    width: '16px',
    height: '16px',
    color: '#333333',
    transition: 'color 0.2s ease-in-out'
  };

  // 載入圖標樣式
  const loadingIconStyle = {
    width: '16px',
    height: '16px',
    animation: 'spin 1s linear infinite',
    color: '#333333',
  };

  return (
    <div className="w-32 h-32 flex justify-center items-center mt-4">
      <div className="relative w-24 h-24">
        <Avatar 
          className="w-24 h-24 cursor-pointer transition-transform duration-300 ease-in-out hover:scale-105"
          onClick={handleAvatarClick}
          title={isUploading ? '正在上傳中...' : '點擊更換頭像'}
          onMouseEnter={() => log.debug('頭像懸停', null, 'FirebaseProfileAvatar')}
          style={{ pointerEvents: isUploading ? 'none' : 'auto' }}
        >
          <AvatarImage src={avatarUrl || undefined} alt="User Avatar" />
          <AvatarFallback 
            className="text-3xl"
            style={{ backgroundColor: '#95d2f4', color: '#000000' }}
          >
            {getInitial()}
          </AvatarFallback>
        </Avatar>
        <button
          onClick={handleAvatarClick}
          disabled={isUploading}
          style={cameraButtonStyle}
          type="button"
          title={isUploading ? '正在上傳中...' : '更換頭像'}
          onMouseEnter={() => log.debug('相機按鈕懸停', null, 'FirebaseProfileAvatar')}
        >
          {isUploading ? (
            <LoadingIcon style={loadingIconStyle} />
          ) : (
            <CameraIcon style={cameraIconStyle} />
          )}
        </button>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,.heic,.heif"
        disabled={isUploading}
        style={{ display: 'none' }}
        id="avatar-file-input"
      />
    </div>
  );
} 