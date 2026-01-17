/**
 * ECharts 图表配置工具
 */

// 金融数字字体配置（与 CSS 变量保持一致）
const MONEY_FONT_FAMILY =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'

// ECharts 文本样式配置（用于金额显示）
export const getMoneyTextStyle = () => ({
  fontFamily: MONEY_FONT_FAMILY,
  fontFeatureSettings: '"tnum"',
})

// ECharts 轴标签配置（用于金额显示）
export const getMoneyAxisLabel = () => ({
  fontFamily: MONEY_FONT_FAMILY,
  fontFeatureSettings: '"tnum"',
})
