---
url: /log/typescript/reset_data.md
---

# 我是这样重置数据的

数据重置，你肯定不陌生，这有啥可讲的，不就是 复制一份 再重新更新上去，哎哎~ 今天讲的可不是让你手动复制一份手动更新

## 前言

相信大家都有遇到这样的一个需求，例如 form 表单，点击编辑只要没有保存，取消时 数据应该还原为之前的数据

在此之前你可能会先 clone一个数据副本，取消再重新赋值上去，嗯~ 没问题 确实可以

但是即便是你把它封装成一个方法，到最后不还是得 import 来 import 过去，还要再 调用。好像有点麻烦的样子👀

本文适合结合上一篇文章 [我是这样写TS的](./design.html) 来阅读

## 传统

```ts [useUser.ts]
import { deepClone } from 'lodash'

// 假设 数据是从 后端获取

export function useUser() {
  return {
    id: 1,
    name: '至尊宝',
    age: 27,
    lover: '紫霞仙子'
  }
}

// user.vue
const user = ref({
  id: 0,
  name: '',
  age: 0,
  lover: ''
})

// 获取用户
const data = useUser()
// copy
const originData = deepClone(data)

user.value = data

// 重置
function reset() {
  user.value = originData
}
```

确实是没问题，继续看不一样的

## 不一样的

### 抽象类 AbstractEntity

在抽象类上添加 reset 方法

```ts
// abstractEntity.ts
const valueWeakMap = new WeakMap<AbstractEntity, EntityJSON<AbstractEntity>>()

export abstract class AbstractEntity {
  constructor() {
    // 注意这里
    const self = this
    window.setTimeout(function () {
      valueWeakMap.set(self, self.toJSON())
    })
  }

  public reset() {
    // 注意这里
    const context = toRaw(this)
    const data = valueWeakMap.get(context)!
    for (const [key, value] of Object.entries(data)) {
      ;(this as Record<string, unknown>)[key] = value
    }
  }
}
```

> 这里可以思考一下 为什么 要 setTimeout 延时 和 reset 方法内 为何要 toRaw

### 实体

```ts
// user.entity.ts
export class UserEntity extends AbstractEntity {
  id: number
  name: string
  age: number
  lover: string
}
```

### 视图

```ts [hooks.ts]
import { plainToInstance } from 'class-transformer'

// 假设已获取到后端数据
export function useUser() {
  const data = new UserEntity()

  Promise.resolve({ name: '至尊宝', age: 27, lover: '紫霞仙子' }).then(function (response) {
    data.value = ref(plainToInstance(UserEntity, response))
  })

  return data
}
```

```vue
<template>
  <form>
    <div>
      <label>用户名</label>
      <input v-model:value="user.name" />
    </div>
    <div>
      <label>年龄</label>
      <input v-model:value="user.age" />
    </div>
    <div>
      <label>喜欢</label>
      <input v-model:value="user.lover" />
    </div>
    <div>
      <button @click="user.reset()">重置</button>
    </div>
  </form>
</template>

<script lang="ts" setup>
import { useUser } from './hooks'

const user = useUser()
</script>
```

怎么样看起来不错吧，很简洁 清晰

## 问题

### WeakMap 是什么？

`WeakMap`这个大家应该很少见，确实 我也少见这个，ES6看了不少，但是这个确实没怎么研究过

先看看MDN怎么解释

> [WeakMap](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/WeakMap)是一种**键值对**的集合，其中的键必须是对象或[非全局注册的符号](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Symbol#全局共享的_symbol)，且值可以是任意的 [JavaScript 类型](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Data_structures)，并且不会创建对它的键的强引用。换句话说，一个对象作为 `WeakMap` 的键存在，不会阻止该对象被垃圾回收。一旦一个对象作为键被回收，那么在 `WeakMap` 中相应的值便成为了进行垃圾回收的候选对象，只要它们没有其他的引用存在。唯一可以作为 `WeakMap` 的键的原始类型是[非全局注册的符号](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Symbol#全局共享的_symbol)，因为非全局注册的符号是保证唯一的，并且不能被重新创建。
>
> `WeakMap` 允许将数据与对象相关联，而不阻止键对象被垃圾回收，即使值引用了键。然而，`WeakMap` 并不允许观察其键的生命周期，这就是为什么它不允许枚举；如果 `WeakMap` 提供了任何获得其键的列表的方法，那么这些列表将会依赖于垃圾回收的状态，这引入了不确定性。如果你想要可以获取键的列表，你应该使用 [`Map`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Map) 而不是 `WeakMap`。

说白了WeakMap 的 key 如果是对象，且这个对象被回收后 那么 所对应的 value 也就被 回收了，那么我们就可以利用这个特性去做数据缓存的操作 嘿嘿嘿🤓

我们都知道 ref 的变量 在 vue 组件销毁时 会自动的也会去销毁变量那么

当 获取后端数据 初始化 class 时 则可以 把原始数据缓存起来，重置的时候 拿出来更新掉，ref 销毁时，则 自动解除了引用 WeakMap 则自动回收 value 值

### 为什么在 constructor 里要 setTimeout？

其实这是跟 微任务/宏任务 有关系的

new 的时候只是会初始化一个普通类而已。如果是初始化数据则（**注意此时数据并没有被填充**），此时 this 是一个 未被填充数据的空对象 所以需要 setTimeout 或者 Promise.then 做异步操作，否则`self.toJSON()`返回的是空对象

### 为什么在 reset 方法内 需要 `toRaw(this)`？

因为此时 this 是一个被 vue 代理的 对象，所以 原来的 this 内存地址 跟 当前 this 内存地址不一致 所以 `valueWeakMap.get(this)`获取到的 是 undefined

在 constructor 里 WeakMap 存的 this 是 未被代理的原生对象，因为那个时候 plainToInstance 还在初始化 class

## 总结

![](https://static-1256180570.cos.ap-nanjing.myqcloud.com/image/%E8%BF%99%E8%BA%AB%E6%80%8E%E6%A0%B7-1729935995.jpg?imageMogr2/interlace/1/quality/100/thumbnail/300x)

Class 优雅永不过时
