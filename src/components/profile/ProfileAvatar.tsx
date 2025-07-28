import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AvatarService } from '@/services/background/AvatarService';
import { useAvatar } from '@/hooks/useAvatar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CameraIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { log } from '@/lib/logger';
import { compressImage } from '@/lib/image-utils';
import { Spinner } from "@/components/ui/spinner";

interface ProfileAvatarProps {
  userId: string;
}

const avatarService = new AvatarService(supabase);

export function ProfileAvatar({ userId }: ProfileAvatarProps) {
  const queryClient = useQueryClient();
  const { data: avatarData, isLoading: isAvatarLoading } = useAvatar(userId);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      log.warn('沒有選擇文件', { event: '文件選擇取消' }, 'ProfileAvatar');
      return;
    }
    
    if (!userId) {
      log.error('缺少用戶ID', { hasUserId: !!userId }, 'ProfileAvatar');
      alert('無法上傳頭像：未找到用戶ID');
      return;
    }

    setIsUploading(true);
    log.debug('開始頭像更換流程', { 
      fileName: file.name, 
      fileType: file.type || '未知類型', 
      fileSize: `${(file.size / 1024).toFixed(2)}KB` 
    }, 'ProfileAvatar');

    try {
      // 檢查文件類型
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];
      
      const fileTypeOK = validTypes.some(type => file.type === type) || 
                         validExtensions.some(ext => fileExtension === ext);
      
      if (!fileTypeOK) {
        throw new Error(`不支持的文件類型: ${file.type || fileExtension || '未知類型'}`);
      }

      log.debug('文件類型檢查通過', { 
        fileType: file.type || '未知類型', 
        extension: fileExtension 
      }, 'ProfileAvatar');

      // 定義壓縮配置
      const compressionConfigs = [
        { size: 96, quality: 0.9 }, // l - 大尺寸，提高質量
        { size: 48, quality: 0.9 }, // m - 中尺寸，提高質量
        { size: 30, quality: 0.9 }, // s - 小尺寸，提高質量
      ];
      
      log.debug('開始壓縮圖片', { configs: compressionConfigs }, 'ProfileAvatar');
      
      // 調用壓縮函數
      const compressedImages = await compressImage(file, compressionConfigs);
      
      if (!compressedImages || compressedImages.length === 0) {
        throw new Error('圖片壓縮失敗，未能生成任何壓縮圖像');
      }
      
      log.debug('圖片壓縮完成', { 
        imagesCount: compressedImages.length,
        imageNames: compressedImages.map(img => img.name),
        imageSizes: compressedImages.map(img => `${(img.blob.size / 1024).toFixed(2)}KB`)
      }, 'ProfileAvatar');

      // 準備上傳的 blob 對象
      const blobs = {
        l: compressedImages.find(img => img.name.includes('-96'))?.blob,
        m: compressedImages.find(img => img.name.includes('-48'))?.blob,
        s: compressedImages.find(img => img.name.includes('-30'))?.blob,
      };

      // 檢查是否所有必要的 blob 都存在
      const missingBlobs = [];
      if (!blobs.l) missingBlobs.push('大尺寸(96px)');
      if (!blobs.m) missingBlobs.push('中尺寸(48px)');
      if (!blobs.s) missingBlobs.push('小尺寸(30px)');
      
      if (missingBlobs.length > 0) {
        throw new Error(`圖片壓縮失敗，缺少必要的尺寸: ${missingBlobs.join(', ')}`);
      }

      // 到這裡，我們確定所有的 blob 都存在
      const blobSizes = {
        large: `${(blobs.l!.size / 1024).toFixed(2)}KB`,
        medium: `${(blobs.m!.size / 1024).toFixed(2)}KB`,
        small: `${(blobs.s!.size / 1024).toFixed(2)}KB`
      };

      log.debug('開始上傳頭像', { 
        userId,
        blobSizes
      }, 'ProfileAvatar');
      
      // 上傳並註冊頭像
      const newUrls = await avatarService.uploadAndRegisterAvatars(userId, {
        l: blobs.l!,
        m: blobs.m!,
        s: blobs.s!
      });
      
      log.debug('頭像上傳成功', { newUrls }, 'ProfileAvatar');

      // 即時更新 UI
                            queryClient.setQueryData(['avatar', userId], (oldData: unknown) => ({
                ...(oldData as Record<string, unknown>),
                ...newUrls,
                updated_at: new Date().toISOString(),
              }));
      
      // 使相關查詢失效
      await queryClient.invalidateQueries({ queryKey: ['avatar'] });
      await queryClient.invalidateQueries({ queryKey: ['prayers'] });

      log.debug('頭像更換流程成功', { userId }, 'ProfileAvatar');

    } catch (error) {
      log.error('頭像更換流程失敗', error, 'ProfileAvatar');
      alert('頭像上傳失敗: ' + (error instanceof Error ? error.message : '未知錯誤'));
    } finally {
      setIsUploading(false);
      // 重置 file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (isAvatarLoading) {
    return <Skeleton className="h-24 w-24 rounded-full" />;
  }

  return (
    <div className="w-32 h-32 flex justify-center items-center mt-4">
      <div className="relative w-24 h-24">
        <Avatar 
          className="w-24 h-24 cursor-pointer transition-transform duration-300 ease-in-out"
          onClick={handleAvatarClick}
        >
          <AvatarImage src={avatarData?.avatar_url_96} alt="User Avatar" />
          <AvatarFallback 
            className="text-3xl"
            style={{ backgroundColor: '#95d2f4', color: '#000000' }}
          >
            G
          </AvatarFallback>
        </Avatar>
        <Button
          onClick={handleAvatarClick}
          disabled={isUploading}
          className="absolute w-8 h-8 p-0 rounded-full bg-white shadow-md flex items-center justify-center"
          style={{ bottom: 0, right: 0, zIndex: 20 }}
        >
          {isUploading ? (
            <Spinner size="small" variant="default" />
          ) : (
            <CameraIcon className="w-4 h-4 text-gray-700" />
          )}
        </Button>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,.heic,.heif"
      />
    </div>
  );
}
