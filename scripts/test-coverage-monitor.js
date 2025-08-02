#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// 獲取當前文件的目錄路徑（在 ES 模塊中使用 __dirname 的替代方法）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 設定覆蓋率目標
const COVERAGE_TARGETS = {
  statements: 80,
  branches: 70,
  functions: 80,
  lines: 80,
  components: 85,
  hooks: 90,
  services: 75,
};

// 需要專注的文件類型
const FOCUS_FILE_TYPES = [
  { type: 'components', pattern: /src\/components\/.*\.tsx?$/, importance: 'high' },
  { type: 'hooks', pattern: /src\/hooks\/.*\.tsx?$/, importance: 'high' },
  { type: 'services', pattern: /src\/services\/.*\.tsx?$/, importance: 'high' },
  { type: 'pages', pattern: /src\/pages\/.*\.tsx?$/, importance: 'medium' },
  { type: 'utils', pattern: /src\/lib\/.*\.tsx?$/, importance: 'medium' },
  { type: 'stores', pattern: /src\/stores\/.*\.tsx?$/, importance: 'medium' },
];

// 生成覆蓋率報告的目錄
const COVERAGE_DIR = path.resolve(__dirname, '../coverage');
const REPORT_FILE = path.resolve(__dirname, '../TEST_COVERAGE_SUMMARY.md');
const DETAILED_REPORT_FILE = path.resolve(__dirname, '../TEST_COVERAGE_ANALYSIS_REPORT.md');
const IMPROVEMENT_REPORT_FILE = path.resolve(__dirname, '../TEST_COVERAGE_IMPROVEMENT_SUMMARY.md');

/**
 * 運行測試並生成覆蓋率數據
 */
function runTestsWithCoverage() {
  console.log('🧪 運行測試並收集覆蓋率數據...');
  try {
    execSync('npx vitest run --coverage', { stdio: 'inherit' });
    console.log('✅ 測試完成，正在分析覆蓋率數據');
    return true;
  } catch (error) {
    console.error('❌ 測試執行失敗', error);
    return false;
  }
}

/**
 * 從覆蓋率目錄讀取數據
 */
function readCoverageData() {
  try {
    const coverageSummary = JSON.parse(
      fs.readFileSync(path.join(COVERAGE_DIR, 'coverage-summary.json'), 'utf8')
    );
    return coverageSummary;
  } catch (error) {
    console.error('❌ 讀取覆蓋率數據失敗', error);
    return null;
  }
}

/**
 * 根據文件類型分類覆蓋率數據
 */
function categorizeCoverageData(coverageData) {
  if (!coverageData || !coverageData.total) {
    console.error('❌ 覆蓋率數據格式無效');
    return null;
  }

  const categorized = {
    total: coverageData.total,
    byType: {
      components: { files: [], coverage: { statements: 0, branches: 0, functions: 0, lines: 0 } },
      hooks: { files: [], coverage: { statements: 0, branches: 0, functions: 0, lines: 0 } },
      services: { files: [], coverage: { statements: 0, branches: 0, functions: 0, lines: 0 } },
      pages: { files: [], coverage: { statements: 0, branches: 0, functions: 0, lines: 0 } },
      utils: { files: [], coverage: { statements: 0, branches: 0, functions: 0, lines: 0 } },
      stores: { files: [], coverage: { statements: 0, branches: 0, functions: 0, lines: 0 } },
      other: { files: [], coverage: { statements: 0, branches: 0, functions: 0, lines: 0 } },
    },
    lowCoverage: [],
  };

  // 處理每個文件
  Object.keys(coverageData).forEach((filePath) => {
    if (filePath === 'total') return;

    // 確定文件類型
    let fileType = 'other';
    for (const type of FOCUS_FILE_TYPES) {
      if (type.pattern.test(filePath)) {
        fileType = type.type;
        break;
      }
    }

    // 添加到對應類型
    const fileData = coverageData[filePath];
    if (fileData && fileData.statements && fileData.branches && fileData.functions && fileData.lines) {
      categorized.byType[fileType].files.push({
        path: filePath,
        coverage: {
          statements: fileData.statements.pct,
          branches: fileData.branches.pct,
          functions: fileData.functions.pct,
          lines: fileData.lines.pct,
        },
      });

      // 檢查低覆蓋率文件
      if (
        fileData.statements.pct < COVERAGE_TARGETS.statements ||
        fileData.branches.pct < COVERAGE_TARGETS.branches ||
        fileData.functions.pct < COVERAGE_TARGETS.functions ||
        fileData.lines.pct < COVERAGE_TARGETS.lines
      ) {
        categorized.lowCoverage.push({
          path: filePath,
          type: fileType,
          coverage: {
            statements: fileData.statements.pct,
            branches: fileData.branches.pct,
            functions: fileData.functions.pct,
            lines: fileData.lines.pct,
          },
        });
      }
    }
  });

  // 計算每種類型的平均覆蓋率
  Object.keys(categorized.byType).forEach((type) => {
    const files = categorized.byType[type].files;
    if (files.length > 0) {
      categorized.byType[type].coverage = {
        statements: files.reduce((sum, file) => sum + file.coverage.statements, 0) / files.length,
        branches: files.reduce((sum, file) => sum + file.coverage.branches, 0) / files.length,
        functions: files.reduce((sum, file) => sum + file.coverage.functions, 0) / files.length,
        lines: files.reduce((sum, file) => sum + file.coverage.lines, 0) / files.length,
      };
    }
  });

  return categorized;
}

