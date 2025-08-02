import React, { useState, useEffect, useRef } from 'react';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { VALIDATION_CONFIG } from '@/constants';

interface EditPrayerFormProps {
  initialContent: string;
  onSave: (content: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const EditPrayerForm: React.FC<EditPrayerFormProps> = ({
  initialContent,
  onSave,
  onCancel,
  isLoading = false
}) => {
  const [content, setContent] = useState(initialContent);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [rows, setRows] = useState(1);

  // 計算初始內容的行數
  useEffect(() => {
    if (initialContent) {
      // 計算換行符的數量
      const lineCount = (initialContent.match(/\n/g) || []).length + 1;
      // 設置最小行數為2，確保至少有足夠的空間
      setRows(Math.max(lineCount, 2));
    }
  }, [initialContent]);

  // 自動調整輸入框高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  // 鍵盤事件處理
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      if (content.trim()) {
        onSave(content);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSave(content);
    }
  };

  // 字數統計計算
  const characterCount = content.length;
  const maxLength = VALIDATION_CONFIG.PRAYER_CONTENT.MAX_LENGTH;
  const isOverLimit = characterCount > maxLength;
  const isNearLimit = characterCount > maxLength * 0.9;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-normal" style={{ color: '#1694da' }}>重新編輯</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="text-black text-[14px] font-normal"
            style={{ 
              width: '50px',
              height: '30px',
              borderRadius: '15px',
              backgroundColor: '#808080',
              border: 'none'
            }}
          >
            取消
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              if (content.trim()) {
                onSave(content);
              }
            }}
            disabled={!content.trim() || isLoading}
            className="text-[#1694da] text-[14px] font-normal"
            style={{ 
              width: '50px',
              height: '30px',
              borderRadius: '15px',
              backgroundColor: isLoading ? '#E5E7EB' : '#95d2f4',
              border: 'none'
            }}
          >
            {isLoading ? '...' : '保存'}
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4" role="form">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="編輯您的代禱內容..."
          className="resize-none p-3 bg-white"
          style={{
            border: '1px solid #1694da',
            borderRadius: '0',
            height: 'auto',
            minHeight: 'auto',
            overflow: 'hidden'
          }}
          rows={rows}
          autoFocus
          autoComplete="off"
          name="edit-prayer-content"
          aria-label="編輯代禱內容"
        />
        
        {/* 字數顯示 */}
        {content && (
          <div className="text-right">
            <span className={`text-xs ${
              isOverLimit 
                ? 'text-red-500' 
                : isNearLimit 
                  ? 'text-orange-500' 
                  : 'text-gray-500'
            }`}>
              <span data-testid="character-count">{characterCount}</span>
              <span data-testid="character-separator">/</span>
              <span data-testid="character-limit">{maxLength}</span>
            </span>
          </div>
        )}
      </form>
    </div>
  );
};
