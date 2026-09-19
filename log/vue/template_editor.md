---
url: /log/vue/template_editor.md
description: 实现一个模板编辑器 - 编辑器
---

# 模板编辑器：编辑器

编辑器是创作者的工具箱，每一个功能键都蕴藏着无限可能...

## 前言

等了好久终于等到今天，梦了好久终于把梦实现...

## 需求分析

编辑器，是装载画布的入口，需要实现画布的缩放功能&根据鼠标位置缩放，和需要拖动画布

## 设计

缩放

缩放使用css 的 scale，为了避免精度问题，采用10-100范围内数字

根据位置缩放

先计算未缩放前鼠标距离画布left\&top比例

再计算缩放后鼠标距离画布left\&top

再将左右比例从新计算即可

*ps: 这个功能我查了好多资料,终于搞明白了🥲，不理解的仔细看代码部分注释*

## 视图

```vue
<template lang="pug">
main.template-editor
  section.template-canvas(ref="canvas")
    TemplateStage(
      :scale="scale.value"
      :position="position"
      :spaceDown="spaceDown"
      :scale-manual="scale.manual"
      @keydown.space.exact.native="spaceDownHandle"
      @keyup.space.exact.native="spaceUpHandle"
      ref="refComponent")
  app-scale(
    :scale.sync="scale.value"
    :max-scale="scale.max"
    :mini-scale="scale.mini"
    :step="scale.step"
    @change="scaleManual(true)")
</template>
```

位置更新以及缩放通过传递`Props`由子组件`TemplateStage`渲染

**有一个重要的点**，`TemplateStage`在使用滚轮缩放时需要设置`transformOrigin`为`top left`，在使用控制按钮缩放时，值需要为`center`这样可以保证手动缩放的时候画布始终在编辑器中间

## 实现

### 缩放

```js
/**
 * @type {Template.Store}
 */
const store = inject(storeSymbol)
const { refComponent } = useToHtml()
/** 缩放比例 */
const scale = reactive({ step: 5, value: 100, max: 200, mini: 20, manual: false })

/**
 * @param {WheelEvent} e
 */
const mousewheel = function (e) {
  vm.scaleManual(false)

  if (e.deltaY > 0) {
    if (scale.value > scale.mini) scale.value -= scale.step
  } else {
    if (scale.value < scale.max) scale.value += scale.step
  }

  /** @type {HTMLElement} */
  const stage = refComponent.value.$el
  const rect = stage.getBoundingClientRect()

  /** 鼠标距离元素 `left` 的比例 */
  const leftScale = (e.clientX - rect.left) / rect.width
  /** 鼠标距离元素 `top` 的比例 */
  const topScale = (e.clientY - rect.top) / rect.height
  /** 缩放后的元素宽度 */
  const newStageWidth = store.size.width * (scale.value / 100)
  /** 缩放后的元素高度 */
  const newStageHeight = store.size.height * (scale.value / 100)
  /** 缩放后的鼠标距离元素 left 值 */
  const newRectLeft = newStageWidth * leftScale
  /** 缩放后的鼠标距离元素 top 值 */
  const newRectTop = newStageHeight * topScale

  // 当前位置 = 当前位置 - (缩放后的 `left/top` - （鼠标距离元素 `left/top` 值))
  vm.position.x = vm.position.x - (newRectLeft - (e.clientX - rect.left))
  vm.position.y = vm.position.y - (newRectTop - (e.clientY - rect.top))
}

onMounted(function () {
  vm.$el.addEventListener('mousewheel', mousewheel)
})

onBeforeUnmount(function () {
  vm.$el.removeEventListener('mousewheel', mousewheel)
})
```

### 拖拉

```js
{
  methods: {
    /**
     * 初始化 画布位置
     */
    init() {
      /** @type {HTMLElement} */
      const canvas = this.$refs.canvas

      const x = (canvas.offsetWidth - this.store.size.width) / 2
      const y = (canvas.offsetHeight - this.store.size.height) / 2

      this.position.x = x
      this.position.y = y
    },
    /**
     * @param {KeyboardEvent} e
     */
    spaceDownHandle(e) {
      /** @type {HTMLElement} */
      const target = e.target
      this.spaceDown = true
      target.style.cursor = 'grab'
    },
    /**
     * @param {KeyboardEvent} e
     */
    spaceUpHandle(e) {
      /** @type {HTMLElement} */
      const target = e.target
      target.style.cursor = 'default'
      this.spaceDown = false
    },
    /**
     * @param {boolean} manual 是否点击缩放
     */
    scaleManual(manual) {
      this.scale.manual = manual
    }
  }
}
```

空格+鼠标左键可实现拖动画布，默认将画布定位到编辑器中间，比较easy，你肯定能看懂

## 最后

根据鼠标位置缩放这个实现原理希望你能看懂，这样就会跟我一样强

![-1c699959fbc944f7](https://static-1256180570.cos.ap-nanjing.myqcloud.com/image/1732983146.jpg?imageMogr2/interlace/1/quality/100/thumbnail/350x)
