import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia } from 'pinia'
import App from '../App.vue'

// 创建测试用路由
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/simulator', component: { template: '<div>Simulator</div>' } },
  ],
})

describe('App', () => {
  it('renders properly', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [router, createPinia()],
      },
    })

    // 等待路由就绪
    await router.isReady()

    // 应该渲染标题
    expect(wrapper.text()).toContain('投资模拟器')
  })
})
