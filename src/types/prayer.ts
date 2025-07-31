// 代禱相關類型定義
export interface Prayer {
  id: string;
  created_at: string;
  updated_at: string;
  content: string;
  is_anonymous: boolean | null;
  user_id: string | null;
  user_name: string | null;
  user_avatar: string | null;
  user_avatar_30?: string | null;
  user_avatar_48?: string | null;
  user_avatar_96?: string | null;
  response_count?: number; // 新增欄位，用於存儲回應計數
  like_count?: number; // 新增欄位，用於存儲讚數
  prayer_responses?: PrayerResponse[]; // 用於 JOIN 查詢的臨時結構
  image_url?: string | null; // 新增欄位，對應圖片網址
  is_answered?: boolean; // 新增欄位，標記是否已被神應允
  prayer_type?: string; // 新增欄位，用於區分不同類型的代禱，例如：'prayer'（一般代禱）, 'baptism'（受洗見證）
}

// =================================================================
// 新的、分離的資料類型
// =================================================================

// 通用貼文基礎類型
export interface BasePost {
  id: string;
  created_at: string;
  updated_at: string;
  content: string;
  is_anonymous: boolean | null;
  user_id: string | null;
  user_name: string | null;
  user_avatar: string | null;
  user_avatar_30?: string | null;
  user_avatar_48?: string | null;
  user_avatar_96?: string | null;
  response_count?: number;
  like_count?: number;
  image_url?: string | null;
  is_answered?: boolean;
}

// 通用回應基礎類型
export interface BaseResponse {
  id: string;
  content: string;
  is_anonymous: boolean | null;
  user_name?: string | null;
  user_avatar?: string | null;
  user_avatar_30?: string | null;
  user_avatar_48?: string | null;
  user_avatar_96?: string | null;
  user_id?: string | null;
  created_at: string;
  updated_at?: string;
  image_url?: string | null;
}

// 受洗 (Baptism) 相關類型
export type BaptismPost = BasePost;
export interface BaptismResponse extends BaseResponse {
  baptism_id: string;
}
export type CreateBaptismPostRequest = Omit<CreatePrayerRequest, 'prayer_type'>;
export interface CreateBaptismResponseRequest extends Omit<CreateResponseRequest, 'prayer_id'> {
  baptism_id: string;
}

// 旅程 (Journey) 相關類型
export type JourneyPost = BasePost;
export interface JourneyResponse extends BaseResponse {
  journey_id: string;
}
export type CreateJourneyPostRequest = Omit<CreatePrayerRequest, 'prayer_type'>;
export interface CreateJourneyResponseRequest extends Omit<CreateResponseRequest, 'prayer_id'> {
  journey_id: string;
}

// 神蹟 (Miracle) 相關類型
export type MiraclePost = BasePost;
export interface MiracleResponse extends BaseResponse {
  miracle_id: string;
}
export type CreateMiraclePostRequest = Omit<CreatePrayerRequest, 'prayer_type'>;
export interface CreateMiracleResponseRequest extends Omit<CreateResponseRequest, 'prayer_id'> {
  miracle_id: string;
}

// =================================================================

export interface PrayerResponse {
  id: string;
  prayer_id: string;  // 從聯合查詢可能不包含此欄位
  content: string;
  is_anonymous: boolean | null;
  user_name?: string | null;
  user_avatar?: string | null;
  user_avatar_30?: string | null;
  user_avatar_48?: string | null;
  user_avatar_96?: string | null;
  user_id?: string | null;
  created_at: string;
  updated_at?: string;  // 從聯合查詢可能不包含此欄位
  image_url?: string | null; // 添加圖片網址欄位
  is_answered?: boolean; // 新增欄位，標記是否已被神應允
}

export interface CreatePrayerRequest {
  content: string;
  is_anonymous: boolean;
  user_name?: string | null;
  user_avatar?: string | null;
  user_id?: string | null;
  image_url?: string | null;
  prayer_type?: string; // 新增欄位，用於區分不同類型的代禱
}

export interface CreateResponseRequest {
  prayer_id: string;
  content: string;
  is_anonymous: boolean;
  user_name?: string | null;
  user_avatar?: string | null;
  user_id?: string | null;
  image_url?: string | null;
}

// 社交功能相關類型
export interface PrayerLike {
  id: string;
  user_id: string;
  prayer_id: string;
  created_at: string;
} 