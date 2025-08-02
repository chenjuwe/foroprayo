/**
 * 標準化測試數據集
 * 
 * 這個文件提供了標準化的測試數據，用於各種測試場景。
 * 使用這些標準數據可以提高測試的一致性和可維護性。
 */

import { MockDatabase, TestDataFactory, MockTimestamp } from '../setup';

/**
 * 測試數據類型定義
 */
export interface TestDataSets {
  users: any[];
  prayers: any[];
  responses: any[];
  likes: any[];
  backgrounds: any[];
  scriptures: any[];
  relationships: {
    friendships: {source: string, target: string}[];
    userPrayers: {userId: string, prayerId: string}[];
    prayerResponses: {prayerId: string, responseId: string}[];
  };
}

/**
 * 建立基本的測試數據集
 * @returns 標準化測試數據集
 */
export function createStandardTestData(): TestDataSets {
  // 創建基本用戶
  const users = [
    TestDataFactory.createUser({
      uid: 'user-1',
      displayName: '測試用戶1',
      email: 'user1@example.com',
      photoURL: 'https://example.com/user1.jpg',
    }),
    TestDataFactory.createUser({
      uid: 'user-2',
      displayName: '測試用戶2',
      email: 'user2@example.com',
      photoURL: 'https://example.com/user2.jpg',
    }),
    TestDataFactory.createUser({
      uid: 'user-3',
      displayName: '測試用戶3',
      email: 'user3@example.com',
      photoURL: 'https://example.com/user3.jpg',
    }),
    TestDataFactory.createUser({
      uid: 'anonymous-user',
      displayName: '匿名用戶',
      email: 'anonymous@example.com',
    }),
    TestDataFactory.createUser({
      uid: 'admin-user',
      displayName: '管理員',
      email: 'admin@example.com',
      isAdmin: true,
    }),
  ];

  // 創建代禱
  const prayers = [
    TestDataFactory.createPrayer({
      id: 'prayer-1',
      content: '請為我的健康禱告，我最近身體不太舒服。',
      user_id: 'user-1',
      user_name: '測試用戶1',
      timestamp: MockTimestamp.fromDate(new Date('2023-01-01')),
      likes: 5,
      responses: 2,
      is_answered: false,
    }),
    TestDataFactory.createPrayer({
      id: 'prayer-2',
      content: '為我的家庭禱告，希望大家都能夠健康平安。',
      user_id: 'user-2',
      user_name: '測試用戶2',
      timestamp: MockTimestamp.fromDate(new Date('2023-01-02')),
      likes: 3,
      responses: 1,
      is_answered: false,
    }),
    TestDataFactory.createPrayer({
      id: 'prayer-3',
      content: '感謝神的恩典，我找到了新工作！',
      user_id: 'user-1',
      user_name: '測試用戶1',
      timestamp: MockTimestamp.fromDate(new Date('2023-01-03')),
      likes: 8,
      responses: 3,
      is_answered: true,
      answered_at: MockTimestamp.fromDate(new Date('2023-01-10')),
    }),
    TestDataFactory.createPrayer({
      id: 'prayer-4',
      content: '請為我的學業禱告，希望能夠順利畢業。',
      user_id: 'user-3',
      user_name: '測試用戶3',
      timestamp: MockTimestamp.fromDate(new Date('2023-01-04')),
      likes: 2,
      responses: 0,
      is_anonymous: true,
    }),
    TestDataFactory.createPrayer({
      id: 'prayer-5',
      content: '為教會的事工禱告，願神帶領。',
      user_id: 'user-2',
      user_name: '測試用戶2',
      timestamp: MockTimestamp.fromDate(new Date('2023-01-05')),
      likes: 10,
      responses: 5,
      is_answered: false,
    }),
  ];

  // 創建回應
  const responses = [
    TestDataFactory.createPrayerResponse({
      id: 'response-1',
      prayer_id: 'prayer-1',
      content: '我會為你的健康禱告，願神醫治你。',
      user_id: 'user-2',
      user_name: '測試用戶2',
      timestamp: MockTimestamp.fromDate(new Date('2023-01-01T12:00:00')),
      likes: 2,
    }),
    TestDataFactory.createPrayerResponse({
      id: 'response-2',
      prayer_id: 'prayer-1',
      content: '求神保守你，早日康復！',
      user_id: 'user-3',
      user_name: '測試用戶3',
      timestamp: MockTimestamp.fromDate(new Date('2023-01-01T14:30:00')),
      likes: 1,
    }),
    TestDataFactory.createPrayerResponse({
      id: 'response-3',
      prayer_id: 'prayer-2',
      content: '願神賜福你的家庭！',
      user_id: 'user-1',
      user_name: '測試用戶1',
      timestamp: MockTimestamp.fromDate(new Date('2023-01-02T10:15:00')),
      likes: 3,
    }),
    TestDataFactory.createPrayerResponse({
      id: 'response-4',
      prayer_id: 'prayer-3',
      content: '感謝主！恭喜你找到新工作！',
      user_id: 'user-2',
      user_name: '測試用戶2',
      timestamp: MockTimestamp.fromDate(new Date('2023-01-03T09:45:00')),
      likes: 2,
    }),
    TestDataFactory.createPrayerResponse({
      id: 'response-5',
      prayer_id: 'prayer-3',
      content: '神真是信實的，讚美主！',
      user_id: 'user-3',
      user_name: '測試用戶3',
      timestamp: MockTimestamp.fromDate(new Date('2023-01-03T11:20:00')),
      likes: 4,
    }),
    TestDataFactory.createPrayerResponse({
      id: 'response-6',
      prayer_id: 'prayer-3',
      content: '願新工作一切順利！',
      user_id: 'anonymous-user',
      user_name: '匿名用戶',
      timestamp: MockTimestamp.fromDate(new Date('2023-01-03T16:40:00')),
      likes: 1,
      is_anonymous: true,
    }),
    TestDataFactory.createPrayerResponse({
      id: 'response-7',
      prayer_id: 'prayer-5',
      content: '阿們，為教會事工同心禱告。',
      user_id: 'user-1',
      user_name: '測試用戶1',
      timestamp: MockTimestamp.fromDate(new Date('2023-01-05T08:30:00')),
      likes: 3,
    }),
  ];

  // 點讚數據
  const likes = [
    { id: 'like-1', user_id: 'user-1', target_id: 'prayer-2', type: 'prayer', timestamp: MockTimestamp.fromDate(new Date('2023-01-02T15:00:00')) },
    { id: 'like-2', user_id: 'user-1', target_id: 'prayer-5', type: 'prayer', timestamp: MockTimestamp.fromDate(new Date('2023-01-05T10:00:00')) },
    { id: 'like-3', user_id: 'user-2', target_id: 'prayer-1', type: 'prayer', timestamp: MockTimestamp.fromDate(new Date('2023-01-01T13:00:00')) },
    { id: 'like-4', user_id: 'user-2', target_id: 'prayer-3', type: 'prayer', timestamp: MockTimestamp.fromDate(new Date('2023-01-03T14:00:00')) },
    { id: 'like-5', user_id: 'user-3', target_id: 'prayer-1', type: 'prayer', timestamp: MockTimestamp.fromDate(new Date('2023-01-01T16:00:00')) },
    { id: 'like-6', user_id: 'user-3', target_id: 'prayer-3', type: 'prayer', timestamp: MockTimestamp.fromDate(new Date('2023-01-03T17:00:00')) },
    { id: 'like-7', user_id: 'user-3', target_id: 'prayer-5', type: 'prayer', timestamp: MockTimestamp.fromDate(new Date('2023-01-05T18:00:00')) },
    { id: 'like-8', user_id: 'user-1', target_id: 'response-1', type: 'response', timestamp: MockTimestamp.fromDate(new Date('2023-01-01T14:00:00')) },
    { id: 'like-9', user_id: 'user-3', target_id: 'response-3', type: 'response', timestamp: MockTimestamp.fromDate(new Date('2023-01-02T11:00:00')) },
    { id: 'like-10', user_id: 'user-1', target_id: 'response-5', type: 'response', timestamp: MockTimestamp.fromDate(new Date('2023-01-03T12:00:00')) },
  ];

  // 背景設置
  const backgrounds = [
    { id: 'bg-1', user_id: 'user-1', background_id: 'default1', custom_background: null, timestamp: MockTimestamp.fromDate(new Date('2023-01-01')) },
    { id: 'bg-2', user_id: 'user-2', background_id: 'default2', custom_background: null, timestamp: MockTimestamp.fromDate(new Date('2023-01-02')) },
    { id: 'bg-3', user_id: 'user-3', background_id: 'default3', custom_background: null, timestamp: MockTimestamp.fromDate(new Date('2023-01-03')) },
  ];

  // 經文收藏
  const scriptures = [
    { id: 'scripture-1', user_id: 'user-1', text: '耶和華是我的牧者，我必不致缺乏。詩篇23:1', timestamp: MockTimestamp.fromDate(new Date('2023-01-05')) },
    { id: 'scripture-2', user_id: 'user-2', text: '我靠著那加給我力量的，凡事都能做。腓立比書4:13', timestamp: MockTimestamp.fromDate(new Date('2023-01-06')) },
    { id: 'scripture-3', user_id: 'user-3', text: '神愛世人，甚至將他的獨生子賜給他們，叫一切信他的，不致滅亡，反得永生。約翰福音3:16', timestamp: MockTimestamp.fromDate(new Date('2023-01-07')) },
  ];

  // 關係數據
  const relationships = {
    // 好友關係
    friendships: [
      { source: 'user-1', target: 'user-2' },
      { source: 'user-1', target: 'user-3' },
      { source: 'user-2', target: 'user-3' },
    ],
    // 用戶-代禱關係
    userPrayers: prayers.map(prayer => ({
      userId: prayer.user_id,
      prayerId: prayer.id,
    })),
    // 代禱-回應關係
    prayerResponses: responses.map(response => ({
      prayerId: response.prayer_id,
      responseId: response.id,
    })),
  };

  return {
    users,
    prayers,
    responses,
    likes,
    backgrounds,
    scriptures,
    relationships,
  };
}

