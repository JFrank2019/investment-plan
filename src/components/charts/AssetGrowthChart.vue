<script setup lang="ts">
import { computed, ref } from 'vue'
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

  const textColor = isDark.value ? '#a1a1aa' : '#71717a'
  const lineColor = isDark.value ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'

  return {
    backgroundColor: 'transparent',
    title: {
      text: '资产增长曲线',
      left: 'center',
      textStyle: {
        color: isDark.value ? '#fff' : '#18181b',
        fontSize: 16,
        fontWeight: 600,
      },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark.value ? '#27272a' : '#fff',
      borderColor: isDark.value ? '#3f3f46' : '#e4e4e7',
      textStyle: {
        color: isDark.value ? '#fff' : '#18181b',
        ...getMoneyTextStyle(),
      },
      formatter: (params: { seriesName: string; value: number; axisValue: string }[]) => {
        const month = params[0]?.axisValue ?? ''
        let html = `<div class="font-medium">${month}</div>`
        params.forEach((p) => {
          if (p.value !== undefined) {
            html += `<div class="flex justify-between gap-4"><span>${p.seriesName}</span><span class="font-medium money-text">${formatMoney(p.value)}</span></div>`
          }
        })
        return html
      },
    },
    legend: {
      bottom: 0,
      textStyle: { color: textColor },
      data: ['确定性预测', '蒙特卡洛中位数', '95%置信区间', '累计投入'],
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: months,
      axisLine: { lineStyle: { color: lineColor } },
      axisLabel: { color: textColor },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: lineColor } },
      axisLabel: {
        color: textColor,
        ...getMoneyAxisLabel(),
        formatter: (value: number) => formatMoney(value),
      },
    },
    series: [
      {
        name: '95%置信区间',
        type: 'line',
        data: p95Values,
        lineStyle: { opacity: 0 },
        areaStyle: {
          color: 'rgba(139, 92, 246, 0.15)',
        },
        stack: 'confidence',
        symbol: 'none',
      },
      {
        name: '95%置信区间下界',
        type: 'line',
        data: p5Values.map((v, i) => (p95Values[i] ?? 0) - v),
        lineStyle: { opacity: 0 },
        areaStyle: {
          color: isDark.value ? '#1a1a2e' : '#f8fafc',
        },
        stack: 'confidence',
        symbol: 'none',
        tooltip: { show: false },
      },
      {
        name: '确定性预测',
        type: 'line',
        data: deterministicValues,
        lineStyle: { width: 3, color: '#8b5cf6' },
        itemStyle: { color: '#8b5cf6' },
        symbol: 'circle',
        symbolSize: 6,
      },
      {
        name: '蒙特卡洛中位数',
        type: 'line',
        data: medianValues,
        lineStyle: { width: 2, color: '#22c55e', type: 'dashed' },
        itemStyle: { color: '#22c55e' },
        symbol: 'none',
      },
      {
        name: '累计投入',
        type: 'line',
        data: investmentValues,
        lineStyle: { width: 2, color: '#71717a', type: 'dotted' },
        itemStyle: { color: '#71717a' },
        symbol: 'none',
      },
    ],
  }
})
</script>

<template>
  <div class="glass-card p-3">
    <VChart :option="chartOption" autoresize style="height: 400px" />
  </div>
</template>
