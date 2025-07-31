import { db, auth } from '@/integrations/firebase/client';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp, 
  Timestamp,
  DocumentData,
  writeBatch
} from 'firebase/firestore';
import { BaseService } from '../base/BaseService';
import { log } from '@/lib/logger';
import { ERROR_MESSAGES } from '@/constants';
import type { Prayer, CreatePrayerRequest } from '@/types/prayer';
import { getUnifiedUserName } from '@/lib/getUnifiedUserName';

/**
 * 使用 Firebase 實現的代禱服務
 */
export class FirebasePrayerService extends BaseService {
  private readonly PRAYERS_COLLECTION = 'prayers';
  private readonly PRAYER_RESPONSES_COLLECTION = 'prayer_responses';
  private readonly PRAYER_LIKES_COLLECTION = 'prayer_likes';
  
  constructor() {
    super('FirebasePrayerService');
  }

  /**
   * 將 Firestore 文檔轉換為 Prayer 物件
   */
  private convertDocToPrayer(doc: DocumentData): Prayer {
    const data = doc.data();
    
    // 處理 Firestore 中的時間戳轉換為 ISO 字符串
    const createdAt = data.created_at instanceof Timestamp 
      ? data.created_at.toDate().toISOString() 
      : data.created_at;
      
    const updatedAt = data.updated_at instanceof Timestamp 
      ? data.updated_at.toDate().toISOString() 
      : (data.updated_at || createdAt);
      
    return {
      id: doc.id,
      content: data.content,
      is_anonymous: data.is_anonymous,
      user_name: data.user_name,
      user_avatar: data.user_avatar,
      user_id: data.user_id,
      created_at: createdAt,
      updated_at: updatedAt,
      image_url: data.image_url || null,
      is_answered: data.is_answered || false,
      response_count: data.response_count || 0,
      prayer_type: data.prayer_type || 'prayer', // 預設為一般代禱
    };
  }

  /**
   * 獲取所有代禱
   */
  async getAllPrayers(): Promise<Prayer[]> {
    this.logOperation('getAllPrayers');
    
    try {
      const prayersQuery = query(
        collection(db(), this.PRAYERS_COLLECTION),
        orderBy('created_at', 'desc')
      );
      
      const querySnapshot = await getDocs(prayersQuery);
      const prayers: Prayer[] = querySnapshot.docs.map(doc => this.convertDocToPrayer(doc));
      
      this.logOperation('getAllPrayers success', { count: prayers.length });
      return prayers;

    } catch (error) {
      this.handleError(error, 'getAllPrayers');
      throw error;
    }
  }

  /**
   * 根據 ID 獲取代禱
   */
  async getPrayerById(id: string): Promise<Prayer | null> {
    this.logOperation('getPrayerById', { id });
    
    try {
      const prayerDoc = await getDoc(doc(db(), this.PRAYERS_COLLECTION, id));
      
      if (!prayerDoc.exists()) {
        return null;
      }
      
      this.logOperation('getPrayerById success', { id });
      return this.convertDocToPrayer(prayerDoc);
    } catch (error) {
      this.handleError(error, 'getPrayerById');
      throw error;
    }
  }

  /**
   * 創建新代禱
   */
  async createPrayer(prayer: CreatePrayerRequest): Promise<Prayer> {
    this.logOperation('createPrayer', prayer);
    
    try {
      const user = auth();
      const currentUser = user.currentUser;
      
      const prayerData = {
        content: prayer.content,
        user_id: currentUser?.uid || prayer.user_id || null,
        user_name: prayer.user_name || (currentUser ? getUnifiedUserName(currentUser, prayer.is_anonymous) : '訪客'),
        user_avatar: prayer.user_avatar || (currentUser && !prayer.is_anonymous ? currentUser.photoURL : null),
        is_anonymous: currentUser ? prayer.is_anonymous : true,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        image_url: prayer.image_url || null,
        is_answered: false,
        response_count: 0,
        // prayer_type is no longer needed here for new prayers
      };
      
      const docRef = await addDoc(collection(db(), this.PRAYERS_COLLECTION), prayerData);
      
      // 獲取完整數據以返回
      const newDocSnapshot = await getDoc(docRef);
      if (!newDocSnapshot.exists()) {
        throw new Error('創建代禱失敗：無法獲取新建的代禱數據');
      }
      
      this.logOperation('createPrayer success', { id: docRef.id, prayer_type: prayer.prayer_type });
      
      // 將服務端時間戳轉換為 ISO 字符串格式
      const newPrayer = this.convertDocToPrayer(newDocSnapshot);
      return newPrayer;
    } catch (error) {
      this.handleError(error, 'createPrayer');
      throw new Error(ERROR_MESSAGES.PRAYER_CREATE_ERROR);
    }
  }

