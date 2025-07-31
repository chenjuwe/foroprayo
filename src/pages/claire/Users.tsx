import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { db } from '@/integrations/firebase/client';
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  limit, 
  startAfter,
  doc,
  getDoc,
  Timestamp,
  DocumentSnapshot,
  where,
  Query,
  DocumentData
} from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileHistoryDialog } from '@/components/profile/ProfileHistoryDialog';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from '@/components/profile/UserAvatar';
import { log } from '@/lib/logger';

interface User {
  user_id: string;
  user_name: string;
  user_email: string;
  user_avatar: string | null;
  prayer_count: number;
  response_count: number;
  like_count: number;
  last_activity: Timestamp | null;
  registration_time: Timestamp | null;
  serial_number: number;
}

const formatDate = (timestamp: Timestamp | null) => {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}  ${hours}:${minutes}`;
};

const formatActivityStatus = (timestamp: Timestamp | null) => {
  if (!timestamp) return '無活動';
  const now = new Date();
  const activityDate = timestamp.toDate();
  const diffSeconds = Math.floor((now.getTime() - activityDate.getTime()) / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 5) {
    return '剛剛';
  }
  if (diffMinutes <= 59) {
    return `${diffMinutes}分鐘前`;
  }
  if (diffHours <= 23) {
    return `${diffHours}小時前`;
  }
  if (diffDays <= 5) {
    return `${diffDays}天前`;
  }
  
  const year = activityDate.getFullYear();
  const month = String(activityDate.getMonth() + 1).padStart(2, '0');
  const day = String(activityDate.getDate()).padStart(2, '0');
  const hours = String(activityDate.getHours()).padStart(2, '0');
  const minutes = String(activityDate.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}  ${hours}:${minutes}`;
};

