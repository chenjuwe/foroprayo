import React from 'react';
import { AuthDescription } from './AuthDescription';
import { AuthInputs } from './AuthInputs';
import { AuthButtons } from './AuthButtons';
import { AuthToggle } from './AuthToggle'; // 確保導入 AuthToggle
import { AuthFooter } from './AuthFooter'; // 確保導入 AuthFooter

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
  
  const handleForgotPassword = async () => {
    // 忘記密碼邏輯可以保留或同樣提升
    console.log("Forgot password clicked"); 
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
