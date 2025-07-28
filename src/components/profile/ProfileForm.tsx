
import React, { useEffect, useState, useRef } from 'react';
import { log } from '@/lib/logger';

interface ProfileFormProps {
  email: string;
  newUsername: string;
  password?: string;
  onUsernameChange: (value: string) => void;
  onPasswordChange?: (value: string) => void;
  scripture: string;
  onScriptureChange: (value: string) => void;
  isEditingMode?: boolean;
  onEditingChange?: (isEditing: boolean) => void;
  showOriginalFields?: boolean;
  isScriptureEditing?: boolean;
  onScriptureEditingChange?: (isEditing: boolean) => void;
  onConfirmChanges?: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function ProfileForm({
  email,
  newUsername,
  password = '',
  onUsernameChange,
  onPasswordChange = () => {},
  scripture = '',
  onScriptureChange,
  isEditingMode,
  onEditingChange = () => {},
  showOriginalFields = true,
  isScriptureEditing = false,
  onScriptureEditingChange = () => {},
  onConfirmChanges = () => {},
  loading = false,
  disabled = false,
}: ProfileFormProps) {
  // 用於經文輸入的狀態
  const [scriptureValue, setScriptureValue] = useState(scripture);
  const [isEditing, setIsEditing] = useState(isEditingMode || false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // 當外部 props 變化時更新本地狀態
  useEffect(() => {
    log.debug('ProfileForm: scripture prop 變化', { scripture }, 'ProfileForm');
    setScriptureValue(scripture);
  }, [scripture]);
  
  // 同步外部編輯狀態
  useEffect(() => {
    if (isEditingMode !== undefined) {
      setIsEditing(isEditingMode);
    }
  }, [isEditingMode]);

  // 同步外部編輯狀態 - 經文編輯
  useEffect(() => {
    if (isScriptureEditing !== undefined) {
      setIsEditing(isScriptureEditing);
    }
  }, [isScriptureEditing]);
  
  // 自動調整 textarea 高度
  useEffect(() => {
    const adjustHeight = () => {
      const textarea = textareaRef.current;
      if (textarea) {
        // 先重設高度，確保準確計算所需高度
        textarea.style.height = 'auto';
        
        // 計算需要的確切高度並加上一點額外空間確保完整顯示
        const requiredHeight = textarea.scrollHeight;
        textarea.style.height = `${requiredHeight}px`;
        
        // 再次檢查是否需要更多空間
        if (textarea.scrollHeight > requiredHeight) {
          textarea.style.height = `${textarea.scrollHeight + 5}px`;
        }
      }
    };
    
    // 初始調整
    adjustHeight();
    
    // 添加一個短暫的延遲再次調整，確保在渲染後高度正確
    const timer = setTimeout(adjustHeight, 10);
    return () => clearTimeout(timer);
  }, [scriptureValue]);
  
  // 處理經文輸入
  const handleScriptureChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setScriptureValue(value);
    onScriptureChange(value);
    
    // 如果有提供 onScriptureEditingChange，則設置為編輯狀態
    if (!isScriptureEditing && onScriptureEditingChange) {
      onScriptureEditingChange(true);
    }
  };

  // 阻止所有按鍵事件的默認行為
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // 允許在 textarea 中使用 Enter 鍵換行
      if (e.target instanceof HTMLTextAreaElement) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
    }
  };
  
  // 點擊文字區域進入編輯模式
  const handleTextAreaClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    // 檢查是否有選取文字，如果有，不要進入編輯模式
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      // 有選取文字，不做任何操作，允許用戶進行文字選取
      return;
    }
    
    if (!isEditing) {
      setIsEditing(true);
      onEditingChange(true);
      onScriptureEditingChange(true);
      // 聚焦到文本區域
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 0);
    }
  };
  
  // 當文本區域失去焦點時，不要自動退出編輯模式
  // 讓用戶有機會點擊確認按鈕或選取文字
  const handleTextAreaBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    // 檢查是否有選取文字，如果有，不要做任何處理
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      // 有選取文字，阻止默認行為，保持選取狀態
      e.preventDefault();
      return;
    }
    
    // 不在這裡設置 isEditing 為 false
    // 而是讓父組件在用戶確認後處理
  };

  return (
    <div className="flex flex-col items-center justify-center w-full" style={{ padding: '10px 0', marginBottom: '20px' }}>
      {/* Username display/input */}
      <div className="relative" style={{ width: '270px', marginTop: '20px' }}>
        <input
          type="text"
          value={newUsername}
          onChange={(e) => onUsernameChange(e.target.value)}
          placeholder="輸入您的名稱"
          className="w-full bg-transparent pb-1 text-black placeholder-[#1694da] focus:outline-none text-xl font-semibold rounded-none text-center"
          autoComplete="off"
          data-form-type="other"
          onKeyDown={handleKeyDown}
          disabled={disabled}
          style={{
            lineHeight: '1.5',
            borderBottomWidth: '0px',
            borderBottomStyle: 'solid',
            borderBottomColor: '#1694da',
          }}
        />
      </div>
      
      {/* 經文輸入 */}
      <div className="relative" style={{ width: '270px', marginTop: '64px', overflowY: 'visible' }}>
        <textarea
          ref={textareaRef}
          value={scriptureValue}
          onChange={handleScriptureChange}
          onKeyDown={handleKeyDown}
          onClick={handleTextAreaClick}
          onBlur={handleTextAreaBlur}
          placeholder={scriptureValue ? '' : "輸入您喜愛的經文"} // 只在沒有經文時顯示 placeholder
          className="w-full bg-transparent pb-2 text-black placeholder-[#1694da] focus:outline-none text-sm rounded-none resize-none"
          autoComplete="off"
          data-form-type="other"
          rows={1}
          disabled={disabled}
          style={{
            minHeight: '24px',
            maxHeight: 'none',  // 移除最大高度限制
            lineHeight: '1.5',
            borderBottomWidth: isEditing ? '1px' : '0px',
            borderBottomStyle: 'solid',
            borderBottomColor: '#1694da',
            userSelect: 'text',
            WebkitUserSelect: 'text',
            MozUserSelect: 'text',
            msUserSelect: 'text',
            whiteSpace: 'pre-wrap', // 保留換行和空格
            overflowWrap: 'break-word', // 確保長單詞可以換行
            display: 'block', // 確保元素顯示為塊級元素
            width: '100%' // 確保寬度使用全部可用空間
          }}
        />
      </div>
      
      {/* 確認更改按鈕 - 只在編輯模式下顯示 */}
      {onConfirmChanges && isEditing && (
        <div className="flex justify-end w-full" style={{ width: '270px', marginTop: '20px', paddingRight: '34px' }}>
          <button
            onClick={onConfirmChanges}
            disabled={loading}
            className="bg-[#1694da] text-black rounded-full hover:bg-[#1585c3] focus:outline-none focus:ring-2 focus:ring-[#1694da] focus:ring-opacity-50 transition-colors"
            style={{
              fontSize: '14px',
              width: '92px',
              height: '30px',
              padding: '0px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {loading ? '處理中...' : '確認更改'}
          </button>
        </div>
      )}
    </div>
  );
}
