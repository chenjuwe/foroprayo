import fs from 'fs/promises'
import path from 'path'
import { PerformanceBenchmark, PerformanceBenchmarkRunner } from './performance-benchmark'

export interface PerformanceBaseline {
  name: string
  averageDuration: number
  minDuration: number
  maxDuration: number
  threshold: number
  timestamp: number
  version: string
  commitHash?: string | undefined
}

export interface PerformanceRegression {
  name: string
  baseline: PerformanceBaseline
  current: PerformanceBenchmark
  regression: {
    averageDuration: number
    percentage: number
    isSignificant: boolean
  }
}

export class PerformanceRegressionDetector {
  private baselineFile: string
  private baselineData: Map<string, PerformanceBaseline> = new Map()
  private regressionThreshold: number = 0.1 // 10% 的性能下降閾值

  constructor(baselineFile: string = './test-results/performance-baseline.json') {
    this.baselineFile = baselineFile
  }

  /**
   * 載入基準數據
   */
  async loadBaseline(): Promise<void> {
    try {
      const data = await fs.readFile(this.baselineFile, 'utf-8')
      const baselines: PerformanceBaseline[] = JSON.parse(data)
      
      this.baselineData.clear()
      baselines.forEach(baseline => {
        this.baselineData.set(baseline.name, baseline)
      })
    } catch (error) {
      console.warn('無法載入性能基準數據:', error)
    }
  }

  /**
   * 儲存基準數據
   */
  async saveBaseline(benchmarks: PerformanceBenchmark[], version: string, commitHash?: string): Promise<void> {
    const baselines: PerformanceBaseline[] = benchmarks.map(benchmark => ({
      name: benchmark.name,
      averageDuration: benchmark.averageDuration,
      minDuration: benchmark.minDuration,
      maxDuration: benchmark.maxDuration,
      threshold: benchmark.threshold,
      timestamp: Date.now(),
      version,
      commitHash,
    }))

    // 確保目錄存在
    const dir = path.dirname(this.baselineFile)
    await fs.mkdir(dir, { recursive: true })

    await fs.writeFile(this.baselineFile, JSON.stringify(baselines, null, 2))
  }

  /**
   * 檢測性能回歸
   */
  detectRegressions(benchmarks: PerformanceBenchmark[]): PerformanceRegression[] {
    const regressions: PerformanceRegression[] = []

    benchmarks.forEach(benchmark => {
      const baseline = this.baselineData.get(benchmark.name)
      if (!baseline) {
        console.warn(`未找到基準數據: ${benchmark.name}`)
        return
      }

      const averageDurationDiff = benchmark.averageDuration - baseline.averageDuration
      const percentage = (averageDurationDiff / baseline.averageDuration) * 100

      // 檢查是否超過回歸閾值
      const isSignificant = percentage > (this.regressionThreshold * 100)

      if (isSignificant) {
        regressions.push({
          name: benchmark.name,
          baseline,
          current: benchmark,
          regression: {
            averageDuration: averageDurationDiff,
            percentage,
            isSignificant,
          },
        })
      }
    })

    return regressions
  }

