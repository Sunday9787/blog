---
title: 模板编辑器：组件
date: 2024-10-28 14:00:00
category: [Vue]
description: 实现一个模板编辑器 - 组件
tag: [Vue, 编辑器, 设计模式]
---

组件在低代码项目中是极其重要的一环，基石中的基石！！！

<!-- more -->

## 需求分析

组件设计最主要分为两部分

1. 解耦

2. 可扩展性

所以 Props 的设计 需要，设计区分开公共 Props 和组件独有的 Props，方便解耦，因此设计了`property`Props 为了传递 组件的公共属性 和 独有属性，其余 Props 则是为了组件公共 Props

所以可以把公共 Props 抽象为 基类，所有控件开发继承这个基类

## 组件

### 实现

Vue2.7 可以使用 `mixin` 或者 `defineComponent` 的 `extends` 属性，参数是 一个 `ComponentOptionsMixin`来实现组件继承复用

Vue3 仅可以使用 `defineComponent` 如果是 setup 语法糖 则可以使用 `defineOptions` 的 `extends` 属性，参数同样是 `ComponentOptionsMixin`

### Props

| Props      | Type                   | 说明                                         |
| ---------- | ---------------------- | -------------------------------------------- |
| `lock`     | Boolean                | 是否锁定                                     |
| `mode`     | "shape" \| "element"   | 控件显示模式 shape 编辑模式 element 展示模式 |
| `label`    | String                 | 控件名字                                     |
| `size`     | {w: Number, h: Number} | 控制控件大小                                 |
| `property` | Template.Property      | 控件属性(特殊属性&公共属性)                  |
| `position` | {x: Number, y: Number} | 控件位置                                     |
| `group`    | Boolean                | 标明组件是是组合组件                         |

### Computed

| Name             | Type    | 说明                                             |
| ---------------- | ------- | ------------------------------------------------ |
| `formValue`      | any     | value 的 setter & getter 方便触发事件更新value值 |
| `id`             | String  | 方便展示 组件名称和id                            |
| `isShape`        | Boolean | 是否是 shape 编辑模式                            |
| `isElement`      | Boolean | 是否是 element 展示模式                          |
| `style`          | Style   | 格式化 `property` 为内联样式                     |
| `containerStyle` | Style   | 最终展示在组件容器上的样式                       |
| `valueStyle`     | Style   | 控件特殊属性 格式后的样式                        |

### Method

| Name       | Type        | 说明                                   |
| ---------- | ----------- | -------------------------------------- |
| `toHtml()` | HTMLElement | 在导出模板时需要格式化组件转为普通HTML |

### 组件基类

```js
import * as transformCase from '@/utils/case'
import { formatComponentStyle } from '@/views/template/utils'

const borderComponent = ['BuiltinInput', 'BuiltinSelect']

/**
 * @param {string} componentName
 */
function isInnerBorderComponent(componentName) {
  return borderComponent.indexOf(componentName) > -1
}

/**
 * @type {Vue.ComponentOptions<Vue>}
 */
const mixin = {
  inheritAttrs: false,
  props: {
    lock: {
      type: Boolean,
      required: true
    },
    mode: {
      type: String,
      default: 'shape'
    },
    label: {
      type: String,
      required: true
    },
    size: {
      type: Object,
      required: true
    },
    property: {
      type: Object,
      required: true
    },
    position: {
      type: Object,
      required: true
    },
    group: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      name: ''
    }
  },
  created() {
    this.name = this.$vnode.componentOptions.Ctor.options.name
  },
  computed: {
    formValue: {
      get() {
        return this.value
      },
      set(val) {
        this.$emit('input', val)
      }
    },
    id() {
      return transformCase.kebabCase(this.name) + '-' + this._uid
    },
    isShape() {
      return this.mode === 'shape'
    },
    isElement() {
      return this.mode === 'element'
    },
    style() {
      return formatComponentStyle(this.property)
    },
    containerStyle() {
      /**
       * @type {import('vue/types/jsx').CSSProperties}
       */
      const style = Object.assign(Object.create(null), this.style)
      style.columnGap = '5px'

      if (isInnerBorderComponent(this.name)) {
        delete style.borderWidth
        delete style.borderColor
        delete style.borderStyle
      }

      if (this.group || this.isElement) {
        style.position = 'absolute'
        style.left = this.position.x + 'px'
        style.top = this.position.y + 'px'
        style.width = this.size.w + 'px'
        style.height = style.lineHeight + 'px'
      }

      return style
    },
    valueStyle() {
      if (isInnerBorderComponent(this.name)) {
        return {
          borderWidth: this.style.borderWidth,
          borderBottomStyle: this.style.borderStyle,
          borderColor: this.style.borderColor
        }
      }

      return null
    }
  },
  methods: {
    toHtml() {
      /**
       * @type {HTMLDivElement}
       */
      const el = this.$el.cloneNode(true)

      el.style.position = 'absolute'
      el.style.left = this.position.x + 'px'
      el.style.top = this.position.y + 'px'
      el.style.width = this.size.w + 'px'
      el.style.height = this.size.h + 'px'

      return el
    }
  }
}

export default mixin
```