/**
 * 比較覆蓋率數據與目標
 */
function compareWithTargets(categorizedData) {
  const result = {
    overall: {
      statements: {
        current: categorizedData.total.statements.pct,
        target: COVERAGE_TARGETS.statements,
        met: categorizedData.total.statements.pct >= COVERAGE_TARGETS.statements,
      },
      branches: {
        current: categorizedData.total.branches.pct,
        target: COVERAGE_TARGETS.branches,
        met: categorizedData.total.branches.pct >= COVERAGE_TARGETS.branches,
      },
      functions: {
        current: categorizedData.total.functions.pct,
        target: COVERAGE_TARGETS.functions,
        met: categorizedData.total.functions.pct >= COVERAGE_TARGETS.functions,
      },
      lines: {
        current: categorizedData.total.lines.pct,
        target: COVERAGE_TARGETS.lines,
        met: categorizedData.total.lines.pct >= COVERAGE_TARGETS.lines,
      },
    },
    byType: {},
  };

  // 檢查每種類型是否達標
  Object.keys(categorizedData.byType).forEach((type) => {
    if (COVERAGE_TARGETS[type]) {
      const coverage = categorizedData.byType[type].coverage;
      result.byType[type] = {
        statements: {
          current: coverage.statements,
          target: COVERAGE_TARGETS[type],
          met: coverage.statements >= COVERAGE_TARGETS[type],
        },
        branches: {
          current: coverage.branches,
          target: COVERAGE_TARGETS[type],
          met: coverage.branches >= COVERAGE_TARGETS[type],
        },
        functions: {
          current: coverage.functions,
          target: COVERAGE_TARGETS[type],
          met: coverage.functions >= COVERAGE_TARGETS[type],
        },
        lines: {
          current: coverage.lines,
          target: COVERAGE_TARGETS[type],
          met: coverage.lines >= COVERAGE_TARGETS[type],
        },
      };
    }
  });

  return result;
}

/**
 * 生成改進建議
 */
