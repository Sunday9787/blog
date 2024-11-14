---
title: 模板编辑器：框选
date: 2024-11-11 10:00:00
category: [Vue]
description: 实现一个模板编辑器 - 框选
tag: [Vue, 编辑器, 设计模式]
---

框选这个功能 easy 非常 so easy😉

<!-- more -->

## 前言

这玩意就是翻版的 Photoshop 框选工具，没错我就是设计出身😌

## 需求分析

框选的时候，如果控件在框选范围内则就算是框选上，直接组合成组。当然可以做成一个快捷键组成组，其实对于这种应用来讲，没必要，快捷方便才是第一位，它并不是图像处理。

## 设计

esay 非常 easy

监听鼠标移动然后遍历所有控件比对 控件的四角位置是不是在，鼠标绘制的范围内，如果在，就组合在一块

get

## 视图

```vue
<template lang="pug">
svg.template-area(
  xmlns="http://www.w3.org/2000/svg"
  :width="rectStyle.width"
  :height="rectStyle.height"
  :style="{ left: rectStyle.left, top: rectStyle.top }")
  rect(stroke="var(--color-primary)" fill="rgba(0, 0, 0, 0.1)" stroke-width="1" height="100%" width="100%")
</template>
```

## Props

```js
{
  name: 'TemplateArea',
  inject: ['stageInstance'],
  props: {
    scale: {
      type: Number,
      required: true
    }
  }
}
```

| Name    | Type     | 说明             |
| ------- | -------- | ---------------- |
| `scale` | `Number` | 缩放比例(20-100) |

## 实现

### 初始化

```js
/**
* @type {import('vue').Ref<{x: number, y: number} | null>}
* 鼠标暂存的位置
*/
const stagePosition = ref(null)
// 鼠标划过的宽高XY
const rect = reactive({ w: 0, h: 0, x: 0, y: 0 })

/**
* @type {Map<number, Template.BuiltinComponent>}
*/
const components = new Map()

/**
* @param {PointerEvent} e
*/
const pointerdown = function (e) {
  if (vm.stageInstance.spaceDown) return
  const scale = props.scale / 100
  const x = (e.pageX - vm.stageRect.x) / scale - vm.offset.x
  const y = (e.pageY - vm.stageRect.y) / scale - vm.offset.y

  rect.x = x
  rect.y = y

  stagePosition.value = { x: e.pageX, y: e.pageY }
}
```

这里主要是位置的初始化操作

`components` 是为了存框选范围内的空间

### 框选

```js
/**
* @param {PointerEvent} e
*/
const pointermove = function (e) {
  if (stagePosition.value) {
    const scale = props.scale / 100
    const w = (e.pageX - stagePosition.value.x) / scale
    const h = (e.pageY - stagePosition.value.y) / scale

    rect.w = w
    rect.h = h

    store.components.forEach(function (item) {
      const component = store.components.get(item.uid)

      if (
        item.props.position.x >= rect.x &&
        item.props.position.x <= rect.x + rect.w &&
        item.props.position.y >= rect.y &&
        item.props.position.y <= rect.y + rect.h
      ) {
        if (!components.has(component.uid)) {
          components.set(component.uid, component)
        }
      }
    })
  }
}
```

遍历所有控件，判断xy是否在框选的矩形范围内，如果框选内的组件Map存在则跳过，否则存进Map。

*目前只实现了从左上角到右下角框选，没有实现另外三个方向*

### 框选完成

```js
/**
* @param {PointerEvent} e
*/
const pointerup = function (e) {
  stagePosition.value = null
  rect.w = rect.h = rect.x = rect.y = 0

  if (components.size) {
    const data = Array.from(components.values())

    context.emit('area', data)
    components.clear()

    return
  }

  context.emit('unArea')
}
```

重置变量

触发area事件后，画布接收此事件，并emit到`eventBus`事件管理中。

## 最后

为什么要在画布中中转一次事件？

因为如果直接在area组件中直接emit事件到`eventBus`事件中心，太过于分散，不利于维护，且不利于扩展

这样做的优势在于：

1. **降低耦合**：子组件不会直接与全局 EventBus 交互，这样就减少了对子组件的依赖，使得子组件更加独立和可复用。

2. **事件管理清晰**：父组件成为事件的“路由器”，它可以控制哪些事件需要广播到全局，以及如何进行广播。

3. **可维护性**：如果需要变更全局 EventBus 的逻辑，直接修改父组件的处理逻辑即可，而不必调整子组件。

*事实上，编辑器内所有的组件都是这样传递事件的*

![好饿早知道不做前端了](https://static-1256180570.cos.ap-nanjing.myqcloud.com/image/1731608104.jpg?imageMogr2/interlace/1/quality/100/thumbnail/400x)