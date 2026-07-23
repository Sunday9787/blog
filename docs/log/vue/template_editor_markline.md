---
title: 模板编辑器：辅助线
date: 2024-11-1 10:30:00
categories: [Vue]
description: 实现一个模板编辑器 - 辅助线
tags: [Vue, 编辑器, 设计模式]
---

辅助线听起来高大上，其实就那么回事儿😝

<!-- more -->

## 前言

这个功能的思路几乎没有经过深思熟虑，就自然地顺畅地出来了，思维像源泉一样不断涌现，是我最得意的功能。

## 需求分析

当控件移动的时候，监听其位置，跟其他控件的水平和垂直对应的边上的每一个控制点的x&y都做一个比较，也就是

`left` vs `left`

`left` vs `right`

`right` vs `right`

`top` vs `top`

`top` vs `bottom`

`top` vs `center`

`bottom` vs `bottom`

`bottom` vs `center`

`bottom` vs `top`

等等... （实际代码里我没有举例完）

跟其他控件的这些边都做一个比较，如果差值在5像素范围，那么就显示此辅助线，并将辅助线x，y更新。

## 设计

**辅助线**

辅助线只是一个展示，仅仅需要控制其 `visible` `x,y` 即可，我们可以根据控件定义6个辅助线分别是

yl => 纵轴左边

yc => 纵轴中间

yr => 纵轴右边

xt => 横轴上边

xc => 横轴中间

Xb => 横轴下边

当然其实定义2条线其实也是可以的，这里我为了更清楚的去显示辅助线所以使用了6条线

```js
/**
   * @type {import('vue').Ref<Array<{type: 'yl'|'yc'|'yr'|'xt'|'xc'|'xb',direction: string, visible: boolean, position: {left: number, top: number}}>>}
   */
const markLine = ref([
  { type: 'yl', direction: 'vertical', visible: false, position: { left: 0, top: 0 } },
  { type: 'yc', direction: 'vertical', visible: false, position: { left: 0, top: 0 } },
  { type: 'yr', direction: 'vertical', visible: false, position: { left: 0, top: 0 } },
  { type: 'xt', direction: 'horizontal', visible: false, position: { left: 0, top: 0 } },
  { type: 'xc', direction: 'horizontal', visible: false, position: { left: 0, top: 0 } },
  { type: 'xb', direction: 'horizontal', visible: false, position: { left: 0, top: 0 } }
])
```

## 视图

### 组件

```vue
<template lang="pug">
svg.template-mark-line(
  xmlns="http://www.w3.org/2000/svg"
  :width="size.width"
  :height="size.height"
  :style="wrapperStyle"
  :class="{visible}")
  line(stroke="var(--color-primary)" x1="0" y1="0" :x2="size.width" :y2="size.height")
</template>
```

### 使用

```vue
<template>
TemplateMarkLine(v-for="item of markLine"
  :key="item.type"
  :position="item.position"
  :direction="item.direction"
  :visible="item.visible")
</template>
```

## Props

```js
{
  name: 'TemplateMarkLine',
  props: {
    visible: Boolean,
    direction: {
      type: String,
      default: 'horizontal'
    },
    position: {
      type: Object,
      required: true
    }
  }
}
```

| Name        | Type                        | 说明 |
| ----------- | --------------------------- | ---- |
| `direction` | `"horizontal" | "vertical"` | 方向 |
| `position`  | `{x: Number, y: Number}`    | 位置 |

## 实现

### 边界判定

```js
/**
 * @param {number} dragValue
 * @param {number} targetValue
 */
function isNearly(dragValue, targetValue) {
  return Math.abs(dragValue - targetValue) <= 5
}
```

此函数 只是判断多少距离是到达边界值

### 对比条件

