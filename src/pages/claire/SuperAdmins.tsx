import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Shield, UserPlus, Trash2, AlertTriangle } from 'lucide-react';
import { log } from '@/lib/logger';
import { db, auth } from '@/integrations/firebase/client';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  deleteDoc,
  query,
  where,
  serverTimestamp,
  updateDoc,
  Timestamp 
} from 'firebase/firestore';
// 導入新的 Spinner 元件
import { Spinner } from "@/components/ui/spinner";

interface SuperAdmin {
  id: string;
  email: string;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export default function SuperAdmins() {
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<SuperAdmin | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    loadSuperAdmins();
    checkSuperAdminStatus();
  }, []);

  const checkSuperAdminStatus = async () => {
    try {
      // 檢查當前登入用戶是否為超級管理員
      const currentUser = auth().currentUser;
      if (!currentUser) {
        setIsSuperAdmin(false);
        toast.error('您尚未登入');
        return;
      }

      const userId = currentUser.uid;
      const superAdminDoc = await getDoc(doc(db(), 'super_admins', userId));
      
      const isSuperAdmin = superAdminDoc.exists();
      setIsSuperAdmin(isSuperAdmin);
      
      if (!isSuperAdmin) {
        toast.error('您沒有超級管理員權限');
      }

      log.debug('檢查超級管理員權限', { 
        userId, 
        isSuperAdmin 
      }, 'SuperAdmins');
    } catch (error) {
      log.error('檢查超級管理員權限失敗', error, 'SuperAdmins');
      setIsSuperAdmin(false);
    }
  };

  const loadSuperAdmins = async () => {
    setLoading(true);
    try {
      const superAdminsQuery = query(collection(db(), 'super_admins'));
      const snapshot = await getDocs(superAdminsQuery);
      
      const adminsData: SuperAdmin[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        adminsData.push({
          id: doc.id,
          email: data.email || '',
          is_active: data.is_active !== false, // 預設為 true
          created_at: data.created_at || Timestamp.now(),
          updated_at: data.updated_at || Timestamp.now()
        });
      });
      
      setSuperAdmins(adminsData);
      log.debug('載入超級管理員列表成功', { count: adminsData.length }, 'SuperAdmins');
    } catch (error) {
      log.error('載入超級管理員失敗', error, 'SuperAdmins');
      toast.error('載入超級管理員失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || !isValidEmail(newAdminEmail)) {
      toast.error('請輸入有效的電子郵件地址');
      return;
    }

    setIsAddingAdmin(true);
    try {
      // 1. 檢查郵箱是否已經是超級管理員
      const existingQuery = query(
        collection(db(), 'super_admins'), 
        where('email', '==', newAdminEmail)
      );
      const existingSnapshot = await getDocs(existingQuery);
      
      if (!existingSnapshot.empty) {
        toast.error(`${newAdminEmail} 已經是超級管理員`);
        setIsAddingAdmin(false);
        return;
      }
      
      // 2. 添加到 super_admins 集合
      const newAdmin = {
        email: newAdminEmail,
        is_active: true,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };
      
      await addDoc(collection(db(), 'super_admins'), newAdmin);
      
      toast.success(`已將 ${newAdminEmail} 添加為超級管理員`);
      setNewAdminEmail('');
      loadSuperAdmins();
      
      log.debug('添加超級管理員成功', { email: newAdminEmail }, 'SuperAdmins');
    } catch (error) {
      log.error('添加超級管理員失敗', error, 'SuperAdmins');
      toast.error('添加超級管理員失敗');
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleDeleteSuperAdmin = async () => {
    if (!selectedAdmin) return;
    
    try {
      // 刪除超級管理員文檔
      await deleteDoc(doc(db(), 'super_admins', selectedAdmin.id));
      
      toast.success(`已刪除超級管理員 ${selectedAdmin.email}`);
      loadSuperAdmins();
      
      log.debug('刪除超級管理員成功', { email: selectedAdmin.email }, 'SuperAdmins');
    } catch (error) {
      log.error('刪除超級管理員失敗', error, 'SuperAdmins');
      toast.error('刪除超級管理員失敗');
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedAdmin(null);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedAdmin) return;
    
    try {
      const newStatus = !selectedAdmin.is_active;
      
      // 更新超級管理員狀態
      await updateDoc(doc(db(), 'super_admins', selectedAdmin.id), {
        is_active: newStatus,
        updated_at: serverTimestamp()
      });
      
      toast.success(`已${newStatus ? '啟用' : '停用'}超級管理員 ${selectedAdmin.email}`);
      loadSuperAdmins();
      
      log.debug('更新超級管理員狀態成功', { 
        email: selectedAdmin.email, 
        newStatus 
      }, 'SuperAdmins');
    } catch (error) {
      log.error('更新超級管理員狀態失敗', error, 'SuperAdmins');
      toast.error('更新超級管理員狀態失敗');
    } finally {
      setIsStatusDialogOpen(false);
      setSelectedAdmin(null);
    }
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const formatDate = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isSuperAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">
              <AlertTriangle className="inline-block mr-2 h-5 w-5" />
              權限不足
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>您沒有權限訪問超級管理員頁面。</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">超級管理員設定</h1>
          <p className="text-gray-500 mt-1">管理具有刪除任何內容權限的超級管理員</p>
        </div>
        <Button onClick={loadSuperAdmins} variant="outline" className="flex items-center gap-2">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          重新載入
        </Button>
      </div>

      {/* 添加新管理員卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">添加超級管理員</CardTitle>
          <CardDescription>
            超級管理員可以刪除社群中的任何不當發言，無視內容所有權
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddSuperAdmin} className="flex items-end gap-4">
            <div className="flex-1">
              <label htmlFor="email" className="text-sm font-medium block mb-2">
                電子郵件地址
              </label>
              <Input
                id="email"
                type="email"
                placeholder="輸入電子郵件地址"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isAddingAdmin || !newAdminEmail.trim()}>
              <UserPlus className="mr-2 h-4 w-4" />
              {isAddingAdmin ? '添加中...' : '添加管理員'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 管理員列表卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">超級管理員列表</CardTitle>
          <CardDescription>
            目前系統中的所有超級管理員
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size="large" />
            </div>
          ) : superAdmins.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              尚未添加任何超級管理員
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>電子郵件</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead>創建時間</TableHead>
                  <TableHead>最後更新</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {superAdmins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Shield className="mr-2 h-4 w-4 text-blue-500" />
                        {admin.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={admin.is_active ? "default" : "secondary"}>
                        {admin.is_active ? '啟用' : '停用'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(admin.created_at)}</TableCell>
                    <TableCell>{formatDate(admin.updated_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAdmin(admin);
                            setIsStatusDialogOpen(true);
                          }}
                        >
                          {admin.is_active ? '停用' : '啟用'}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedAdmin(admin);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 刪除確認對話框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除此超級管理員？</AlertDialogTitle>
            <AlertDialogDescription>
              刪除後，此郵箱將失去超級管理員權限，無法刪除社群中的內容。
              {selectedAdmin && (
                <div className="mt-2 font-medium">{selectedAdmin.email}</div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSuperAdmin}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 狀態更新對話框 */}
      <AlertDialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              確定要{selectedAdmin?.is_active ? '停用' : '啟用'}此超級管理員？
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedAdmin?.is_active
                ? '停用後，此郵箱將暫時失去超級管理員權限，無法刪除社群中的內容。'
                : '啟用後，此郵箱將恢復超級管理員權限，可以刪除社群中的任何內容。'}
              {selectedAdmin && (
                <div className="mt-2 font-medium">{selectedAdmin.email}</div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleStatus}>
              確認{selectedAdmin?.is_active ? '停用' : '啟用'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 