function generateImprovementSuggestions(categorizedData, comparisonResult) {
  // 按重要性排序低覆蓋率文件
  const prioritizedFiles = [...categorizedData.lowCoverage].sort((a, b) => {
    // 根據文件類型重要性排序
    const typeA = FOCUS_FILE_TYPES.find((t) => t.type === a.type);
    const typeB = FOCUS_FILE_TYPES.find((t) => t.type === b.type);
    const importanceA = typeA ? (typeA.importance === 'high' ? 0 : typeA.importance === 'medium' ? 1 : 2) : 3;
    const importanceB = typeB ? (typeB.importance === 'high' ? 0 : typeB.importance === 'medium' ? 1 : 2) : 3;

    if (importanceA !== importanceB) return importanceA - importanceB;

    // 然後根據覆蓋率排序
    const avgCoverageA = (a.coverage.statements + a.coverage.branches + a.coverage.functions + a.coverage.lines) / 4;
    const avgCoverageB = (b.coverage.statements + b.coverage.branches + b.coverage.functions + b.coverage.lines) / 4;
    return avgCoverageA - avgCoverageB;
  });

  // 最高優先級改進項目
  const highPriorityFiles = prioritizedFiles.slice(0, 5);

  // 未達標的類型
  const underperformingTypes = Object.keys(comparisonResult.byType)
    .filter((type) => {
      const typeData = comparisonResult.byType[type];
      return !typeData.statements.met || !typeData.branches.met || !typeData.functions.met || !typeData.lines.met;
    })
    .sort((a, b) => {
      const avgMetA = [
        comparisonResult.byType[a].statements.met,
        comparisonResult.byType[a].branches.met,
        comparisonResult.byType[a].functions.met,
        comparisonResult.byType[a].lines.met,
      ].filter(Boolean).length;

      const avgMetB = [
        comparisonResult.byType[b].statements.met,
        comparisonResult.byType[b].branches.met,
        comparisonResult.byType[b].functions.met,
        comparisonResult.byType[b].lines.met,
      ].filter(Boolean).length;

      return avgMetA - avgMetB;
    });

  return {
    highPriorityFiles,
    underperformingTypes,
  };
}

/**
 * 生成覆蓋率摘要報告
 */
function generateSummaryReport(categorizedData, comparisonResult, suggestions) {
  const report = [
    '# 測試覆蓋率摘要報告',
    `生成日期：${new Date().toLocaleString()}`,
    '',
    '## 整體覆蓋率',
    '',
    '| 指標 | 當前覆蓋率 | 目標 | 達標情況 |',
    '| --- | --- | --- | --- |',
    `| 語句 (Statements) | ${comparisonResult.overall.statements.current.toFixed(2)}% | ${
      comparisonResult.overall.statements.target
    }% | ${comparisonResult.overall.statements.met ? '✅' : '❌'} |`,
    `| 分支 (Branches) | ${comparisonResult.overall.branches.current.toFixed(2)}% | ${
      comparisonResult.overall.branches.target
    }% | ${comparisonResult.overall.branches.met ? '✅' : '❌'} |`,
    `| 函數 (Functions) | ${comparisonResult.overall.functions.current.toFixed(2)}% | ${
      comparisonResult.overall.functions.target
    }% | ${comparisonResult.overall.functions.met ? '✅' : '❌'} |`,
    `| 行數 (Lines) | ${comparisonResult.overall.lines.current.toFixed(2)}% | ${
      comparisonResult.overall.lines.target
    }% | ${comparisonResult.overall.lines.met ? '✅' : '❌'} |`,
    '',
    '## 各類型文件覆蓋率',
    '',
    '| 類型 | 文件數量 | 語句覆蓋率 | 分支覆蓋率 | 函數覆蓋率 | 行數覆蓋率 |',
    '| --- | --- | --- | --- | --- | --- |',
  ];

  Object.keys(categorizedData.byType).forEach((type) => {
    const typeData = categorizedData.byType[type];
    if (typeData.files.length > 0) {
      report.push(
        `| ${type} | ${typeData.files.length} | ${typeData.coverage.statements.toFixed(2)}% | ${typeData.coverage.branches.toFixed(
          2
        )}% | ${typeData.coverage.functions.toFixed(2)}% | ${typeData.coverage.lines.toFixed(2)}% |`
      );
    }
  });

  report.push(
    '',
    '## 待改進文件（優先級排序）',
    '',
    '以下文件的測試覆蓋率較低，建議優先改進：',
    '',
    '| 路徑 | 類型 | 語句覆蓋率 | 分支覆蓋率 | 函數覆蓋率 | 行數覆蓋率 |',
    '| --- | --- | --- | --- | --- | --- |'
  );

  suggestions.highPriorityFiles.forEach((file) => {
    report.push(
      `| ${file.path} | ${file.type} | ${file.coverage.statements.toFixed(2)}% | ${file.coverage.branches.toFixed(
        2
      )}% | ${file.coverage.functions.toFixed(2)}% | ${file.coverage.lines.toFixed(2)}% |`
    );
  });

  report.push(
    '',
    '查看完整的測試覆蓋率報告和改進建議，請參考 `TEST_COVERAGE_ANALYSIS_REPORT.md` 和 `TEST_COVERAGE_IMPROVEMENT_SUMMARY.md`。',
    ''
  );

  return report.join('\n');
}

