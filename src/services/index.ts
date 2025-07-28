import { BaseService } from './base/BaseService';
// import { PrayerService } from './prayer/PrayerService';
import { FirebasePrayerService } from './prayer/FirebasePrayerService';
import { FirebasePrayerResponseService } from './prayer/FirebasePrayerResponseService';
import { FirebasePrayerImageService } from './prayer/FirebasePrayerImageService';
import { PrayerResponseService } from './prayer/PrayerResponseService';
import { AuthService } from './auth/AuthService';
import { FirebaseAuthService } from './auth/FirebaseAuthService';
import { FirebaseUserService } from './auth/FirebaseUserService';
import { ReportService } from './report/ReportService';
import { FirebaseReportService } from './report/FirebaseReportService';
import { BackgroundService } from './background/BackgroundService';
import { AvatarService } from './background/AvatarService';
import { SuperAdminService } from './admin/SuperAdminService';
import { PrayerImageService } from './prayer/PrayerImageService';
import { backgroundSyncService } from './sync/BackgroundSyncService';
import { cacheService } from './sync/CacheService';

export { 
  BaseService, 
  // PrayerService, 
  FirebasePrayerService, 
  FirebasePrayerResponseService, 
  FirebasePrayerImageService, 
  PrayerResponseService, 
  AuthService, 
  FirebaseAuthService,
  FirebaseUserService,
  ReportService, 
  FirebaseReportService,
  BackgroundService, 
  AvatarService, 
  SuperAdminService, 
  PrayerImageService,
  backgroundSyncService,
  cacheService
};

// 使用懶加載模式創建單例
// 這樣服務只會在第一次被使用時初始化，避免不必要的實例創建
// let _prayerService: PrayerService | null = null;
let _firebasePrayerService: FirebasePrayerService | null = null;
let _firebasePrayerResponseService: FirebasePrayerResponseService | null = null;
let _prayerResponseService: PrayerResponseService | null = null;
let _authService: AuthService | null = null;
let _reportService: ReportService | null = null;
let _firebaseReportService: FirebaseReportService | null = null;
let _backgroundService: BackgroundService | null = null;
let _avatarService: AvatarService | null = null;
let _superAdminService: SuperAdminService | null = null;
let _prayerImageService: PrayerImageService | null = null;

// 導出服務的 getter 函數，確保單例模式
// export const prayerService = {
//   getInstance: (): PrayerService => {
//     if (!_prayerService) {
//       _prayerService = new PrayerService();
//     }
//     return _prayerService;
//   }
// };

export const firebasePrayerService = {
  getInstance: (): FirebasePrayerService => {
    if (!_firebasePrayerService) {
      _firebasePrayerService = new FirebasePrayerService();
    }
    return _firebasePrayerService;
  }
};

export const firebasePrayerResponseService = {
  getInstance: (): FirebasePrayerResponseService => {
    if (!_firebasePrayerResponseService) {
      _firebasePrayerResponseService = new FirebasePrayerResponseService();
    }
    return _firebasePrayerResponseService;
  }
};

export const prayerResponseService = {
  getInstance: (): PrayerResponseService => {
    if (!_prayerResponseService) {
      _prayerResponseService = new PrayerResponseService();
    }
    return _prayerResponseService;
  }
};

export const authService = {
  getInstance: (): AuthService => {
    if (!_authService) {
      _authService = new AuthService();
    }
    return _authService;
  }
};

export const reportService = {
  getInstance: (): ReportService => {
    if (!_reportService) {
      _reportService = new ReportService();
    }
    return _reportService;
  }
};

export const firebaseReportService = {
  getInstance: (): FirebaseReportService => {
    if (!_firebaseReportService) {
      _firebaseReportService = new FirebaseReportService();
    }
    return _firebaseReportService;
  }
};

export const backgroundService = {
  getInstance: (): BackgroundService => {
    if (!_backgroundService) {
      _backgroundService = new BackgroundService();
    }
    return _backgroundService;
  }
};

export const avatarService = {
  getInstance: (): AvatarService => {
    if (!_avatarService) {
      _avatarService = new AvatarService();
    }
    return _avatarService;
  }
};

export const superAdminService = {
  getInstance: (): SuperAdminService => {
    if (!_superAdminService) {
      _superAdminService = new SuperAdminService();
    }
    return _superAdminService;
  }
};

export const prayerImageService = {
  getInstance: (): PrayerImageService => {
    if (!_prayerImageService) {
      _prayerImageService = new PrayerImageService();
    }
    return _prayerImageService;
  }
}; 