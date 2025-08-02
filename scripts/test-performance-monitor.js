#!/usr/bin/env node

/**
 * 測試效能監控腳本
 * 
 * 這個腳本用於監控測試效能，並生成報告。
 * 可在本地開發環境或 CI/CD 管道中執行。
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// 配置
const CONFIG = {
  // 效能閾值（毫秒）
  thresholds: {
    unit: 50,       // 單元測試
    integration: 200, // 整合測試
    e2e: 5000       // 端對端測試
  },
  
  // 報告輸出目錄
  outputDir: path.join(process.cwd(), 'test-results'),
  
  // 測試類型
  testTypes: [
    { name: 'unit', pattern: 'src/**/*.test.{ts,tsx}', excludePattern: 'src/test/integration' },
    { name: 'integration', pattern: 'src/test/integration/**/*.test.{ts,tsx}' },
    { name: 'e2e', pattern: 'e2e/**/*.spec.ts' }
  ],
  
  // 性能基準歷史文件
  baselineFile: path.join(process.cwd(), 'test-results', 'performance-baseline.json'),
  
  // 性能退化閾值（百分比）
  regressionThreshold: 20
};

// 確保輸出目錄存在
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

// 讀取現有基準（如果有）
let baseline = {};
if (fs.existsSync(CONFIG.baselineFile)) {
  try {
    baseline = JSON.parse(fs.readFileSync(CONFIG.baselineFile, 'utf8'));
  } catch (err) {
    console.warn('無法讀取基準文件，將創建新的基準:', err.message);
  }
}

/**
 * 運行特定類型的測試並收集性能數據
 * @param {string} type 測試類型
 * @param {string} pattern 測試文件匹配模式
 * @returns {Object} 測試性能數據
 */
