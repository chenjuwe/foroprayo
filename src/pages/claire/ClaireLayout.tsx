import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { auth, db } from '@/integrations/firebase/client';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { toast } from 'sonner';
import { Home, Users, FileText, BarChart2, Shield } from 'lucide-react';
import ClaireLogo from '@/assets/icons/ClaireLogo.svg';
import { log } from '@/lib/logger';
import { Spinner } from "@/components/ui/spinner";

// 創建一個樣式對象，用於全局應用到整個管理後台
const claireGlobalStyles = `
  .claire-admin * {
    font-size: 14px !important;
    border-radius: 0 !important; /* 移除所有圓角，使用直角 */
    color: #000000 !important; /* 將所有文字設置為黑色 */
    font-weight: normal !important; /* 將所有文字設置為非粗體 */
  }
  
  /* 特定樣式覆蓋 */
  .claire-admin .claire-username {
    font-weight: bold !important;
  }
  .claire-admin .claire-uuid {
    font-size: 14px !important;
    color: #000000 !important; /* black */
    white-space: nowrap !important;
  }
  .claire-admin .claire-date {
    font-size: 14px !important;
  }

  .claire-admin h1 {
    font-size: 18px !important;
    color: #000000 !important; /* 確保標題也是黑色 */
    font-weight: normal !important; /* 標題也使用正常字重 */
  }
  
  .claire-admin h2 {
    font-size: 16px !important;
    color: #000000 !important; /* 確保副標題也是黑色 */
    font-weight: normal !important; /* 副標題也使用正常字重 */
  }
  
  /* 確保所有元素的圓角都設置為0 */
  .claire-admin button,
  .claire-admin input,
  .claire-admin select,
  .claire-admin textarea,
  .claire-admin .card,
  .claire-admin .badge,
  .claire-admin .alert,
  .claire-admin .dialog,
  .claire-admin .dropdown,
  .claire-admin .popover,
  .claire-admin .modal,
  .claire-admin .menu,
  .claire-admin .avatar,
  .claire-admin [class*="rounded"] {
    border-radius: 0 !important;
  }
  
  /* 恢復 Avatar 的圓角 */
  .claire-admin .rounded-full {
    border-radius: 9999px !important;
  }
  
  /* 特別針對文字顏色的設置 */
  .claire-admin p,
  .claire-admin span,
  .claire-admin a,
  .claire-admin label,
  .claire-admin th,
  .claire-admin td,
  .claire-admin li,
  .claire-admin strong,
  .claire-admin small,
  .claire-admin div {
    color: #000000 !important;
  }
  
  /* 確保連結的樣式 */
  .claire-admin a:hover {
    color: #000000 !important;
    text-decoration: underline !important;
  }
  
  /* 確保所有卡片和元素背景透明 */
  .claire-admin .card,
  .claire-admin [class*="bg-"] {
    background-color: transparent !important;
  }
  
  /* 特別確保通常會使用粗體的元素都設置為正常字重 */
  .claire-admin strong,
  .claire-admin b,
  .claire-admin th,
  .claire-admin [class*="font-bold"],
  .claire-admin [class*="font-semibold"],
  .claire-admin [class*="font-medium"],
  .claire-admin button,
  .claire-admin .btn,
  .claire-admin .card-title,
  .claire-admin .title,
  .claire-admin .header,
  .claire-admin .heading {
    font-weight: normal !important;
  }
  
  /* 修改所有按鈕樣式 - 統一樣式 */
  .claire-admin button {
    background-color: transparent !important; /* 無色背景 */
    border: 1px solid #D1D5DB !important; /* border-gray-300 的色值，1px邊框 */
    color: #000000 !important; /* 黑色文字 */
    box-shadow: none !important;
    transition: background-color 0.2s ease !important;
  }

  /* 按鈕懸停效果 */
  .claire-admin button:hover:not(:disabled) {
    background-color: #F9FAFB !important; /* bg-gray-50 的色值 */
  }
`;