/**
 * 將標準測試數據加載到模擬數據庫
 * @param db MockDatabase 實例
 * @returns 加載的數據集
 */
export function loadStandardTestData(db: MockDatabase): TestDataSets {
  // 獲取標準數據
  const data = createStandardTestData();

  // 重置數據庫
  db.reset();

  // 加載用戶
  db.addCollection('users');
  data.users.forEach(user => {
    db.addDocument('users', user.uid, user);
  });

  // 加載代禱
  db.addCollection('prayers');
  data.prayers.forEach(prayer => {
    db.addDocument('prayers', prayer.id, prayer);
    
    // 創建用戶與代禱的關聯
    db.createRelationship('users', prayer.user_id, 'prayers', prayer.id, 'authored');
  });

  // 加載回應
  db.addCollection('responses');
  data.responses.forEach(response => {
    db.addDocument('responses', response.id, response);
    
    // 創建代禱與回應的關聯
    db.createRelationship('prayers', response.prayer_id, 'responses', response.id, 'has_responses');
    
    // 創建用戶與回應的關聯
    db.createRelationship('users', response.user_id, 'responses', response.id, 'authored');
  });

  // 加載點讚
  db.addCollection('likes');
  data.likes.forEach(like => {
    db.addDocument('likes', like.id, like);
    
    // 創建用戶與點讚的關聯
    db.createRelationship('users', like.user_id, 'likes', like.id, 'liked');
    
    // 創建目標與點讚的關聯
    if (like.type === 'prayer') {
      db.createRelationship('prayers', like.target_id, 'likes', like.id, 'received_likes');
    } else if (like.type === 'response') {
      db.createRelationship('responses', like.target_id, 'likes', like.id, 'received_likes');
    }
  });

  // 加載背景設置
  db.addCollection('backgrounds');
  data.backgrounds.forEach(bg => {
    db.addDocument('backgrounds', bg.id, bg);
    
    // 創建用戶與背景的關聯
    db.createRelationship('users', bg.user_id, 'backgrounds', bg.id, 'has_background');
  });

  // 加載經文收藏
  db.addCollection('scriptures');
  data.scriptures.forEach(scripture => {
    db.addDocument('scriptures', scripture.id, scripture);
    
    // 創建用戶與經文的關聯
    db.createRelationship('users', scripture.user_id, 'scriptures', scripture.id, 'saved_scripture');
  });

  // 創建好友關係
  data.relationships.friendships.forEach(({ source, target }) => {
    db.createRelationship('users', source, 'users', target, 'friends');
    db.createRelationship('users', target, 'users', source, 'friends');
  });

  // 創建索引以提高查詢效能
  db.createIndex('prayers', 'user_id');
  db.createIndex('prayers', 'is_answered');
  db.createIndex('responses', 'prayer_id');
  db.createIndex('likes', 'user_id');
  db.createIndex('likes', 'target_id');

  return data;
}