function runTests(type, pattern, excludePattern = '') {
  console.log(`\n🧪 運行${type}測試...`);
  
  const startTime = Date.now();
  let output;
  
  try {
    const excludeArg = excludePattern ? ` --exclude=${excludePattern}` : '';
    output = execSync(`npx vitest run ${pattern} --reporter=json${excludeArg}`, { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
  } catch (err) {
    console.error(`❌ 運行${type}測試失敗:`, err.message);
    return {
      success: false,
      duration: Date.now() - startTime,
      tests: [],
      error: err.message
    };
  }
  
  let results;
  try {
    results = JSON.parse(output);
  } catch (err) {
    console.error('❌ 解析測試結果失敗:', err.message);
    return {
      success: false,
      duration: Date.now() - startTime,
      tests: [],
      error: 'JSON解析失敗'
    };
  }
  
  const endTime = Date.now();
  
  const testResults = results.testResults || [];
  const processedResults = testResults.map(result => {
    const testFile = path.relative(process.cwd(), result.name);
    const tests = (result.assertionResults || []).map(test => ({
      name: test.fullName || test.title,
      status: test.status,
      duration: test.duration || 0
    }));
    
    return {
      file: testFile,
      status: result.status,
      duration: result.duration || 0,
      tests
    };
  });
  
  return {
    success: true,
    totalDuration: endTime - startTime,
    files: processedResults,
    testFiles: testResults.length,
    passed: testResults.filter(r => r.status === 'passed').length,
    failed: testResults.filter(r => r.status === 'failed').length,
    tests: processedResults.flatMap(r => r.tests),
    timestamp: new Date().toISOString()
  };
}

/**
 * 分析測試結果，找出慢測試
 * @param {Object} results 測試結果
 * @param {string} type 測試類型
 * @returns {Object} 分析結果
 */
function analyzeResults(results, type) {
  const threshold = CONFIG.thresholds[type];
  
  // 找出慢測試
  const slowTests = results.tests
    .filter(test => test.duration > threshold)
    .sort((a, b) => b.duration - a.duration);
  
  // 計算平均執行時間
  const totalTestTime = results.tests.reduce((sum, test) => sum + test.duration, 0);
  const avgTestTime = results.tests.length ? totalTestTime / results.tests.length : 0;
  
  // 找出最慢的文件
  const slowestFiles = [...results.files]
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 5);
  
  return {
    slowTests,
    avgTestTime,
    slowestFiles,
    totalTime: results.totalDuration,
    totalTests: results.tests.length
  };
}

/**
 * 比較當前結果與基準
 * @param {Object} results 當前測試結果
 * @param {Object} baseline 基準結果
 * @param {string} type 測試類型
 * @returns {Object} 比較結果
 */
function compareWithBaseline(results, baseline, type) {
  if (!baseline[type]) {
    return {
      hasBaseline: false,
      regressions: []
    };
  }
  
  const currentTests = results.tests.reduce((map, test) => {
    map[test.name] = test;
    return map;
  }, {});
  
  const baselineTests = baseline[type].tests.reduce((map, test) => {
    map[test.name] = test;
    return map;
  }, {});
  
  // 找出性能退化的測試
  const regressions = [];
  Object.entries(currentTests).forEach(([name, test]) => {
    const baselineTest = baselineTests[name];
    if (baselineTest && test.status === 'passed' && baselineTest.status === 'passed') {
      const diff = test.duration - baselineTest.duration;
      const percentChange = (diff / baselineTest.duration) * 100;
      
      if (percentChange > CONFIG.regressionThreshold) {
        regressions.push({
          name,
          current: test.duration,
          baseline: baselineTest.duration,
          diff,
          percentChange
        });
      }
    }
  });
  
  // 對退化排序
  regressions.sort((a, b) => b.percentChange - a.percentChange);
  
  return {
    hasBaseline: true,
    regressions,
    overallChange: {
      avgTime: {
        current: results.tests.length ? results.tests.reduce((sum, t) => sum + t.duration, 0) / results.tests.length : 0,
        baseline: baseline[type].avgTestTime
      },
      totalTime: {
        current: results.totalDuration,
        baseline: baseline[type].totalTime
      }
    }
  };
}

/**
 * 生成報告
 * @param {Object} results 所有測試結果
 * @param {Object} analyses 所有分析結果
 * @param {Object} comparisons 與基準的比較結果
 */
function generateReport(results, analyses, comparisons) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      unit: {
        testFiles: results.unit?.testFiles || 0,
        passed: results.unit?.passed || 0,
        failed: results.unit?.failed || 0,
        totalTests: analyses.unit?.totalTests || 0,
        totalTime: analyses.unit?.totalTime || 0,
        avgTime: analyses.unit?.avgTestTime || 0
      },
      integration: {
        testFiles: results.integration?.testFiles || 0,
        passed: results.integration?.passed || 0,
        failed: results.integration?.failed || 0,
        totalTests: analyses.integration?.totalTests || 0,
        totalTime: analyses.integration?.totalTime || 0,
        avgTime: analyses.integration?.avgTestTime || 0
      },
      e2e: {
        testFiles: results.e2e?.testFiles || 0,
        passed: results.e2e?.passed || 0,
        failed: results.e2e?.failed || 0,
        totalTests: analyses.e2e?.totalTests || 0,
        totalTime: analyses.e2e?.totalTime || 0,
        avgTime: analyses.e2e?.avgTestTime || 0
      }
    },
    slowTests: {
      unit: analyses.unit?.slowTests || [],
      integration: analyses.integration?.slowTests || [],
      e2e: analyses.e2e?.slowTests || []
    },
    slowestFiles: {
      unit: analyses.unit?.slowestFiles || [],
      integration: analyses.integration?.slowestFiles || [],
      e2e: analyses.e2e?.slowestFiles || []
    },
    regressions: {
      unit: comparisons.unit?.regressions || [],
      integration: comparisons.integration?.regressions || [],
      e2e: comparisons.e2e?.regressions || []
    },
    system: {
      platform: os.platform(),
      cpus: os.cpus().length,
      totalMemory: Math.round(os.totalmem() / (1024 * 1024 * 1024)) + 'GB',
      freeMemory: Math.round(os.freemem() / (1024 * 1024 * 1024)) + 'GB'
    }
  };
  
  // 寫入 JSON 報告
  const reportPath = path.join(CONFIG.outputDir, 'performance-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // 生成 Markdown 報告
  const markdownReport = generateMarkdownReport(report);
  const markdownPath = path.join(CONFIG.outputDir, 'performance-report.md');
  fs.writeFileSync(markdownPath, markdownReport);
  
  return report;
}

/**
 * 生成 Markdown 格式的報告
 * @param {Object} report 報告數據
 * @returns {string} Markdown 格式的報告
 */
