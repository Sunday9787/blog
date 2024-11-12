---
title: 模板编辑器：控件的控制
date: 2024-10-29 15:00:00
category: [Vue]
description: 实现一个模板编辑器 - 控件的控制
tag: [Vue, 编辑器]
---

编辑器没了它 组件就不可能随意在画布上拖动，就像是 鱼儿不能离开水，鸟儿需要天空，星星需要夜空...

<!-- more -->

## 前言

写这个控件真的老费劲了，尤其是 scale 变量的加入，很绕🙃。如果你看懂了，那你一也可以像我一样强😎

## 需求分析

控件的设计主要分为两部分

1. 监听鼠标拖动控制组件位置，且画布缩放时能移动到正确的位置
2. 控件的八个控制点，从而调整组件尺寸大小

## 视图

视图部分很简单，组件套进容器即可，没有别的东西，同时需要绘制出八个控制点

```vue
<template lang="pug">
.template-control(
  :class="{ visible, lock }"
  :style="wrapperStyle"
  @pointerdown.stop="onPointerdown")
  div.template-control-mask
  i.template-control-point.top-left(@pointerdown.stop="onControlPointerdown('topLeft', $event)")
  i.template-control-point.top-center(@pointerdown.stop="onControlPointerdown('topCenter', $event)")
  i.template-control-point.top-right(@pointerdown.stop="onControlPointerdown('topRight', $event)")
  i.template-control-point.center-left(@pointerdown.stop="onControlPointerdown('centerLeft', $event)")
  i.template-control-point.center-right(@pointerdown.stop="onControlPointerdown('centerRight', $event)")
  i.template-control-point.bottom-left(@pointerdown.stop="onControlPointerdown('bottomLeft', $event)")
  i.template-control-point.bottom-center(@pointerdown.stop="onControlPointerdown('bottomCenter', $event)")
  i.template-control-point.bottom-right(@pointerdown.stop="onControlPointerdown('bottomRight', $event)")
  slot
</template>
```

*样式就不贴了，具体看仓库具体代码*

*这里事件都添加了阻止事件继续冒泡，主要是为了，不跟上面的编辑器产生影响*

## Props

```js
{
  name: 'TemplateControl',
  inject: ['stageInstance'],
  props: {
    zIndex: {
      type: Number,
      required: true
    },
    scale: {
      type: Number,
      default: 1
    },
    position: {
      type: Object,
      required: true
    },
    size: {
      type: Object,
      required: true
    },
    value: {
      type: Boolean,
      required: true
    },
    lock: {
      type: Boolean,
      required: true
    }
  }
}
```

| Name            | Type                  | 说明                  |
| --------------- | --------------------- | --------------------- |
| `stageInstance` | Vue                   | 画布的实例            |
| `zIndex`        | Number                | 组件的层级            |
| `scale`         | Number                | 画布的缩放等级 10-100 |
| `position`      | {x: Number,y: Number} | 组件的位置            |
| `size`          | {w: Number,x: Number} | 组件的尺寸            |
| `value`         | Boolean               | 组 组件是否显示控制点 |
| `lock`          | Boolean               | 组件是否锁定          |

## 缩放移动

原理：

鼠标按下时暂存当前位置，新的位置 - 暂存位置则就是移动的距离

*但是 因为 画布有个 scale 缩放变量，所以 又增加了一点难度。*

### 公式

暂存的pageX = 当前鼠标的pageX - 当前组件的offsetLeft * scale

> 解释：
>
> 当前鼠标的pageX 是一个常量 跟 scale 没有关系，当前组件因为在画布内，缩放则是缩放整个画布，所以，实际视图上的 offset = offset * sclae

所以:

x = 当前鼠标的pageX - 暂存的pageX

y = 当前鼠标的pageY - 暂存的pageY

### 限制范围

初始化位置

```js
let x = e.pageX - stashPosition.value.x
let y = e.pageY - stashPosition.value.y
```

当前鼠标位置 - 暂存位置 = 移动的距离

#### 限制最左边

```js
/**
 * 左边限制
 */
if (x <= 0) x = 0
```

暂存的X不能 < 0 否则在画布外了

#### 限制最右边

```js
/**
 * 右边限制
 */
if (x > (vm.stageInstance.$el.clientWidth - initSize.w) * scale) {
  x = (vm.stageInstance.$el.clientWidth - initSize.w) * scale
}
```

> 解释：
>
> `vm.stageInstance.$el.clientWidth` 是 画布的可视区宽度（不包含画布边距），如果使用 `offsetWidth` 则需要计算边距的值减去比较麻烦
>
> `initSize.w` 是 控件首次渲染的宽度
>
> 上述两个变量是始终不会随着缩放变的，但是**鼠标 pageX/Y 的位置会随着 scale 变化而变化，因为画布缩放后原素自然不会在原来屏幕上的位置**

