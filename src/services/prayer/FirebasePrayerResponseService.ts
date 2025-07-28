import { db, auth } from '@/integrations/firebase/client';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  Timestamp,
  DocumentData, 
  runTransaction
} from 'firebase/firestore';
import { BaseService } from '../base/BaseService';
import { log } from '@/lib/logger';
import { ERROR_MESSAGES } from '@/constants';
import type { PrayerResponse, CreateResponseRequest } from '@/types/prayer';
import { getUnifiedUserName } from '@/lib/getUnifiedUserName';
import { firebasePrayerService } from '../index';

/**
 * 使用 Firebase 實現的代禱回應服務
 */
export class FirebasePrayerResponseService extends BaseService {
  private readonly PRAYER_RESPONSES_COLLECTION = 'prayer_responses';
  private readonly PRAYERS_COLLECTION = 'prayers';
  
  constructor() {
    super('FirebasePrayerResponseService');
  }

  /**
   * 將 Firestore 文檔轉換為 PrayerResponse 物件
   */
  private convertDocToResponse(doc: DocumentData): PrayerResponse {
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
      user_name: data.user_name,
      user_avatar: data.user_avatar,
      user_id: data.user_id,
      prayer_id: data.prayer_id,
      created_at: createdAt,
      updated_at: updatedAt,
      image_url: data.image_url || null,
      is_anonymous: data.is_anonymous || false, // 添加缺失的屬性
    };
  }

  /**
   * 獲取指定代禱的所有回應
   */
  async getPrayerResponses(prayerId: string): Promise<PrayerResponse[]> {
    this.logOperation('getPrayerResponses', { prayerId });
    
    try {
      const responsesQuery = query(
        collection(db(), this.PRAYER_RESPONSES_COLLECTION),
        where('prayer_id', '==', prayerId),
        orderBy('created_at', 'asc')
      );
      
      const querySnapshot = await getDocs(responsesQuery);
      const responses: PrayerResponse[] = [];
      
      for (const doc of querySnapshot.docs) {
        responses.push(this.convertDocToResponse(doc));
      }
      
      this.logOperation('getPrayerResponses success', { 
        prayerId,
        count: responses.length 
      });
      
      return responses;
    } catch (error) {
      this.handleError(error, 'getPrayerResponses');
      throw error;
    }
  }

  /**
   * 創建新代禱回應
   */
  async createResponse(response: CreateResponseRequest): Promise<PrayerResponse> {
    this.logOperation('createResponse', {
      prayerId: response.prayer_id,
      contentLength: response.content?.length || 0,
      isAnonymous: response.is_anonymous
    });
    
    try {
      const authInstance = auth();
      const user = authInstance.currentUser;
      
      // 檢查是否為訪客模式
      const isGuestMode = localStorage.getItem('guestMode') === 'true';
      
      // 詳細記錄狀態
      this.logOperation('創建回應狀態詳情', {
        isGuestMode,
        hasUser: !!user,
        isAnonymous: response.is_anonymous,
        userAuth: user ? {
          uid: user.uid,
          isAnonymous: user.isAnonymous,
          hasPhotoURL: !!user.photoURL,
          hasDisplayName: !!user.displayName
        } : null
      });
      
      // 檢查代禱 ID 是否有效
      if (!response.prayer_id || typeof response.prayer_id !== 'string' || response.prayer_id.trim() === '') {
        this.logOperation('無效的代禱 ID', { 
          providedId: response.prayer_id,
          type: typeof response.prayer_id
        });
        throw new Error('無效的代禱 ID');
      }
      
      // 訪客模式時顯示詳細日誌
      if (isGuestMode) {
        this.logOperation('訪客模式下創建回應', {
          content: response.content?.substring(0, 20) + '...',
          prayerId: response.prayer_id,
          hasImage: !!response.image_url
        });
      }
      
      // 檢查代禱是否存在
      try {
        const prayerRef = doc(db(), this.PRAYERS_COLLECTION, response.prayer_id);
        const prayerDoc = await getDoc(prayerRef);
        
        if (!prayerDoc.exists()) {
          this.logOperation('代禱不存在', { 
            prayerId: response.prayer_id,
            isGuestMode
          });
          throw new Error('代禱不存在');
        }
        
        // 處理圖片 URL
        let imageUrl = response.image_url || null;
        
        // 如果提供了圖片 URL 但格式不正確，進行處理
        if (imageUrl && typeof imageUrl === 'string') {
          // 確保圖片 URL 是絕對路徑
          if (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
            this.logOperation('處理相對路徑圖片 URL', { originalUrl: imageUrl });
            // 轉換為絕對路徑
            imageUrl = imageUrl.startsWith('/') ? `${window.location.origin}${imageUrl}` : `${window.location.origin}/${imageUrl}`;
          }
        }
        
        // 根據登入狀態和訪客模式決定用戶信息
        const isLoggedIn = !!user && !isGuestMode;
        const isAnonymous = response.is_anonymous || !isLoggedIn || isGuestMode;
        let userName = '訪客';
        let userAvatar = null;
        let userId = null;
        
        if (isLoggedIn && !isAnonymous && user) {
          // 已登入且非匿名
          userName = response.user_name || getUnifiedUserName(user, false);
          userAvatar = response.user_avatar || user.photoURL;
          userId = user.uid;
        } else {
          // 匿名發布或訪客模式
          userName = '訪客';
          userAvatar = null;
          userId = null;
        }
        
        // 構建回應數據
        const responseData = {
          content: response.content,
          user_id: userId,
          user_name: userName,
          user_avatar: userAvatar,
          prayer_id: response.prayer_id,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
          image_url: imageUrl,
          is_anonymous: isAnonymous
        };
        
        // 記錄詳細的回應創建信息
        this.logOperation('準備創建回應', {
          isGuestMode,
          isLoggedIn,
          isAnonymous,
          userId,
          userName,
          prayerId: response.prayer_id
        });
        
        // 直接添加回應，不使用交易（可能是交易導致權限問題）
        let newResponse: PrayerResponse;
        
        // 訪客模式下直接添加回應，不使用交易
        if (isGuestMode) {
          this.logOperation('訪客模式：直接添加回應', { prayerId: response.prayer_id });
          
          // 直接添加回應
          const responseRef = await addDoc(collection(db(), this.PRAYER_RESPONSES_COLLECTION), responseData);
          
          // 構造返回的回應對象
          newResponse = {
            id: responseRef.id,
            content: response.content,
            user_id: userId,
            user_name: userName,
            user_avatar: userAvatar,
            prayer_id: response.prayer_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            image_url: imageUrl,
            is_anonymous: isAnonymous
          };
          
          // 訪客模式下不更新計數，避免權限問題
          this.logOperation('訪客模式：跳過計數更新', { responseId: newResponse.id });
        } else {
          // 已登入用戶使用交易
          try {
            // 使用交易確保更新回應數和添加回應同時成功
            newResponse = await runTransaction(db(), async (transaction) => {
              // 添加回應
              const responseRef = doc(collection(db(), this.PRAYER_RESPONSES_COLLECTION));
              transaction.set(responseRef, responseData);
              
              // 更新代禱回應計數
              const prayerRef = doc(db(), this.PRAYERS_COLLECTION, response.prayer_id);
              const prayerData = prayerDoc.data();
              const currentCount = prayerData?.response_count || 0;
              transaction.update(prayerRef, { response_count: currentCount + 1 });
              
              // 構造返回的回應對象 (因為我們沒有完整文檔)
              return {
                id: responseRef.id,
                content: response.content,
                user_id: userId,
                user_name: userName,
                user_avatar: userAvatar,
                prayer_id: response.prayer_id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                image_url: imageUrl,
                is_anonymous: isAnonymous
              };
            });
          } catch (transactionError) {
            // 如果交易失敗，嘗試直接添加回應而不更新計數
            this.logOperation('交易失敗，嘗試直接添加回應', { 
              error: transactionError, 
              isGuestMode 
            });
            
            // 直接添加回應
            const responseRef = await addDoc(collection(db(), this.PRAYER_RESPONSES_COLLECTION), responseData);
            
            // 構造返回的回應對象
            newResponse = {
              id: responseRef.id,
              content: response.content,
              user_id: userId,
              user_name: userName,
              user_avatar: userAvatar,
              prayer_id: response.prayer_id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              image_url: imageUrl,
              is_anonymous: isAnonymous
            };
            
            // 嘗試單獨更新計數
            try {
              const prayerRef = doc(db(), this.PRAYERS_COLLECTION, response.prayer_id);
              const prayerSnapshot = await getDoc(prayerRef);
              if (prayerSnapshot.exists()) {
                const prayerData = prayerSnapshot.data();
                const currentCount = prayerData?.response_count || 0;
                await firebasePrayerService.getInstance().updatePrayerFields(response.prayer_id, {
                  response_count: currentCount + 1
                });
              }
            } catch (countUpdateError) {
              // 即使計數更新失敗，仍然返回成功創建的回應
              this.logOperation('回應計數更新失敗，但回應已創建', { 
                error: countUpdateError, 
                responseId: newResponse.id 
              });
            }
          }
        }
        
        this.logOperation('createResponse success', { 
          id: newResponse.id,
          prayerId: response.prayer_id,
          hasImage: !!newResponse.image_url,
          isGuestMode,
          isAnonymous
        });
        
        return newResponse;
      } catch (error) {
        // 處理代禱檢查或交易過程中的錯誤
        this.logOperation('代禱檢查或回應創建失敗', { 
          error,
          prayerId: response.prayer_id,
          isGuestMode,
          errorMessage: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }
    } catch (error) {
      this.handleError(error, 'createResponse');
      throw error;
    }
  }

  /**
   * 刪除代禱回應
   */
  async deleteResponse(responseId: string): Promise<void> {
    this.logOperation('deleteResponse', { responseId });
    
    try {
      const authInstance = auth();
      const user = authInstance.currentUser;
      
      // 檢查是否為訪客模式
      const isGuestMode = localStorage.getItem('guestMode') === 'true';
      
      this.logOperation('刪除回應狀態', {
        isGuestMode,
        hasUser: !!user,
        responseId
      });
      
      // 訪客模式下不允許刪除回應
      if (isGuestMode) {
        throw new Error('訪客模式下無法刪除回應');
      }
      
      // 非訪客模式但未登入
      if (!user) {
        throw new Error('需要登入才能刪除回應');
      }
      
      // 獲取回應數據以檢查權限和獲取 prayer_id
      const responseRef = doc(db(), this.PRAYER_RESPONSES_COLLECTION, responseId);
      const responseDoc = await getDoc(responseRef);
      
      if (!responseDoc.exists()) {
        throw new Error('回應不存在');
      }
      
      const responseData = responseDoc.data();
      
      // 確認當前用戶是回應的創建者或超級管理員
      if (responseData.user_id !== user.uid) {
        // 檢查是否為超級管理員
        const isAdmin = await this.checkIfUserIsAdmin(user.uid);
        
        if (!isAdmin) {
          this.logOperation('刪除權限不足', {
            responseUserId: responseData.user_id,
            currentUserId: user.uid,
            isAdmin
          });
          throw new Error(ERROR_MESSAGES.PERMISSION_ERROR);
        }
      }
      
      const prayerId = responseData.prayer_id;
      
      // 使用交易確保刪除回應和更新計數同時成功
      await runTransaction(db(), async (transaction) => {
        // 刪除回應
        transaction.delete(responseRef);
        
        // 更新代禱回應計數
        const prayerRef = doc(db(), this.PRAYERS_COLLECTION, prayerId);
        const prayerDoc = await transaction.get(prayerRef);
        
        if (prayerDoc.exists()) {
          const currentCount = prayerDoc.data().response_count || 0;
          // 確保計數不會變為負數
          transaction.update(prayerRef, { 
            response_count: Math.max(0, currentCount - 1) 
          });
        }
      });
      
      this.logOperation('deleteResponse success', { responseId, prayerId });
    } catch (error) {
      this.handleError(error, 'deleteResponse');
      throw error;
    }
  }
  
  /**
   * 檢查用戶是否為超級管理員
   */
  private async checkIfUserIsAdmin(userId: string): Promise<boolean> {
    try {
      // 檢查用戶是否存在於超級管理員集合中
      const adminRef = doc(db(), 'super_admins', userId);
      const adminDoc = await getDoc(adminRef);
      
      return adminDoc.exists();
    } catch (error) {
      this.logOperation('檢查管理員權限失敗', { error, userId });
      return false;
    }
  }

  /**
   * 獲取用戶的所有回應
   */
  async getUserResponses(userId: string): Promise<PrayerResponse[]> {
    this.logOperation('getUserResponses', { userId });
    
    try {
      const responsesQuery = query(
        collection(db(), this.PRAYER_RESPONSES_COLLECTION),
        where('user_id', '==', userId),
        orderBy('created_at', 'desc')
      );
      
      const querySnapshot = await getDocs(responsesQuery);
      const responses: PrayerResponse[] = [];
      
      for (const doc of querySnapshot.docs) {
        responses.push(this.convertDocToResponse(doc));
      }
      
      this.logOperation('getUserResponses success', { 
        userId,
        count: responses.length 
      });
      
      return responses;
    } catch (error) {
      this.handleError(error, 'getUserResponses');
      throw error;
    }
  }
} 