  /**
   * 更新代禱內容
   */
  async updatePrayer(id: string, content: string): Promise<Prayer | null> {
    this.logOperation('updatePrayer', { id, contentLength: content.length });
    
    try {
      const user = auth();
      if (!user.currentUser) {
        throw new Error(ERROR_MESSAGES.AUTH_ERROR);
      }
      
      // 檢查代禱是否存在且屬於當前用戶
      const existingPrayer = await this.getPrayerById(id);
      if (!existingPrayer) {
        throw new Error('代禱不存在');
      }
      
      if (existingPrayer.user_id !== user.currentUser.uid) {
        throw new Error(ERROR_MESSAGES.PERMISSION_ERROR);
      }
      
      const prayerRef = doc(db(), this.PRAYERS_COLLECTION, id);
      await updateDoc(prayerRef, {
        content: content.trim(),
        updated_at: serverTimestamp()
      });
      
      // 獲取更新後的數據
      const updatedPrayer = await this.getPrayerById(id);
      
      this.logOperation('updatePrayer success', { id });
      return updatedPrayer;
    } catch (error) {
      this.handleError(error, 'updatePrayer');
      throw error;
    }
  }

  /**
   * 刪除代禱
   */
  async deletePrayer(id: string): Promise<void> {
    this.logOperation('deletePrayer', { id });
    
    try {
      const user = auth();
      if (!user.currentUser) {
        throw new Error('需要登入才能刪除代禱');
      }
      
      const existingPrayer = await this.getPrayerById(id);
      if (!existingPrayer) {
        throw new Error('代禱不存在');
      }
      
      if (existingPrayer.user_id !== user.currentUser.uid) {
        throw new Error(ERROR_MESSAGES.PERMISSION_ERROR);
      }
      
      await deleteDoc(doc(db(), this.PRAYERS_COLLECTION, id));
      
      // 同步刪除相關回應和點讚
      // TODO: 如有需要，實現批量刪除相關資料的功能
      
      this.logOperation('deletePrayer success', { id });
    } catch (error) {
      this.handleError(error, 'deletePrayer');
      throw error;
    }
  }

  /**
   * 根據用戶 ID 獲取代禱列表
   */
  async getPrayersByUserId(userId: string): Promise<Prayer[]> {
    this.logOperation('getPrayersByUserId', { userId });
    
    try {
      const prayersQuery = query(
        collection(db(), this.PRAYERS_COLLECTION),
        where('user_id', '==', userId),
        orderBy('created_at', 'desc')
      );
      
      const querySnapshot = await getDocs(prayersQuery);
      const prayers: Prayer[] = [];
      
      for (const doc of querySnapshot.docs) {
        prayers.push(this.convertDocToPrayer(doc));
      }
      
      this.logOperation('getPrayersByUserId success', { 
        userId, 
        count: prayers.length 
      });
      
      return prayers;
    } catch (error) {
      this.handleError(error, 'getPrayersByUserId');
      throw error;
    }
  }

  /**
   * 獲取當前用戶的代禱列表，支持分頁
   */
  async getMyPrayers({ userId, limit = 10, offset = 0 }: { userId: string, limit?: number, offset?: number }): Promise<Prayer[]> {
    this.logOperation('getMyPrayers', { userId, limit, offset });
    
    try {
      // Firestore 不支持 offset 分頁，我們使用 limit 和 startAfter
      // 這裡簡化實現，直接獲取所有數據並手動分頁
      const allPrayers = await this.getPrayersByUserId(userId);
      
      // 手動分頁
      const prayersPage = allPrayers.slice(offset, offset + limit);
      
      this.logOperation('getMyPrayers success', { 
        userId, 
        count: prayersPage.length 
      });
      
      return prayersPage;
    } catch (error) {
      this.handleError(error, 'getMyPrayers');
      throw error;
    }
  }

