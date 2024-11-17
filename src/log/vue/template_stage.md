---
title: 模板编辑器：画布
date: 2024-11-13 13:00:00
category: [Vue]
description: 实现一个模板编辑器 - 画布
tag: [Vue, 编辑器, 设计模式]
---

它是一块自由的天地，艺术家可以在其中创造属于自己的世界...

<!-- more -->

## 前言

画布就是把控件原素放进去

## 需求分析

画布需要支持缩放，空格+鼠标左键拖拉移动，和随着滚轮位置缩放，以及添加删除控件

## 设计

这里着重说下 缩放 和 拖动

### 缩放

使用`transform`的`scale`实现，为了不产生精度问题数值范围采用 10 - 100，最后 / 100即可

### 拖动

画布使用position定位，为什么不也采用transform呢？

> 因为，使用 `transform: translate` 移动元素后，如果用户点击的是视觉上移动后的区域，事件可能无法触发，因为事件仍然绑定在原始位置

**position 和 transform 使用场景**

| 场景                               | 推荐使用               | 原因                                                         |
| ---------------------------------- | ---------------------- | ------------------------------------------------------------ |
| 精确移动元素且需要交互事件         | `position`             | 元素的实际边界会随之移动，点击或事件触发范围和视觉一致。     |
| 动画效果或临时位移，事件触发不重要 | `transform: translate` | 适合单纯的视觉效果，不影响事件触发。                         |
| 动画效果中同时需要事件触发         | `transform` + 调整逻辑 | 如果事件范围有问题，可以额外调整父容器或通过 JavaScript 手动处理事件触发逻辑。 |

## 视图

 ```vue
<template lang="pug">
.template-stage(
  tabindex="-1"
  :style="stageStyle"
  @pointerdown="unSelectComponent"
  @keydown.delete="deleteComponent"
  @drop="dropHandle"
  @dragover.prevent="noop")
  TemplateContextmenu(:scale="scale")
  TemplateArea(:scale="scale" @area="area")
  TemplateMarkLine(v-for="item of markLine"
    :key="item.type"
    :position="item.position"
    :direction="item.direction"
    :visible="item.visible")
  TemplateControl(v-for="component of store.componentsData"
    v-model="component.visible"
    :key="component.id"
    :scale="scale"
    :lock="component.props.lock"
    :zIndex="component.props.zIndex"
    :position.sync="component.props.position"
    :size.sync="component.props.size"
    @moveStart="moveStart(component)"
    @move="move(component)"
    @moveEnd="moveEnd(component)"
    @resizeStart="resizeStart(component)"
    @resize="resize(component)"
    @resizeEnd="resizeEnd(component)"
    @select="selectComponent(component)")
    component(
      top
      group
      ref="builtinGroupComponentRef"
      :is="component.name"
      :children="component.children"
      v-bind="component.props"
      v-if="component.name === 'builtin-group'")
    component(
      ref="builtinComponentRef"
      :is="component.name"
      v-bind="component.props"
      v-else)
</template>
 ```

`tabindex="-1"`这个属性很重要，不设置这个，原素无法触发键盘事件

原因

> 普通非交互元素（如 `div`, `span`）在默认情况下是**不可聚焦（not focusable）**的。
>
> 只有交互式元素（如 `input`, `button`, `textarea`, `a` 等）默认可以通过键盘或鼠标获取焦点，才能接收键盘事件。

`tabindex` 的作用

> 当为一个普通元素添加 `tabindex` 属性时，它会影响该元素的焦点行为：
>
> - `tabindex="0"`: 元素变得可聚焦，并参与正常的 Tab 键导航顺序。
> - `tabindex="-1"`: 元素变得可聚焦，但不参与 Tab 键导航顺序。只能通过编程或鼠标点击等方式聚焦。即便不参与导航，元素一旦被聚焦，就能触发键盘事件。

聚焦与键盘事件的关系

> 键盘事件（如 `keydown`, `keypress`, `keyup`）只有在元素**拥有焦点**时才会触发。因此：
>
> 1. 为普通元素添加 `tabindex="-1"` 后，虽然它不能被 Tab 键选中，但仍然能通过脚本或鼠标点击使其聚焦。
> 2. 一旦元素获得焦点，它就能正常响应键盘事件。

剩下的就是一些编辑器核心组件使用

> `TemplateControl`将控件放进 `slot` 即可实现控件的拖拉移动和控制
>
> `TemplateContextmenu` 自定义右键菜单，调整控件层级关系和控制是否锁定
>
> `TemplateArea`框选组件，判定范围内那些控件应该组合，最后触发事件，最后监听组合，解组合
>
> `TemplateMarkLine`辅助线，通过 `useMarkLine` 来获取数据控制位置和是否显示线条

所有功能都是以组件化思维设计开发，做到了，高内聚低耦合，易扩展维护

## Props