function generateMarkdownReport(report) {
  const { summary, slowTests, slowestFiles, regressions, system } = report;
  
  return `# 測試效能報告

生成時間: ${new Date(report.timestamp).toLocaleString()}

## 系統資訊
- 平台: ${system.platform}
- CPU 核心數: ${system.cpus}
- 總記憶體: ${system.totalMemory}
- 可用記憶體: ${system.freeMemory}

## 測試摘要

### 單元測試
- 測試檔案數: ${summary.unit.testFiles}
- 通過: ${summary.unit.passed}
- 失敗: ${summary.unit.failed}
- 總測試數: ${summary.unit.totalTests}
- 總執行時間: ${summary.unit.totalTime}ms
- 平均執行時間: ${summary.unit.avgTime.toFixed(2)}ms

### 整合測試
- 測試檔案數: ${summary.integration.testFiles}
- 通過: ${summary.integration.passed}
- 失敗: ${summary.integration.failed}
- 總測試數: ${summary.integration.totalTests}
- 總執行時間: ${summary.integration.totalTime}ms
- 平均執行時間: ${summary.integration.avgTime.toFixed(2)}ms

### 端對端測試
- 測試檔案數: ${summary.e2e.testFiles}
- 通過: ${summary.e2e.passed}
- 失敗: ${summary.e2e.failed}
- 總測試數: ${summary.e2e.totalTests}
- 總執行時間: ${summary.e2e.totalTime}ms
- 平均執行時間: ${summary.e2e.avgTime.toFixed(2)}ms

## 慢測試分析

### 慢單元測試 (> ${CONFIG.thresholds.unit}ms)
${slowTests.unit.length === 0 ? '無慢測試' : slowTests.unit.map(test => (
  `- ${test.name}: ${test.duration}ms`
)).join('\n')}

### 慢整合測試 (> ${CONFIG.thresholds.integration}ms)
${slowTests.integration.length === 0 ? '無慢測試' : slowTests.integration.map(test => (
  `- ${test.name}: ${test.duration}ms`
)).join('\n')}

### 慢端對端測試 (> ${CONFIG.thresholds.e2e}ms)
${slowTests.e2e.length === 0 ? '無慢測試' : slowTests.e2e.map(test => (
  `- ${test.name}: ${test.duration}ms`
)).join('\n')}

## 最慢的文件

### 單元測試文件
${slowestFiles.unit.length === 0 ? '無資料' : slowestFiles.unit.map(file => (
  `- ${file.file}: ${file.duration}ms (${file.tests.length} 測試)`
)).join('\n')}

### 整合測試文件
${slowestFiles.integration.length === 0 ? '無資料' : slowestFiles.integration.map(file => (
  `- ${file.file}: ${file.duration}ms (${file.tests.length} 測試)`
)).join('\n')}

### 端對端測試文件
${slowestFiles.e2e.length === 0 ? '無資料' : slowestFiles.e2e.map(file => (
  `- ${file.file}: ${file.duration}ms (${file.tests.length} 測試)`
)).join('\n')}

## 效能退化分析

### 單元測試退化
${regressions.unit.length === 0 ? '無退化' : regressions.unit.map(reg => (
  `- ${reg.name}: ${reg.current}ms (增加了 ${reg.diff.toFixed(2)}ms, ${reg.percentChange.toFixed(2)}%)`
)).join('\n')}

### 整合測試退化
${regressions.integration.length === 0 ? '無退化' : regressions.integration.map(reg => (
  `- ${reg.name}: ${reg.current}ms (增加了 ${reg.diff.toFixed(2)}ms, ${reg.percentChange.toFixed(2)}%)`
)).join('\n')}

### 端對端測試退化
${regressions.e2e.length === 0 ? '無退化' : regressions.e2e.map(reg => (
  `- ${reg.name}: ${reg.current}ms (增加了 ${reg.diff.toFixed(2)}ms, ${reg.percentChange.toFixed(2)}%)`
)).join('\n')}

## 結論和建議

${generateConclusions(report)}
`;
}

/**
 * 生成結論和建議
 * @param {Object} report 報告數據
 * @returns {string} 結論和建議
 */
function generateConclusions(report) {
  const { summary, slowTests, regressions } = report;
  const conclusions = [];
  
  // 總結測試情況
  const totalTests = summary.unit.totalTests + summary.integration.totalTests + summary.e2e.totalTests;
  const totalFailed = summary.unit.failed + summary.integration.failed + summary.e2e.failed;
  
  conclusions.push(`總共執行了 ${totalTests} 個測試，其中 ${totalFailed} 個失敗。`);
  
  // 分析慢測試
  const totalSlowTests = slowTests.unit.length + slowTests.integration.length + slowTests.e2e.length;
  if (totalSlowTests > 0) {
    conclusions.push(`檢測到 ${totalSlowTests} 個效能較慢的測試，建議優化這些測試以提高整體效能。`);
  }
  
  // 分析退化
  const totalRegressions = regressions.unit.length + regressions.integration.length + regressions.e2e.length;
  if (totalRegressions > 0) {
    conclusions.push(`檢測到 ${totalRegressions} 個效能退化的測試，這些測試的效能明顯比基準值差。`);
    
    // 找出最嚴重的退化
    let worstRegression = { percentChange: 0 };
    [...regressions.unit, ...regressions.integration, ...regressions.e2e].forEach(reg => {
      if (reg.percentChange > worstRegression.percentChange) {
        worstRegression = reg;
      }
    });
    
    if (worstRegression.name) {
      conclusions.push(`最嚴重的退化是「${worstRegression.name}」，效能下降了 ${worstRegression.percentChange.toFixed(2)}%。`);
    }
  }
  
  // 建議
  conclusions.push('\n### 建議');
  
  if (totalSlowTests > 0) {
    conclusions.push('- 優化標記為「慢」的測試，特別是那些執行時間遠超過閾值的測試。');
  }
  
  if (totalRegressions > 0) {
    conclusions.push('- 調查並修復效能退化的測試。');
  }
  
  if (summary.unit.avgTime > CONFIG.thresholds.unit / 2) {
    conclusions.push('- 考慮優化單元測試的平均執行時間，目前平均時間接近閾值。');
  }
  
  if (summary.integration.avgTime > CONFIG.thresholds.integration / 2) {
    conclusions.push('- 考慮優化整合測試的平均執行時間，目前平均時間接近閾值。');
  }
  
  conclusions.push('- 持續監控測試效能，確保不會引入新的性能問題。');
  
  return conclusions.join('\n\n');
}

