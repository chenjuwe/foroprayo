#!/usr/bin/env node

/**
 * 性能基準檢查腳本
 * 用於檢查當前性能是否與基準數據相比有回歸
 */

import { performanceBenchmark } from '../src/test/performance/performance-benchmark.js'
import { performanceRegressionDetector } from '../src/test/performance/performance-regression.js'
import fs from 'fs/promises'
import path from 'path'

async function runPerformanceTests() {
  console.log('🚀 開始執行性能測試...')

  // 執行與基準更新腳本相同的測試
  const tests = [
    {
      name: '組件渲染測試',
      fn: async () => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 10))
      },
      runs: 20,
      threshold: 100,
    },
    {
      name: 'API 調用測試',
      fn: async () => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 20))
      },
      runs: 15,
      threshold: 150,
    },
    {
      name: '資料處理測試',
      fn: async () => {
        const data = Array.from({ length: 1000 }, (_, i) => i)
        data.sort((a, b) => b - a)
        await new Promise(resolve => setTimeout(resolve, Math.random() * 30 + 5))
      },
      runs: 25,
      threshold: 80,
    },
  ]

  for (const test of tests) {
    console.log(`📊 執行測試: ${test.name}`)
    await performanceBenchmark.runBenchmark(
      test.name,
      test.fn,
      test.runs,
      test.threshold
    )
  }

  console.log('✅ 性能測試完成')
}

async function checkBaselineExists() {
  const baselineFile = './test-results/performance-baseline.json'
  try {
    await fs.access(baselineFile)
    return true
  } catch {
    return false
  }
}

async function main() {
  try {
    console.log('🔍 開始檢查性能基準...')

    // 檢查基準數據是否存在
    const baselineExists = await checkBaselineExists()
    if (!baselineExists) {
      console.log('⚠️  未找到性能基準數據')
      console.log('請先運行 npm run test:baseline:update 來建立基準數據')
      process.exit(1)
    }

    // 執行性能測試
    await runPerformanceTests()

    // 載入基準數據
    await performanceRegressionDetector.loadBaseline()

    // 檢測回歸
    const benchmarks = performanceBenchmark.getAllBenchmarks()
    const regressions = performanceRegressionDetector.detectRegressions(benchmarks)

    // 生成報告
    const report = performanceRegressionDetector.generateRegressionReport(regressions)
    
    // 保存報告
    const reportDir = './test-results'
    await fs.mkdir(reportDir, { recursive: true })
    await fs.writeFile(path.join(reportDir, 'performance-regression-report.md'), report)

    console.log('✅ 性能基準檢查完成')
    console.log(`📄 報告已保存到: ${path.join(reportDir, 'performance-regression-report.md')}`)

    // 顯示檢查結果
    console.log('\n📈 檢查結果:')
    if (regressions.length === 0) {
      console.log('✅ 未檢測到性能回歸')
    } else {
      console.log(`❌ 檢測到 ${regressions.length} 個性能回歸:`)
      regressions.forEach(regression => {
        const { name, regression: reg } = regression
        console.log(`  - ${name}: +${reg.percentage.toFixed(2)}%`)
      })
    }

    // 顯示當前性能數據
    console.log('\n📊 當前性能數據:')
    benchmarks.forEach(benchmark => {
      const baseline = performanceRegressionDetector.getBaseline(benchmark.name)
      if (baseline) {
        const diff = benchmark.averageDuration - baseline.averageDuration
        const percentage = (diff / baseline.averageDuration) * 100
        const status = diff > 0 ? '🔴' : '🟢'
        console.log(`  ${status} ${benchmark.name}: ${benchmark.averageDuration.toFixed(2)}ms (${diff > 0 ? '+' : ''}${percentage.toFixed(2)}%)`)
      } else {
        console.log(`  ⚪ ${benchmark.name}: ${benchmark.averageDuration.toFixed(2)}ms (無基準數據)`)
      }
    })

    // 如果有回歸，返回錯誤碼
    if (regressions.length > 0) {
      console.log('\n❌ 檢測到性能回歸，請檢查相關程式碼變更')
      process.exit(1)
    }

  } catch (error) {
    console.error('❌ 檢查性能基準失敗:', error)
    process.exit(1)
  }
}

// 執行主函數
main() 