### 组件

```vue
// builtin-input.vue
<template lang="pug">
div(v-if="isShape" :style="containerStyle")
  label(:for="id") {{ label }}
  div(:id="id" :style="valueStyle" style="flex: 1")

div(v-else :style="containerStyle")
  label(:for="id") {{ label }}
  div.flex1(:style="valueStyle" style="flex: 1") {{ formValue }}
</template>

<script>
import mixin from './mixins'

export default {
  name: 'BuiltinInput',
  mixins: [mixin],
  props: {
    value: {
      type: String,
      required: true
    }
  }
}
</script>
```

每个组件需要自己声明 value 属性，目的是为了 可以有正确的数据类型校验，组件的视图需要考虑到 在不同渲染模式下的样式

## 控件

一个组件往往会被复用多次，区别也仅仅是 名称 和 绑定的key的区别

### 控件数据模型

```ts
type BuiltinComponentName = 'builtin-group' | 'builtin-input' | 'builtin-select'

interface BuiltinComponent {
  /** 组件id */
  id: string
  uid: number
  shapeId: string
  visible: boolean
  builtin: boolean
  value: string
  /** 组件名称 */
  name: BuiltinComponentName
  props: BuiltinComponentProps
  children?: BuiltinComponent[]
}
```

组件的顶层数据模型，主要是跟组件标识符相关，或者是一些顶层变量

### 初始化控件

```js
export function createBuiltinComponent(data, type = 'normal') {
  const name = data.name ?? 'builtin-input'

  /**
   * @type {Template.BuiltinComponent}
   */
  const component = {
    id: data.id ?? '',
    uid: data.uid ?? -1,
    shapeId: data.shapeId,
    name,
    value: data.value ?? '',
    visible: data.visible ?? false,
    builtin: data.builtin ?? false,
    props: initBuiltinComponentProps(data.props ?? {}, name, type)
  }

  return component
}
```

*因为没有涉及到后端数据填充，所以只设计了 `name` 字段，key 字段未设计实现*

分层架构

创建控件拆分为三部分

1. 初始化组件基础数据
2. 初始化组件Props
3. 初始化组件属性

### Props 数据模型

```ts
interface BuiltinComponentProps {
  lock: boolean
  label: string
  zIndex: number
  required: boolean
  property: Property
  position: {
    x: number
    y: number
  }
  size: {
    w: number
    h: number
  }
  value: string
  option: {
    value: BuiltinComponentPropsOptions[]
    del(key: number): void
    add(): void
	}
  get options(): BuiltinComponentPropsOptions[]
}
```

### 初始化 控件 props

