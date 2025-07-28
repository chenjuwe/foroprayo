import React from 'react';

interface AuthButtonsProps {
  isLogin: boolean;
  isLoading: boolean;
  onForgotPassword: () => void;
  onToggle: () => void;
  onGuestAccess: () => void;
}

export function AuthButtons({ 
  isLogin, 
  isLoading, 
  onForgotPassword, 
  onToggle, 
  onGuestAccess 
}: AuthButtonsProps) {
  
  // 確保按鈕點擊事件被正確處理
  const handleGuestClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onGuestAccess();
  };
  
  return (
    <>
      <div className="flex justify-between items-center pt-4" style={{ width: '270px' }}>
        <button
          type="button"
          onClick={onForgotPassword}
          disabled={isLoading}
          style={{ 
            color: '#1694da',
            fontSize: '14px'
          }}
        >
          忘記密碼
        </button>
        <button
          type="button"
          onClick={onToggle}
          disabled={isLoading}
          style={{ 
            color: '#1694da',
            fontSize: '14px'
          }}
        >
          {isLogin ? '註冊帳號' : '登入帳號'}
        </button>
      </div>
    </>
  );
}
