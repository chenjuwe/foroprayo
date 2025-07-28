import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { SuperAdminService } from '@/services/admin/SuperAdminService';
import type { UserProfileHistory } from '@/types/common';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

interface ProfileHistoryDialogProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userEmail?: string;
}

const adminService = new SuperAdminService();

export function ProfileHistoryDialog({ userId, isOpen, onClose, userName, userEmail }: ProfileHistoryDialogProps) {
  const [history, setHistory] = useState<UserProfileHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailedError, setDetailedError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      setIsLoading(true);
      setError(null);
      setDetailedError(null);
      
      // 使用更詳細的歷史查詢方法
      adminService
        .getDetailedUserHistory(userId)
        .then((result) => {
          setIsAdmin(result.isSuperAdmin);
          
          if (result.success) {
            setHistory(result.data || []);
          } else {
            console.error('獲取歷史失敗', result.error);
            setError('無法讀取變更歷史');
            setDetailedError(result.errorDetails);
          }
        })
        .catch((err) => {
          console.error(err);
          setError('無法讀取變更歷史');
          setDetailedError(err?.message || '未知錯誤');
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, userId]);

  const renderChange = (entry: UserProfileHistory) => {
    const {
      old_username,
      new_username,
      old_avatar_url,
      new_avatar_url,
    } = entry;

    const changes = [];
    if (old_username !== new_username) {
      changes.push(
        <div key="name">
          <p className="font-semibold">名稱變更:</p>
          <p className="text-sm text-gray-500">從: {old_username || 'N/A'}</p>
          <p className="text-sm text-green-600">到: {new_username || 'N/A'}</p>
        </div>
      );
    }

    if (old_avatar_url !== new_avatar_url) {
      changes.push(
        <div key="avatar">
          <p className="font-semibold mt-2">頭像變更:</p>
          <div className="flex items-center space-x-4">
            <div>
              <p className="text-sm text-gray-500">從:</p>
              <Avatar className="h-10 w-10">
                <AvatarImage src={old_avatar_url || undefined} />
                <AvatarFallback>{old_username?.charAt(0) || '?'}</AvatarFallback>
              </Avatar>
            </div>
            <div>
              <p className="text-sm text-green-600">到:</p>
              <Avatar className="h-10 w-10">
                <AvatarImage src={new_avatar_url || undefined} />
                <AvatarFallback>{new_username?.charAt(0) || '?'}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      );
    }
    
    if (changes.length === 0) {
      return <p className="text-sm text-gray-500">沒有偵測到具體的使用者名稱或頭像變更。</p>
    }

    return changes;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]">
        <DialogHeader>
          <DialogTitle>「{userEmail || userName}」的變更歷史</DialogTitle>
          <DialogDescription>
            此處顯示該使用者的個人資料（名稱、頭像）變更紀錄。
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto p-1 pr-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : error ? (
            <div>
              <p className="text-red-500">{error}</p>
              {detailedError && (
                <div className="mt-2 text-xs bg-gray-100 p-2 rounded-md overflow-auto">
                  <p className="font-bold">錯誤詳情 (僅供開發者參考):</p>
                  <p className="break-all">{detailedError}</p>
                  <p className="mt-1">管理員狀態: {isAdmin === null ? '未知' : isAdmin ? '是' : '否'}</p>
                </div>
              )}
            </div>
          ) : history.length === 0 ? (
            <p className="text-center text-gray-500 py-8">沒有任何變更歷史記錄。</p>
          ) : (
            <ul className="space-y-4">
              {history.map((entry) => (
                <li key={entry.id} className="p-4 rounded-lg border">
                  <div className="flex justify-between items-center mb-2">
                    <Badge variant="secondary">
                      {format(new Date(entry.changed_at), 'yyyy/MM/dd HH:mm')}
                    </Badge>
                  </div>
                  {renderChange(entry)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 