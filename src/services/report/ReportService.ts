import { BaseService } from '../base/BaseService';
import { CreateReportData, Report } from '../../types/common';
import { FirebaseReportService } from './FirebaseReportService';

export class ReportService extends BaseService {
  private firebaseReportService: FirebaseReportService;

  constructor() {
    super('ReportService');
    this.firebaseReportService = new FirebaseReportService();
  }

  /**
   * 創建檢舉
   */
  async createReport(data: CreateReportData): Promise<Report> {
    return this.firebaseReportService.createReport(data);
  }

  /**
   * 獲取所有檢舉（管理員用）
   */
  async getReports(status?: string): Promise<Report[]> {
    // Firebase 實現中可能需要傳遞 status
    return this.firebaseReportService.getReports(status);
  }

  /**
   * 更新檢舉狀態
   */
  async updateReportStatus(
    reportId: string, 
    status: 'reviewed' | 'resolved' | 'dismissed',
    adminNotes?: string
  ): Promise<Report> {
    return this.firebaseReportService.updateReportStatus(reportId, status, adminNotes);
  }

  /**
   * 刪除檢舉
   */
  async deleteReport(reportId: string): Promise<void> {
    return this.firebaseReportService.deleteReport(reportId);
  }
} 