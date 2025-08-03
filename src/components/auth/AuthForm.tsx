import React from 'react';
import { AuthDescription } from './AuthDescription';
import { AuthInputs } from './AuthInputs';
import { AuthButtons } from './AuthButtons';
import { AuthToggle } from './AuthToggle'; // 確保導入 AuthToggle
import { AuthFooter } from './AuthFooter'; // 確保導入 AuthFooter
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';

interface AuthFormProps {
  email: string;
  password: string;
  isLogin: boolean;
  isLoading: boolean;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggle: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AuthForm({
  email,
  password,
  isLogin,
  isLoading,
  onEmailChange,
  onPasswordChange,
  onToggle,
  onSubmit
}: AuthFormProps) {
  // 移除本地狀態和 handleSubmit, 因為它們現在由 Auth.tsx 管理
  const { resetPassword } = useFirebaseAuth();
  
  const handleForgotPassword = async () => {
    // 彈出輸入郵箱的對話框
    const userEmail = prompt("請輸入您的郵箱地址來重置密碼：", email);
    
    if (userEmail && userEmail.trim()) {
      try {
        // 直接引導用戶到遷移協助工具進行密碼重置
        const confirmed = window.confirm(
          `將為 ${userEmail.trim()} 進行密碼重置\n\n如果您是從 prayforo 遷移過來的用戶，請使用遷移用戶協助工具進行密碼重置：\nhttp://localhost:5173/migrated-user-helper.html\n\n點擊確定前往協助工具。`
        );
        
        if (confirmed) {
          // 開啟遷移用戶協助工具
          window.open('/migrated-user-helper.html', '_blank');
        }
      } catch (error) {
        console.error('重置密碼錯誤:', error);
        alert('請使用遷移用戶協助工具進行密碼重置：\nhttp://localhost:5173/migrated-user-helper.html');
      }
    }
  };
  
  const handleGuestAccess = () => {
    // 這個按鈕已經被移除了，但為了避免錯誤，暫時保留空函式
    console.log("Guest access (from AuthForm - should not be called)");
  };

  return (
    <div className="flex flex-col items-center" style={{ marginTop: '0' }}>
      <AuthToggle 
        isLogin={isLogin} 
        onToggle={onToggle} 
        isLoading={isLoading} 
      />
      
      <AuthDescription isLogin={isLogin} />
      
      <div style={{ marginTop: '254px' }}>
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-6 flex flex-col items-center" autoComplete="off">
          <AuthInputs
            email={email}
            password={password}
            isLoading={isLoading}
            onEmailChange={onEmailChange}
            onPasswordChange={onPasswordChange}
          />
          
          <AuthButtons
            isLogin={isLogin}
            isLoading={isLoading}
            onForgotPassword={handleForgotPassword}
            onToggle={onToggle}
            onGuestAccess={handleGuestAccess} // 這裡的 onGuestAccess 實際上不會被觸發
          />
          <AuthFooter />
        </form>
      </div>
    </div>
  );
}
