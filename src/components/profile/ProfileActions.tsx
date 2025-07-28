
import React from 'react';

export function ProfileActions() {
  return (
    <div className="space-y-4">
      <button className="w-full py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors">
        儲存變更
      </button>
      
      <div className="space-y-3">
        <button className="w-full py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
          變更密碼
        </button>
        
        <button className="w-full py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
          隱私設定
        </button>
        
        <button className="w-full py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
          通知設定
        </button>
      </div>
      
      <div className="pt-4 border-t border-gray-200">
        <button className="w-full py-3 bg-white text-red-500 font-medium rounded-lg border border-gray-200 hover:bg-red-50 transition-colors">
          登出帳號
        </button>
      </div>
    </div>
  );
}
