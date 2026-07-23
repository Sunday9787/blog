---
title: 我是这样写TS的
date: 2024-10-8 11:30:00
sticky: 3
top: true
categories: [Typescript]
tags: [Typescript, Vue]
---

写了那么多年TS总结一下vue3 + ts 最佳实践，我愿称之为：终极蛇皮上帝视角之TS的终极奥义之女朋友喊我回家吃饭之我6点准时下班！好的下面我们开始进入正文

<!-- more -->

## 前言

你是否有这样的顾虑，项目想上ts但是又怕写声明，还有各种数据结构转换，尤其是提交数据给后端尤其费劲，那~ 我是这样写ts的

这篇文章是受到 这篇文章启发而来 [也许跟大家不太一样,我是这么用TypeScript来写前端的](https://juejin.cn/post/7259562014417813564?searchId=202405211746025DD37F5F491A5FF13ED1#heading-5)不同的是我只有实战没有花活没有高科技名词

我早在18年下半年就开始使用Vue2 + TS 了，但那时候 写接口返回的声明真的是累死了，后面 vscode 有个 `JSON TO TS` 的插件可以一键把json 转为类型声明，帮我减轻了不少工作量。（听说还有后端可以直接生成d.ts的操作，但是我那个时候不知道👀）

TS 写下来觉得没有它不能活，代码就是文档，代码就是api，也不需要总是去翻API文档了 `.`一下所有东西都出来了，也不需要担心单词拼写错误，完全百分百杜绝这类低级错误。（关于要不要上TS这个话题太多了，你觉得好就上不好就不上，就这么简单，懂的人自然懂。。。）

不过现在想想，当时上 TS 有点虎，当时我学TS花了一周左右，就直接上了👀😅

## 传统的前端TS操作

```ts
// api/user.ts
interface User {
  id: number;
  nickname: string;
  avatar: string;
  email: string;
  createAt: string
}

function UserUpdate(data: User) {
  return axios.post({ url: '/user/update', { data } })
}

// views/user/index.vue
defineComponent({
  setup() {
    // 如果数据需要一次性更新 那么 使用 ref 否则使用 reactive
    const user = ref<User>({
      id: 0,
      nickname: '',
      avatar: '',
      email: ''
    });

    return {
      user
    }
  }
})
```

看着好像是没啥问题，确实没啥问题🤪但是不觉得繁琐吗？

我需要先写声明，接着 需要去声明变量，真的没必要。。。

## 我的操作

### Class

是否忘记了 ts 中 class 也是类型，那么我 直接定义 class

```ts
// api/user.ts
export class User {
  id: number
  nickname: string
  avatar: string
  email: string
  createAt: string
}
```

别忘了tsconfig内关闭 `strictPropertyInitialization` 这样就不需要再写 `!`非空操作符了(主要还是麻烦 不好看)

```json
{
  ...,
  "compilerOptions": {
    "strictPropertyInitialization": false,
  }
}
```

`strictPropertyInitialization`是控制 是否严格初始化变量，默认是true

有人会问 为什么不初始化 属性呢？

其实 如果没有必要的话 不需要初始化（id 这种可以初始化一个值），完全是多此一举，首先 组件 会有空判断，其次 接口同样会返回这样的数据结构，如果后端不确定这个字段是否返回那么我们相应的加一个`?`可选声明即可

### Model

那么还有一个问题，上面是 后端返回的数据模型，其实 后端返回的数据结构 通常前端不能直接使用，根据业务复杂度不同，前端也有自己的数据模型，根据后端返回的数据来初始化数据模型，提交时 再转换成后端需要的数据模型，转换操作 可能每一个业务都需要 来一遍，js的话还好 ts 则 非常痛苦很繁琐

### Class-transformer

这玩意儿真是相见恨晚，如果我能早点用，也就不用怎么加班了🥲数据转换真的很繁琐

```ts
class User {
  @Expose() id = 0
  @Expose() nickname: string
  @Expose() avatar: string
  @Expose() email: string
  createAt: string
  show = false
}
```

`@Expose` 装饰器配合

```ts
class User {
  @Expose() id = 0
  @Expose() nickname: string
  @Expose() avatar: string
  @Expose() email: string
  createAt: string
  updateAt: string
  show = false
}

// views/user/index.vue
defineComponent({
  setup() {
    const user = ref<User>(new User());

    // 更新&新增
    const save = async function() {
      const message = user.id > 0 ? '更新成功' : '创建成功'
      const data = instanceToPlain(user, { strategy: 'excludeAll' })
      await UserUpdate(data)
			Notify.success(message)
    }

    return {
      user,
      save
    }
  }
})
```

`class-transformer` 过滤字段有几种策略

1. `excludeAll` - 过滤掉未加 `@Expose` 装饰器的字段
2. `exposeAll` - 过滤掉加了 `@Exclude` 装饰器的字段

过滤后提交的数据

```ts
class User {
  @Expose() id = 0
  @Expose() nickname: string
  @Expose() avatar: string
  @Expose() email: string
  createAt: string
  updateAt: string
  show = false
}

instanceToPlain(user, { strategy: 'excludeAll' })

// output
{
  id: number
  name: string
  avatar: string
  email: string
}
```

`class-transformer` 不仅可以过滤字段 还可以 格式化数据

```ts
class User {
  @Expose() id = 0
  @Expose() nickname: string
  @Expose() avatar: string
  @Expose() email: string
  @Transform(value => dayjs(value.value).format('YYYY-MM-DD HH:mm:ss'))
  createAt: string
  @Transform(value => dayjs(value.value).format('YYYY-MM-DD HH:mm:ss'))
  updateAt: string
  show = false
}
```

这样 在渲染时就不需要在 模板上或者render再处理了，而且更优雅

详细功能可参考 [文档](https://github.com/typestack/class-transformer)

### Abstract&OOP

我们其实可以把很多事物都可以抽象为类，以面向对象的形式去设计&管理

#### 服务类：Service

```ts
// global.d.ts
declare namespace AppRequest {
  interface List {
    current?: number
    size?: number
  }
}

// abstractService.ts
export abstract class AbstractService {
  // 定义一个抽象属性 让子类们实现
  abstract baseUrl: string
  // 还可以再定义一些通用方法 让子类实现

  // 添加&更新
  // abstract save?(): Promise<void>
  // 删除
  // abstract del?(): Promise<void>
  // 获取多个数据或者单个数据
  // abstract data()?: Promise<unknown>
  // 获取分页数据
  // abstract select?(query: AppRequest.List): Promise<unknown>
}
```

#### 实体类：Entity

```ts
// abstractEntity.ts
import { instanceToPlain, Transform } from 'class-transformer'

type ObjectKey<T> = keyof T extends `${infer U}` ? U : string
type AbstractEntityMethodKey = ObjectKey<AbstractEntity>
type EntityMethodKey = ObjectKey<AbstractEntityMethod>
type ExcludeEntityAttribute = EntityMethodKey | AbstractEntityMethodKey
// 主要是为了根据实体提取后端返回的数据结构，排除前端实体额外定义的属性&方法
export type EntityJSON<T> = Omit<T, ExcludeEntityAttribute>

export abstract class AbstractEntity {
  public static toJSON<T extends object>(context: T) {
    return instanceToPlain(context, { strategy: 'excludeAll' }) as EntityJSON<T>
  }

  public toJSON() {
    return AbstractEntity.toJSON(this)
  }
}
```

再丰富一点

例如如果表字段都存在 createAt updateAt 这种统一的字段则可以

```ts
// abstractEntity.ts
export abstract class AbstractEntity {
  public static toJSON<T extends object>(context: T) {
    return instanceToPlain(context, { strategy: 'excludeAll' }) as EntityJSON<T>
  }

  @Transform(value => dayjs(value.value).format('YYYY-MM-DD HH:mm:ss'))
  readonly createAt: Date

  @Transform(value => dayjs(value.value).format('YYYY-MM-DD HH:mm:ss'))
  readonly updateAt: Date

  public toJSON() {
    return AbstractEntity.toJSON(this)
  }
}
```

#### 子类实现

```ts
// user.service.ts

export class UserService extends AbstractService {
  baseURL = '/user'

  data(id: number) {
    return request.post(this.baseURL + `/data${id}`)
  }

  del(id: number) {
    return request.delete(this.baseURL + `/del/${id}`)
  }

  save(data: UserEntityJSON) {
    return request.put(this.baseURL + '/save', data)
  }
}

// user.entity.ts
export type UserEntityJSON = EntityJSON<UserEntity>
export class UserEntity extends AbstractEntity {
  private static service = new UserService()
  static statusMap = new Map<UserEntity['status'], { text: string; type: Utils.StatusType }>(
    [0, { text: '未初始化', type: 'warning' }],
    [1, { text: '未认证', type: 'info' }],
    [2, { text: '已认证', type: 'success' }],
  )

  @Expose() id = 0
  @Expose() nickname: string
  @Expose() avatar: string
  @Expose() email: string
  /* 0未初始化 1未实名 2已实名 */
  status: 0|1|2
  get statusText() {
    return UserEntity.statusMap.get(this.status)!.text
  }
  // 是否已实名
  get isCertified() {
    return this.status === 2
  }

  save() {
    return UserEntity.service.save(this.toJSON())
  }

  del() {
    return UserEntity.service.del(this.id)
  }
}
```

> 在这里我并没有依照上面引用的文章把 **service** 声明在实体内，主要是我觉得服务这类初始化一次即可，当然这个看你自己，声明在实体内 直接 `this.service.save(this.toJSON())` 也可

#### View 视图调用

```vue
<template lang="pug">
  el-input(v-model="user.nickname")
  el-button(@click="onUserSave()") 创建用户
</template>

<script setup lang="ts">
const user = shallowRef(new UserEntity())

async function onUserSave() {
  await user.save()
}
</script>
```

获取数据调用

我们可以写成一个hooks

```ts
// global.d.ts
declare namespace Utils {
  type ActionType = 'edit' | 'add' | 'detail'

  interface ActionProps {
    id: number
    type: ActionType
  }

  type StatusType = 'default' | 'error' | 'primary' | 'info' | 'success' | 'warning'
}

// views/user/hooks/index.ts
export function useUser(props: Utils.ActionProps) {
  const user = ref(new UserEntity(props.id))

  user.value.data().then(function (data) {
    user.value = data
  })

  return user
}
```

OOP和FP的完美结合😃

我们再加一个loading状态

```ts
// hooks/useLoading.ts
type UseActionRequest = () => Promise<void>
type UseActionHandle = (request: UseActionRequest) => void
type UseActionCallback = (handle: UseActionHandle) => void

export function useLoading(cb: UseActionCallback) {
  const loading = ref(false)

  function init(refresh = false) {
    cb(function (request) {
      loading.value = true
      request().finally(function () {
        window.setTimeout(
          function () {
            loading.value = false
          },
          refresh ? 0 : 400
        )
      })
    })
  }

  init()

  return { loading, init }
}

// views/user/hooks/index.ts
export function useUser(props: Utils.ActionProps) {
  const user = ref(new UserEntity(props.id))
  
  const { loading } = useLoading(function (request) {
    if (props.type !== 'add') {
      request(async function () {
        user.value = await user.value.data()
      })
    }
  })

  return { user, loading }
}
```

视图

```vue
<template lang="pug">
  app-view
    app-loading(v-if="loading")
    app-card(v-else)
      el-col
        label 用户名
        span {{ user.nickname }}
      el-col
        label 头像
        span {{ user.avatar }}
      el-col
        label 邮箱
        span {{ user.email }}
      el-col
        label 状态
        span {{ user.statusText }}
</template>

<script lang="ts" setup>
import { useUser } from '../hooks'

const { user, loading } = useUser()
</script>
```

## 总结

对比以上发现，oop的方式去组织api 请求 和 数据结构等等，能够更好的内聚业务，合理的分层更能体现出单一职责的设计原则，这对于项目是否变成一座屎山来讲至关重要。

前端现在人人都在讲 FP、FP、FP 其实FP有FP擅长的地方，OOP有OOP擅长的地方，两种模式没有绝对的好也没有绝对的坏，为何不把两种设计模式结合使用，让擅长做的，去做擅长的，岂不是写大欢喜

**强调**

面向对象的设计模式对于不论是什么项目来讲都是非常重要的，工程化、结构化、高度抽象化，可以更好的维护我们的项目，组织代码逻辑

如果本文有帮助到你 还请不要吝啬你的小手手点个小心心

![比心心](https://static-1256180570.cos.ap-nanjing.myqcloud.com/image/202410091825137-1728469523.png)
