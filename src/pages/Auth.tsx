import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthForm } from '@/components/auth/AuthForm';
import { AuthFooter } from '@/components/auth/AuthFooter';
import { useToast } from '@/hooks/use-toast';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useFirebaseAuthStore } from '@/stores/firebaseAuthStore';
import { log } from '@/lib/logger';
import { useFirebaseAvatar } from '@/hooks/useFirebaseAvatar';

// 頁面預加載函數 - 這會在模組層級執行，而不是在組件內部
(() => {
  // 預加載關鍵資源
  const preloadResources = [
    '/prayers', // 頁面路由
    '/apple-touch-icon.png', // 關鍵圖片
    '/pwa-192x192.png'
  ];
  
  preloadResources.forEach(resource => {
    if (resource.endsWith('.png')) {
      const img = new Image();
      img.src = resource;
    } else {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = resource;
      document.head.appendChild(link);
    }
  });
})();

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp, refreshUserAvatar } = useFirebaseAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // 初始化 Firebase 認證狀態
  const initFirebaseAuth = useFirebaseAuthStore(state => state.initAuth);
  const { refreshAvatar } = useFirebaseAvatar();
  
  // 在組件掛載時初始化 Firebase 認證狀態並預加載資源
  useEffect(() => {
    // 初始化認證
    initFirebaseAuth();
  }, [initFirebaseAuth]);
  
  // 超高速跳轉函數 - 使用最快的方式跳轉
  const ultraFastRedirect = (userId?: string) => {
    if (isRedirecting) return; // 防止重複跳轉
    setIsRedirecting(true);
    
    // 使用內聯腳本技術，將會立即執行，比 setTimeout 更快
    const script = document.createElement('script');
    script.textContent = `
      try {
        // 記錄跳轉開始時間 (用於性能監控)
        window.__redirectStart = Date.now();
        
        // 使用 location.replace 提供最快的跳轉（不會增加瀏覽歷史）
        window.location.replace('/prayers');
      } catch(e) {
        // 降級方案
        window.location.href = '/prayers'; 
      }
    `;
    document.body.appendChild(script);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    // 防止重複提交
    if (isLoading || isRedirecting) return;
    
    setIsLoading(true);

    try {
      // 首先檢查網絡狀態
      if (!navigator.onLine) {
        throw new Error('網絡連接不可用，請檢查您的連接並重試');
      }

      if (isLogin) {
        // 顯示登入中提示（立即顯示以提供視覺反饋）
        toast({ title: "登入中...", description: "請稍候" });
        
        // 檢查是否存在匹配的緩存用戶
        try {
          const cachedUserString = localStorage.getItem('auth_user');
          if (email && cachedUserString) {
            const cachedUser = JSON.parse(cachedUserString);
            // 檢查緩存的電子郵件是否匹配
            if (cachedUser.email === email && 
                Date.now() - cachedUser.timestamp < 24 * 60 * 60 * 1000) {
              
              // 使用緩存快速登入
              toast({ 
                title: "登入成功", 
                description: "使用緩存認證快速登入" 
              });
              
              // 存儲當前郵箱作為最後使用的用戶
              localStorage.setItem('last_user', email);
              
              // 立即跳轉
              ultraFastRedirect(cachedUser.uid);
              
              // 在後台嘗試實際登入
              setTimeout(async () => {
                try {
                  await signIn(email, password);
                } catch (e) {
                  // 忽略錯誤，因為用戶已經使用緩存登入
                }
              }, 100);
              
              setIsLoading(false);
              return;
            }
          }
        } catch (e) {
          // 忽略緩存處理錯誤
        }
        
        // 使用 Firebase 登入
        try {
          const { user, error, fromCache } = await signIn(email, password);
          
          if (error) {
            // 特別處理資源限制問題
            // if (resourceLimit) {
            //   toast({
            //     title: "使用離線模式登入",
            //     description: "Firebase服務繁忙，使用本地登入"
            //   });
              
            //   // 如果有緩存的用戶且登入成功
            //   if (user) {
            //     // 存儲當前郵箱作為最後使用的用戶
            //     localStorage.setItem('last_user', email);
                
            //     // 立即跳轉
            //     ultraFastRedirect(user.uid);
            //     setIsLoading(false);
            //     return;
            //   }
            // }
            
            throw new Error(error);
          }
          
          if (user) {
            // 處理離線或緩存登入
            if (fromCache) {
              toast({ 
                title: "登入成功", 
                description: "歡迎回來！" 
              });
              
              // 存儲當前郵箱作為最後使用的用戶
              localStorage.setItem('last_user', email);
              
              // 立即跳轉
              ultraFastRedirect(user.uid);
              setIsLoading(false);
              return;
            }
            
            // 正常登入流程
            initFirebaseAuth();
            toast({ title: "登入成功", description: "歡迎回來！" });
            ultraFastRedirect(user.uid);
            
            // 將非關鍵操作延後
            setTimeout(() => {
              try {
                refreshUserAvatar();
              } catch (e) {
                // 忽略錯誤
              }
            }, 100);
          }
        } catch (authError) {
          // 處理特定登入錯誤
          const errorMessage = authError instanceof Error ? authError.message : '登入失敗';
          
          // 再次嘗試緩存登入（作為最後的降級手段）
          try {
            const lastUser = localStorage.getItem('last_user');
            const cachedUserString = localStorage.getItem('auth_user');
            
            // 如果有緩存且電子郵件匹配
            if (cachedUserString && lastUser === email) {
              const cachedUser = JSON.parse(cachedUserString);
              
              toast({
                title: "嘗試使用緩存登入",
                description: "正常登入失敗，使用備用方式"
              });
              
              ultraFastRedirect(cachedUser.uid);
              setIsLoading(false);
              return;
            }
          } catch (e) {
            // 忽略備用方案錯誤
          }
          
          // 徹底失敗，顯示錯誤
          toast({
            title: "登入失敗",
            description: errorMessage,
            variant: "destructive",
          });
        }
      } else {
        // 使用 Firebase 註冊
        log.debug('嘗試 Firebase 註冊', { 
          email: email.substring(0, 3) + '***', // 只記錄部分郵件，保護隱私
          timestamp: Date.now()
        }, 'Auth');
        
        const { user, error } = await signUp(email, password);
        if (error) throw new Error(error);
        
        if (user) {
          log.debug('Firebase 註冊成功', { 
            userId: user.uid, 
            email: user.email
          }, 'Auth');
          
          // 確保 Firebase Auth 狀態更新
          initFirebaseAuth();
          
          // 強制刷新頭像
          refreshUserAvatar();
          
          // 觸發頭像更新事件
          window.dispatchEvent(new CustomEvent('avatar-updated', { 
            detail: { 
              userId: user.uid,
              timestamp: Date.now(),
              source: 'Auth'
            }
          }));
          
          toast({ title: "註冊成功", description: "帳號創建完成，正在為你登入..." });
          
          // 延遲跳轉，給認證狀態更新更多時間
          log.debug('準備導航到 /prayers (註冊後)', { 
            userId: user.uid,
            currentPath: window.location.pathname
          }, 'Auth');
          
          // 簡化導航邏輯，使用 setTimeout + window.location.replace
          setTimeout(() => {
            log.debug('執行導航到 /prayers (註冊後)', { 
              userId: user.uid,
              authState: !!user,
              timestamp: Date.now()
            }, 'Auth');
            
            // 使用 replace 而不是 href，避免瀏覽器歷史記錄問題
            window.location.replace('/prayers');
          }, 1500); // 增加到 1.5 秒
        } else {
          toast({ title: "註冊完成", description: "請檢查你的電子信箱以完成帳號啟用" });
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "請稍後再試";
      
      // 處理配額超出的特殊情況
      if (errorMessage.includes('quota') || 
          errorMessage.includes('AUTH_QUOTA_LIMIT') ||
          errorMessage.includes('認證服務暫時不可用') ||
          errorMessage.includes('INSUFFICIENT_RESOURCES') ||
          errorMessage.includes('Firebase 服務暫時不可用')) {
          
        // 檢查是否有緩存的用戶資訊
        const cachedUser = localStorage.getItem('auth_user');
        if (cachedUser && email) {
          try {
            const userData = JSON.parse(cachedUser);
            
            // 記錄上次使用的電子郵件，便於下次快速緩存恢復
            localStorage.setItem('last_user', email);
            
            toast({
              title: "使用備用登入方式",
              description: "Firebase服務繁忙，使用本地認證"
            });
            
            // 立即跳轉
            ultraFastRedirect(userData.uid);
            setIsLoading(false);
            return;
          } catch (e) {
            // 忽略錯誤並繼續下面的錯誤處理
          }
        }
        
        toast({
          title: "伺服器忙碌中",
          description: "請稍後再試，或使用訪客登入",
          variant: "destructive",
        });
      } else {
        // 一般錯誤處理
        toast({
          title: isLogin ? "登入失敗" : "註冊失敗",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestAccess = () => {
    try {
      log.debug('嘗試進入訪客模式', { currentPath: window.location.pathname }, 'Auth');
      
      // 設置訪客模式
      localStorage.setItem('guestMode', 'true');
      
      // 顯示訪客登入成功提示
      toast({ title: "訪客登入中...", description: "請稍候" });
      
      // 確保頁面重新導向
      console.log('準備導航到訪客模式 /prayers 頁面');
      
      // 使用 setTimeout 確保 localStorage 設置有時間完成
      setTimeout(() => {
        // 使用直接的導航方式
        window.location.href = '/prayers';
      }, 100);
    } catch (error) {
      console.error('訪客模式導航失敗', error);
      // 降級方案 - 如果發生錯誤，使用最簡單的跳轉
      window.location.href = '/prayers';
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FFE5D9' }}>
      <div className="flex-1 flex flex-col items-center px-6 py-8">
        <div className="relative z-10 w-full max-w-sm">
          <AuthForm 
            email={email}
            password={password}
            isLogin={isLogin}
            isLoading={isLoading}
            onEmailChange={(e) => setEmail(e.target.value)}
            onPasswordChange={(e) => setPassword(e.target.value)}
            onToggle={() => setIsLogin(!isLogin)}
            onSubmit={handleSubmit}
          />
        </div>
        
        <div 
          style={{ 
            position: 'absolute', 
            top: '544px', 
            left: '50%', 
            transform: 'translateX(-50%)',
            width: '270px',
            zIndex: 20
          }}
        >
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isLoading}
            className="text-black w-full"
            style={{ 
              backgroundColor: '#95d2f4',
              height: '30px',
              borderRadius: '15px',
              fontSize: '14px',
              opacity: isLoading ? 0.7 : 1,
              marginBottom: '40px'
            }}
          >
            {isLoading ? '處理中...' : (isLogin ? '登入帳號' : '註冊帳號')}
          </button>
          <button
            type="button"
            onClick={handleGuestAccess}
            className="text-black w-full"
            style={{ 
              backgroundColor: '#4D9BD9',
              height: '30px',
              borderRadius: '15px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            訪客帳號
          </button>
        </div>
      </div>
    </div>
  );
} 