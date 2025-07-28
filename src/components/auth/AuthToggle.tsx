import React from 'react';

interface AuthToggleProps {
  isLogin: boolean;
  onToggle: () => void;
  isLoading: boolean;
}

export function AuthToggle({ isLogin, onToggle, isLoading }: AuthToggleProps) {
  return (
    <div className="mb-8" style={{ position: 'absolute', top: '77px', left: '50%', transform: 'translateX(-50%)' }}>
      <button
        onClick={onToggle}
        disabled={isLoading}
        className="text-black"
        style={{ 
          backgroundColor: '#ffb3b3',
          width: '100px',
          height: '30px',
          borderRadius: '15px',
          fontSize: '14px'
        }}
      >
        {isLogin ? '登入帳號' : '註冊帳號'}
      </button>
    </div>
  );
}
