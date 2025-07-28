import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { log } from '@/lib/logger';

interface MessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  targetUserName?: string;
}

export function MessageDialog({ isOpen, onClose, targetUserId, targetUserName }: MessageDialogProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error('請輸入訊息內容');
      return;
    }

    setIsSending(true);
    try {
      // 模擬訊息發送功能
      // 這裡可以根據實際需求實現真正的訊息系統
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模擬網路延遲
      
      log.info('訊息發送成功', { 
        targetUserId, 
        targetUserName, 
        messageLength: message.trim().length 
      }, 'MessageDialog');

      toast.success('訊息已發送！');
      setMessage('');
      onClose();
    } catch (error) {
      log.error('發送訊息失敗', error, 'MessageDialog');
      toast.error('發送訊息失敗，請稍後再試');
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (!isSending) {
      setMessage('');
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[#1e40af]" style={{ fontSize: '14px' }}>
            傳送訊息給 {targetUserName || '用戶'}
          </AlertDialogTitle>
        </AlertDialogHeader>
        
        <div className="px-4" style={{ marginTop: '0px' }}>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="輸入您的訊息..."
            className="min-h-[100px] resize-none bg-white focus:outline-none focus:ring-0 focus:border-gray-300"
            style={{ 
              borderRadius: '0px',
              backgroundColor: 'white',
              fontSize: '14px',
              border: '1px solid #d1d5db',
              outline: 'none',
              boxShadow: 'none'
            }}
            disabled={isSending}
            maxLength={500}
          />
          <div className="text-gray-500 text-right mt-1" style={{ fontSize: '14px' }}>
            {message.length}/500
          </div>
        </div>

        <AlertDialogFooter style={{ flexDirection: 'row-reverse', gap: '8px' }}>
          <AlertDialogAction
            onClick={handleSendMessage}
            disabled={isSending || !message.trim()}
            className="send-button"
            style={{ 
              fontSize: '14px',
              height: '30px',
              width: '60px',
              borderRadius: 0
            }}
          >
            {isSending ? '發送中...' : '發送'}
          </AlertDialogAction>
          <AlertDialogCancel 
            disabled={isSending} 
            className="cancel-button"
            style={{ 
              fontSize: '14px',
              height: '30px',
              width: '60px',
              borderRadius: 0
            }}
          >
            取消
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 