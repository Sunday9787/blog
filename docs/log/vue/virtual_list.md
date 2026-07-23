---
title: 虚拟列表
date: 2025-1-22 15:15:00
sticky: 5
top: true
categories: [Vue]
description: Vue 虚拟列表实现方案
tags: [Vue, 虚拟列表]
---

虚拟列表-完美的障眼法

<!-- more -->

## 前言

虚拟列表在C端和B端大量数据展示，有些切图仔一点不陌生，有些就很陌生感觉很高端的样子呢🧐

## 什么是虚拟列表

有的特殊场景我们不能分页，只能渲染一个长列表。这个长列表中可能有几万条数据，如果全部渲染到页面上用户的设备差点可能就会直接卡死了，这时我们就需要虚拟列表来解决问题

![](https://static-1256180570.cos.ap-nanjing.myqcloud.com/image/1737532126.webp)

其中实线框的item表示在视口区域内真实渲染DOM，虚线框的item表示并没有渲染的DOM。

在item固定的的虚拟列表中，我们可以根据`可视区域的高度`和`每个item的高度`计算得出在可视区域内可以渲染多少个item。不在可视区域里面的item那么就不需要渲染了（不管有几万个还是几十万个item），这样就能解决长列表性能很差的问题啦。

## 实现原理

我们需要知道item 的高度 从而计算出 可视区应该展示多少个 item，通过滚动条拖动来动态计算 可视区展示的items

滚动条如何产生？

滚动容器内放置一个div原素 高度 = 总数据的长度 * item的高度即可

## 实现滚动条

根据上图dom结构应该是这样子

```html
<template>
  <div class='app-virtual-list'>
    <ol class='app-virtual-container' style={this.containerStyle}>
      <!-- 只渲染可视区域列表数据 -->
    </ol>
  </div>
</template>

<style>
.app-virtual-list {
  position: relative;
  height: 100%;
  padding: 10px 0;
  overflow-y: auto;
}
.app-virtual-container {
  position: absolute;
  inset: 0;
  height: 100%;
  padding: 0;
  margin: 0;
  overflow: hidden;
  list-style: none;
}
.app-virtual-scroll-bar {
  position: absolute;
  top: 0;
  right: 0;
  z-index: -1;
  width: 1px;
  visibility: hidden;
}
</style>
```

### 滚动条怎么来？

非常简单，我们知道每个item的高度`itemHeight`，并且知道有多少条数据`data.length`。那么`itemHeight * data.length`不就是真实的列表高度了吗

```html
<div class='app-virtual-list'>
  <div class='app-virtual-scroll-bar' style={{ height: this.listHeight + 'px' }} />
  <ol class='app-virtual-container' style={this.containerStyle}>
		<!-- 只渲染可视区域列表数据 -->
  </ol>
</div>
```

`.app-virtual-scroll-bar` 采用绝对定位，为了不遮挡住内容，所以需要设置`z-index: -1`

### 可视区展示多少个item？

实际上非常简单

可视区可展示数量 = 向上取整（可视区高度 / item 高度）

```js
/**
 * 可视区高度
 */
const screenHeight = ref(0)
/**
 * 可视区可展示数量 = 向上取整（可视区高度 / item 高度）
 */
const visibleCount = computed(function () {
  return Math.ceil(screenHeight.value / props.itemHeight)
})
onMounted(function () {
  screenHeight.value = virtualContainer.value.clientHeight
})
```

`可视区高度 = app-virtual-list容器的高度`

为什么要使用`Math.ceil`向上取整呢？

因为如果少了一个在滚动时只要有个item在可视区域漏了一点出来，我们也应该将其渲染

此时我们得到一下几个变量

- 可视区可展示数量 = 向上取整（可视区高度 / item 高度）
- 数据的结束索引 = 起始索引 + 可视区可展示数量
- 数据起始索引 = 向下取整（滚动高度 / item 高度）
- 真实渲染items = 总数据列表.slice(数据起始索引, 数据结束索引)
- 列表总高度 = item高度 * 总数据列表长度

```js
/**
 * 可视区高度
 */
const screenHeight = ref(0)

/**
 * @type {import('vue').Ref<HTMLUListElement>}
 */
const virtualContainer = ref()

/**
 * 可视区可展示数量 = 向上取整（可视区高度 / item 高度）
 */
const visibleCount = computed(function () {
  return Math.ceil(screenHeight.value / props.itemHeight)
})

/**
 * 滚动的高度
 */
const scrollTop = ref(0)

/**
 * 列表总高度 = item 高度 * 总数量
 */
const listHeight = computed(function () {
  return props.data.length * props.itemHeight
})

/**
 * 数据的起始索引 = 向下取整（滚动高度 / item 高度）
 */
const startIndex = computed(function () {
  return Math.floor(scrollTop.value / props.itemHeight)
})

/**
 * 数据的结束索引 = 起始索引 + 可视区可展示数量
 */
const endIndex = computed(function () {
  return startIndex.value + visibleCount.value
})

const offset = ref(0)

/**
 * 列表显示数据为
 */
const visibleData = computed(function () {
  return props.data.slice(startIndex.value, Math.min(endIndex.value, props.data.length))
})

/**
 * @type {import('vue').Ref<import('vue/types/jsx').StyleValue>}
 */
const containerStyle = computed(function () {
  return {
    transform: `translate3d(0, ${offset.value}px, 0)`
  }
})

onMounted(function () {
  screenHeight.value = virtualContainer.value.clientHeight
})
```

### 为何起始索引是由 `向下取整（滚动高度 / item 高度）`？

例如item高度 = 50 滚动高度是100 那么就代表2个item已被遮住

向下取整是因为如何如果当滚动高度是80时，则代表第二个item有一部分被遮住一部分还在可视区，则不能判定已经遮住

## 滚动事件

```js
/**
 * @param {UIEvent} e
 */
function onScroll(e) {
  /**
   * @type {HTMLUListElement}
   */
  const target = e.target
  scrollTop.value = target.scrollTop
  offset.value = target.scrollTop - (target.scrollTop % props.itemHeight)
}
```

### offset 是如何得来？

首先我们要明白，我们手动创建了真实item的高度`app-virtual-scroll-bar`那我们滚动的时候拖动的是真实的滚动条，可视区的高度始终是固定的。那么我们在滚动容器的时候，则内容需要跟随滚动条位置，否则容器内items则被卷进去，所以需要给items容器设置一个偏移量让他始终保持在可视区位置

### 如何计算 offset？

正常来讲`scrollTop`的值就是offset的偏移量，但是因为当item高度 = 50 滚动高度是120，此时第二个未被遮住那么他距离容器的顶部距离则是20`scrollTop % itemHeight`(如果非0则表示被除数无法被整除)所以offset的真实值是 `scrollTop -(scrollTop % itemHeight) `

## 扩展一下

我们给新增个功能，滚动到底部一定位置触发事件，让父组件去获取数据，从而实现无限滚动加载数据

### Props

| Name      | Type   | describe   |
| --------- | ------ | ---------- |
| `limit`   | Number | 分页大小   |
| `current` | Number | 当前第几页 |
| `rowKey`  | String | key        |
| `offset`  | Number | 底部偏移量 |

默认Props配置

```js
const defaultProp = { limit: 15, current: 1, rowKey: 'id', offset: 80 }
```

需要改动的地方很小

我们需要新增一个loading变量,在滚动的时候，判断

如果处于loading时则 return

否则计算最底部item 距离 可视区的距离 是否 >= `options.offset` 触发 `end` 事件 通知父组件获取数据

```js
/**
 * @param {UIEvent} e
 */
function onScroll(e) {
  /**
   * @type {HTMLUListElement}
   */
  const target = e.target
  scrollTop.value = target.scrollTop
  startOffset.value = target.scrollTop - (target.scrollTop % props.itemHeight)

  if (loading.value) return
  if (target.scrollHeight - target.scrollTop - screenHeight.value < options.offset) {
    loading.value = true
    options.current += 1

    context.emit('end', options)
  }
}
```

通过向外暴露loaded方法来通知虚拟列表，数据加载完毕

首次使用时，自动触发 `end` 事件,让父组件开始获取数据

```js
function loaded() {
  loading.value = false
}

context.emit('end', options)
loading.value = true

context.expose({ loaded })
```



## 完整的代码

组件

```jsx
import { computed, defineComponent, onMounted, ref } from 'vue'
import './style.scss'

const defaultProp = { limit: 15, current: 1, rowKey: 'id', offset: 80 }

export default defineComponent({
  name: 'app-virtual-list',
  props: {
    data: {
      type: Array,
      default: () => []
    },
    /** item 高度 */
    itemHeight: {
      type: Number,
      required: true
    },
    prop: {
      type: Object,
      default: () => defaultProp
    }
  },
  setup(props, context) {
    /**
     * @type {{limit: number, current: number, rowKey: string, offset: number}}
     */
    const options = Object.assign({}, defaultProp, props.prop)

    const loading = ref(false)

    /**
     * 可视区高度
     */
    const screenHeight = ref(0)

    /**
     * @type {import('vue').Ref<HTMLUListElement>}
     */
    const virtualContainer = ref()

    /**
     * 可视区可展示数量 = 向上取整（可视区高度 / item 高度）
     */
    const visibleCount = computed(function () {
      return Math.ceil(screenHeight.value / props.itemHeight)
    })

    /**
     * 滚动的高度
     */
    const scrollTop = ref(0)

    /**
     * 列表总高度 = item 高度 * 总数量
     */
    const listHeight = computed(function () {
      return props.data.length * props.itemHeight
    })

    /**
     * 数据的起始索引 = 向下取整（滚动高度 / item 高度）
     */
    const startIndex = computed(function () {
      return Math.floor(scrollTop.value / props.itemHeight)
    })

    /**
     * 数据的结束索引 = 起始索引 + 可视区可展示数量
     */
    const endIndex = computed(function () {
      return startIndex.value + visibleCount.value
    })

    const startOffset = ref(0)

    /**
     * 列表显示数据为
     */
    const visibleData = computed(function () {
      return props.data.slice(startIndex.value, Math.min(endIndex.value, props.data.length))
    })

    /**
     * @type {import('vue').Ref<import('vue/types/jsx').StyleValue>}
     */
    const containerStyle = computed(function () {
      return {
        transform: `translate3d(0, ${startOffset.value}px, 0)`
      }
    })

    onMounted(function () {
      screenHeight.value = virtualContainer.value.clientHeight
    })

    /**
     * @param {UIEvent} e
     */
    function onScroll(e) {
      /**
       * @type {HTMLUListElement}
       */
      const target = e.target
      scrollTop.value = target.scrollTop
      startOffset.value = target.scrollTop - (target.scrollTop % props.itemHeight)

      if (loading.value) return
      if (target.scrollHeight - target.scrollTop - screenHeight.value < options.offset) {
        loading.value = true
        options.current += 1

        context.emit('end', options)
      }
    }

    function loaded() {
      loading.value = false
    }

    context.emit('end', options)
    loading.value = true

    context.expose({ loaded })

    return {
      options,
      virtualContainer,
      listHeight,
      containerStyle,
      visibleData,
      onScroll
    }
  },
  render() {
    return (
      <div class='app-virtual-list' ref='virtualContainer' onScroll={this.onScroll}>
        <div class='app-virtual-scroll-bar' style={{ height: this.listHeight + 'px' }} />
        <ol class='app-virtual-container' style={this.containerStyle}>
          {this.visibleData.map(item => (
            <li
              class='app-virtual-item'
              key={item[this.options.rowKey]}
              style={{ height: this.itemHeight + 'px' }}
            >
              {this.$scopedSlots.default(item)}
            </li>
          ))}
        </ol>
      </div>
    )
  }
})
```

样式

```scss
.app-virtual-list {
  position: relative;
  height: 100%;
  padding: 10px 0;
  overflow-y: auto;
}

.app-virtual-container {
  position: absolute;
  inset: 0;
  height: 100%;
  padding: 0;
  margin: 0;
  overflow: hidden;
  list-style: none;
}

.app-virtual-scroll-bar {
  position: absolute;
  top: 0;
  right: 0;
  z-index: -1;
  width: 1px;
  visibility: hidden;
}
```

## 最后

虚拟列表的原理我也看过不少文章，也是似懂半懂的样子，所以想写个组件彻底了解原理可以温故知新

祝大家新春快乐

![-468a38b7dc9409a6](https://static-1256180570.cos.ap-nanjing.myqcloud.com/image/1737688730.jpg)
