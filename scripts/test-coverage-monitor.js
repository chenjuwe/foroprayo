#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 測試覆蓋率閾值配置
const COVERAGE_THRESHOLDS = {
  statements: 80,
  branches: 70,
  functions: 75,
  lines: 80
};

// 覆蓋率歷史檔案路徑
const COVERAGE_HISTORY_FILE = path.join(__dirname, '../test-results/coverage-history.json');
const COVERAGE_REPORT_DIR = path.join(__dirname, '../coverage');

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function getCurrentCoverage() {
  try {
    console.log('🔍 執行測試覆蓋率分析...');
    
    // 執行測試並生成覆蓋率報告
    execSync('npm run test:coverage', { 
      stdio: 'inherit',
      encoding: 'utf8'
    });
    
    // 讀取覆蓋率摘要
    const coverageSummaryPath = path.join(COVERAGE_REPORT_DIR, 'coverage-summary.json');
    
    if (!fs.existsSync(coverageSummaryPath)) {
      throw new Error('無法找到覆蓋率摘要檔案');
    }
    
    const coverageData = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
    return coverageData.total;
    
  } catch (error) {
    console.error('❌ 執行測試覆蓋率分析失敗:', error.message);
    return null;
  }
}

function loadCoverageHistory() {
  try {
    if (fs.existsSync(COVERAGE_HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(COVERAGE_HISTORY_FILE, 'utf8'));
    }
  } catch (error) {
    console.warn('⚠️ 無法讀取覆蓋率歷史:', error.message);
  }
  return [];
}

function saveCoverageHistory(history) {
  try {
    ensureDirectoryExists(path.dirname(COVERAGE_HISTORY_FILE));
    fs.writeFileSync(COVERAGE_HISTORY_FILE, JSON.stringify(history, null, 2));
  } catch (error) {
    console.error('❌ 無法保存覆蓋率歷史:', error.message);
  }
}

function analyzeCoverageTrend(history) {
  if (history.length < 2) {
    return {
      trend: 'unknown',
      message: '需要更多數據來分析趨勢'
    };
  }
  
  const latest = history[history.length - 1];
  const previous = history[history.length - 2];
  
  const trends = {};
  const metrics = ['statements', 'branches', 'functions', 'lines'];
  
  metrics.forEach(metric => {
    const latestPct = latest[metric].pct;
    const previousPct = previous[metric].pct;
    const diff = latestPct - previousPct;
    
    trends[metric] = {
      current: latestPct,
      previous: previousPct,
      change: diff,
      trend: diff > 0 ? '上升' : diff < 0 ? '下降' : '穩定'
    };
  });
  
  return trends;
}

function checkCoverageThresholds(coverage) {
  const results = {};
  let allPassed = true;
  
  Object.keys(COVERAGE_THRESHOLDS).forEach(metric => {
    const actual = coverage[metric].pct;
    const threshold = COVERAGE_THRESHOLDS[metric];
    const passed = actual >= threshold;
    
    results[metric] = {
      actual,
      threshold,
      passed,
      gap: threshold - actual
    };
    
    if (!passed) {
      allPassed = false;
    }
  });
  
  return { allPassed, results };
}

function generateReport(coverage, trends, thresholdCheck) {
  console.log('\n📊 測試覆蓋率報告');
  console.log('==================');
  
  // 當前覆蓋率
  console.log('\n📈 當前覆蓋率:');
  Object.keys(coverage).forEach(metric => {
    if (metric === 'pct') return;
    const pct = coverage[metric].pct;
    const threshold = COVERAGE_THRESHOLDS[metric];
    const status = pct >= threshold ? '✅' : '❌';
    console.log(`  ${status} ${metric.padEnd(12)}: ${pct.toFixed(2)}% (閾值: ${threshold}%)`);
  });
  
  // 趨勢分析
  if (trends && typeof trends === 'object' && Object.keys(trends).length > 0) {
    console.log('\n📊 覆蓋率趨勢:');
    Object.keys(trends).forEach(metric => {
      const trend = trends[metric];
      const arrow = trend.change > 0 ? '📈' : trend.change < 0 ? '📉' : '➡️';
      const changeStr = trend.change > 0 ? `+${trend.change.toFixed(2)}` : trend.change.toFixed(2);
      console.log(`  ${arrow} ${metric.padEnd(12)}: ${changeStr}% (${trend.previous.toFixed(2)}% → ${trend.current.toFixed(2)}%)`);
    });
  }
  
  // 建議
  console.log('\n💡 建議:');
  if (thresholdCheck.allPassed) {
    console.log('  🎉 所有覆蓋率指標都達到了閾值！');
  } else {
    console.log('  需要改善的指標:');
    Object.keys(thresholdCheck.results).forEach(metric => {
      const result = thresholdCheck.results[metric];
      if (!result.passed) {
        console.log(`    - ${metric}: 需要提高 ${result.gap.toFixed(2)}%`);
      }
    });
  }
  
  return thresholdCheck.allPassed;
}

