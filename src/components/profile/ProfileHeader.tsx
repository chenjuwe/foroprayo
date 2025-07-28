import React from 'react';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';

interface ProfileHeaderProps {
  onBack: () => void;
}

export function ProfileHeader({ onBack }: ProfileHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 bg-transparent">
      <button
        onClick={onBack}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm"
      >
        <ArrowLeft size={20} className="text-gray-700" />
      </button>
      <h1 className="text-lg font-medium text-black">個人帳號設定</h1>
      <div className="w-10 h-10" /> {/* Spacer for centering */}
    </div>
  );
}