所以:

(vm.stageInstance.$el.clientWidth - initSize.w) * scale 就是鼠标X最大值

#### 限制最上边

```js
/**
 * 上边限制
 */
if (y <= 0) y = 0
```

#### 限制最下边

```js
/**
 * 下边限制
 */
if (y > (vm.stageInstance.$el.clientHeight - initSize.h) * scale) {
  y = (vm.stageInstance.$el.clientHeight - initSize.h) * scale
}
```

> 下边跟限制右边同理

### 更新位置

```js
data.x = x / scale
data.y = y / scale
```

> 解释：
>
> 这一步非常非常重要！！！
>
> 因为目前得到的值都是缩放后的值，所以需要 / scale 还原为真实值（这里你肯定会想不明白，没关系，你好好想，手动滑稽）

完整代码

```js
const vm = getCurrentInstance().proxy
const visible = computed({
  get() {
    return props.value
  },
  set(val) {
    context.emit('input', val)
  }
})

const { multiple } = useControl()
/**
* 指针点击类型 - 控制方向类型/null
*/
const pointType = ref(null)
/**
* 实际显示 定位 & 宽度
* @type {{x: number, y: number, h: number, w: number}}
*/
const data = reactive({ x: props.position.x, y: props.position.y, h: props.size.h, w: props.size.w })
/**
* 暂存拖动位置 pageX/pageY
*/
const stashPosition = ref(null)
/**
* 初始控件大小
* 每次拖动后需更新此值
*/
const initSize = reactive({ w: 0, h: 0 })
/**
* 最小控件大小
*/
const miniSize = reactive({ w: 0, h: 0 })

const offset = useBorderSize(vm.stageInstance)

/**
* @param {PointerEvent} e
*/
const onPointerdown = function (e) {
  const scale = props.scale / 100

  visible.value = true
  pointType.value = null
  stashPosition.value = {
    x: e.pageX - vm.$el.offsetLeft * scale,
    y: e.pageY - vm.$el.offsetTop * scale
  }

  context.emit('select', vm)
  context.emit('moveStart', { x: data.x, y: data.y })
}

/**
* @param {PointerEvent} e
*/
const onPointermove = function (e) {
  if (props.lock) return
  if (stashPosition.value) {
    const scale = props.scale / 100
    if (pointType.value) {
      onPointermoveHandle[pointType.value].call(vm, e)

      context.emit('update:position', { x: data.x, y: data.y })
      context.emit('update:size', { w: data.w, h: data.h })
      return
    }

    let x = e.pageX - stashPosition.value.x
    let y = e.pageY - stashPosition.value.y

    /**
    * 左边限制
    */
    if (x <= 0) x = 0

    /**
    * 上边限制
    */
    if (y <= 0) y = 0

    /**
    * 右边限制
    */
    if (x > (vm.stageInstance.$el.clientWidth - initSize.w) * scale) {
      x = (vm.stageInstance.$el.clientWidth - initSize.w) * scale
    }

    /**
    * 下边限制
    */
    if (y > (vm.stageInstance.$el.clientHeight - initSize.h) * scale) {
      y = (vm.stageInstance.$el.clientHeight - initSize.h) * scale
    }

    data.x = x / scale
    data.y = y / scale

    context.emit('update:position', { x: data.x, y: data.y })
    context.emit('move', { x: data.x, y: data.y })
  }
}

/**
* @param {PointerEvent} e
*/
const onPointerup = function (e) {
  if (stashPosition.value) {
    stashPosition.value = null
    pointType.value = null
    initSize.w = data.w
    initSize.h = data.h

    context.emit('moveEnd')
    context.emit('resizeEnd')
  }
}

/**
* @param {PointerEvent} e
*/
const onBodyPointerdown = function (e) {
  visible.value = false
}

onMounted(function () {
  nextTick(function () {
    data.w = initSize.w = miniSize.w = vm.$el.offsetWidth
    data.h = initSize.h = miniSize.h = vm.$el.offsetHeight
    context.emit('update:size', { w: data.w, h: data.h })
  })

  window.addEventListener('pointerdown', onBodyPointerdown)
  vm.stageInstance.$el.addEventListener('pointermove', onPointermove)
  vm.stageInstance.$el.addEventListener('pointerup', onPointerup)
})

onBeforeUnmount(function () {
  window.removeEventListener('pointerdown', onBodyPointerdown)
  vm.stageInstance.$el.removeEventListener('pointermove', onPointermove)
  vm.stageInstance.$el.removeEventListener('pointerup', onPointerup)
})
```

