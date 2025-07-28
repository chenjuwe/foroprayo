import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { db } from '@/integrations/firebase/client';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  Timestamp, 
  getCountFromServer 
} from 'firebase/firestore';
import { Users, Heart, MessageSquare, UserCheck, AlertTriangle, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { log } from '@/lib/logger';
import { Spinner } from "@/components/ui/spinner";

interface DashboardStats {
  totalUsers: number;
  totalPrayers: number;
  totalResponses: number;
  totalLikes: number;
  activeUsers24h: number;
  reportedContent: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPrayers: 0,
    totalResponses: 0,
    totalLikes: 0,
    activeUsers24h: 0,
    reportedContent: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      // 建立24小時前的時間戳
      const twentyFourHoursAgo = Timestamp.fromDate(
        new Date(Date.now() - 24 * 60 * 60 * 1000)
      );

      // 獲取代禱統計
      const prayersCollection = collection(db(), 'prayers');
      const prayersSnapshot = await getCountFromServer(prayersCollection);
      const prayerCount = prayersSnapshot.data().count;

      // 獲取回應統計
      const responsesCollection = collection(db(), 'prayer_responses');
      const responsesSnapshot = await getCountFromServer(responsesCollection);
      const responseCount = responsesSnapshot.data().count;

      // 獲取愛心統計
      const likesCollection = collection(db(), 'prayer_likes');
      const likesSnapshot = await getCountFromServer(likesCollection);
      const likeCount = likesSnapshot.data().count;

      // 獲取唯一用戶數
      const usersCollection = collection(db(), 'users');
      const usersSnapshot = await getCountFromServer(usersCollection);
      const uniqueUserCount = usersSnapshot.data().count;

      // 獲取24小時內的活動（最近的代禱）
      const recentActivityQuery = query(
        collection(db(), 'prayers'),
        where('created_at', '>=', twentyFourHoursAgo)
      );
      const recentActivitySnapshot = await getCountFromServer(recentActivityQuery);
      const recentActivity = recentActivitySnapshot.data().count;

      // 獲取舉報內容數量
      const reportsCollection = collection(db(), 'reports');
      const reportsSnapshot = await getCountFromServer(reportsCollection);
      const reportedContentCount = reportsSnapshot.data().count;

      setStats({
        totalUsers: uniqueUserCount,
        totalPrayers: prayerCount,
        totalResponses: responseCount,
        totalLikes: likeCount,
        activeUsers24h: recentActivity,
        reportedContent: reportedContentCount
      });

      log.debug('管理後台統計數據已載入', {
        users: uniqueUserCount,
        prayers: prayerCount,
        responses: responseCount,
        likes: likeCount
      }, 'Dashboard');
    } catch (error) {
      log.error('載入統計數據失敗', error, 'Dashboard');
      toast.error('載入統計數據失敗');
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = () => {
    setLoading(true);
    loadDashboardStats();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Claire 管理後台</h1>
          <p className="text-gray-500 mt-1">平台統計概覽與管理功能</p>
        </div>
        <Button 
          variant="outline" 
          onClick={refreshStats}
          className="flex items-center gap-2"
          disabled={loading}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          刷新數據
        </Button>
      </div>

      {/* 統計卡片區 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users size={16} />
              用戶總數
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-gray-500 mt-1">註冊用戶總數</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare size={16} />
              代禱總數
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPrayers}</div>
            <p className="text-xs text-gray-500 mt-1">平台累積發布代禱數</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Heart size={16} />
              互動總數
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalResponses + stats.totalLikes}</div>
            <p className="text-xs text-gray-500 mt-1">
              回應: {stats.totalResponses} / 愛心: {stats.totalLikes}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserCheck size={16} />
              活躍用戶 (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers24h}</div>
            <p className="text-xs text-gray-500 mt-1">24小時內發布代禱的用戶數</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle size={16} />
              舉報內容
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reportedContent}</div>
            <p className="text-xs text-gray-500 mt-1">
              待處理的舉報數量
              {stats.reportedContent > 0 && (
                <Badge className="ml-2 bg-red-500">需處理</Badge>
              )}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp size={16} />
              平台健康度
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalPrayers > 0 
                ? Math.min(Math.round((stats.totalResponses + stats.totalLikes) / stats.totalPrayers * 10) / 10, 5).toFixed(1) 
                : '0.0'}
            </div>
            <p className="text-xs text-gray-500 mt-1">每篇代禱平均互動數</p>
          </CardContent>
        </Card>
      </div>

      {/* 選項卡區域 */}
      <Tabs defaultValue="recent">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="recent">最近活動</TabsTrigger>
            <TabsTrigger value="reports">舉報管理</TabsTrigger>
            <TabsTrigger value="analytics">數據分析</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="recent" className="p-4 border rounded-md mt-2">
          <h2 className="text-lg font-medium mb-4">最近活動</h2>
          <p className="text-sm text-gray-500">
            此區域將顯示最近的用戶活動，包括新代禱、回應和舉報。
          </p>
          <div className="mt-4">
            <p className="text-center text-gray-400 py-4">
              最近活動功能正在開發中...
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="reports" className="p-4 border rounded-md mt-2">
          <h2 className="text-lg font-medium mb-4">舉報管理</h2>
          <p className="text-sm text-gray-500">
            此區域將顯示用戶提交的舉報，並提供處理功能。
          </p>
          <div className="mt-4">
            <p className="text-center text-gray-400 py-4">
              舉報管理功能正在開發中...
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="p-4 border rounded-md mt-2">
          <h2 className="text-lg font-medium mb-4">數據分析</h2>
          <p className="text-sm text-gray-500">
            此區域將提供更詳細的平台使用數據和趨勢圖表。
          </p>
          <div className="mt-4">
            <p className="text-center text-gray-400 py-4">
              數據分析功能正在開發中...
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 