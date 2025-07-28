import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Prayer, CreatePrayerRequest } from '@/types/prayer';

export class PrayerService {
  async getAllPrayers(): Promise<Prayer[]> {
    const { data, error } = await supabase
      .from('prayers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data as Prayer[];
  }

  async getPrayerById(id: string): Promise<Prayer> {
    const { data, error } = await supabase
      .from('prayers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as Prayer;
  }

  async createPrayer(prayer: CreatePrayerRequest): Promise<Prayer> {
    const user = useAuthStore.getState().user;
    
    if (!user) {
      throw new Error('請先登入再發布代禱');
    }

    const { data, error } = await supabase
      .from('prayers')
      .insert({
        content: prayer.content,
        is_anonymous: prayer.is_anonymous,
        user_id: user.id,
        user_name: user.user_metadata?.full_name || user.email || '用戶',
        user_avatar: user.user_metadata?.avatar_url || null
      })
      .select('*')
      .single();

    if (error) {
      if (error.message.includes('row-level security policy')) {
        throw new Error('您沒有發布代禱的權限。請檢查資料庫權限設定。');
      }
      throw new Error(error.message);
    }

    return data as Prayer;
  }

  async updatePrayer(id: string, content: string): Promise<Prayer> {
    const user = useAuthStore.getState().user;

    if (!user) {
      throw new Error('請先登入再進行此操作');
    }

    // 先獲取代禱信息，確認是否為當前用戶的代禱
    const { data: prayer, error: fetchError } = await supabase
      .from('prayers')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    if (!prayer || prayer.user_id !== user.id) {
      throw new Error('您沒有權限執行此操作');
    }

    // 進行更新
    const { data, error } = await supabase
      .from('prayers')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as Prayer;
  }

  async deletePrayer(id: string): Promise<void> {
    const user = useAuthStore.getState().user;

    if (!user) {
      throw new Error('需要登入才能刪除代禱');
    }

    const { error } = await supabase
      .from('prayers')
      .delete()
      .match({ id, user_id: user.id });

    if (error) {
      throw new Error(error.message);
    }
  }

  async getPrayersByUserId(userId: string): Promise<Prayer[]> {
    const { data, error } = await supabase
      .from('prayers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data as Prayer[];
  }

  async updateUserNameForUser(userId: string, newUserName: string): Promise<void> {
    const { error } = await supabase
      .from('prayers')
      .update({ user_name: newUserName })
      .eq('user_id', userId)
      .select('id');

    if (error) {
      throw new Error(error.message);
    }
  }
} 