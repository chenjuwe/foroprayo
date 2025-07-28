import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { db } from '@/integrations/firebase/client';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { Download, TrendingUp, Calendar, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { log } from '@/lib/logger';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
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
} from '../../components/ui/alert-dialog';
import { Textarea } from '../../components/ui/textarea';
import { AvatarImage } from '../../components/ui/avatar-image';
import { firebaseReportService, firebasePrayerService, firebasePrayerResponseService } from '../../services';
import { FirebaseReport } from '../../services/report/FirebaseReportService';
import { Flag, Clock, CheckCircle, XCircle, Eye, Trash2, Edit } from 'lucide-react';
import { Spinner } from "@/components/ui/spinner";

interface DailyStats {
  date: string;
  prayers: number;
  responses: number;
  likes: number;
}

interface UserActivity {
  name: string;
  value: number;
  percentage: number;
}

export default function Reports() {
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(7);
  const [reports, setReports] = useState<FirebaseReport[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<FirebaseReport | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // 獲取臨時檢舉（從 localStorage）
  const getTempReports = () => {
    try {
      const tempReports = JSON.parse(localStorage.getItem('tempReports') || '[]');
      return tempReports.map((report: Record<string, unknown>) => ({
        ...report,
        isTemp: true
      }));
    } catch {
      return [];
    }
  };

  const [tempReports, setTempReports] = useState<any[]>([]);

  const loadTempReports = () => {
    const temp = getTempReports();
    setTempReports(temp);
    console.log('📋 載入臨時檢舉:', temp);
  };

  // 監聽 localStorage 變化
  useEffect(() => {
    const handleStorageChange = () => {
      loadTempReports();
    };

    // 監聽 storage 事件
    window.addEventListener('storage', handleStorageChange);
    
    // 定期檢查臨時檢舉（以防 storage 事件不觸發）
    const interval = setInterval(loadTempReports, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // 清除臨時檢舉
  const clearTempReports = () => {
    localStorage.removeItem('tempReports');
    setTempReports([]);
    console.log('🗑️ 已清除臨時檢舉');
  };

  useEffect(() => {
    loadReportData();
    loadReports(filterStatus);
    loadTempReports(); // 自動載入臨時檢舉
  }, [dateRange, filterStatus]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadDailyStats(),
        loadUserActivity()
      ]);
    } catch (error) {
      console.error('載入報告數據失敗:', error);
      toast.error('載入報告數據失敗');
    } finally {
      setLoading(false);
    }
  };

  const loadDailyStats = async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dateRange);
    const startTimestamp = Timestamp.fromDate(startDate);

    try {
      // 獲取代禱數據
      const prayersQuery = query(
        collection(db(), 'prayers'),
        where('created_at', '>=', startTimestamp),
        orderBy('created_at', 'desc')
      );
      const prayersSnapshot = await getDocs(prayersQuery);
      const prayers = prayersSnapshot.docs.map(doc => ({
        created_at: doc.data().created_at
      }));

      // 獲取回應數據
      const responsesQuery = query(
        collection(db(), 'prayer_responses'),
        where('created_at', '>=', startTimestamp),
        orderBy('created_at', 'desc')
      );
      const responsesSnapshot = await getDocs(responsesQuery);
      const responses = responsesSnapshot.docs.map(doc => ({
        created_at: doc.data().created_at
      }));

      // 獲取點讚數據
      const likesQuery = query(
        collection(db(), 'prayer_likes'),
        where('created_at', '>=', startTimestamp),
        orderBy('created_at', 'desc')
      );
      const likesSnapshot = await getDocs(likesQuery);
      const likes = likesSnapshot.docs.map(doc => ({
        created_at: doc.data().created_at
      }));

      // 按日期分組
      const statsMap = new Map<string, DailyStats>();
      
      for (let i = 0; i < dateRange; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        statsMap.set(dateStr, {
          date: dateStr,
          prayers: 0,
          responses: 0,
          likes: 0
        });
      }

      // 計算每日代禱數量
      prayers.forEach(prayer => {
        const date = prayer.created_at.toDate().toISOString().split('T')[0];
        const stat = statsMap.get(date);
        if (stat) {
          stat.prayers++;
        }
      });

      // 計算每日回應數量
      responses.forEach(response => {
        const date = response.created_at.toDate().toISOString().split('T')[0];
        const stat = statsMap.get(date);
        if (stat) {
          stat.responses++;
        }
      });

      // 計算每日點讚數量
      likes.forEach(like => {
        const date = like.created_at.toDate().toISOString().split('T')[0];
        const stat = statsMap.get(date);
        if (stat) {
          stat.likes++;
        }
      });

      // 排序並格式化日期
      const sortedStats = Array.from(statsMap.values())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(stat => ({
          ...stat,
          date: new Date(stat.date).toLocaleDateString('zh-TW', { 
            month: 'short', 
            day: 'numeric' 
          })
        }));

      setDailyStats(sortedStats);
      log.debug('已載入每日統計數據', { days: sortedStats.length }, 'Reports');
    } catch (error) {
      log.error('載入每日統計數據失敗', error, 'Reports');
      toast.error('載入每日統計數據失敗');
    }
  };

  const loadUserActivity = async () => {
    try {
      const prayersQuery = query(collection(db(), 'prayers'));
      const prayersSnapshot = await getDocs(prayersQuery);
      
      const userActivityMap = new Map<string, number>();
      
      // 計算匿名和實名用戶的代禱數量
      prayersSnapshot.docs.forEach(doc => {
        const prayer = doc.data();
        if (prayer.is_anonymous) {
          userActivityMap.set('匿名用戶', (userActivityMap.get('匿名用戶') || 0) + 1);
        } else {
          userActivityMap.set('實名用戶', (userActivityMap.get('實名用戶') || 0) + 1);
        }
      });

      const totalActivity = Array.from(userActivityMap.values()).reduce((sum, value) => sum + value, 0);

      const activityData = Array.from(userActivityMap.entries()).map(([name, value]) => ({
        name,
        value,
        percentage: totalActivity > 0 ? Math.round((value / totalActivity) * 100) : 0
      }));

      setUserActivity(activityData);
      log.debug('已載入用戶活動統計', { data: activityData }, 'Reports');
    } catch (error) {
      log.error('載入用戶活動統計失敗', error, 'Reports');
    }
  };

  const exportReport = () => {
    const reportData = {
      生成時間: new Date().toLocaleString('zh-TW'),
      統計期間: `${dateRange}天`,
      每日統計: dailyStats,
      用戶活動: userActivity
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prayforo-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('報告已下載');
  };

  const loadReports = async (status?: string) => {
    try {
      setLoading(true);
      const data = await firebaseReportService.getInstance().getReports(status === 'all' ? undefined : status);
      setReports(data);
      log.debug('載入檢舉成功', { count: data.length, status: status || 'all' }, 'Reports');
    } catch (error) {
      log.error('載入檢舉失敗', error, 'Reports');
      toast.error('載入檢舉失敗');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: Timestamp | string) => {
    if (!timestamp) return 'N/A';
    
    let date: Date;
    if (timestamp instanceof Timestamp) {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }

    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待處理';
      case 'reviewed': return '已審核';
      case 'resolved': return '已解決';
      case 'dismissed': return '已駁回';
      default: return status;
    }
  };

  const getTypeText = (type: string) => {
    return type === 'prayer' ? '代禱' : '回應';
  };

  const handleUpdateStatus = async (reportId: string, status: 'reviewed' | 'resolved' | 'dismissed') => {
    try {
      setIsUpdating(true);
      await firebaseReportService.getInstance().updateReportStatus(reportId, status, adminNotes);
      await loadReports(filterStatus);
      setSelectedReport(null);
      setAdminNotes('');
      log.debug('更新檢舉狀態成功', { reportId, status, hasNotes: !!adminNotes }, 'Reports');
    } catch (error) {
      log.error('更新檢舉狀態失敗', error, 'Reports');
      toast.error('更新檢舉狀態失敗');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteContent = async (report: FirebaseReport) => {
    try {
      if (report.report_type === 'prayer') {
        await firebasePrayerService.getInstance().deletePrayer(report.target_id);
        log.debug('刪除代禱成功', { prayerId: report.target_id }, 'Reports');
      } else {
        await firebasePrayerResponseService.getInstance().deleteResponse(report.target_id);
        log.debug('刪除回應成功', { responseId: report.target_id }, 'Reports');
      }
      await handleUpdateStatus(report.id, 'resolved');
      toast.success('內容已刪除且檢舉已標記為已解決');
    } catch (error) {
      log.error('刪除內容失敗', error, 'Reports');
      toast.error('刪除內容失敗');
    }
  };

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    reviewed: reports.filter(r => r.status === 'reviewed').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    dismissed: reports.filter(r => r.status === 'dismissed').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">統計報告</h1>
          <p className="text-gray-600">Prayforo 平台數據分析</p>
        </div>
        <div className="flex items-center space-x-2">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="border rounded px-3 py-2"
          >
            <option value={7}>最近 7 天</option>
            <option value={14}>最近 14 天</option>
            <option value={30}>最近 30 天</option>
          </select>
          <Button onClick={exportReport}>
            <Download className="mr-2 h-4 w-4" />
            匯出報告
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總代禱數</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dailyStats.reduce((sum, day) => sum + day.prayers, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              過去 {dateRange} 天
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總回應數</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dailyStats.reduce((sum, day) => sum + day.responses, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              社群互動回應
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總愛心數</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dailyStats.reduce((sum, day) => sum + day.likes, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              用戶按讚互動
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">日均活動</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(dailyStats.reduce((sum, day) => sum + day.prayers + day.responses + day.likes, 0) / dateRange)}
            </div>
            <p className="text-xs text-muted-foreground">
              每日平均互動
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily">每日趨勢</TabsTrigger>
          <TabsTrigger value="activity">用戶活動</TabsTrigger>
          <TabsTrigger value="engagement">參與度分析</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>每日活動趨勢</CardTitle>
              <CardDescription>
                過去 {dateRange} 天的代禱、回應和愛心數量變化
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dailyStats.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="font-medium">{stat.date}</span>
                    <div className="flex space-x-4 text-sm">
                      <span>代禱: {stat.prayers}</span>
                      <span>回應: {stat.responses}</span>
                      <span>愛心: {stat.likes}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>用戶類型分布</CardTitle>
              <CardDescription>
                實名用戶與匿名用戶的活動比例
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userActivity.map((activity, index) => (
                  <div key={activity.name} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="font-medium">{activity.name}</span>
                    <div className="text-right">
                      <div className="font-bold">{activity.value}</div>
                      <div className="text-sm text-gray-500">{activity.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>參與度指標</CardTitle>
              <CardDescription>
                分析用戶的參與程度和互動品質
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {dailyStats.length > 0 ? 
                      (dailyStats.reduce((sum, day) => sum + day.responses, 0) / 
                       Math.max(dailyStats.reduce((sum, day) => sum + day.prayers, 0), 1)).toFixed(2)
                      : 0
                    }
                  </div>
                  <div className="text-sm text-blue-600">平均回應率</div>
                  <div className="text-xs text-gray-500">回應數/代禱數</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {dailyStats.length > 0 ? 
                      (dailyStats.reduce((sum, day) => sum + day.likes, 0) / 
                       Math.max(dailyStats.reduce((sum, day) => sum + day.prayers, 0), 1)).toFixed(2)
                      : 0
                    }
                  </div>
                  <div className="text-sm text-green-600">平均愛心率</div>
                  <div className="text-xs text-gray-500">愛心數/代禱數</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {dailyStats.length > 0 ? 
                      Math.round((dailyStats.reduce((sum, day) => sum + day.prayers + day.responses + day.likes, 0)) / dateRange)
                      : 0
                    }
                  </div>
                  <div className="text-sm text-purple-600">日均互動</div>
                  <div className="text-xs text-gray-500">每日平均活動量</div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">參與度分析</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>社群活躍度:</span>
                    <span className="font-medium">
                      {dailyStats.reduce((sum, day) => sum + day.prayers + day.responses + day.likes, 0) > 100 ? '非常活躍' : 
                       dailyStats.reduce((sum, day) => sum + day.prayers + day.responses + day.likes, 0) > 50 ? '活躍' : 
                       dailyStats.reduce((sum, day) => sum + day.prayers + day.responses + day.likes, 0) > 20 ? '普通' : '需要改善'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>互動品質:</span>
                    <span className="font-medium">
                      {(dailyStats.reduce((sum, day) => sum + day.responses, 0) / 
                        Math.max(dailyStats.reduce((sum, day) => sum + day.prayers, 0), 1)) > 1 ? '優秀' : 
                       (dailyStats.reduce((sum, day) => sum + day.responses, 0) / 
                        Math.max(dailyStats.reduce((sum, day) => sum + day.prayers, 0), 1)) > 0.5 ? '良好' : '需要提升'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">檢舉管理</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              const tempData = localStorage.getItem('tempReports');
              console.log('🔍 localStorage 檢舉數據:', tempData);
              console.log('🔍 解析後的數據:', tempData ? JSON.parse(tempData) : null);
              loadTempReports();
            }}
            variant="outline"
            size="sm"
            className="text-blue-600 hover:text-blue-700"
          >
            🔍 檢查本地數據
          </Button>
          <Button
            onClick={loadTempReports}
            variant="outline"
            size="sm"
          >
            載入臨時檢舉 ({tempReports.length})
          </Button>
          {tempReports.length > 0 && (
            <Button
              onClick={clearTempReports}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              清除臨時檢舉
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">總檢舉數</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">待處理</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">已審核</p>
                <p className="text-2xl font-bold">{stats.reviewed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">已解決</p>
                <p className="text-2xl font-bold">{stats.resolved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-gray-600" />
              <div>
                <p className="text-sm font-medium">已駁回</p>
                <p className="text-2xl font-bold">{stats.dismissed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">狀態篩選：</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="pending">待處理</SelectItem>
                <SelectItem value="reviewed">已審核</SelectItem>
                <SelectItem value="resolved">已解決</SelectItem>
                <SelectItem value="dismissed">已駁回</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>檢舉列表</CardTitle>
          <CardDescription>點擊檢舉項目查看詳細資訊並進行處理</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size="large" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">沒有檢舉記錄</div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getStatusColor(report.status)}>
                          {getStatusText(report.status)}
                        </Badge>
                        <Badge variant="outline">
                          {getTypeText(report.report_type)}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {formatDate(report.created_at)}
                        </span>
                      </div>
                      <div className="mb-2">
                        <p className="text-sm text-gray-700 line-clamp-2">
                          <strong>被檢舉內容：</strong>{report.target_content}
                        </p>
                      </div>
                      {report.reason && (
                        <p className="text-sm text-red-600">
                          <strong>檢舉原因：</strong>{report.reason}
                        </p>
                      )}
                      {report.target_user_name && (
                        <p className="text-xs text-gray-500 mt-1">
                          發言者：{report.target_user_name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {report.target_user_avatar && (
                        <AvatarImage
                          src={report.target_user_avatar}
                          alt="用戶頭像"
                          size={32}
                          className="shrink-0"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedReport && (
        <AlertDialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>檢舉詳情處理</AlertDialogTitle>
              <AlertDialogDescription>
                請仔細審核檢舉內容並作出適當處理
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">檢舉類型</label>
                  <p className="text-sm text-gray-700">{getTypeText(selectedReport.report_type)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">目前狀態</label>
                  <Badge className={getStatusColor(selectedReport.status)}>
                    {getStatusText(selectedReport.status)}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">被檢舉內容</label>
                <div className="mt-1 p-3 bg-gray-50 rounded border">
                  <p className="text-sm whitespace-pre-wrap">{selectedReport.target_content}</p>
                </div>
              </div>

              {selectedReport.target_user_name && (
                <div>
                  <label className="text-sm font-medium">發言者</label>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedReport.target_user_avatar && (
                      <AvatarImage
                        src={selectedReport.target_user_avatar}
                        alt="用戶頭像"
                        size={32}
                      />
                    )}
                    <span className="text-sm">{selectedReport.target_user_name}</span>
                  </div>
                </div>
              )}

              {selectedReport.reason && (
                <div>
                  <label className="text-sm font-medium">檢舉原因</label>
                  <p className="text-sm text-red-600 mt-1">{selectedReport.reason}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">檢舉時間</label>
                <p className="text-sm text-gray-700">{formatDate(selectedReport.created_at)}</p>
              </div>

              {selectedReport.reporter_ip && (
                <div>
                  <label className="text-sm font-medium">檢舉者 IP</label>
                  <p className="text-sm text-gray-700">{selectedReport.reporter_ip}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">管理員備註</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="輸入處理備註..."
                  rows={3}
                />
              </div>
            </div>

            <AlertDialogFooter>
              <div className="flex flex-wrap gap-2">
                <AlertDialogCancel>取消</AlertDialogCancel>
                
                {selectedReport.status === 'pending' && (
                  <Button
                    onClick={() => handleUpdateStatus(selectedReport.id, 'reviewed')}
                    disabled={isUpdating}
                    variant="outline"
                  >
                    標記為已審核
                  </Button>
                )}

                <Button
                  onClick={() => handleUpdateStatus(selectedReport.id, 'dismissed')}
                  disabled={isUpdating}
                  variant="outline"
                >
                  駁回檢舉
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isUpdating}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      刪除內容
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>確認刪除內容</AlertDialogTitle>
                      <AlertDialogDescription>
                        此操作將永久刪除被檢舉的內容，無法復原。確定要繼續嗎？
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteContent(selectedReport)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        確認刪除
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* 臨時檢舉區域 */}
      {tempReports.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            臨時檢舉 ({tempReports.length})
          </h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              這些檢舉暫存在本地瀏覽器中，可能是因為資料庫連線問題。請確認後端服務正常運作。
            </p>
          </div>
          <div className="space-y-4">
            {tempReports.map((report, index) => (
              <div
                key={report.id || index}
                className="bg-white rounded-lg border border-yellow-300 p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                      臨時 - {report.report_type === 'prayer' ? '代禱' : '回應'}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">
                      {new Date(report.created_at).toLocaleString('zh-TW')}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">檢舉原因：</span>
                    <span className="text-gray-600">{report.reason}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">被檢舉內容：</span>
                    <p className="text-gray-600 bg-gray-50 p-2 rounded mt-1">
                      {report.target_content}
                    </p>
                  </div>
                  {report.target_user_name && (
                    <div>
                      <span className="font-medium text-gray-700">發言者：</span>
                      <span className="text-gray-600">{report.target_user_name}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 