/**
 * 獲取特定測試場景的數據
 */
export const testScenarios = {
  /**
   * 基本代禱頁面場景
   */
  prayersPageScenario: {
    /**
     * 加載基本代禱頁面場景的數據
     * @param db MockDatabase 實例
     */
    load(db: MockDatabase) {
      loadStandardTestData(db);
    },
    
    /**
     * 模擬用戶的代禱互動（查看、點讚、回應）
     * @param db MockDatabase 實例
     * @param userId 當前用戶ID
     * @param prayerId 要互動的代禱ID
     */
    simulateInteractions(db: MockDatabase, userId: string, prayerId: string) {
      // 生成互動ID
      const likeId = `test-like-${Date.now()}`;
      const responseId = `test-response-${Date.now()}`;
      
      // 添加點讚
      db.addDocument('likes', likeId, {
        id: likeId,
        user_id: userId,
        target_id: prayerId,
        type: 'prayer',
        timestamp: MockTimestamp.now(),
      });
      
      // 建立點讚關聯
      db.createRelationship('users', userId, 'likes', likeId, 'liked');
      db.createRelationship('prayers', prayerId, 'likes', likeId, 'received_likes');
      
      // 添加回應
      db.addDocument('responses', responseId, {
        id: responseId,
        prayer_id: prayerId,
        content: '我為你禱告！願神祝福你。',
        user_id: userId,
        user_name: db.getDocument('users', userId)?.displayName || '用戶',
        timestamp: MockTimestamp.now(),
        likes: 0,
      });
      
      // 建立回應關聯
      db.createRelationship('users', userId, 'responses', responseId, 'authored');
      db.createRelationship('prayers', prayerId, 'responses', responseId, 'has_responses');
      
      // 更新代禱的回應計數
      const prayer = db.getDocument('prayers', prayerId);
      if (prayer) {
        db.updateDocument('prayers', prayerId, {
          responses: (prayer.responses || 0) + 1,
          likes: (prayer.likes || 0) + 1,
        });
      }
    },
  },
  
  /**
   * 用戶個人資料頁面場景
   */
  profilePageScenario: {
    /**
     * 加載個人資料頁面場景的數據
     * @param db MockDatabase 實例
     */
    load(db: MockDatabase) {
      loadStandardTestData(db);
    },
    
    /**
     * 獲取特定用戶的代禱列表
     * @param db MockDatabase 實例
     * @param userId 用戶ID
     */
    getUserPrayers(db: MockDatabase, userId: string) {
      return db.queryDocuments('prayers', prayer => prayer.user_id === userId);
    },
    
    /**
     * 模擬用戶更新個人資料
     * @param db MockDatabase 實例
     * @param userId 用戶ID
     * @param profileData 更新的資料
     */
    updateUserProfile(db: MockDatabase, userId: string, profileData: any) {
      const user = db.getDocument('users', userId);
      if (user) {
        db.updateDocument('users', userId, {
          ...user,
          ...profileData,
          updatedAt: MockTimestamp.now(),
        });
      }
    },
  },
}; 