/**
 * 生成詳細覆蓋率分析報告
 */
function generateDetailedReport(categorizedData) {
  const report = [
    '# 詳細測試覆蓋率分析報告',
    `生成日期：${new Date().toLocaleString()}`,
    '',
    '## 文件分類統計',
    '',
    '| 類型 | 文件數量 | 平均語句覆蓋率 | 平均分支覆蓋率 | 平均函數覆蓋率 | 平均行數覆蓋率 |',
    '| --- | --- | --- | --- | --- | --- |',
  ];

  Object.keys(categorizedData.byType).forEach((type) => {
    const typeData = categorizedData.byType[type];
    if (typeData.files.length > 0) {
      report.push(
        `| ${type} | ${typeData.files.length} | ${typeData.coverage.statements.toFixed(2)}% | ${typeData.coverage.branches.toFixed(
          2
        )}% | ${typeData.coverage.functions.toFixed(2)}% | ${typeData.coverage.lines.toFixed(2)}% |`
      );
    }
  });

  // 新增每個類型的詳細文件列表
  Object.keys(categorizedData.byType).forEach((type) => {
    const typeData = categorizedData.byType[type];
    if (typeData.files.length > 0) {
      report.push(
        '',
        `## ${type} 類型文件詳情`,
        '',
        '| 文件路徑 | 語句覆蓋率 | 分支覆蓋率 | 函數覆蓋率 | 行數覆蓋率 |',
        '| --- | --- | --- | --- | --- |'
      );

      typeData.files
        .sort((a, b) => {
          // 按平均覆蓋率排序
          const avgA =
            (a.coverage.statements + a.coverage.branches + a.coverage.functions + a.coverage.lines) / 4;
          const avgB =
            (b.coverage.statements + b.coverage.branches + b.coverage.functions + b.coverage.lines) / 4;
          return avgA - avgB;
        })
        .forEach((file) => {
          report.push(
            `| ${file.path} | ${file.coverage.statements.toFixed(2)}% | ${file.coverage.branches.toFixed(
              2
            )}% | ${file.coverage.functions.toFixed(2)}% | ${file.coverage.lines.toFixed(2)}% |`
          );
        });
    }
  });

  return report.join('\n');
}

/**
 * 生成改進計劃報告
 */
