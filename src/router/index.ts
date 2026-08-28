import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import HomePage from '@/views/home/HomePage.vue'

/* 
 * 增加路由页面时请注意：
    1. 路由页面中必须有 id="main-container" 的元素，否则AppHeader会无法拉出抽屉
 */

const routes : RouteRecordRaw[] = [
  { path: '/', component: HomePage },
  { 
    path: '/hqwb', 
    component: () => import('@/views/main/HqWorkbenchPage.vue') 
  },
  { 
    path: '/fthelper', 
    component: () => import('@/views/food-and-tinc/FoodAndTincPage.vue') 
  },
  { 
    path: '/cshelper', 
    component: () => import('@/views/collectable-submissions/CollectableSubmissionsPage.vue') 
  },
  { 
    path: '/fchelper', 
    component: () => import('@/views/fashion-clothes/FashionClothesPage.vue') 
  },
  { 
    path: '/gatherclock', 
    component: () => import('@/views/gatherclock/GatherClockPage.vue') 
  },
  { 
    path: '/workflow', 
    component: () => import('@/views/workflow/WorkflowPage.vue') 
  },
  { 
    path: '/share', 
    component: () => import('@/views/workflow/WorkflowPage.vue') 
  },
  { 
    path: '/workflow_process', 
    component: () => import('@/views/workflow-process/WorkflowProcessPage.vue') 
  },
  { 
    path: '/download', 
    component: () => import('@/views/download/DownloadPage.vue') 
  },
  { 
    path: '/macromanage', 
    component: () => import('@/views/macro-manage/MacroManagePage.vue') 
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    meta: {
      keepAlive: false,
      showTabBar: false
    },
    component: () => import('@/views/error/ErrorPage404.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router