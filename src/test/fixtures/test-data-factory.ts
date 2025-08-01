import { faker } from '@faker-js/faker'
import type { Prayer, User, PrayerResponse, BaptismPost, JourneyPost, MiraclePost } from '@/types'

// 設置 faker 語言為中文
faker.setLocale('zh_TW')

export class TestDataFactory {
  // 用戶數據工廠
  static createUser(overrides: Partial<User> = {}): User {
    return {
      uid: faker.string.uuid(),
      displayName: faker.person.fullName(),
      email: faker.internet.email(),
      photoURL: faker.image.avatar(),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      isGuest: false,
      ...overrides,
    }
  }

  static createGuestUser(overrides: Partial<User> = {}): User {
    return this.createUser({
      isGuest: true,
      displayName: `訪客_${faker.string.alphanumeric(6)}`,
      email: undefined,
      photoURL: undefined,
      ...overrides,
    })
  }

  // 禱告數據工廠
  static createPrayer(overrides: Partial<Prayer> = {}): Prayer {
    return {
      id: faker.string.uuid(),
      userId: faker.string.uuid(),
      content: faker.lorem.paragraph(),
      title: faker.lorem.sentence(),
      isAnonymous: faker.datatype.boolean(),
      isAnswered: faker.datatype.boolean(),
      answeredAt: faker.datatype.boolean() ? faker.date.recent().toISOString() : null,
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      likes: faker.number.int({ min: 0, max: 100 }),
      responses: faker.number.int({ min: 0, max: 20 }),
      tags: faker.helpers.arrayElements(['健康', '工作', '家庭', '學業', '感情'], { min: 1, max: 3 }),
      ...overrides,
    }
  }

  static createAnsweredPrayer(overrides: Partial<Prayer> = {}): Prayer {
    return this.createPrayer({
      isAnswered: true,
      answeredAt: faker.date.recent().toISOString(),
      ...overrides,
    })
  }

  static createAnonymousPrayer(overrides: Partial<Prayer> = {}): Prayer {
    return this.createPrayer({
      isAnonymous: true,
      ...overrides,
    })
  }

  // 禱告回應數據工廠
  static createPrayerResponse(overrides: Partial<PrayerResponse> = {}): PrayerResponse {
    return {
      id: faker.string.uuid(),
      prayerId: faker.string.uuid(),
      userId: faker.string.uuid(),
      content: faker.lorem.paragraph(),
      isAnonymous: faker.datatype.boolean(),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      likes: faker.number.int({ min: 0, max: 50 }),
      ...overrides,
    }
  }

  // 洗禮見證數據工廠
  static createBaptismPost(overrides: Partial<BaptismPost> = {}): BaptismPost {
    return {
      id: faker.string.uuid(),
      userId: faker.string.uuid(),
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(3),
      baptismDate: faker.date.past().toISOString(),
      church: faker.company.name(),
      pastor: faker.person.fullName(),
      isAnonymous: faker.datatype.boolean(),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      likes: faker.number.int({ min: 0, max: 100 }),
      ...overrides,
    }
  }

  // 信仰旅程數據工廠
  static createJourneyPost(overrides: Partial<JourneyPost> = {}): JourneyPost {
    return {
      id: faker.string.uuid(),
      userId: faker.string.uuid(),
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(2),
      journeyType: faker.helpers.arrayElement(['見證', '挑戰', '成長', '感恩']),
      isAnonymous: faker.datatype.boolean(),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      likes: faker.number.int({ min: 0, max: 100 }),
      ...overrides,
    }
  }

  // 神蹟見證數據工廠
  static createMiraclePost(overrides: Partial<MiraclePost> = {}): MiraclePost {
    return {
      id: faker.string.uuid(),
      userId: faker.string.uuid(),
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(4),
      miracleType: faker.helpers.arrayElement(['醫治', '供應', '保護', '引導', '其他']),
      miracleDate: faker.date.past().toISOString(),
      isAnonymous: faker.datatype.boolean(),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      likes: faker.number.int({ min: 0, max: 100 }),
      ...overrides,
    }
  }

  // 批量創建數據
  static createUsers(count: number, overrides: Partial<User> = {}): User[] {
    return Array.from({ length: count }, () => this.createUser(overrides))
  }

  static createPrayers(count: number, overrides: Partial<Prayer> = {}): Prayer[] {
    return Array.from({ length: count }, () => this.createPrayer(overrides))
  }

  static createPrayerResponses(count: number, overrides: Partial<PrayerResponse> = {}): PrayerResponse[] {
    return Array.from({ length: count }, () => this.createPrayerResponse(overrides))
  }

  // 創建關聯數據
  static createPrayerWithResponses(
    prayerOverrides: Partial<Prayer> = {},
    responseCount: number = 3
  ): { prayer: Prayer; responses: PrayerResponse[] } {
    const prayer = this.createPrayer(prayerOverrides)
    const responses = this.createPrayerResponses(responseCount, {
      prayerId: prayer.id,
      userId: prayer.userId,
    })

    return { prayer, responses }
  }

  static createUserWithPrayers(
    userOverrides: Partial<User> = {},
    prayerCount: number = 5
  ): { user: User; prayers: Prayer[] } {
    const user = this.createUser(userOverrides)
    const prayers = this.createPrayers(prayerCount, { userId: user.uid })

    return { user, prayers }
  }

  // 創建測試場景數據
  static createTestScenario() {
    const users = this.createUsers(3)
    const prayers = users.flatMap(user =>
      this.createPrayers(2, { userId: user.uid })
    )
    const responses = prayers.flatMap(prayer =>
      this.createPrayerResponses(2, { prayerId: prayer.id })
    )

    return { users, prayers, responses }
  }
}

// 導出常用的測試數據
export const testUsers = {
  regular: TestDataFactory.createUser({ displayName: '測試用戶' }),
  guest: TestDataFactory.createGuestUser(),
  admin: TestDataFactory.createUser({ 
    displayName: '管理員',
    email: 'admin@test.com'
  }),
}

export const testPrayers = {
  simple: TestDataFactory.createPrayer({ title: '簡單禱告' }),
  answered: TestDataFactory.createAnsweredPrayer({ title: '已應驗禱告' }),
  anonymous: TestDataFactory.createAnonymousPrayer({ title: '匿名禱告' }),
  longContent: TestDataFactory.createPrayer({
    title: '長內容禱告',
    content: faker.lorem.paragraphs(5),
  }),
}

export const testResponses = {
  simple: TestDataFactory.createPrayerResponse({ content: '簡單回應' }),
  anonymous: TestDataFactory.createPrayerResponse({ 
    content: '匿名回應',
    isAnonymous: true 
  }),
} 