## 控制点移动

前面缩放移动如果能理解，那么，控制点的实现你肯定能一看就会

### 公式

同上👆

### 设计

因为是八个控制点，且都要单独去暂存位置，和更新位置所以可以这样设计。给控制点命名

topLeft

topCenter

topRight

centerLeft

centerRight

bottomLeft

bottomCenter

bottomRight

所以当绑定的控制点鼠标按下时执行对应函数即可（策略模式）

### 实现

`pointType`变量记录指针类型

`onPointeDownHandle`&`onPointermoveHandle`分别执行对应的事件处理函数

#### 控制点按下

```js
onControlPointerdown(pointType) {
  this.pointType = pointType
  onPointeDownHandle[pointType].apply(this, [e])
  this.$emit('resizeStart', { w: this.data.w, h: this.data.h })
}
```

onPointeDownHandle

```js
/**
 * @type {Record<string, (this: Vue, e: PointerEvent) => void>}
 */
const onPointeDownHandle = {
  topLeft(e) {
    const rect = this.$el.getBoundingClientRect()
    this.stashPosition = {
      x: rect.left,
      y: rect.top
    }
  },
  topCenter(e) {
    const rect = this.$el.getBoundingClientRect()
    this.stashPosition = {
      x: rect.left,
      y: rect.top
    }
  },
  topRight(e) {
    const rect = this.$el.getBoundingClientRect()
    const scale = this.scale / 100
    this.stashPosition = {
      x: this.$el.offsetWidth * scale + rect.left,
      y: rect.top
    }
  },
  centerLeft(e) {
    const rect = this.$el.getBoundingClientRect()
    this.stashPosition = {
      x: rect.left,
      y: rect.top
    }
  },
  centerRight(e) {
    const rect = this.$el.getBoundingClientRect()
    const scale = this.scale / 100
    this.stashPosition = {
      x: this.$el.offsetWidth * scale + rect.left,
      y: (this.$el.offsetHeight / 2) * scale + rect.top
    }
  },
  bottomLeft(e) {
    const rect = this.$el.getBoundingClientRect()
    const scale = this.scale / 100

    this.stashPosition = {
      x: rect.left,
      y: this.$el.offsetHeight * scale + rect.top
    }
  },
  bottomCenter(e) {
    const rect = this.$el.getBoundingClientRect()
    const scale = this.scale / 100

    this.stashPosition = {
      x: (this.$el.offsetWidth / 2) * scale + rect.left,
      y: this.$el.offsetHeight * scale + rect.top
    }
  },
  bottomRight(e) {
    const rect = this.$el.getBoundingClientRect()
    const scale = this.scale / 100
    this.stashPosition = {
      x: this.$el.offsetWidth * scale + rect.left,
      y: this.$el.offsetHeight * scale + rect.top
    }
  }
}
```

onPointermoveHandle

