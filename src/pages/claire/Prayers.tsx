import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { db } from '@/integrations/firebase/client';
import { 
  collection, 
  getDocs, 
  doc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { Search, MoreVertical, Trash2, Flag, Eye, Heart, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { log } from '@/lib/logger';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
// 導入新的 Spinner 元件
import { Spinner } from "@/components/ui/spinner";

interface Prayer {
  id: string;
  content: string;
  user_id: string | null;
  user_name: string | null;
  user_avatar: string | null;
  is_anonymous: boolean | null;
  created_at: Timestamp;
  updated_at: Timestamp | null;
  likeCount: number;
  responseCount: number;
}

export default function Prayers() {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [filteredPrayers, setFilteredPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null);

  useEffect(() => {
    loadPrayers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = prayers.filter(prayer =>
        prayer.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prayer.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPrayers(filtered);
    } else {
      setFilteredPrayers(prayers);
    }
  }, [searchTerm, prayers]);

  const loadPrayers = async () => {
    try {
      setLoading(true);

      // 獲取所有代禱，按創建時間降序排列
      const prayersQuery = query(collection(db(), 'prayers'), orderBy('created_at', 'desc'));
      const prayerSnapshot = await getDocs(prayersQuery);
      
      if (prayerSnapshot.empty) {
        setPrayers([]);
        setFilteredPrayers([]);
        return;
      }

      // 為每個代禱獲取統計數據
      const prayersWithStats = await Promise.all(
        prayerSnapshot.docs.map(async (doc) => {
          const prayer = doc.data();
          const prayerId = doc.id;
          
          // 獲取愛心數
          const likesQuery = query(collection(db(), 'prayer_likes'), where('prayer_id', '==', prayerId));
          const likesSnapshot = await getDocs(likesQuery);
          
          // 獲取回應數
          const responsesQuery = query(collection(db(), 'prayer_responses'), where('prayer_id', '==', prayerId));
          const responsesSnapshot = await getDocs(responsesQuery);

          return {
            id: prayerId,
            content: prayer.content || '',
            user_id: prayer.user_id || null,
            user_name: prayer.user_name || null,
            user_avatar: prayer.user_avatar || null,
            is_anonymous: prayer.is_anonymous || false,
            created_at: prayer.created_at || Timestamp.now(),
            updated_at: prayer.updated_at || null,
            likeCount: likesSnapshot.size,
            responseCount: responsesSnapshot.size
          } as Prayer;
        })
      );

      log.debug('載入代禱數據成功', { count: prayersWithStats.length }, 'Prayers');
      setPrayers(prayersWithStats);
      setFilteredPrayers(prayersWithStats);
    } catch (error) {
      log.error('載入代禱失敗', error, 'Prayers');
      toast.error('載入代禱失敗');
    } finally {
      setLoading(false);
    }
  };

  const deletePrayer = async (prayerId: string) => {
    try {
      const batch = writeBatch(db());
      
      // 刪除相關的愛心
      const likesQuery = query(collection(db(), 'prayer_likes'), where('prayer_id', '==', prayerId));
      const likesSnapshot = await getDocs(likesQuery);
      likesSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // 刪除相關的回應
      const responsesQuery = query(collection(db(), 'prayer_responses'), where('prayer_id', '==', prayerId));
      const responsesSnapshot = await getDocs(responsesQuery);
      responsesSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // 刪除相關的書籤
      const bookmarksQuery = query(collection(db(), 'prayer_bookmarks'), where('prayer_id', '==', prayerId));
      const bookmarksSnapshot = await getDocs(bookmarksQuery);
      bookmarksSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // 刪除代禱本身
      const prayerRef = doc(db(), 'prayers', prayerId);
      batch.delete(prayerRef);
      
      // 提交批量操作
      await batch.commit();

      // 更新UI
      setPrayers(prayers.filter(p => p.id !== prayerId));
      setFilteredPrayers(filteredPrayers.filter(p => p.id !== prayerId));
      
      toast.success('代禱已刪除');
      log.debug('代禱刪除成功', { prayerId }, 'Prayers');
    } catch (error) {
      log.error('刪除代禱失敗', error, 'Prayers');
      toast.error('刪除代禱失敗');
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const getEngagementBadge = (prayer: Prayer) => {
    const totalEngagement = prayer.likeCount + prayer.responseCount;
    if (totalEngagement >= 20) return <Badge variant="default">熱門</Badge>;
    if (totalEngagement >= 10) return <Badge variant="secondary">活躍</Badge>;
    if (totalEngagement >= 5) return <Badge variant="outline">普通</Badge>;
    return <Badge variant="destructive">冷門</Badge>;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="large" />
      </div>
    );
  }

  // 計算今日代禱數量
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayTimestamp = Timestamp.fromDate(todayStart);
  const todayPrayers = prayers.filter(p => p.created_at.toMillis() >= todayTimestamp.toMillis());

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">代禱管理</h1>
          <p className="text-gray-500 mt-1">管理社群代禱內容</p>
        </div>
        <Button 
          onClick={loadPrayers} 
          disabled={loading}
          variant="outline"
          className="flex items-center gap-2"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          重新載入
        </Button>
      </div>

      {/* 統計概覽 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總代禱數</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prayers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日代禱</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {todayPrayers.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">熱門代禱</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {prayers.filter(p => (p.likeCount + p.responseCount) >= 10).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">匿名代禱</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {prayers.filter(p => p.is_anonymous).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜尋和過濾 */}
      <Card>
        <CardHeader>
          <CardTitle>代禱列表</CardTitle>
          <CardDescription>
            查看和管理所有代禱內容
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜尋代禱內容或用戶..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>作者</TableHead>
                <TableHead>內容</TableHead>
                <TableHead>互動</TableHead>
                <TableHead>發佈時間</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrayers.map((prayer) => (
                <TableRow key={prayer.id}>
                  <TableCell className="flex items-center space-x-3">
                    {prayer.is_anonymous ? (
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-xs">匿</span>
                        </div>
                        <span className="text-gray-500">匿名用戶</span>
                      </div>
                    ) : (
                      <>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={prayer.user_avatar || undefined} />
                          <AvatarFallback>
                            {prayer.user_name?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{prayer.user_name}</div>
                          <div className="text-sm text-gray-500 font-mono">
                            {prayer.user_id?.slice(0, 8)}...
                          </div>
                        </div>
                      </>
                    )}
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="text-sm">
                      {truncateContent(prayer.content)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <Heart className="h-4 w-4 text-red-500" />
                        <span>{prayer.likeCount}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                        <span>{prayer.responseCount}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(prayer.created_at)}</TableCell>
                  <TableCell>{getEngagementBadge(prayer)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setSelectedPrayer(prayer)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          查看詳情
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Flag className="mr-2 h-4 w-4" />
                          標記審核
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              className="text-red-600"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              刪除代禱
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>確認刪除</AlertDialogTitle>
                              <AlertDialogDescription>
                                刪除後代禱與所有回覆將永久消失！
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deletePrayer(prayer.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                確認刪除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredPrayers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? '找不到符合條件的代禱' : '暫無代禱數據'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 代禱詳情對話框 */}
      {selectedPrayer && (
        <AlertDialog open={!!selectedPrayer} onOpenChange={() => setSelectedPrayer(null)}>
          <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>代禱詳情</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                {selectedPrayer.is_anonymous ? (
                  <div className="flex items-center space-x-2">
                    <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm">匿</span>
                    </div>
                    <span className="text-gray-500">匿名用戶</span>
                  </div>
                ) : (
                  <>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedPrayer.user_avatar || undefined} />
                      <AvatarFallback>
                        {selectedPrayer.user_name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{selectedPrayer.user_name}</div>
                      <div className="text-sm text-gray-500">
                        {formatDate(selectedPrayer.created_at)}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-900">{selectedPrayer.content}</p>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span>{selectedPrayer.likeCount} 個愛心</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                    <span>{selectedPrayer.responseCount} 個回應</span>
                  </div>
                </div>
                <div>ID: {selectedPrayer.id.slice(0, 8)}...</div>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>關閉</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
} 