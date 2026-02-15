# 投资计划工具 - 功能迭代路线图

## 概述

本文档概述了 investment-plan 项目的功能迭代计划，聚焦于三个"快速见效"的功能，这些功能能以适中的实现复杂度带来显著的产品价值提升。

---

## 功能 1：预设模板（已完成）

### 状态：已完成 ✅

### 描述

提供常见投资组合模板（如 60/40 平衡组合、全天候组合等），让用户一键应用预设参数。

### 实现详情

- **新增文件**：`/src/engine/presets.ts` - 预设模板数据和工具函数
- **新增组件**：`/src/components/config/PresetSelector.vue` - 预设模板选择卡片
- **修改文件**：
  - `/src/engine/types.ts` - 添加 `PortfolioPreset` 接口
  - `/src/engine/index.ts` - 导出新模块
  - `/src/stores/investment.ts` - 添加 `applyPreset()` 方法
  - `/src/components/config/ConfigPanel.vue` - 集成预设选择器
- **测试文件**：`/tests/engine/presets.test.ts` - 14 个测试用例

### 可用预设

| 名称           | 偏股比例 | 收益率 | 波动率 | 风险等级 |
| -------------- | -------- | ------ | ------ | -------- |
| 60/40 平衡组合 | 60%      | 8%     | 18%    | 平衡     |
| 三巨头组合     | 60%      | 8.5%   | 20%    | 平衡     |
| 全天候组合     | 30%      | 6%     | 15%    | 保守     |
| 激进成长组合   | 85%      | 10%    | 25%    | 激进     |
| 保守防御组合   | 20%      | 6%     | 12%    | 保守     |

---

## 功能 2：通胀调整（已完成）

### 状态：已完成 ✅

### 描述

在模拟中加入通胀因子，展示实际购买力随时间的变化。

### 实现详情

- **类型修改** (`types.ts`)：
  - `SimulationParams` - 添加 `inflationRate`（默认 2.5%）
  - `AssetState` - 添加 `realTotalAsset`、`realProfit`、`realProfitRate`、`cumulativeInflation`
  - `ConfidenceBand` - 添加 `realMedian`、`realP5`、`realP95`

- **修改文件**：
  - `/src/engine/statistics.ts` - 添加通胀计算工具函数
  - `/src/engine/deterministic.ts` - 支持通胀计算
  - `/src/engine/monteCarlo.ts` - 支持通胀模拟
  - `/src/stores/investment.ts` - 添加 `inflationSummary` 计算属性
  - `/src/components/config/ConfigPanel.vue` - 添加通胀率输入
  - `/src/components/stats/StatsCards.vue` - 添加实际购买力卡片
  - `/src/components/charts/AssetGrowthChart.vue` - 添加实际购买力曲线

- **测试用例**：
  - `/tests/engine/statistics.test.ts` - 11 个通胀计算测试
  - `/tests/engine/deterministic.test.ts` - 5 个通胀调整测试
  - `/tests/engine/monteCarlo.test.ts` - 3 个通胀测试

---

## 功能 3：风险指标（已完成）

### 状态：已完成 ✅

### 描述

添加专业风险指标，帮助用户全面评估投资风险。

### 实现详情

- **新增类型** (`types.ts`)：

  ```typescript
  interface RiskMetrics {
    // 现有指标（从 SimulationStatistics 移出）
    maxDrawdownMean: number       // 平均最大回撤
    maxDrawdownP95: number        // 95%分位最大回撤
    lossProbability: number       // 亏损概率

    // 新增指标
    sharpeRatio: number           // 夏普比率
    sortinoRatio: number          // 索提诺比率
    var95: number                 // VaR (95%)
    var95Percent: number          // VaR 百分比
    cvar95: number                // 条件 VaR
    maxDrawdownDuration: number   // 最大回撤持续期（月）
    avgDrawdownDuration: number   // 平均回撤持续期
    recoveryProbability: number   // 回撤恢复概率
  }
  ```

- **新增统计函数** (`statistics.ts`)：
  - `sharpeRatio()` - 夏普比率计算
  - `sortinoRatio()` - 索提诺比率计算
  - `valueAtRisk()` - VaR 计算
  - `conditionalVaR()` - CVaR 计算
  - `drawdownDuration()` - 回撤持续期计算
  - `calculateRiskMetrics()` - 完整风险指标计算

- **新增组件**：
  - `/src/components/stats/RiskMetricsCard.vue` - 风险指标展示卡片

- **修改文件**：
  - `/src/engine/types.ts` - 添加 `RiskMetrics` 接口
  - `/src/engine/statistics.ts` - 实现风险指标函数
  - `/src/engine/monteCarlo.ts` - 使用新的风险指标计算
  - `/src/components/stats/StatsCards.vue` - 更新现有卡片
  - `/src/views/SimulatorView.vue` - 集成风险指标卡片

- **测试用例**：
  - `/tests/engine/statistics.test.ts` - 11 个风险指标函数测试
  - `/tests/engine/monteCarlo.test.ts` - 4 个风险指标集成测试

---

## 验证清单

### 预设模板

- [x] 点击预设模板卡片，参数自动更新
- [x] 重新计算后结果正确
- [x] 单元测试通过（14 个测试）

### 通胀调整

- [x] 设置通胀率后，实际购买力数据正确显示
- [x] 图表显示名义值和实际值两条曲线
- [x] 单元测试通过（19 个测试）

### 风险指标

- [x] 新的风险指标卡片正确显示所有指标
- [x] 数值计算正确（可用已知数据验证夏普比率）
- [x] 单元测试通过（15 个测试）

### 整体测试

- [x] 运行 `pnpm dev` 启动开发服务器
- [x] 运行 `pnpm test:unit` - 全部 92 个测试通过
- [x] 运行 `pnpm run type-check` - 无类型错误
- [x] 运行 `pnpm run build` - 构建成功
- [x] 检查暗色模式下样式正确

---

## 测试汇总

| 测试文件                             | 测试数 | 描述                         |
| ------------------------------------ | ------ | ---------------------------- |
| `tests/engine/presets.test.ts`       | 14     | 预设模板函数                 |
| `tests/engine/statistics.test.ts`    | 42     | 统计函数（含通胀和风险指标） |
| `tests/engine/deterministic.test.ts` | 21     | 确定性模拟（含通胀）         |
| `tests/engine/monteCarlo.test.ts`    | 14     | 蒙特卡洛模拟（含风险指标）   |
| `src/__tests__/App.spec.ts`          | 1      | 应用挂载测试                 |
| **总计**                             | **92** |                              |

---

## 更新日志

### 2026-02-15

- 完成全部三个功能的初始实现
- 创建文档结构
- 添加全面的测试覆盖（新增 51 个测试，总计 92 个）
