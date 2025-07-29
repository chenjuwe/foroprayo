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
import { FirebaseBaptismService } from './prayer/FirebaseBaptismService';
import { FirebaseJourneyService } from './prayer/FirebaseJourneyService';
import { FirebaseMiracleService } from './prayer/FirebaseMiracleService';

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
  cacheService,
  FirebaseBaptismService,
  FirebaseJourneyService,
  FirebaseMiracleService
};

// 使用懶加載模式創建單例
// 這樣服務只會在第一次被使用時初始化，避免不必要的實例創建
// let _prayerService: PrayerService | null = null;
let _firebaseAuthService: FirebaseAuthService | null = null;
let _firebaseUserService: FirebaseUserService | null = null;
let _firebasePrayerService: FirebasePrayerService | null = null;
let _firebasePrayerResponseService: FirebasePrayerResponseService | null = null;
let _firebasePrayerImageService: FirebasePrayerImageService | null = null;
let _firebaseReportService: FirebaseReportService | null = null;
let _superAdminService: SuperAdminService | null = null;
let _backgroundService: BackgroundService | null = null;
let _avatarService: AvatarService | null = null;
let _firebaseBaptismService: FirebaseBaptismService | null = null;
let _firebaseJourneyService: FirebaseJourneyService | null = null;
let _firebaseMiracleService: FirebaseMiracleService | null = null;

export const firebaseAuthService = {
  getInstance: (): FirebaseAuthService => {
    if (!_firebaseAuthService) {
      _firebaseAuthService = new FirebaseAuthService();
    }
    return _firebaseAuthService;
  }
};

export const firebaseUserService = {
  getInstance: (): FirebaseUserService => {
    if (!_firebaseUserService) {
      _firebaseUserService = new FirebaseUserService();
    }
    return _firebaseUserService;
  }
};

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

export const firebasePrayerImageService = {
  getInstance: (): FirebasePrayerImageService => {
    if (!_firebasePrayerImageService) {
      _firebasePrayerImageService = new FirebasePrayerImageService();
    }
    return _firebasePrayerImageService;
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

export const superAdminService = {
  getInstance: (): SuperAdminService => {
    if (!_superAdminService) {
      _superAdminService = new SuperAdminService('SuperAdminService');
    }
    return _superAdminService;
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

export const firebaseBaptismService = {
  getInstance: (): FirebaseBaptismService => {
    if (!_firebaseBaptismService) {
      _firebaseBaptismService = new FirebaseBaptismService();
    }
    return _firebaseBaptismService;
  }
};

export const firebaseJourneyService = {
  getInstance: (): FirebaseJourneyService => {
    if (!_firebaseJourneyService) {
      _firebaseJourneyService = new FirebaseJourneyService();
    }
    return _firebaseJourneyService;
  }
};

export const firebaseMiracleService = {
  getInstance: (): FirebaseMiracleService => {
    if (!_firebaseMiracleService) {
      _firebaseMiracleService = new FirebaseMiracleService();
    }
    return _firebaseMiracleService;
  }
}; 