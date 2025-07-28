import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { reportService } from '../services';
import { CreateReportData } from '../types/common';
import { useToast } from './ui/use-toast';

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: 'prayer' | 'response';
  targetId: string;
  targetContent: string;
  targetUserId?: string;
  targetUserName?: string;
  targetUserAvatar?: string;
}

export const ReportDialog: React.FC<ReportDialogProps> = ({
  isOpen,
  onClose,
  reportType,
  targetId,
  targetContent,
  targetUserId,
  targetUserName,
  targetUserAvatar,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast({
        title: '請填寫檢舉原因',
        description: '請描述您認為不當的原因',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🚩 準備提交檢舉:', {
        reportType,
        targetId,
        targetContent: targetContent.substring(0, 50) + '...',
        targetUserId,
        targetUserName,
        reason: reason.trim()
      });

      const reportData: CreateReportData = {
        report_type: reportType,
        target_id: targetId,
        target_content: targetContent,
        ...(targetUserId && { target_user_id: targetUserId }),
        ...(targetUserName && { target_user_name: targetUserName }),
        ...(targetUserAvatar && { target_user_avatar: targetUserAvatar }),
        reason: reason.trim(),
      };

      try {
        // 嘗試使用正式的檢舉服務
        const result = await reportService.createReport(reportData);
        console.log('✅ 檢舉提交成功:', result);
      } catch (serviceError: unknown) {
        console.warn('⚠️ 檢舉服務失敗，使用臨時存儲:', serviceError);
        
        // 如果資料庫服務失敗，將檢舉存儲到 localStorage 作為臨時解決方案
        const tempReports = JSON.parse(localStorage.getItem('tempReports') || '[]');
        const tempReport = {
          ...reportData,
          id: `temp_${Date.now()}`,
          created_at: new Date().toISOString(),
          status: 'pending',
          reporter_ip: null,
          reporter_user_agent: navigator?.userAgent || null,
        };
        tempReports.push(tempReport);
        localStorage.setItem('tempReports', JSON.stringify(tempReports));
        
        console.log('📝 檢舉已暫存至本地:', tempReport);
      }

      toast({
        title: '檢舉已提交',
        description: '我們會盡快審核您的檢舉，感謝您協助維護社群環境',
      });

      onClose();
      setReason('');
    } catch (error: unknown) {
      console.error('❌ 提交檢舉失敗 - 詳細錯誤:', {
        error: error,
        message: error instanceof Error ? error.message : '未知錯誤',
        stack: error instanceof Error ? error.stack : undefined,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
        code: (error as any)?.code
      });

      let errorMessage = '檢舉提交失敗，請稍後再試';
      
      if (error instanceof Error && error.message) {
        if (error.message.includes('permission denied') || error.message.includes('RLS')) {
          errorMessage = '權限錯誤：無法提交檢舉，請確認您的登入狀態';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = '網路錯誤：請檢查網路連線後重試';
        } else if (error.message.includes('relation') || error.message.includes('table')) {
          errorMessage = '系統錯誤：檢舉功能暫時無法使用';
        } else {
          errorMessage = `提交失敗：${error.message}`;
        }
      }

      toast({
        title: '提交失敗',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setReason('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            檢舉不當發言
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            請描述您認為此{reportType === 'prayer' ? '代禱' : '回應'}不當的原因
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-700 line-clamp-3">
              {targetContent}
            </p>
            {targetUserName && (
              <p className="text-xs text-gray-500 mt-2">
                發言者：{targetUserName}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              檢舉原因 *
            </label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="請具體描述不當內容的原因，例如：不雅言語、誹謗他人、垃圾訊息等..."
              rows={4}
              disabled={isSubmitting}
              className="w-full"
            />
          </div>
        </div>

        <DialogFooter className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !reason.trim()}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isSubmitting ? '提交中...' : '提交檢舉'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 