```js
/**
 * @type {Record<string, (this: Vue, e: PointerEvent) => void>}
 */
const onPointermoveHandle = {
  topLeft(e) {
    if (this.stashPosition) {
      const scale = this.scale / 100
      const rect = this.stageInstance.$el.getBoundingClientRect()
      let y = e.pageY - rect.top - this.offset.h * scale
      let x = e.pageX - rect.left - this.offset.w * scale

      if (x <= 0) {
        x = 0
      }

      let w = this.data.w + (this.data.x - x / scale)

      if (w <= this.miniSize.w) {
        w = this.miniSize.w
      } else {
        this.data.x = x / scale
      }

      if (y <= 0) {
        y = 0
      }

      let h = this.data.h + (this.data.y - y / scale)

      if (h <= this.miniSize.h) {
        h = this.miniSize.h
      } else {
        this.data.y = y / scale
      }

      this.data.h = h
      this.data.w = w
    }
  },
  topCenter(e) {
    if (this.stashPosition) {
      const scale = this.scale / 100
      const rect = this.stageInstance.$el.getBoundingClientRect()
      let y = e.pageY - rect.top - this.offset.h * scale

      if (y <= 0) {
        y = 0
      }

      let h = this.data.h + (this.data.y - y / scale)

      if (h <= this.miniSize.h) {
        h = this.miniSize.h
      } else {
        this.data.y = y / scale
      }

      this.data.h = h
    }
  },
  topRight(e) {
    if (this.stashPosition) {
      const scale = this.scale / 100
      const rect = this.stageInstance.$el.getBoundingClientRect()
      let w = this.initSize.w * scale + (e.pageX - this.stashPosition.x)

      /**
       * 左边限制
       */
      if (w <= this.miniSize.w * scale) {
        w = this.miniSize.w * scale
      }

      /**
       * 右边限制
       */
      if (this.$el.offsetLeft * scale + w >= this.stageInstance.$el.clientWidth * scale) {
        w = (this.stageInstance.$el.clientWidth - this.$el.offsetLeft) * scale
      }

      this.data.w = w / scale

      let y = e.pageY - rect.top - this.offset.h * scale

      if (y <= 0) {
        y = 0
      }

      let h = this.data.h + (this.data.y - y / scale)

      if (h <= this.miniSize.h) {
        h = this.miniSize.h
      } else {
        this.data.y = y / scale
      }

      this.data.h = h
    }
  },
  centerLeft(e) {
    if (this.stashPosition) {
      const scale = this.scale / 100
      const rect = this.stageInstance.$el.getBoundingClientRect()
      let x = e.pageX - rect.left - this.offset.w * scale

      if (x <= 0) {
        x = 0
      }

      let w = this.data.w + (this.data.x - x / scale)

      if (w <= this.miniSize.w) {
        w = this.miniSize.w
      } else {
        this.data.x = x / scale
      }

      this.data.w = w
    }
  },
  centerRight(e) {
    if (this.stashPosition) {
      const scale = this.scale / 100
      let w = this.initSize.w * scale + (e.pageX - this.stashPosition.x)

      /**
       * 左边限制
       */
      if (w <= this.miniSize.w * scale) {
        w = this.miniSize.w * scale
      }

      /**
       * 右边限制
       */
      if (this.$el.offsetLeft * scale + w >= this.stageInstance.$el.clientWidth * scale) {
        w = (this.stageInstance.$el.clientWidth - this.$el.offsetLeft) * scale
      }

      this.data.w = w / scale
    }
  },
  bottomLeft(e) {
    if (this.stashPosition) {
      const scale = this.scale / 100
      const rect = this.stageInstance.$el.getBoundingClientRect()
      let x = e.pageX - rect.left - this.offset.w * scale
      let h = this.initSize.h * scale + (e.pageY - this.stashPosition.y)

      /**
       * 上边限制
       */
      if (h <= this.miniSize.h * scale) {
        h = this.miniSize.h * scale
      }

      /**
       * 下边限制
       */
      if (this.$el.offsetTop * scale + h >= this.stageInstance.$el.clientHeight * scale) {
        h = this.stageInstance.$el.clientHeight * scale - this.$el.offsetTop * scale
      }

      this.data.h = h / scale

      if (x <= 0) {
        x = 0
      }

      let w = this.data.w + (this.data.x - x / scale)

      if (w <= this.miniSize.w) {
        w = this.miniSize.w
      } else {
        this.data.x = x / scale
      }

      this.data.w = w
    }
  },
  bottomCenter(e) {
    if (this.stashPosition) {
      const scale = this.scale / 100
      let h = this.initSize.h * scale + (e.pageY - this.stashPosition.y)

      /**
       * 上边限制
       */
      if (h <= this.miniSize.h * scale) {
        h = this.miniSize.h * scale
      }

      /**
       * 下边限制
       */
      if (this.$el.offsetTop * scale + h >= this.stageInstance.$el.clientHeight * scale) {
        h = this.stageInstance.$el.clientHeight * scale - this.$el.offsetTop * scale
      }

      this.data.h = h / scale
    }
  },
  bottomRight(e) {
    const scale = this.scale / 100
    let w = this.initSize.w * scale + (e.pageX - this.stashPosition.x)
    let h = this.initSize.h * scale + (e.pageY - this.stashPosition.y)

    /**
     * 左边限制
     */
    if (w <= this.miniSize.w * scale) {
      w = this.miniSize.w * scale
    }

    /**
     * 上边限制
     */
    if (h <= this.miniSize.h * scale) {
      h = this.miniSize.h * scale
    }

    /**
     * 右边限制
     */
    if (this.$el.offsetLeft * scale + w >= this.stageInstance.$el.clientWidth * scale) {
      w = (this.stageInstance.$el.clientWidth - this.$el.offsetLeft) * scale
    }

    /**
     * 下边限制
     */
    if (this.$el.offsetTop * scale + h >= this.stageInstance.$el.clientHeight * scale) {
      h = (this.stageInstance.$el.clientHeight - this.$el.offsetTop) * scale
    }

    this.data.w = w / scale
    this.data.h = h / scale
  }
}
```

## 最后

希望你可以理解 scale 跟 client offset rect 各种关系

![E7F692D428BD1D78B21E2751F013C795](https://static-1256180570.cos.ap-nanjing.myqcloud.com/image/1730428440.png?imageMogr2/interlace/1/quality/100/thumbnail/500x)