```js
export default {
  name: 'TemplateStage',
  components: {
    BuiltinInput: () => import('../components/builtin/builtin-input.vue'),
    BuiltinGroup: () => import('../components/builtin/builtin-group.vue'),
    BuiltinSelect: () => import('../components/builtin/builtin-select.vue'),
    TemplateControl: () => import('../components/template-control.vue'),
    TemplateMarkLine: () => import('../components/template-mark-line.vue'),
    TemplateArea: () => import('../components/template-area.vue'),
    TemplateContextmenu: () => import('../components/template-contextmenu.vue')
  },
  props: {
    scale: {
      type: Number,
      required: true
    },
    position: {
      type: Object,
      required: true
    },
    spaceDown: {
      type: Boolean,
      required: true
    },
    scaleManual: {
      type: Boolean,
      required: false
    }
  },
  provide() {
    return {
      stageInstance: this
    }
  },
}
```

| Name          | Type                   | 说明                                                         |
| ------------- | ---------------------- | ------------------------------------------------------------ |
| `scale`       | Number                 | 缩放数值（10-100）                                           |
| `position`    | {x: Number, y: Number} | 画布位置                                                     |
| `spaceDown`   | Boolean                | 空格键是否被按下（按下后，拖动鼠标即可拖动画布）             |
| `scaleManual` | Boolean                | 是否手动调整缩放（`true`跟随鼠标位置缩放，`false`手动点击缩放按钮缩放） |

## 实现

**计算样式**

```js
{
  computed: {
    stageStyle() {
      return {
        borderLeftWidth: this.store.padding.left + 'mm',
        borderTopWidth: this.store.padding.top + 'mm',
        borderRightWidth: this.store.padding.right + 'mm',
        borderBottomWidth: this.store.padding.bottom + 'mm',
        width: this.store.size.width + 'px',
        height: this.store.size.height + 'px',
        left: this.position.x + 'px',
        top: this.position.y + 'px',
        transformOrigin: this.scaleManual ? 'center' : 'left top',
        transform: `scale3d(${this.scale / 100}, ${this.scale / 100}, 1)`
      }
    }
  }
}
```

### 拖拉

参考编辑器(正在抓紧更新中...)

### 缩放

参考编辑器(正在抓紧更新中...)

### 添加&删除控件

**添加控件逻辑**

```flow:prest
aside=>start: 控件栏
stage=>operation: 拖拉到画布

state=>condition: 控件是否使用
disableMove=>operation: 禁止拖动
allowMove=>operation: 拖动

init=>operation: 初始化控件
addComponentItem=>operation: 添加到画布
e=>end: 结束

aside->stage->state
state(yes)->allowMove->init->addComponentItem->e
state(no)->disableMove->e
```

**添加控件**

```js
methods: {
  /**
    * @param {DragEvent} e
    */
  dropHandle(e) {
    const response = e.dataTransfer.getData('application/json')
    /**
      * @type {Template.BuiltinComponentItem}
      */
    const data = JSON.parse(response)
    const component = builtinComponent.get(data.id).create()
    const [x, y] = shapeLocation({ x: e.pageX, y: e.pageY, el: this.$el }, this.scale / 100)

    component.props.position.x = x - data.offset.x
    component.props.position.y = y - data.offset.y
    component.shapeId = data.id

    const event = new TemplateEvent(templateChannel.componentAdd, {
      detail: component,
      target: 'stage'
    })

    eventBus.$emit(templateChannel.componentAdd, event)
  }
}
```

drop事件触发后，创建控件，根据鼠标的位置初始化控件位置，然后把事件通过 `EventBus` 总线 `emit` 出去，上层编辑器监听去执行相应工作。所有编辑器的功能都是如此实现，具体请看厂库代码。

## toHTML

```js
toHtml() {
  /**
  * @type {Vue[]}
  */
  const builtinGroupComponentRef = Array.isArray(this.$refs.builtinGroupComponentRef)
  ? this.$refs.builtinGroupComponentRef
  : [this.$refs.builtinGroupComponentRef]

  /**
  * @type {Vue[]}
  */
  const builtinComponentRef = Array.isArray(this.$refs.builtinComponentRef)
  ? this.$refs.builtinComponentRef
  : [this.$refs.builtinComponentRef]

  /**
  * @type {HTMLElement}
  */
  const root = this.$el.cloneNode()
  const fragment = document.createDocumentFragment()
  const style = window.getComputedStyle(this.$el)

  root.style.left = ''
  root.style.top = ''
  root.style.transform = ''
  root.style.position = 'relative'
  root.style.border = style.border
  root.style.boxShadow = style.boxShadow
  root.style.backgroundImage = style.backgroundImage
  root.style.backgroundRepeat = style.backgroundRepeat

  builtinGroupComponentRef
    .concat(builtinComponentRef)
    .filter(Boolean)
    .forEach(function (item) {
    fragment.append(item.toHtml())
  })

  root.appendChild(fragment)

  return root
}
```

画布的toHtml比控件的实现稍微复杂一点，那是肯定的，要处理各种情况，组情况和非组情况。

到这里就开始把画布上的所有控件全部生成为普通HTML原素，等待着编辑器最终生成可预览页面。

## 最后

希望你能看懂为何要如此实现。

![51bfb58e31bacf81](https://static-1256180570.cos.ap-nanjing.myqcloud.com/image/1731835375.jpg)