  /**
   * 獲取用戶統計信息：代禱次數、回應次數和獲得愛心數
   */
  async getUserStats(userId: string): Promise<{
    prayerCount: number;
    responseCount: number;
    receivedLikesCount: number;
  }> {
    this.logOperation('getUserStats', { userId });
    
    try {
      // 1. 獲取代禱次數
      const prayersQuery = query(
        collection(db(), this.PRAYERS_COLLECTION),
        where('user_id', '==', userId)
      );
      const prayersSnapshot = await getDocs(prayersQuery);
      const prayerCount = prayersSnapshot.size;
      
      // 2. 獲取回應次數
      const responsesQuery = query(
        collection(db(), this.PRAYER_RESPONSES_COLLECTION),
        where('user_id', '==', userId)
      );
      const responsesSnapshot = await getDocs(responsesQuery);
      const responseCount = responsesSnapshot.size;
      
      // 3. 獲取獲得的愛心數 (簡化實現)
      // 實際應用中可能需要更複雜的查詢
      const likesQuery = query(
        collection(db(), this.PRAYER_LIKES_COLLECTION),
        where('liked_user_id', '==', userId)
      );
      const likesSnapshot = await getDocs(likesQuery);
      const receivedLikesCount = likesSnapshot.size;
      
      this.logOperation('getUserStats success', { 
        userId, 
        prayerCount,
        responseCount,
        receivedLikesCount 
      });
      
      return {
        prayerCount,
        responseCount,
        receivedLikesCount
      };
    } catch (error) {
      this.handleError(error, 'getUserStats');
      // 出錯時返回默認值
      return {
        prayerCount: 0,
        responseCount: 0,
        receivedLikesCount: 0
      };
    }
  }

  /**
   * 更新代禱的已回應狀態
   */
  async updatePrayerAnsweredStatus(prayerId: string, isAnswered: boolean): Promise<Prayer | null> {
    this.logOperation('updatePrayerAnsweredStatus', { prayerId, isAnswered });
    
    try {
      const user = auth();
      if (!user.currentUser) {
        throw new Error(ERROR_MESSAGES.AUTH_ERROR);
      }
      
      // 檢查代禱是否存在且屬於當前用戶
      const existingPrayer = await this.getPrayerById(prayerId);
      if (!existingPrayer) {
        throw new Error('代禱不存在');
      }
      
      if (existingPrayer.user_id !== user.currentUser.uid) {
        throw new Error(ERROR_MESSAGES.PERMISSION_ERROR);
      }
      
      const prayerRef = doc(db(), this.PRAYERS_COLLECTION, prayerId);
      await updateDoc(prayerRef, {
        is_answered: isAnswered,
        updated_at: serverTimestamp()
      });
      
      // 獲取更新後的數據
      const updatedPrayer = await this.getPrayerById(prayerId);
      
      this.logOperation('updatePrayerAnsweredStatus success', { prayerId, isAnswered });
      return updatedPrayer;
    } catch (error) {
      this.handleError(error, 'updatePrayerAnsweredStatus');
      throw error;
    }
  }

  /**
   * 更新代禱的回應數量
   */
  async updateResponseCount(prayerId: string): Promise<void> {
    this.logOperation('updateResponseCount', { prayerId });
    
    try {
      // 獲取所有相關回應
      const responsesQuery = query(
        collection(db(), this.PRAYER_RESPONSES_COLLECTION),
        where('prayer_id', '==', prayerId)
      );
      
      const responsesSnapshot = await getDocs(responsesQuery);
      const responseCount = responsesSnapshot.size;
      
      // 更新代禱文檔中的回應數量
      const prayerRef = doc(db(), this.PRAYERS_COLLECTION, prayerId);
      await updateDoc(prayerRef, {
        response_count: responseCount
      });
      
      this.logOperation('updateResponseCount success', { prayerId, responseCount });
    } catch (error) {
      this.handleError(error, 'updateResponseCount');
      // 這裡不拋出錯誤，因為這是一個輔助操作
    }
  }

  /**
   * 更新代禱的任意字段
   * 用於內部服務調用，不進行權限檢查
   */
  async updatePrayerFields(id: string, fields: Record<string, unknown>): Promise<Prayer | null> {
    this.logOperation('updatePrayerFields', { id, fields: Object.keys(fields) });
    
    try {
      // 檢查代禱是否存在
      const existingPrayer = await this.getPrayerById(id);
      if (!existingPrayer) {
        throw new Error('代禱不存在');
      }
      
      // 添加更新時間
      const updateData = {
        ...fields,
        updated_at: serverTimestamp()
      };
      
      const prayerRef = doc(db(), this.PRAYERS_COLLECTION, id);
      await updateDoc(prayerRef, updateData);
      
      // 獲取更新後的數據
      const updatedPrayer = await this.getPrayerById(id);
      
      this.logOperation('updatePrayerFields success', { id, fields: Object.keys(fields) });
      return updatedPrayer;
    } catch (error) {
      this.handleError(error, 'updatePrayerFields');
      throw error;
    }
  }

  // 刪除重複函數 - 已經在文件中存在更完整的版本
} 