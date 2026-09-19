---
url: /log/typescript/decorator.md
---

# Typescript 类型装饰器

好久没有去看ts文档了，最近在用 ts + vue3 写项目，发现ts 都更新到 5.0版本了...

前面工作都没用过了，主要是 公司项目 全都是js项目，想用要照顾到组员的技术水平 哎。。。

今天去看了下 [TS 5.0](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html#writing-well-typed-decorators) 版本更新日志，发现 装饰器 更新了

5.0 的装饰器 可以写 约束类型了，在早之前 是不能约束任何类型的(谢谢三月老师提示)

## 一个简单的类型约束装饰器

我们想要推导出 被Log装饰 的函数的参数类型，以提供给Log 作为参数类型使用

![ts 类型装饰器](https://static-1256180570.cos.ap-nanjing.myqcloud.com/image/2023-12-16-00-27-23-202312160027099.png?imageMogr2/interlace/1/quality/100/)

::: playground#ts 例子1

@file index.ts

```ts
function Log<T, K extends string>(
  ...args: K extends keyof T ? (T[K] extends (...args: any[]) => any ? Parameters<T[K]> : never) : never
) {
  return function (target: T, key: K, descriptor: PropertyDescriptor) {
    descriptor.value = function (...args: any[]) {}
  }
}

interface Data {
  name: string
  job: string
  age: number
}

class Test {
  @Log({ name: '666', age: 23, job: '摄影师' })
  say(data: Data) {
    console.log('用户名是', data.name)
    console.log('职业是', data.job)
    console.log('年龄是', data.age)
  }
}

const test = new Test()
```

@setting

```json
{
  "experimentalDecorators": true
}
```

:::

## 再来一个复杂一点的装饰器

比如我们自定义取参数的数据，类似一个 map 返回 需要的东西

::: playground#ts 例子2

@file index.ts

```ts
function Log<
  T extends { id: number },
  K,
  Args = K extends keyof T ? (T[K] extends (...args: any[]) => unknown ? Parameters<T[K]>[number] : never) : never
>(map: (data: Args) => string) {
  return function (target: T, key: K, descriptor: PropertyDescriptor) {
    const original = descriptor.value as (this: T, data: Args) => unknown
    descriptor.value = function (this: T, data: Args) {
      const message = map(data)
      console.log(`实例id: ${this.id} to log`)
      console.log('to log', message)
      original.call(target, data) as unknown
    }
  }
}

interface Data {
  name: string
  job: string
  age: number
}

class Test {
  constructor(public id: number) {}

  @Log(data => data.name)
  say(data: Data) {
    console.log('用户名是', data.name)
    console.log('职业是', data.job)
    console.log('年龄是', data.age)
  }
}

const test = new Test(9527)

test.say({ name: '机车靓仔', job: '摄影师', age: 23 })
```

@setting

```json
{
  "experimentalDecorators": true
}
```

:::

![复杂一点的装饰器](https://static-1256180570.cos.ap-nanjing.myqcloud.com/image/2023-12-16-01-04-01-202312160104300.png?imageMogr2/interlace/1/quality/100)

## 结语

ts 这次的装饰器更新 太棒了， 之前的 装饰器类型 太差劲了 无法做到类型推导 大量的 any 类型定义，体验差 无法做到自动推导

此次更新的一个契机也是 ECMAScript 的装饰器标准 已经进入到 stage 3 阶段了，装饰器已经定型了，就等下一个时机正式成为 ECMAScript 标准一部分了

本节内容你学会了吗 🤡