  /**
   * 生成回歸報告
   */
  generateRegressionReport(regressions: PerformanceRegression[]): string {
    if (regressions.length === 0) {
      return '# 性能回歸檢測報告\n\n✅ 未檢測到性能回歸\n'
    }

    let report = '# 性能回歸檢測報告\n\n'
    report += `檢測時間: ${new Date().toLocaleString('zh-TW')}\n`
    report += `檢測到 ${regressions.length} 個性能回歸\n\n`

    regressions.forEach(regression => {
      const { name, baseline, current, regression: reg } = regression
      
      report += `## ${name}\n\n`
      report += `### 基準數據 (${baseline.version})\n`
      report += `- 平均執行時間: ${baseline.averageDuration.toFixed(2)}ms\n`
      report += `- 最短執行時間: ${baseline.minDuration.toFixed(2)}ms\n`
      report += `- 最長執行時間: ${baseline.maxDuration.toFixed(2)}ms\n`
      report += `- 基準時間: ${new Date(baseline.timestamp).toLocaleString('zh-TW')}\n\n`

      report += `### 當前數據\n`
      report += `- 平均執行時間: ${current.averageDuration.toFixed(2)}ms\n`
      report += `- 最短執行時間: ${current.minDuration.toFixed(2)}ms\n`
      report += `- 最長執行時間: ${current.maxDuration.toFixed(2)}ms\n`
      report += `- 總執行次數: ${current.totalRuns}\n\n`

      report += `### 回歸分析\n`
      report += `- 平均執行時間變化: ${reg.averageDuration > 0 ? '+' : ''}${reg.averageDuration.toFixed(2)}ms\n`
      report += `- 性能下降百分比: ${reg.percentage.toFixed(2)}%\n`
      report += `- 狀態: ${reg.isSignificant ? '❌ 顯著回歸' : '⚠️ 輕微回歸'}\n\n`

      if (reg.isSignificant) {
        report += `### 建議\n`
        report += `- 檢查最近的程式碼變更\n`
        report += `- 分析性能瓶頸\n`
        report += `- 考慮優化演算法或資料結構\n\n`
      }
    })

    return report
  }

  /**
   * 更新基準數據
   */
  async updateBaseline(benchmarks: PerformanceBenchmark[], version: string, commitHash?: string): Promise<void> {
    await this.saveBaseline(benchmarks, version, commitHash)
    await this.loadBaseline()
  }

  /**
   * 設定回歸閾值
   */
  setRegressionThreshold(threshold: number): void {
    this.regressionThreshold = threshold
  }

  /**
   * 獲取基準數據
   */
  getBaseline(name: string): PerformanceBaseline | undefined {
    return this.baselineData.get(name)
  }

  /**
   * 獲取所有基準數據
   */
  getAllBaselines(): PerformanceBaseline[] {
    return Array.from(this.baselineData.values())
  }
}

// 全域性能回歸檢測器實例
export const performanceRegressionDetector = new PerformanceRegressionDetector()

// 性能回歸測試工具
export async function runPerformanceRegressionTest(
  testRunner: PerformanceBenchmarkRunner,
  testName: string,
  testFn: () => void | Promise<void>,
  runs: number = 10,
  threshold: number = 100
): Promise<PerformanceRegression[]> {
  // 執行當前測試
  const benchmark = await testRunner.runBenchmark(testName, testFn, runs, threshold)
  
  // 載入基準數據
  await performanceRegressionDetector.loadBaseline()
  
  // 檢測回歸
  const regressions = performanceRegressionDetector.detectRegressions([benchmark])
  
  return regressions
}

// 性能基準更新工具
export async function updatePerformanceBaseline(
  testRunner: PerformanceBenchmarkRunner,
  version: string,
  commitHash?: string
): Promise<void> {
  const benchmarks = testRunner.getAllBenchmarks()
  await performanceRegressionDetector.updateBaseline(benchmarks, version, commitHash)
}

// 自動化性能測試流程
export async function automatedPerformanceTest(
  testRunner: PerformanceBenchmarkRunner,
  tests: Array<{
    name: string
    fn: () => void | Promise<void>
    runs?: number
    threshold?: number
  }>,
  version: string,
  commitHash?: string
): Promise<{
  benchmarks: PerformanceBenchmark[]
  regressions: PerformanceRegression[]
  report: string
}> {
  // 執行所有測試
  const benchmarks: PerformanceBenchmark[] = []
  
  for (const test of tests) {
    const benchmark = await testRunner.runBenchmark(
      test.name,
      test.fn,
      test.runs || 10,
      test.threshold || 100
    )
    benchmarks.push(benchmark)
  }

  // 載入基準數據
  await performanceRegressionDetector.loadBaseline()
  
  // 檢測回歸
  const regressions = performanceRegressionDetector.detectRegressions(benchmarks)
  
  // 生成報告
  const report = performanceRegressionDetector.generateRegressionReport(regressions)
  
  return {
    benchmarks,
    regressions,
    report,
  }
} 