export default function ClaireLayout() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // 檢查用戶是否為管理員
  const checkIsAdmin = async (userId: string) => {
    try {
      // 從 Firebase 中檢查用戶是否為管理員
      const adminRef = doc(db(), 'admins', userId);
      const superAdminRef = doc(db(), 'super_admins', userId);
      
      // 檢查用戶是否在 admins 或 super_admins 集合中
      const [adminDoc, superAdminDoc] = await Promise.all([
        getDoc(adminRef),
        getDoc(superAdminRef)
      ]);
      
      // 如果任一文檔存在，則用戶為管理員
      return adminDoc.exists() || superAdminDoc.exists();
    } catch (error) {
      log.error('檢查管理員狀態失敗', error, 'ClaireLayout');
      return false;
    }
  };

  useEffect(() => {
    // 監聽用戶認證狀態
    const unsubscribe = onAuthStateChanged(auth(), async (user) => {
      if (!user) {
        log.debug('用戶未登入', null, 'ClaireLayout');
        setIsAdmin(false);
        setLoading(false);
        navigate('/auth');
        return;
      }
      
      try {
        // 檢查用戶是否為管理員
        const adminStatus = await checkIsAdmin(user.uid);
        
        if (adminStatus) {
          log.debug('管理員認證成功', { userId: user.uid }, 'ClaireLayout');
          setIsAdmin(true);
        } else {
          log.debug('非管理員用戶', { userId: user.uid }, 'ClaireLayout');
          setIsAdmin(false);
          navigate('/auth');
          toast.error('您沒有管理員權限');
        }
      } catch (error) {
        log.error('檢查管理員狀態失敗', error, 'ClaireLayout');
        setIsAdmin(false);
        navigate('/auth');
      } finally {
        setLoading(false);
      }
    });
    
    // 清理訂閱
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await auth().signOut();
      navigate('/auth');
      toast.success('已登出');
    } catch (error) {
      log.error('登出失敗', error, 'ClaireLayout');
      toast.error('登出失敗');
    }
  };

  const menuItems = [
    { path: '/claire', label: '儀表板', icon: <Home className="h-3.5 w-3.5 mr-2" /> },
    { path: '/claire/users', label: '用戶管理', icon: <Users className="h-3.5 w-3.5 mr-2" /> },
    { path: '/claire/prayers', label: '代禱管理', icon: <FileText className="h-3.5 w-3.5 mr-2" /> },
    { path: '/claire/reports', label: '舉報處理', icon: <BarChart2 className="h-3.5 w-3.5 mr-2" /> },
    { path: '/claire/super-admins', label: '超級管理員', icon: <Shield className="h-3.5 w-3.5 mr-2" /> },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Spinner size="large" />
        <p className="mt-4 text-lg text-gray-600">載入中...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      {/* 插入全局樣式 */}
      <style>{claireGlobalStyles}</style>
      
      <div className="flex h-screen bg-transparent claire-admin">
        {/* 側邊欄 */}
        <aside className="w-[215px] bg-transparent border-r border-gray-300">
          <div className="py-6 pr-6 pl-[60px]">
            <img src={ClaireLogo} alt="Claire Logo" className="h-8" />
          </div>
          <nav className="mt-6">
            <ul>
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center py-6 pr-6 pl-[60px] text-gray-600 hover:bg-transparent hover:text-blue-600 ${
                      location.pathname === item.path ? 'bg-transparent text-blue-600 border-r-4 border-blue-600' : ''
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="absolute bottom-0 w-[215px] py-4 px-4 border-t">
            <Button
              variant="outline"
              className="w-full justify-center text-gray-600"
              onClick={handleLogout}
            >
              登出
            </Button>
          </div>
        </aside>

        {/* 主內容區 */}
        <main className="flex-1 overflow-auto bg-transparent">
          <Outlet />
        </main>
      </div>
    </>
  );
} 