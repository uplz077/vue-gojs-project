import Vue from 'vue'
import Router from 'vue-router'
import FlowChart from '@/components/FlowChart'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'FlowChart',
      component: FlowChart
    }
  ]
})