function generateImprovementReport(categorizedData, comparisonResult, suggestions) {
  const report = [
    '# 測試覆蓋率改進計劃',
    `生成日期：${new Date().toLocaleString()}`,
    '',
    '## 整體覆蓋率達標情況',
    '',
    '| 指標 | 當前覆蓋率 | 目標 | 差距 | 達標情況 |',
    '| --- | --- | --- | --- | --- |',
  ];

  Object.keys(comparisonResult.overall).forEach((metric) => {
    const data = comparisonResult.overall[metric];
    const gap = data.met ? 0 : (data.target - data.current).toFixed(2);
    report.push(`| ${metric} | ${data.current.toFixed(2)}% | ${data.target}% | ${gap}% | ${data.met ? '✅' : '❌'} |`);
  });

  report.push(
    '',
    '## 優先改進項目',
    '',
    '以下文件測試覆蓋率較低，應優先改進：',
    ''
  );

  suggestions.highPriorityFiles.forEach((file, index) => {
    const avgCoverage = (file.coverage.statements + file.coverage.branches + file.coverage.functions + file.coverage.lines) / 4;
    report.push(
      `### ${index + 1}. ${path.basename(file.path)} (${file.type})`,
      '',
      `- **文件路徑**: ${file.path}`,
      `- **平均覆蓋率**: ${avgCoverage.toFixed(2)}%`,
      `- **語句覆蓋率**: ${file.coverage.statements.toFixed(2)}%`,
      `- **分支覆蓋率**: ${file.coverage.branches.toFixed(2)}%`,
      `- **函數覆蓋率**: ${file.coverage.functions.toFixed(2)}%`,
      `- **行數覆蓋率**: ${file.coverage.lines.toFixed(2)}%`,
      '',
      '**改進建議**:',
      ''
    );

    // 基於覆蓋率給出具體建議
    if (file.coverage.functions < 70) {
      report.push(`- 增加對未測試函數的單元測試，特別注意將函數覆蓋率從 ${file.coverage.functions.toFixed(2)}% 提升至少至 70%`);
    }

    if (file.coverage.branches < 60) {
      report.push(`- 增加分支條件覆蓋，確保測試涵蓋不同的條件路徑，將分支覆蓋率從 ${file.coverage.branches.toFixed(2)}% 提升至少至 60%`);
    }

    if (file.type === 'components') {
      report.push('- 使用 React Testing Library 對組件進行更全面的測試，包括狀態變化、事件處理和條件渲染');
    } else if (file.type === 'hooks') {
      report.push('- 使用 React Testing Library 的 renderHook 函數全面測試 hook 的所有功能和邊界條件');
    } else if (file.type === 'services') {
      report.push('- 增加 mock 數據測試不同響應場景，確保服務函數在各種條件下的行為符合預期');
    }

    report.push('');
  });

  if (suggestions.underperformingTypes.length > 0) {
    report.push(
      '## 需要系統性改進的類型',
      '',
      '以下類型的文件整體測試覆蓋率未達標，需要系統性改進：',
      ''
    );

    suggestions.underperformingTypes.forEach((type) => {
      const typeData = comparisonResult.byType[type];
      report.push(
        `### ${type} 類型`,
        '',
        '| 指標 | 當前覆蓋率 | 目標 | 差距 | 達標情況 |',
        '| --- | --- | --- | --- | --- |',
        `| 語句覆蓋率 | ${typeData.statements.current.toFixed(2)}% | ${typeData.statements.target}% | ${
          typeData.statements.met ? 0 : (typeData.statements.target - typeData.statements.current).toFixed(2)
        }% | ${typeData.statements.met ? '✅' : '❌'} |`,
        `| 分支覆蓋率 | ${typeData.branches.current.toFixed(2)}% | ${typeData.branches.target}% | ${
          typeData.branches.met ? 0 : (typeData.branches.target - typeData.branches.current).toFixed(2)
        }% | ${typeData.branches.met ? '✅' : '❌'} |`,
        `| 函數覆蓋率 | ${typeData.functions.current.toFixed(2)}% | ${typeData.functions.target}% | ${
          typeData.functions.met ? 0 : (typeData.functions.target - typeData.functions.current).toFixed(2)
        }% | ${typeData.functions.met ? '✅' : '❌'} |`,
        `| 行數覆蓋率 | ${typeData.lines.current.toFixed(2)}% | ${typeData.lines.target}% | ${
          typeData.lines.met ? 0 : (typeData.lines.target - typeData.lines.current).toFixed(2)
        }% | ${typeData.lines.met ? '✅' : '❌'} |`,
        '',
        '**改進建議**:',
        ''
      );

      // 根據類型提供特定建議
      switch (type) {
        case 'components':
          report.push(
            '- 創建更多組件快照測試，特別是針對可視元素',
            '- 測試組件在不同 props 和狀態下的渲染結果',
            '- 確保用戶交互（如點擊、輸入）的事件處理函數被測試',
            '- 測試條件渲染邏輯和錯誤處理',
            ''
          );
          break;
        case 'hooks':
          report.push(
            '- 使用 renderHook 對自定義 hooks 進行全面測試',
            '- 確保測試覆蓋初始化、更新和清理階段',
            '- 測試邊界情況和異常處理',
            '- 驗證 hook 與其他 API 的交互',
            ''
          );
          break;
        case 'services':
          report.push(
            '- 全面測試 API 請求的成功和失敗情況',
            '- 使用 Mock 處理外部依賴',
            '- 測試數據轉換和驗證邏輯',
            '- 確保錯誤處理邏輯得到測試',
            ''
          );
          break;
        case 'stores':
          report.push(
            '- 確保每個 store 的狀態變化都有測試覆蓋',
            '- 測試 actions 和 reducers',
            '- 驗證初始狀態和複雜狀態轉換',
            ''
          );
          break;
        default:
          report.push('- 提高單元測試覆蓋率，特別關注重要業務邏輯', '');
          break;
      }
    });
  }

  report.push(
    '## 後續步驟',
    '',
    '1. 針對上述優先文件編寫測試用例，提高覆蓋率',
    '2. 定期執行覆蓋率報告，追蹤進度',
    '3. 在 CI 流程中集成覆蓋率檢查，確保覆蓋率不會下降',
    '4. 考慮引入測試覆蓋率門檻，要求新代碼達到特定覆蓋率標準',
    ''
  );

  return report.join('\n');
}