```js
/**
 * @param {TemplateDocument.BuiltinComponentProps} props
 * @param {Template.BuiltinComponentName} name
 * @param {'init'|'document'|'normal'} type `init` 初始化 `document` 模板数据 `normal` 普通初始化
 */
export function initBuiltinComponentProps(props, name, type) {
  /**
   * @type {Template.BuiltinComponentProps}
   */
  const result = {
    zIndex: props.zIndex ?? 1,
    required: props.required ?? false,
    lock: props.lock ?? false,
    label: props.label ?? '',
    value: props.value ?? '',
    property: initBuiltinComponentProperty(props.property ?? defaultProperty),
    position: props.position ?? usePosition(),
    size: props.size ?? useSize({ name }),
    option: {
      value: Vue.observable(props.options ?? []),
      add() {
        if (this.value.length) {
          // 当最后一项不为空时 才可以 新增项
          if (this.value.at(-1).value) {
            this.value.push({ value: '', key: Date.now() })
          }
          return
        }

        this.value.push({ value: '', key: Date.now() })
      },
      del(index) {
        this.value.splice(index, 1)
      }
    },
    get options() {
      return this.option.value
    }
  }

  if (type !== 'document' && !result.options.length) {
    result.option.add()
  }

  return result
}
```

因为下拉列表想要实现自定义

所以option.value 值必须是一个响应式