export default function Users() {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [selectedUser, setSelectedUser] = useState<{id: string, name: string, email: string} | null>(null);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [firstDocInPage, setFirstDocInPage] = useState<Record<number, DocumentSnapshot>>({});

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "user_name",
      header: () => (
        <div style={{ position: 'relative', marginLeft: '62px' }}>
          用戶
        </div>
      ),
      cell: ({ row }) => (
        <div
          className="flex items-center space-x-6 cursor-pointer hover:bg-gray-100 p-2 rounded-md"
          onClick={() => setSelectedUser({ 
            id: row.original.user_id, 
            name: row.original.user_name, 
            email: row.original.user_email 
          })}
        >
          <UserAvatar userId={row.original.user_id} username={row.original.user_name} />
          <div className="text-left">
            <div className="claire-username">{row.original.user_name || 'N/A'}</div>
            <div className="text-xs text-gray-500">{row.original.user_email}</div>
            <div className="claire-uuid">{row.original.user_id}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "registration_time",
      header: "註冊時間",
      cell: ({ row }) => (
        <div className="claire-date" style={{ color: 'red' }}>
          {formatDate(row.original.registration_time)}
        </div>
      ),
      meta: {
        className: 'text-center',
      },
    },
    {
      accessorKey: "serial_number",
      header: "註冊序號",
      cell: ({ row }) => (
        <div className="claire-date" style={{ color: 'purple', whiteSpace: 'nowrap' }}>
          {`# ${String(row.original.serial_number || 0).padStart(5, '0')}`}
        </div>
      ),
      meta: {
        className: 'text-center',
      },
    },
    {
      accessorKey: "last_activity",
      header: "活動狀態",
      cell: ({ row }) => formatActivityStatus(row.original.last_activity),
      meta: {
        className: 'text-center',
      },
    },
  ];

  const { data: users = [], isLoading, error, refetch } = useQuery({
    queryKey: ['userStatistics', page, pageSize],
    queryFn: () => fetchUserStatistics(page, pageSize),
  });

  const fetchUserStatistics = async (page: number, pageSize: number) => {
    try {
      // 在Firebase中我們需要使用分頁查詢
      const usersCollection = collection(db(), 'users');
      let usersQuery: Query<DocumentData>;
      
      if (page === 1 || !lastDoc) {
        // 第一頁查詢
        usersQuery = query(
          usersCollection, 
          orderBy('created_at', 'desc'),
          limit(pageSize)
        );
      } else if (firstDocInPage[page]) {
        // 已經有這一頁的第一個文檔，直接查詢
        usersQuery = query(
          usersCollection, 
          orderBy('created_at', 'desc'),
          startAfter(firstDocInPage[page - 1]),
          limit(pageSize)
        );
      } else {
        // 下一頁查詢，使用上一頁的最後一個文檔作為起點
        usersQuery = query(
          usersCollection, 
          orderBy('created_at', 'desc'),
          startAfter(lastDoc),
          limit(pageSize)
        );
      }

      const userSnapshot = await getDocs(usersQuery);
      
      // 保存該頁的第一個文檔，方便導航
      if (userSnapshot.docs.length > 0) {
        if (page === 1) {
          setFirstDocInPage({1: userSnapshot.docs[0]});
        } else if (!firstDocInPage[page]) {
          setFirstDocInPage(prev => ({...prev, [page]: userSnapshot.docs[0]}));
        }
        
        // 保存最後一個文檔，用於下一頁查詢
        setLastDoc(userSnapshot.docs[userSnapshot.docs.length - 1]);
      }

      // 獲取每個用戶的詳細統計信息
      const userDetailsPromises = userSnapshot.docs.map(async (doc, index) => {
        const userData = doc.data();
        const userId = doc.id;
        
        // 獲取用戶的代禱數量
        const prayersQuery = query(collection(db(), 'prayers'), where('user_id', '==', userId));
        const prayersSnapshot = await getDocs(prayersQuery);
        
        // 獲取用戶的回應數量
        const responsesQuery = query(collection(db(), 'prayer_responses'), where('user_id', '==', userId));
        const responsesSnapshot = await getDocs(responsesQuery);
        
        // 獲取用戶的點讚數量
        const likesQuery = query(collection(db(), 'prayer_likes'), where('user_id', '==', userId));
        const likesSnapshot = await getDocs(likesQuery);
        
        // 查找最後活動時間（可能是代禱、回應或點讚中最近的一個）
        const lastActivity: Timestamp | null = userData.last_active || userData.created_at || null;
        
        // 序號從1開始，基於在用戶列表中的位置和當前頁數
        const serialNumber = (page - 1) * pageSize + index + 1;
        
        return {
          user_id: userId,
          user_name: userData.display_name || userData.displayName || 'User',
          user_email: userData.email || '',
          user_avatar: userData.photoURL || null,
          prayer_count: prayersSnapshot.size,
          response_count: responsesSnapshot.size,
          like_count: likesSnapshot.size,
          last_activity: lastActivity,
          registration_time: userData.created_at || null,
          serial_number: serialNumber
        } as User;
      });
      
      const userDetails = await Promise.all(userDetailsPromises);
      log.debug('獲取用戶統計數據', { count: userDetails.length, page }, 'Users');
      
      return userDetails;
    } catch (error) {
      log.error('獲取用戶統計數據失敗', error, 'Users');
      throw error;
    }
  };

  if (error) {
    return <div>讀取用戶資料失敗，請稍後再試。</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">用戶管理</h1>
          <p className="text-gray-500 mt-1">查看和管理用戶資料</p>
        </div>
        <Button 
          onClick={() => refetch()} 
          disabled={isLoading}
          variant="outline"
          className="flex items-center gap-2"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isLoading ? "載入中..." : "重新整理"}
        </Button>
      </div>

      <div>
        {/* We will add search back later */}
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full bg-transparent" />
            <Skeleton className="h-12 w-full bg-transparent" />
            <Skeleton className="h-12 w-full bg-transparent" />
          </div>
        ) : (
          <DataTable columns={columns} data={users} />
        )}
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
            className="bg-transparent"
          >
            上一頁
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={users.length < pageSize}
            className="bg-transparent"
          >
            下一頁
          </Button>
        </div>
      </div>
      
      <ProfileHistoryDialog
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        userId={selectedUser?.id || null}
        userName={selectedUser?.name || ''}
        userEmail={selectedUser?.email || ''}
      />
    </div>
  );
}