```js
/**
 * @type {Record<string, (rect1: Template.Rect, rect2: Template.Rect) => {visible: boolean, position: {left: number, top: number}}}}>}
 */
const conditions = {
  yl(rect1, rect2) {
    const ll = {
      visible: isNearly(rect1.left, rect2.left),
      position: { left: rect2.left, top: 0 }
    }

    const lr = {
      visible: isNearly(rect1.left, rect2.right),
      position: { left: rect2.right, top: 0 }
    }

    return ll.visible ? ll : lr
  },
  yc(rect1, rect2) {
    return {
      visible: isNearly(rect1.right - rect1.width / 2, rect2.right - rect2.width / 2),
      position: { left: rect2.right - rect2.width / 2, top: 0 }
    }
  },
  yr(rect1, rect2) {
    const rr = {
      visible: isNearly(rect1.right, rect2.right),
      position: { left: rect2.right, top: 0 }
    }

    const rl = {
      visible: isNearly(rect1.right, rect2.left),
      position: { left: rect2.left, top: 0 }
    }

    return rr.visible ? rr : rl
  },
  xt(rect1, rect2) {
    const tt = {
      visible: isNearly(rect1.top, rect2.top),
      position: { left: 0, top: rect2.top }
    }

    const tb = {
      visible: isNearly(rect1.top, rect2.bottom),
      position: { left: 0, top: rect2.bottom }
    }

    return tt.visible ? tt : tb
  },
  xc(rect1, rect2) {
    return {
      visible: isNearly(rect1.bottom - rect1.height / 2, rect2.bottom - rect2.height / 2),
      position: { left: 0, top: rect2.bottom - rect2.height / 2 }
    }
  },
  xb(rect1, rect2) {
    const bb = {
      visible: isNearly(rect1.bottom, rect2.bottom),
      position: { left: 0, top: rect2.bottom }
    }

    const bt = {
      visible: isNearly(rect1.bottom, rect2.top),
      position: { left: 0, top: rect2.top }
    }

    return bb.visible ? bb : bt
  }
}
```

定义了各个边的对比，其实很简单，就是 两个点的距离计算比较

## 遍历对比

```js
/**
  * @param {Template.Event<Template.BuiltinComponent>} e
  */
const moveHandle = function (e) {
  const currentComponent = e.detail
  // 获得当前控件 rect
  const currentRect = getRect(currentComponent)

  // 遍历所有控件
  for (const [key, item] of store.components) {
    // 如果当前控件是自己则跳过
    if (key === currentComponent.uid) continue

    // 获取控件 rect
    const rect = getRect(item)

    // 成立条件数量
    let condition = 0

    // 所有条件进行一次执行
    for (const line of markLine.value) {
      const { visible, position } = conditions[line.type].apply(null, [currentRect, rect])
      line.visible = visible
      line.position = position

      if (visible) {
        condition += 1

        /**
          * @type {[number, number]}
          */
        const [x, y] = [
          position.left || currentComponent.props.position.x,
          position.top || currentComponent.props.position.y
        ]

        // 这一步是为了 让组件有个吸附效果
        switch (line.type) {
          case 'xt':
            currentComponent.props.position.x = x
            currentComponent.props.position.y = y
            break
          case 'xc':
            currentComponent.props.position.x = x
            currentComponent.props.position.y = y - currentComponent.props.size.h / 2
            break
          case 'xb':
            currentComponent.props.position.x = x
            currentComponent.props.position.y = y - currentComponent.props.size.h
            break
          case 'yc':
            currentComponent.props.position.x = x - currentComponent.props.size.w / 2
            currentComponent.props.position.y = y
            break
          case 'yl':
            currentComponent.props.position.x = x
            currentComponent.props.position.y = y
            break
          case 'yr':
            currentComponent.props.position.x = x - currentComponent.props.size.w
            currentComponent.props.position.y = y
            break
        }
      }
    }

    // 如果有一个条件成立 则取消遍历
    if (condition) break
  }
}
```

## 最后

![](https://static-1256180570.cos.ap-nanjing.myqcloud.com/image/1731492501.jpg)