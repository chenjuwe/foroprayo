import { beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

// 設置 MSW 伺服器
export const server = setupServer(...handlers);

// 在所有測試開始前啟動 MSW 伺服器
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// 每個測試後重置處理器
afterEach(() => server.resetHandlers());

// 所有測試結束後關閉 MSW 伺服器
afterAll(() => server.close());

// 導出 server 以便在測試中使用
export { server }; 