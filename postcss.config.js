export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // 添加自定義處理，移除任何 `-: .;` 的無效語法
    'postcss-custom-properties': {},
    // 使用 cssnano 進行進一步的 CSS 優化和清理
    cssnano: {
      preset: ['default', {
        discardComments: {
          removeAll: true,
        },
        // 修復無效語法
        reduceIdents: false,
        discardDuplicates: true,
        normalizeWhitespace: true,
        // 移除無用的規則
        discardEmpty: true,
      }],
    }
  },
}
