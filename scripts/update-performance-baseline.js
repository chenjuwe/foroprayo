#!/usr/bin/env node

/**
 * 性能基準更新腳本
 * 用於更新性能測試的基準數據
 */

import { performanceBenchmark } from '../src/test/performance/performance-benchmark.js'
import { updatePerformanceBaseline } from '../src/test/performance/performance-regression.js'
import { execSync } from 'child_process'
import fs from 'fs/promises'
import path from 'path'

async function getVersionInfo() {
  try {
    // 從 package.json 獲取版本
    const packageJson = JSON.parse(await fs.readFile('./package.json', 'utf-8'))
    const version = packageJson.version

    // 獲取 git commit hash
    let commitHash = 'unknown'
    try {
      commitHash = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim()
    } catch (error) {
      console.warn('無法獲取 git commit hash:', error.message)
    }

    return { version, commitHash }
  } catch (error) {
    console.error('無法獲取版本信息:', error)
    return { version: 'unknown', commitHash: 'unknown' }
  }
}

async function runPerformanceTests() {
  console.log('🚀 開始執行性能測試...')

  // 這裡可以添加實際的性能測試
  // 例如：測試組件渲染、API 調用等
  
  // 模擬一些性能測試
  const tests = [
    {
      name: '組件渲染測試',
      fn: async () => {
        // 模擬組件渲染
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 10))
      },
      runs: 20,
      threshold: 100,
    },
    {
      name: 'API 調用測試',
      fn: async () => {
        // 模擬 API 調用
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 20))
      },
      runs: 15,
      threshold: 150,
    },
    {
      name: '資料處理測試',
      fn: async () => {
        // 模擬資料處理
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

async function main() {
  try {
    console.log('🔄 開始更新性能基準...')

    // 獲取版本信息
    const { version, commitHash } = await getVersionInfo()
    console.log(`📦 版本: ${version}`)
    console.log(`🔗 Commit: ${commitHash}`)

    // 執行性能測試
    await runPerformanceTests()

    // 更新基準數據
    await updatePerformanceBaseline(performanceBenchmark, version, commitHash)

    // 生成報告
    const report = performanceBenchmark.generateReport()
    
    // 保存報告
    const reportDir = './test-results'
    await fs.mkdir(reportDir, { recursive: true })
    await fs.writeFile(path.join(reportDir, 'performance-baseline-report.md'), report)

    console.log('✅ 性能基準更新完成')
    console.log(`📄 報告已保存到: ${path.join(reportDir, 'performance-baseline-report.md')}`)
    console.log(`📊 基準數據已保存到: ${path.join(reportDir, 'performance-baseline.json')}`)

    // 顯示基準數據摘要
    const benchmarks = performanceBenchmark.getAllBenchmarks()
    console.log('\n📈 基準數據摘要:')
    benchmarks.forEach(benchmark => {
      console.log(`  ${benchmark.name}: ${benchmark.averageDuration.toFixed(2)}ms (${benchmark.totalRuns} 次運行)`)
    })

  } catch (error) {
    console.error('❌ 更新性能基準失敗:', error)
    process.exit(1)
  }
}

// 執行主函數
main() 