/**
 * 更新基準文件
 * @param {Object} results 測試結果
 * @param {Object} analyses 分析結果
 */
function updateBaseline(results, analyses) {
  // 只在所有測試都成功的情況下更新基準
  const allSuccess = Object.values(results).every(r => r?.success);
  if (!allSuccess) {
    console.log('❌ 由於測試失敗，不更新基準');
    return;
  }
  
  const newBaseline = {};
  
  // 為每種類型的測試更新基準
  Object.entries(analyses).forEach(([type, analysis]) => {
    if (analysis) {
      newBaseline[type] = {
        timestamp: new Date().toISOString(),
        tests: results[type]?.tests || [],
        avgTestTime: analysis.avgTestTime,
        totalTime: analysis.totalTime
      };
    }
  });
  
  fs.writeFileSync(CONFIG.baselineFile, JSON.stringify(newBaseline, null, 2));
  console.log(`✅ 基準文件已更新: ${CONFIG.baselineFile}`);
}

// 主函數
function main() {
  console.log('🔍 開始測試效能監控...');
  console.log(`📊 使用配置:\n- 單元測試閾值: ${CONFIG.thresholds.unit}ms\n- 整合測試閾值: ${CONFIG.thresholds.integration}ms\n- 端對端測試閾值: ${CONFIG.thresholds.e2e}ms`);
  
  const results = {};
  const analyses = {};
  const comparisons = {};
  
  // 運行各類型測試
  for (const { name, pattern, excludePattern } of CONFIG.testTypes) {
    results[name] = runTests(name, pattern, excludePattern);
    
    if (results[name].success) {
      analyses[name] = analyzeResults(results[name], name);
      comparisons[name] = compareWithBaseline(results[name], baseline, name);
    }
  }
  
  // 生成報告
  const report = generateReport(results, analyses, comparisons);
  
  // 檢查是否有退化
  const hasRegressions = Object.values(comparisons).some(c => c.regressions && c.regressions.length > 0);
  
  if (hasRegressions) {
    console.log('\n⚠️ 檢測到測試效能退化!');
    
    Object.entries(comparisons).forEach(([type, comparison]) => {
      if (comparison.regressions && comparison.regressions.length > 0) {
        console.log(`\n${type} 測試效能退化:`);
        comparison.regressions.slice(0, 5).forEach(reg => {
          console.log(`- ${reg.name}: ${reg.current}ms (增加了 ${reg.diff.toFixed(2)}ms, ${reg.percentChange.toFixed(2)}%)`);
        });
      }
    });
    
    console.log(`\n詳情請查看報告: ${path.join(CONFIG.outputDir, 'performance-report.md')}`);
  } else {
    console.log('\n✅ 沒有檢測到明顯的效能退化');
  }
  
  // 顯示慢測試
  const hasSlow = Object.values(analyses).some(a => a.slowTests && a.slowTests.length > 0);
  
  if (hasSlow) {
    console.log('\n⚠️ 檢測到執行較慢的測試:');
    
    Object.entries(analyses).forEach(([type, analysis]) => {
      if (analysis.slowTests && analysis.slowTests.length > 0) {
        console.log(`\n慢 ${type} 測試 (> ${CONFIG.thresholds[type]}ms):`);
        analysis.slowTests.slice(0, 5).forEach(test => {
          console.log(`- ${test.name}: ${test.duration}ms`);
        });
      }
    });
    
    console.log(`\n詳情請查看報告: ${path.join(CONFIG.outputDir, 'performance-report.md')}`);
  }
  
  // 詢問是否更新基準
  if (process.argv.includes('--update-baseline')) {
    updateBaseline(results, analyses);
  } else if (!process.env.CI) {
    console.log('\n如果這是預期的效能，請使用 --update-baseline 參數運行此腳本更新基準');
  }
  
  console.log('\n🏁 測試效能監控完成');
  
  // 如果在 CI 環境中並檢測到退化，以非零退出
  if (process.env.CI && hasRegressions) {
    process.exit(1);
  }
}

// 執行主函數
main(); 