import React from 'react';

interface GuestAvatarProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * 專門用於顯示訪客頭像的組件，強制使用淺藍色背景和黑色字母G
 */
export const GuestAvatar: React.FC<GuestAvatarProps> = ({ 
  className = '', 
  size = 'md' 
}) => {
  // 根據尺寸決定實際像素大小
  const sizeMap = {
    sm: 30,
    md: 40,
    lg: 48
  };

  const pixelSize = sizeMap[size];
  const fontSize = size === 'sm' ? 14 : size === 'md' ? 18 : 22;

  return (
    <div 
      className={`flex items-center justify-center rounded-full guest-avatar ${className}`}
      style={{ 
        width: pixelSize, 
        height: pixelSize, 
        backgroundColor: '#95d2f4', 
        color: '#000000',
        fontSize: `${fontSize}px`,
        fontWeight: 500,
        overflow: 'hidden'
      }}
    >
      G
    </div>
  );
};

export default GuestAvatar; 