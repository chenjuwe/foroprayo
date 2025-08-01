import { performance } from 'perf_hooks'

export interface PerformanceMetrics {
  name: string
  duration: number
  memoryUsage?: NodeJS.MemoryUsage
  timestamp: number
  metadata?: Record<string, any> | undefined
}

export interface PerformanceBenchmark {
  name: string
  metrics: PerformanceMetrics[]
  averageDuration: number
  minDuration: number
  maxDuration: number
  totalRuns: number
  threshold: number
  passed: boolean
}

export class PerformanceBenchmarkRunner {
  private benchmarks: Map<string, PerformanceBenchmark> = new Map()
  private currentBenchmark: string | null = null
  private startTime: number | null = null

  /**
   * 開始性能基準測試
   */
  startBenchmark(name: string, threshold: number = 100): void {
    this.currentBenchmark = name
    this.startTime = performance.now()
    
    if (!this.benchmarks.has(name)) {
      this.benchmarks.set(name, {
        name,
        metrics: [],
        averageDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        totalRuns: 0,
        threshold,
        passed: true,
      })
    }
  }

  /**
   * 結束性能基準測試
   */
  endBenchmark(metadata?: Record<string, any>): PerformanceMetrics | null {
    if (!this.currentBenchmark || !this.startTime) {
      return null
    }

    const duration = performance.now() - this.startTime
    const memoryUsage = process.memoryUsage()
    const timestamp = Date.now()

    const metric: PerformanceMetrics = {
      name: this.currentBenchmark,
      duration,
      memoryUsage,
      timestamp,
      metadata,
    }

    const benchmark = this.benchmarks.get(this.currentBenchmark)!
    benchmark.metrics.push(metric)
    benchmark.totalRuns++

    // 更新統計數據
    benchmark.averageDuration = benchmark.metrics.reduce((sum, m) => sum + m.duration, 0) / benchmark.metrics.length
    benchmark.minDuration = Math.min(benchmark.minDuration, duration)
    benchmark.maxDuration = Math.max(benchmark.maxDuration, duration)
    benchmark.passed = benchmark.averageDuration <= benchmark.threshold

    this.currentBenchmark = null
    this.startTime = null

    return metric
  }

  /**
   * 執行多次基準測試
   */
  async runBenchmark(
    name: string,
    testFn: () => void | Promise<void>,
    runs: number = 10,
    threshold: number = 100,
    metadata?: Record<string, any>
  ): Promise<PerformanceBenchmark> {
    this.startBenchmark(name, threshold)

    for (let i = 0; i < runs; i++) {
      const start = performance.now()
      await testFn()
      const end = performance.now()
      
      const metric: PerformanceMetrics = {
        name,
        duration: end - start,
        memoryUsage: process.memoryUsage(),
        timestamp: Date.now(),
        metadata: { ...metadata, run: i + 1 },
      }

      const benchmark = this.benchmarks.get(name)!
      benchmark.metrics.push(metric)
      benchmark.totalRuns++

      // 更新統計數據
      benchmark.averageDuration = benchmark.metrics.reduce((sum, m) => sum + m.duration, 0) / benchmark.metrics.length
      benchmark.minDuration = Math.min(benchmark.minDuration, metric.duration)
      benchmark.maxDuration = Math.max(benchmark.maxDuration, metric.duration)
      benchmark.passed = benchmark.averageDuration <= benchmark.threshold
    }

    return this.benchmarks.get(name)!
  }

  /**
   * 獲取基準測試結果
   */
  getBenchmark(name: string): PerformanceBenchmark | undefined {
    return this.benchmarks.get(name)
  }

  /**
   * 獲取所有基準測試結果
   */
  getAllBenchmarks(): PerformanceBenchmark[] {
    return Array.from(this.benchmarks.values())
  }

  /**
   * 生成性能報告
   */
  generateReport(): string {
    const benchmarks = this.getAllBenchmarks()
    let report = '# 性能基準測試報告\n\n'
    report += `生成時間: ${new Date().toLocaleString('zh-TW')}\n\n`

    benchmarks.forEach(benchmark => {
      report += `## ${benchmark.name}\n\n`
      report += `- 平均執行時間: ${benchmark.averageDuration.toFixed(2)}ms\n`
      report += `- 最短執行時間: ${benchmark.minDuration.toFixed(2)}ms\n`
      report += `- 最長執行時間: ${benchmark.maxDuration.toFixed(2)}ms\n`
      report += `- 總執行次數: ${benchmark.totalRuns}\n`
      report += `- 閾值: ${benchmark.threshold}ms\n`
      report += `- 狀態: ${benchmark.passed ? '✅ 通過' : '❌ 失敗'}\n\n`

      if (benchmark.metrics.length > 0) {
        report += '### 詳細數據\n\n'
        report += '| 執行次數 | 執行時間 (ms) | 記憶體使用 (MB) |\n'
        report += '|---------|--------------|----------------|\n'
        
        benchmark.metrics.forEach((metric, index) => {
          const memoryMB = metric.memoryUsage 
            ? (metric.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)
            : 'N/A'
          report += `| ${index + 1} | ${metric.duration.toFixed(2)} | ${memoryMB} |\n`
        })
        report += '\n'
      }
    })

    return report
  }

  /**
   * 清除所有基準測試數據
   */
  clear(): void {
    this.benchmarks.clear()
    this.currentBenchmark = null
    this.startTime = null
  }
}

// 全域性能基準測試實例
export const performanceBenchmark = new PerformanceBenchmarkRunner()

// 性能測試裝飾器
export function benchmark(name: string, threshold: number = 100) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const start = performance.now()
      const result = await method.apply(this, args)
      const duration = performance.now() - start

      const metric: PerformanceMetrics = {
        name: `${target.constructor.name}.${propertyName}`,
        duration,
        memoryUsage: process.memoryUsage(),
        timestamp: Date.now(),
        metadata: { args: args.length },
      }

      // 檢查是否超過閾值
      if (duration > threshold) {
        console.warn(`⚠️  性能警告: ${metric.name} 執行時間 ${duration.toFixed(2)}ms 超過閾值 ${threshold}ms`)
      }

      return result
    }

    return descriptor
  }
}

// 性能監控 Hook
export function usePerformanceMonitor(componentName: string) {
  const startTime = performance.now()
  
  return {
    end: (metadata?: Record<string, any>) => {
      const duration = performance.now() - startTime
      const metric: PerformanceMetrics = {
        name: componentName,
        duration,
        memoryUsage: process.memoryUsage(),
        timestamp: Date.now(),
        metadata,
      }
      
      // 記錄到全域基準測試實例
      const benchmark = performanceBenchmark.getBenchmark(componentName)
      if (benchmark) {
        benchmark.metrics.push(metric)
        benchmark.totalRuns++
        benchmark.averageDuration = benchmark.metrics.reduce((sum, m) => sum + m.duration, 0) / benchmark.metrics.length
        benchmark.minDuration = Math.min(benchmark.minDuration, duration)
        benchmark.maxDuration = Math.max(benchmark.maxDuration, duration)
      }
      
      return metric
    }
  }
} 