---
title: 模板编辑器：状态
date: 2024-11-19 15:00:00
categories: [Vue]
description: 实现一个模板编辑器 - 状态
tags: [Vue, 编辑器, 设计模式]
---

没有石油的的钢铁巨兽就是一堆废铜烂铁...

<!-- more -->

## 前言

编辑的状态管理对于整个编辑器至关重要，如果数据结构没有设计好，则很容易导致在错误的路上一路走到黑。。。开发陷入死胡同。

不论做什么项目写什么功能，第一行代码绝不能是直接写逻辑，否则，就是在拉💩。

必要经过

项目介绍 -> 需求分析 -> 模块拆分 -> 功能设计 -> 数据模型设计 -> 页面绘制 -> 逻辑开发

## 需求分析

编辑器画布有边距，尺寸和方向，模板名称、撤销队列、重做队列、当前控件

## 设计

```ts
interface Store {
  name: string
  get changes(): number
  get size(): Size
  direction: 'vertical' | 'horizontal'
  padding: Padding
  currentComponent: BuiltinComponent
  components: Map<number, BuiltinComponent>
  componentsData: BuiltinComponent[]
  /** 历史记录 */
  record: BuiltinComponentRecord[]
  /** 恢复队列 */
  restore: BuiltinComponentRecord[]
}
```

## 实现

### Size

```js
import { readonly } from 'vue'

const A4 = readonly({
  name: 'A4',
  vertical: {
    width: 794,
    height: 1123
  },
  horizontal: {
    width: 1123,
    height: 794
  }
})

const A5 = readonly({
  name: 'A5',
  vertical: {
    width: 559,
    height: 794
  },
  horizontal: {
    width: 794,
    height: 559
  }
})

export function useSize() {
  return { A4, A5 }
}
```

定义每一种尺寸的两个方向尺寸，这样切换时只需要切换尺寸名称即可，画布根据名称自动调整尺寸

### Padding

```js
import { reactive } from 'vue'

export function usePadding() {
  const padding = reactive({
    top: 20,
    bottom: 20,
    left: 20,
    right: 20
  })

  return padding
}
```

间距

### Store

```js
import { reactive } from 'vue'
import { usePadding } from './usePadding'
import { useSize } from './useSize'

export function useStore() {
  let changes = 0
  const size = useSize()
  const padding = usePadding()

  /**
   * @type {Template.Store}
   */
  const state = reactive({
    name: '',
    direction: 'vertical',
    get changes() {
      return changes
    },
    set changes(val) {
      changes = val
      this.componentsData = Array.from(this.components.values())
    },
    size: {
      name: size.A4.name,
      /** @type {number} */
      get width() {
        return size[this.name][state.direction].width
      },
      /** @type {number} */
      get height() {
        return size[this.name][state.direction].height
      }
    },
    padding,
    /**
     * @type {Map<string, Template.BuiltinComponent>}
     */
    components: new Map(),
    /**
     * @type {Template.BuiltinComponent[]}
     */
    componentsData: [],
    /**
     * 历史记录
     * @type {Template.BuiltinComponentRecord[]}
     */
    record: [],
    /**
     * 恢复队列
     * @type {Template.BuiltinComponentRecord[]}
     */
    restore: [],
    /**
     * @type {Template.|null}
     */
    currentComponent: null
  })

  return state
}
```

`components` 在 store 里我试用了 `Map` 数据结构来存储控件数据

为什么使用 `Map` 存而不是 `Array` ？

> 如果使用 `Array`，那么删除控件时需要准确知道控件的 `index`。如果是在控件视图上加一个删除按钮则很容易实现删除，但是删除不是跟控件一个视图层上，所以你需要单独维护一个 `index` 挺费力，使用 `Map` 则仅仅需要知道 `key` 即可

为什么会有 `componentsData` 它跟 `components` 有什么区别？

> 没有区别，同样都是存组件数据，但是注意听
>
> Vue2 的数据劫持并不能劫持Map这类数据，因为vue2劫持数据核心是，使用`Object.defineProperty` 劫持这些内部操作（如 `set`、`delete` 等方法）它们没有固定的属性键名（不像普通对象那样有具体的键值对），所以无法通过定义特定属性的 `getter` 和 `setter` 来监听。
>
> 所以需要一个数组来存可响应式数据。

那么上面说Map数据不能被劫持那么，Map数据更新后如何才能刷新视图呢？

> 非常简单，定义一个变量 `changes`，`Map` 数据更新后，手动触发 `changes` 变化，`changesset` 触发后 则更新 `componentsData` 响应式变量即可。
>
> **画布上遍历生成控件使用的变量必须是** `componentsData`

## 最后

希望你能看懂为何要如此实现，这样你就能跟我一样强了。

![不要盲目的崇拜我](https://static-1256180570.cos.ap-nanjing.myqcloud.com/image/1732024503.jpg)