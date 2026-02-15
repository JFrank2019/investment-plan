<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import { useInvestmentStore } from '@/stores/investment'
import { formatMoney, formatMonthLabel } from '@/engine'
import { useDark } from '@vueuse/core'
import { getMoneyTextStyle, getMoneyAxisLabel } from '@/utils/chartConfig'

use([CanvasRenderer, LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent])

const store = useInvestmentStore()
const isDark = useDark()

const chartOption = computed(() => {
  if (!store.deterministicResult || !store.monteCarloResult) {
    return {}
  }

  const deterministicData = store.deterministicResult.path.states
  const confidenceBands = store.monteCarloResult.statistics.confidenceBands

  const months = deterministicData.map((s) => formatMonthLabel(s.month))
  const deterministicValues = deterministicData.map((s) => s.totalAsset)
  const medianValues = confidenceBands.map((b) => b.median)
  const p5Values = confidenceBands.map((b) => b.p5)
  const p95Values = confidenceBands.map((b) => b.p95)
  const investmentValues = deterministicData.map((s) => s.cumulativeInvestment)

  // 实际购买力数据
  const realDeterministicValues = deterministicData.map((s) => s.realTotalAsset)

  // Theme Colors (Slate / Financial Navy)
  const textColor = isDark.value ? '#94a3b8' : '#64748b' // Slate 400 / 500
  const axisLineColor = isDark.value ? '#334155' : '#e2e8f0' // Slate 700 / 200
  const splitLineColor = isDark.value ? '#1e293b' : '#f1f5f9' // Slate 800 / 100
  const tooltipBg = isDark.value ? '#0f172a' : '#ffffff' // Slate 900 / White
  const tooltipBorder = isDark.value ? '#1e293b' : '#e2e8f0' // Slate 800 / 200

  return {
    backgroundColor: 'transparent',
    title: {
      text: '资产增长曲线',
      left: 'left',
      textStyle: {
        color: isDark.value ? '#f8fafc' : '#0f172a', // Slate 50 / 900
        fontSize: 14,
        fontWeight: 600,
      },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
      textStyle: {
        color: isDark.value ? '#f8fafc' : '#0f172a',
        ...getMoneyTextStyle(),
      },
      formatter: (
        params: Array<{ axisValue?: string; value?: number; color?: string; seriesName?: string }>,
      ) => {
        const month = params[0]?.axisValue ?? ''
        let html = `<div class="font-medium mb-2 border-b border-zinc-100 dark:border-zinc-800 pb-1">${month}</div>`
        params.forEach((p) => {
          if (p.value !== undefined) {
            // 只显示关键指标，避免太多
            if (p.seriesName?.includes('下界')) return
            html += `
              <div class="flex justify-between gap-4 text-xs mb-1">
                <span style="color: ${p.color}">${p.seriesName}</span>
                <span class="font-mono font-medium">${formatMoney(p.value)}</span>
              </div>`
          }
        })
        return html
      },
    },
    legend: {
      bottom: 0,
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { color: textColor, fontSize: 12 },
      data: ['确定性预测', '蒙特卡洛中位数', '95%置信区间', '累计投入', '实际购买力'],
    },
    grid: {
      left: '0%',
      right: '2%',
      bottom: '10%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: months,
      axisLine: { lineStyle: { color: axisLineColor } },
      axisLabel: { color: textColor, fontSize: 11 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: splitLineColor } },
      axisLabel: {
        color: textColor,
        fontSize: 11,
        ...getMoneyAxisLabel(),
        formatter: (value: number) => formatMoney(value),
      },
    },
    series: [
      // 蒙特卡洛置信区间 (背景带)
      {
        name: '95%置信区间',
        type: 'line',
        data: p95Values,
        lineStyle: { opacity: 0 },
        areaStyle: {
          color: isDark.value ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)',
        },
        stack: 'confidence',
        symbol: 'none',
      },
      {
        name: '95%置信区间下界',
        type: 'line',
        data: p5Values,
        lineStyle: { opacity: 0 },
        areaStyle: {
          color: isDark.value ? '#020617' : '#ffffff', // Mask with bg color
        },
        stack: 'confidence',
        symbol: 'none',
        tooltip: { show: false },
      },

      // 核心曲线
      {
        name: '确定性预测',
        type: 'line',
        data: deterministicValues,
        lineStyle: { width: 2, color: '#3b82f6' }, // Blue 500
        itemStyle: { color: '#3b82f6' },
        symbol: 'none',
        showSymbol: false,
      },
      {
        name: '蒙特卡洛中位数',
        type: 'line',
        data: medianValues,
        lineStyle: { width: 2, color: '#10b981', type: 'dashed' }, // Emerald 500
        itemStyle: { color: '#10b981' },
        symbol: 'none',
        showSymbol: false,
      },
      {
        name: '累计投入',
        type: 'line',
        data: investmentValues,
        lineStyle: { width: 1.5, color: textColor, type: 'dotted' },
        itemStyle: { color: textColor },
        symbol: 'none',
        showSymbol: false,
      },
      {
        name: '实际购买力',
        type: 'line',
        data: realDeterministicValues,
        lineStyle: { width: 2, color: '#a855f7' }, // Purple 500
        itemStyle: { color: '#a855f7' },
        symbol: 'none',
        showSymbol: false,
      },
    ],
  }
})
</script>

<template>
  <!-- Removed wrapper div, chart takes full height of parent -->
  <VChart :option="chartOption" autoresize style="height: 100%; min-height: 350px" />
</template>