function generateMarkdownReport(coverage, trends, timestamp) {
  const report = `# 測試覆蓋率報告

*生成時間: ${new Date(timestamp).toLocaleString('zh-TW')}*

## 📊 當前覆蓋率

| 指標 | 覆蓋率 | 閾值 | 狀態 |
|------|--------|------|------|
| Statements | ${coverage.statements.pct.toFixed(2)}% | ${COVERAGE_THRESHOLDS.statements}% | ${coverage.statements.pct >= COVERAGE_THRESHOLDS.statements ? '✅' : '❌'} |
| Branches | ${coverage.branches.pct.toFixed(2)}% | ${COVERAGE_THRESHOLDS.branches}% | ${coverage.branches.pct >= COVERAGE_THRESHOLDS.branches ? '✅' : '❌'} |
| Functions | ${coverage.functions.pct.toFixed(2)}% | ${COVERAGE_THRESHOLDS.functions}% | ${coverage.functions.pct >= COVERAGE_THRESHOLDS.functions ? '✅' : '❌'} |
| Lines | ${coverage.lines.pct.toFixed(2)}% | ${COVERAGE_THRESHOLDS.lines}% | ${coverage.lines.pct >= COVERAGE_THRESHOLDS.lines ? '✅' : '❌'} |

## 📈 趨勢分析

${trends && typeof trends === 'object' ? Object.keys(trends).map(metric => {
  const trend = trends[metric];
  const arrow = trend.change > 0 ? '📈' : trend.change < 0 ? '📉' : '➡️';
  const changeStr = trend.change > 0 ? `+${trend.change.toFixed(2)}` : trend.change.toFixed(2);
  return `- **${metric}**: ${arrow} ${changeStr}% (${trend.previous.toFixed(2)}% → ${trend.current.toFixed(2)}%)`;
}).join('\n') : '需要更多數據來分析趨勢'}

## 🎯 改善建議

- 重點關注分支覆蓋率和函數覆蓋率
- 為新增的組件添加全面的測試
- 定期審查和更新測試用例
- 增加邊界條件和錯誤處理的測試

---
*此報告由自動化測試覆蓋率監控系統生成*
`;

  // 保存報告
  const reportPath = path.join(__dirname, '../TEST_COVERAGE_REPORT.md');
  fs.writeFileSync(reportPath, report);
  console.log(`\n📄 詳細報告已保存到: ${reportPath}`);
  
  return reportPath;
}

function main() {
  console.log('🚀 開始測試覆蓋率監控...\n');
  
  // 獲取當前覆蓋率
  const currentCoverage = getCurrentCoverage();
  if (!currentCoverage) {
    process.exit(1);
  }
  
  // 讀取歷史數據
  const history = loadCoverageHistory();
  
  // 添加當前數據到歷史
  const timestamp = Date.now();
  const coverageRecord = {
    timestamp,
    date: new Date(timestamp).toISOString(),
    ...currentCoverage
  };
  history.push(coverageRecord);
  
  // 限制歷史記錄數量 (保留最近30次)
  if (history.length > 30) {
    history.splice(0, history.length - 30);
  }
  
  // 保存歷史
  saveCoverageHistory(history);
  
  // 分析趨勢
  const trends = analyzeCoverageTrend(history);
  
  // 檢查閾值
  const thresholdCheck = checkCoverageThresholds(currentCoverage);
  
  // 生成報告
  const passed = generateReport(currentCoverage, trends, thresholdCheck);
  generateMarkdownReport(currentCoverage, trends, timestamp);
  
  // 退出碼
  if (!passed) {
    console.log('\n❌ 部分覆蓋率指標未達到閾值');
    process.exit(1);
  } else {
    console.log('\n✅ 所有覆蓋率指標都達到要求');
    process.exit(0);
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  main();
}

module.exports = {
  getCurrentCoverage,
  analyzeCoverageTrend,
  checkCoverageThresholds,
  generateReport,
  generateMarkdownReport
}; 