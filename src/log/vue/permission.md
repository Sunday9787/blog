---
title: 中后台管理系统权限应该怎样设计
date: 2023-12-20 16:51:03
category: [Vue]
tag: [权限, 中后台]
---

最近群里在问权限应该怎么设计，用什么方案合适。说实话我很早前第一次做权限的时候也栽进坑里过

<!-- more -->

## 权限方案

权限无非就是限制 页面的展示 或则 某个组件的展示，总结下来就是 :

- `C` 创建
- `U` 更新(编辑)
- `R` 读取(查询)
- `D` 删除

`C` 数据是否可以被创建，限制初始化某功能（权限独立）

`R` 数据是否可以被查询，限制页面 or 组件查看（权限独立）

`U` 数据是否可以被更新，限制数据更新，可查询数据 （联合权限`R`）

`D` 数据是否可以被删除，限制数据删除，可查询可更新（联合权限`R` `U`）

目前我已知方案有:

### 动态路由

菜单 页面 单独存放，请求后端返回router配置信息登录时 addRoute

技术细节：

1. 首先 路由书写不能像官网示例那样 一个一个 import('xxx')，需要动态遍历组合生成路由

   ```ts
   /* 权限数据结构 */
   interface Permission {
       id: number
       parentId: number | null
       path: string
       name: string
       redirect: string
       /**
        * 组件名称
        * 组件具体的路径
        * @example `component = 'product/detail.vue'` `src/views/${component}`
        */
       component: string
   }

   interface PermissionRoute {
       id: number
       parentId: number | null
       parentName?: string
       route: RouteRecordRaw
   }

   const permissionMap = new Map<number, Permission>(permission.map((item) => [item.id, item]))

   function createRoute(permission: Permission) {
        const asyncRoute: PermissionRoute = {
            id: item.id,
            parentId: item.parentId,
            parentName: permissionMap.get(item.id)?.name,
            route: {
                name: item.name,
                redirect: item.redirect,
                path: item.path,
                component: () => import(`@/views/${item.component}`)
            }
        }

        return asyncRoute
   }

   const routers = [
        { path: '/403', name: 'Qianli403', meta: { hidden: true }, props: { status: 403 }, component: ErrorView },
        { path: '/404', name: 'Qianli404', meta: { hidden: true }, props: { status: 404 }, component: ErrorView },
        { path: '/:catchAll(.*)', redirect: '/404', meta: { hidden: true } }
   ]

   function generateRoute(permission: Permission[], router: Router) {
       const asyncRouters = permission.map(createRoute)

       for (asyncRoute of asyncRouters) {
            router.addRoute(asyncRoute.parentName, asyncRoute.route)
       }

       for (route of routers) {
            router.addRoute(route)
       }
   }

   const router = createRouter({
        history: createWebHistory(import.meta.env.BASE_URL),
        routes: [
            { path: '/', name: 'QianliRoot', meta: { hidden: true }, redirect: '/dashboard/workplace' },
            {
                path: '/login',
                name: 'QianliLogin',
                meta: { hidden: true, title: '登录' },
                props: route => ({ redirect: route.query.redirect }),
                component: () => import('@/views/login/index.vue')
            }
        ]
    })
   ```

```flow:prest
logIn=>start: 用户登录
logOut=>operation: 用户登出
permission=>operation: 获取权限配置
route=>operation: 生成路由
view=>operation: Dashboard
end=>end: 结束

logIn->permission->route->view->logOut
logOut->logIn
logOut->end
```

#### 有几个问题

##### props 问题

我们可以看到 动态生成路由 非常麻烦，手动组合 route 配置，且 props 没办法 手动指定，只能 props: true，这样是能解决问题 但是

## 第一个问题：如何才能控制页面/组件展示

### 1、绑定权限码