在这里使用 vue2 的 [observable](https://v2.cn.vuejs.org/v2/api/#Vue-observable) 主要是考虑去掉.value尾巴 又可以获得响应式数据


### Property 数据模型

```ts
type TemplatePropertyValue = Pick<TemplateProperty, 'value'>

class TemplateProperty {
  constructor(opt: TemplateProperty)
  static format(this: TemplateProperty): string
  static options: TemplateProperty
  value: string | number | boolean
  unit?: string
  trueValue?: string | number
  falseValue?: string | number
  indeterminate?: boolean
  indeterminateTrueValue?: string | number
  indeterminateFalseValue?: string | number
}

interface Property {
  display: TemplatePropertyValue
  color: TemplatePropertyValue
  fontFamily: TemplatePropertyValue
  fontSize: TemplatePropertyValue
  lineHeight: TemplatePropertyValue
  borderWidth: TemplatePropertyValue
  borderStyle: TemplatePropertyValue
  borderColor: TemplatePropertyValue
  [key: string]: TemplatePropertyValue
}
```

### Property 初始化

```js
/**
 * @param {TemplateDocument.Property} property
 */
export function initBuiltinComponentProperty(property) {
  /**
   * @type {TemplateDocument.Property}
   */
  const result = {
    get dashed() {
      return this.borderStyle.value
    },
    set dashed(val) {
      this.borderStyle.value = val
    },
    get underline() {
      return this.borderStyle.indeterminate
    },
    set underline(val) {
      this.borderStyle.indeterminate = val
    }
  }

  for (const [key, item] of Object.entries(property)) {
    result[key] = new TemplateProperty(item)
  }

  return result
}
```

Property 就主要是对组件的样式调整，并设计了一个 `TemplatePropertyValue` 模型 主要是想统一 value 的类型 从而可以更好的转为 style 样式

### PropsOption 数据模型

```ts
interface BuiltinComponentPropsOptions {
  label: string
  value: string
  key: number
}
```

## 控件组

这个组件是实现自由组合的核心功能之一

实现原理很简单，将组件的数据存入一个数组 `children` 中，从 children 里 找到 最小 left 和 最大 right 得到 x&y，最小 top 和 最大 bottom 相减，取绝对值得到 h&w

### 公式

#### Position

x = Math.min.apply(null,所有组件的left)

y = Math.min.apply(null,所有组件的top)

#### Size

*w 和 h 仅仅只需要找到差值即可 不需要关心正负值*

w = Math.abs(Math.min.apply(null, 所有组件的left) - Math.max.apply(null, 所有组件的right))

h = Math.abs(Math.min.apply(null, 所有组件的top) - Math.max.apply(null, 所有组件的bottom))

### 实现

```vue
<template lang="pug">
.builtin-group(:style="groupStyle")
  component(
    ref="builtinComponentRef"
    v-for="(component) in children"
    v-bind="component.props"
    v-model="component.value"
    :mode="mode"
    :children="component.children"
    :key="component.id"
    :is="component.name"
    group)
</template>

<script>
import { reactive } from 'vue'
import mixin from './mixins'
import BuiltinInput from './builtin-input.vue'
import BuiltinSelect from './builtin-select.vue'

export default {
  name: 'BuiltinGroup',
  mixins: [mixin],
  components: {
    BuiltinInput,
    BuiltinSelect
  },
  props: {
    top: {
      type: Boolean,
      default: false
    },
    children: {
      type: Array,
      default: () => []
    }
  },
  setup(props) {
    const rect = reactive({
      w: props.size.w,
      h: props.size.h
    })

    return { rect }
  },
  computed: {
    groupStyle() {
      const style = {
        width: this.rect.w + 'px',
        height: this.rect.h + 'px'
      }

      if (this.top) {
        style.position = 'reactive'
      } else {
        style.position = 'absolute'
        style.left = this.position.x + 'px'
        style.top = this.position.y + 'px'
      }

      return style
    }
  },
  methods: {
    toHtml() {
      /**
       * @type {Vue[]}
       */
      const builtinComponentRef = Array.isArray(this.$refs.builtinComponentRef)
        ? this.$refs.builtinComponentRef
        : [this.$refs.builtinComponentRef]

      const group = this.$el.cloneNode()
      group.style.position = 'absolute'
      group.style.left = this.position.x + 'px'
      group.style.top = this.position.y + 'px'

      builtinComponentRef.forEach(function (item) {
        group.append(item.toHtml())
      })

      return group
    }
  }
}
</script>
```

#### 重写 toHtml

因为组内的是vue 组件，跟普通的组件不一样，所以需要拿到组件 Ref 再调用 vue实例的 toHTML 方法

### 初始化组

```js
/**
 * @param {[TemplateDocument.BuiltinComponent, TemplateDocument.BuiltinComponent[], TemplateDocument.CreateBuiltinComponentType]|
 * [TemplateDocument.BuiltinComponent[], TemplateDocument.CreateBuiltinComponentType]} args
 */
export function createBuiltinComponentGroup(...args) {
  /**
   * @type {TemplateDocument.CreateBuiltinComponentType}
   */
  let type = 'normal'
  /**
   * @type {TemplateDocument.BuiltinComponent}
   */
  let group = null
  /**
   * @type {TemplateDocument.BuiltinComponent[]}
   */
  let children = []

  if (Array.isArray(args[0])) {
    type = args[1]
    children = args[0]
    group = createBuiltinComponent({ name: 'builtin-group' }, type)
  } else {
    type = args[2]
    children = args[1]
    group = createBuiltinComponent({ name: 'builtin-group', ...args[0] }, type)
  }

  /**
   * @type {[number[],number[],number[],number[]]}
   */
  const [left, top, right, bottom] = children.map(getRect).reduce(
    function (previousValue, currentValue) {
      /**
       * @type {Array<number[],number[],number[],number[]>}
       */
      const [left, top, right, bottom] = previousValue

      left.push(currentValue.left)
      top.push(currentValue.top)
      right.push(currentValue.right)
      bottom.push(currentValue.bottom)
      return [left, top, right, bottom]
    },
    [[], [], [], []]
  )

  group.props.position.x = Math.min.apply(null, left)
  group.props.position.y = Math.min.apply(null, top)
  group.props.size.w = Math.abs(Math.min.apply(null, left) - Math.max.apply(null, right))
  group.props.size.h = Math.abs(Math.min.apply(null, top) - Math.max.apply(null, bottom))

  if (type !== 'document') {
    children.forEach(item => {
      item.props.position.x -= group.props.position.x
      item.props.position.y -= group.props.position.y
    })
  }

  group.children = children

  return group
}
```

通过计算组内的组件来计算组控件的位置和尺寸

## 最后

希望通过我的见解能给你带来一点点的小启发

![](https://static-1256180570.cos.ap-nanjing.myqcloud.com/image/1731370838.jpg)