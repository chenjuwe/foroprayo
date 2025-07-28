
import React from 'react';

interface AuthDescriptionProps {
  isLogin: boolean;
}

export function AuthDescription({ isLogin }: AuthDescriptionProps) {
  return (
    <div className="text-black leading-relaxed text-left" style={{ 
      width: '270px', 
      fontSize: '14px', 
      position: 'absolute',
      top: '158px',
      left: '50%',
      transform: 'translateX(-50%)'
    }}>
      {isLogin ? (
        <>
          登入帳號後，代禱紀錄會自動儲存於雲端，
          <br />
          讓每一次代禱都即時同步到你的每一個設備
          <br />
          ，也可以跟好友互相禱告！
        </>
      ) : (
        <>
          三步驟註冊帳號！
          <br />
          不需要其他的個人資料，
          <br />
          隱私安全又保密。
        </>
      )}
    </div>
  );
}
