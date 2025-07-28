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
}

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