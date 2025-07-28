import { db } from '../../integrations/firebase/client';
import { BaseService } from '../base/BaseService';
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { log } from '../../lib/logger';
import { Report } from '../../types/common'; // 導入通用的 Report 類型

// 定義 Firebase 版本的 Report 類型
export interface FirebaseReport {
  id: string;
  report_type: 'prayer' | 'response';
  target_id: string;
  target_content: string;
  target_user_id?: string;
  target_user_name?: string;
  target_user_avatar?: string;
  reporter_id?: string | null;
  reporter_ip?: string | null;
  reporter_user_agent?: string | null;
  reason?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  admin_notes?: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// 創建舉報的輸入數據類型
export interface CreateFirebaseReportData {
  report_type: 'prayer' | 'response';
  target_id: string;
  target_content: string;
  target_user_id?: string;
  target_user_name?: string;
  target_user_avatar?: string;
  reporter_id?: string | null;
  reason?: string;
}

export class FirebaseReportService extends BaseService {
  constructor() {
    super('FirebaseReportService');
  }

  // 私有的類型映射函數
  private _mapFirebaseReportToReport(firebaseReport: FirebaseReport): Report {
    return {
      id: firebaseReport.id,
      type: 'report', // 靜態類型
      target_id: firebaseReport.target_id,
      target_type: firebaseReport.report_type, // 'prayer' 或 'response'
      reporter_id: firebaseReport.reporter_id || null,
      reporter_name: 'Unknown', // FirebaseReport 中沒有此欄位
      reason: firebaseReport.reason || '',
      details: firebaseReport.target_content, // 使用 target_content 作為 details
      status: firebaseReport.status,
      created_at: firebaseReport.created_at.toDate().toISOString(),
      updated_at: firebaseReport.updated_at.toDate().toISOString(),
      admin_notes: firebaseReport.admin_notes || null,
      // reporter_avatar 留空，因為它是可選的
    };
  }

  /**
   * 創建檢舉
   */
  async createReport(data: CreateFirebaseReportData): Promise<Report> {
    try {
      this.logOperation('createReport', { reportType: data.report_type });

      // 準備檢舉數據
      const reportData = {
        ...data,
        reporter_ip: null, // 暫時不獲取 IP
        reporter_user_agent: navigator?.userAgent || null,
        status: 'pending' as const,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };

      log.debug('準備插入檢舉數據', reportData, 'FirebaseReportService');

      // 添加到 Firestore
      const reportRef = await addDoc(collection(db(), 'reports'), reportData);
      
      // 獲取完整的文檔數據
      const newReportData: FirebaseReport = {
        id: reportRef.id,
        ...reportData,
        created_at: Timestamp.now(), // 因為 serverTimestamp 在客戶端讀取時不是立即可用
        updated_at: Timestamp.now()
      } as FirebaseReport;

      log.debug('檢舉成功創建', { id: reportRef.id }, 'FirebaseReportService');
      return this._mapFirebaseReportToReport(newReportData);
    } catch (error) {
      log.error('創建檢舉失敗', error, 'FirebaseReportService');
      throw this.handleError(error, 'createReport');
    }
  }

  /**
   * 獲取所有檢舉（管理員用）
   */
  async getReports(status?: string): Promise<Report[]> {
    try {
      this.logOperation('getReports', { status });

      // 創建查詢
      const reportsCollection = collection(db(), 'reports');
      let reportsQuery;

      if (status && status !== 'all') {
        // 按狀態過濾
        reportsQuery = query(
          reportsCollection,
          where('status', '==', status),
          orderBy('created_at', 'desc')
        );
      } else {
        // 獲取所有報告
        reportsQuery = query(
          reportsCollection,
          orderBy('created_at', 'desc')
        );
      }

      // 執行查詢
      const snapshot = await getDocs(reportsQuery);
      
      // 處理結果
      const reports: FirebaseReport[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        reports.push({
          id: doc.id,
          report_type: data.report_type,
          target_id: data.target_id,
          target_content: data.target_content,
          target_user_id: data.target_user_id,
          target_user_name: data.target_user_name,
          target_user_avatar: data.target_user_avatar,
          reporter_id: data.reporter_id || null,
          reporter_ip: data.reporter_ip || null,
          reporter_user_agent: data.reporter_user_agent || null,
          reason: data.reason || '',
          status: data.status || 'pending',
          admin_notes: data.admin_notes || null,
          created_at: data.created_at || Timestamp.now(),
          updated_at: data.updated_at || Timestamp.now()
        } as FirebaseReport);
      });

      log.debug('成功獲取檢舉列表', { 
        count: reports.length,
        status: status || 'all' 
      }, 'FirebaseReportService');
      
      return reports.map(this._mapFirebaseReportToReport);
    } catch (error) {
      log.error('獲取檢舉列表失敗', error, 'FirebaseReportService');
      throw this.handleError(error, 'getReports');
    }
  }

  /**
   * 更新檢舉狀態
   */
  async updateReportStatus(
    reportId: string, 
    status: 'reviewed' | 'resolved' | 'dismissed',
    adminNotes?: string
  ): Promise<Report> {
    try {
      this.logOperation('updateReportStatus', { reportId, status });

      // 更新檢舉狀態
      const reportRef = doc(db(), 'reports', reportId);
      
      await updateDoc(reportRef, { 
        status,
        admin_notes: adminNotes || null,
        updated_at: serverTimestamp()
      });

      // 因為我們沒有完整的 FirebaseReport，所以手動構建一個來映射
      const updatedFirebaseReport: Partial<FirebaseReport> = {
        id: reportId,
        status,
        admin_notes: adminNotes || null,
        updated_at: Timestamp.now(),
        // 為了通過映射，需要添加其他必要欄位
        target_id: 'unknown',
        report_type: 'prayer',
        target_content: 'unknown',
        created_at: Timestamp.now(),
      };
      
      return this._mapFirebaseReportToReport(updatedFirebaseReport as FirebaseReport);
    } catch (error) {
      log.error('更新檢舉狀態失敗', error, 'FirebaseReportService');
      throw this.handleError(error, 'updateReportStatus');
    }
  }

  /**
   * 刪除檢舉
   */
  async deleteReport(reportId: string): Promise<void> {
    try {
      this.logOperation('deleteReport', { reportId });

      // 刪除檢舉
      await deleteDoc(doc(db(), 'reports', reportId));
      log.debug('檢舉刪除成功', { reportId }, 'FirebaseReportService');
    } catch (error) {
      log.error('刪除檢舉失敗', error, 'FirebaseReportService');
      throw this.handleError(error, 'deleteReport');
    }
  }
} 