/**
 * 主函數
 */
function main() {
  console.log('🔍 開始分析測試覆蓋率...');

  // 檢查是否需要運行測試
  const shouldRunTests = process.argv.includes('--run-tests');
  if (shouldRunTests && !runTestsWithCoverage()) {
    process.exit(1);
  }

  // 讀取覆蓋率數據
  const coverageData = readCoverageData();
  if (!coverageData) {
    console.error('❌ 無法讀取覆蓋率數據');
    process.exit(1);
  }

  // 分類覆蓋率數據
  const categorizedData = categorizeCoverageData(coverageData);
  if (!categorizedData) {
    console.error('❌ 無法分類覆蓋率數據');
    process.exit(1);
  }

  // 與目標比較
  const comparisonResult = compareWithTargets(categorizedData);

  // 生成改進建議
  const suggestions = generateImprovementSuggestions(categorizedData, comparisonResult);

  // 生成報告
  const summaryReport = generateSummaryReport(categorizedData, comparisonResult, suggestions);
  const detailedReport = generateDetailedReport(categorizedData);
  const improvementReport = generateImprovementReport(categorizedData, comparisonResult, suggestions);

  // 寫入報告文件
  fs.writeFileSync(REPORT_FILE, summaryReport);
  fs.writeFileSync(DETAILED_REPORT_FILE, detailedReport);
  fs.writeFileSync(IMPROVEMENT_REPORT_FILE, improvementReport);

  console.log(`✅ 覆蓋率報告已生成：
- 摘要報告：${REPORT_FILE}
- 詳細分析：${DETAILED_REPORT_FILE}
- 改進建議：${IMPROVEMENT_REPORT_FILE}
`);

  // 報告覆蓋率達標情況
  console.log('📊 覆蓋率達標情況:');
  console.log(`- 語句覆蓋率: ${comparisonResult.overall.statements.current.toFixed(2)}% (目標 ${comparisonResult.overall.statements.target}%) ${
    comparisonResult.overall.statements.met ? '✅' : '❌'
  }`);
  console.log(`- 分支覆蓋率: ${comparisonResult.overall.branches.current.toFixed(2)}% (目標 ${comparisonResult.overall.branches.target}%) ${
    comparisonResult.overall.branches.met ? '✅' : '❌'
  }`);
  console.log(`- 函數覆蓋率: ${comparisonResult.overall.functions.current.toFixed(2)}% (目標 ${comparisonResult.overall.functions.target}%) ${
    comparisonResult.overall.functions.met ? '✅' : '❌'
  }`);
  console.log(`- 行數覆蓋率: ${comparisonResult.overall.lines.current.toFixed(2)}% (目標 ${comparisonResult.overall.lines.target}%) ${
    comparisonResult.overall.lines.met ? '✅' : '❌'
  }`);

  // 輸出優先改進項目
  if (suggestions.highPriorityFiles.length > 0) {
    console.log('\n🔧 優先需要改進的文件:');
    suggestions.highPriorityFiles.slice(0, 3).forEach((file, index) => {
      console.log(`${index + 1}. ${file.path} (平均覆蓋率: ${(
        (file.coverage.statements + file.coverage.branches + file.coverage.functions + file.coverage.lines) / 4
      ).toFixed(2)}%)`);
    });
  }
}

// 執行主函數
main(); 