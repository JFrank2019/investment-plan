# 📈 投资收益模拟器

基于蒙特卡洛模拟的投资收益预测工具，帮助投资者评估不同投资策略下的潜在收益和风险。

## 功能特性

- **确定性计算**：基于固定收益率的投资回报预测
- **蒙特卡洛模拟**：通过随机模拟评估收益的概率分布
- **灵活的参数配置**：
  - 初始资金与偏股/偏债比例
  - 定投金额与投资比例
  - 自定义年化收益率和波动率
  - 再平衡周期与目标比例
- **可视化图表**：直观展示模拟路径、收益分布等
- **响应式设计**：支持桌面端和移动端

## 技术栈

- **框架**：Vue 3 + TypeScript + Vite
- **状态管理**：Pinia
- **样式**：Tailwind CSS v4
- **UI 组件**：shadcn-vue + Lucide Icons
- **图表**：ECharts
- **测试**：Vitest

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

### 运行测试

```bash
pnpm test:unit
```

## 项目结构

```
src/
├── assets/          # 静态资源和全局样式
├── components/      # Vue 组件
│   ├── charts/      # 图表组件
│   ├── config/      # 配置面板组件
│   ├── layout/      # 布局组件
│   └── stats/       # 统计卡片组件
├── engine/          # 核心计算引擎
│   ├── deterministic.ts  # 确定性计算
│   ├── monteCarlo.ts     # 蒙特卡洛模拟
│   ├── statistics.ts     # 统计分析
│   └── types.ts          # 类型定义
├── stores/          # Pinia 状态管理
├── views/           # 页面视图
└── router/          # 路由配置
```

## 核心算法

### 蒙特卡洛模拟

使用几何布朗运动模型模拟资产价格变化：

$$
S_{t+1} = S_t \cdot e^{(\mu - \frac{\sigma^2}{2})\Delta t + \sigma \sqrt{\Delta t} \cdot Z}
$$

其中：

- $\mu$ 为年化收益率
- $\sigma$ 为年化波动率
- $Z$ 为标准正态分布随机数

### 置信区间

基于模拟结果计算不同置信水平（50%、75%、90%、95%）下的收益区间。

## 免责声明

本工具仅供学习和参考，不构成任何投资建议。投资有风险，入市需谨慎。

## License

MIT
