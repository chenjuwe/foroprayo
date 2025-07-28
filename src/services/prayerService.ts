// 舊版本兼容性導出 - 將在未來版本中移除
// 請使用 '@/services' 導入服務

// 類型定義重新導出
export type {
  Prayer,
  PrayerResponse,
  CreatePrayerRequest,
  CreateResponseRequest,
  PrayerLike
} from '@/types/prayer';

// 服務類重新導出
export {
  // PrayerService,
  PrayerResponseService,
  AuthService,
  // prayerService,
  prayerResponseService,
  authService
} from '@/services'; 