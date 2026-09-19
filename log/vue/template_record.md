---
url: /log/vue/template_record.md
description: 实现一个模板编辑器 - 历史记录
---

# 模板编辑器：历史记录

每一段历史记录，都是回忆的窗口，连接着过去与未来...

## 前言

撤销、重做、历史记录，听着是有点高大上的样子，单其实本质是是对栈的操作，`pop` `push`

## 需求分析

撤销、重做，就是在操作历史记录，所以重点是历史记录如何实现？

那么很容易

首先我们需要监听编辑器的所有操作，所以，编辑器需要把这些操作全部都要用事件的形式传递出去消息。注册历史记录监听这些消息从而达到一个记录。撤销重做就是对栈的`pop` `push`

类似 `PhotoShop` 的历史记录那样

## 设计

**历史记录**

我们需要设计一套事件，为了更好的维护事件，事件名需要用变量来存储管理。且编辑器的操作事件要跟历史记录事件要区分，也就是说，要做命名空间，这样省事儿简单区分。

**撤销&重做**

我们需要设计一个根据事件类型，来分别实现这个事件的撤销和重做动作

```ts
// 数据结构
type RecordActionHandle = Record<
  "componentAdd"|"componentDel",
  Record<"undo"|"restore", (data: Template.BuiltinComponentRecord) => void}>
>
```

## 事件

```js
import { readonly } from 'vue'

/**
 * @param {string} namespace
 * @param {string} event
 */
function nameSpace(namespace, event) {
  return namespace + ':' + event
}

export const storeSymbol = Symbol('store')

export const templateChannel = readonly({
  editorToHtml: 'template:to:html',
  /** 画布 缩放变化 */
  stageScaleChange: 'template:scale:change',
  /** 画布 大小变化 */
  stageSizeChange: 'template:size:change',
  /** 画布 边距变化 */
  stagePaddingChange: 'template:padding:change',
  /** 画布 清除 */
  stageClear: 'template:clear',
  /** 画布 撤销 */
  stageUndo: 'template:undo',
  /** 画布 重做 */
  stageRestore: 'template:restore',
  /** 画布 移动 */
  stageMove: 'template:move',
  /** 组 组合 */
  groupPack: 'group:pack',
  /** 组 解散 */
  groupUn: 'group:un',
  /** 组件 添加 */
  componentAdd: 'component:add',
  /** 组件 删除 */
  componentDel: 'component:del',
  /** 组件 选择 */
  componentSelect: 'component:select',
  /** 组件 取消选择 */
  componentSelectUn: 'component:select:un',
  /** 组件 定位变化开始 */
  componentMoveStart: 'component:move:start',
  /** 组件 定位变化 */
  componentMove: 'component:move',
  /** 组件 定位变化结束 */
  componentMoveEnd: 'component:move:end',
  /** 组件 字体变化 */
  componentFontChange: 'component:font:change',
  /** 组件 字体大小变化 */
  componentFontSizeChange: 'component:font:size:change',
  /** 组件 大小变化开始 */
  componentResizeStart: 'component:resize:start',
  /** 组件 大小变化 */
  componentResize: 'component:resize',
  /** 组件 大小变化结束 */
  componentResizeEnd: 'component:resize:end'
})

export const recordChannel = readonly({
  /** 画布 缩放变化 */
  stageScaleChange: nameSpace('record', templateChannel.stageScaleChange),
  /** 画布 大小变化 */
  stageSizeChange: nameSpace('record', templateChannel.stageSizeChange),
  /** 画布 边距变化 */
  stagePaddingChange: nameSpace('record', templateChannel.stagePaddingChange),
  /** 画布 边距变化 */
  stageClear: nameSpace('record', templateChannel.stageClear),
  /** 画布 撤销 */
  stageUndo: nameSpace('record', templateChannel.stageUndo),
  /** 画布 重做 */
  stageRestore: nameSpace('record', templateChannel.stageRestore),
  /** 画布 移动 */
  stageMove: nameSpace('record', templateChannel.stageMove),
  /** 组 组合 */
  groupPack: nameSpace('record', templateChannel.groupPack),
  /** 组 解散 */
  groupUn: nameSpace('record', templateChannel.groupUn),
  /** 组件 添加 */
  componentAdd: nameSpace('record', templateChannel.componentAdd),
  /** 组件 删除 */
  componentDel: nameSpace('record', templateChannel.componentDel),
  /** 组件 选择 */
  componentSelect: nameSpace('record', templateChannel.componentSelect),
  /** 组件 取消选择 */
  componentSelectUn: nameSpace('record', templateChannel.componentSelectUn),
  /** 组件 定位变化开始 */
  componentMoveStart: nameSpace('record', templateChannel.componentMoveStart),
  /** 组件 定位变化 */
  componentMove: nameSpace('record', templateChannel.componentMove),
  /** 组件 定位变化结束 */
  componentMoveEnd: nameSpace('record', templateChannel.componentMoveEnd),
  /** 组件 字体变化 */
  componentFontChange: nameSpace('record', templateChannel.componentFontChange),
  /** 组件 字体变化 */
  componentFontSizeChange: nameSpace('record', templateChannel.componentFontSizeChange),
  /** 组件 大小变化开始 */
  componentResizeStart: nameSpace('record', templateChannel.componentResizeStart),
  /** 组件 大小变化 */
  componentResize: nameSpace('record', templateChannel.componentResize),
  /** 组件 大小变化结束 */
  componentResizeEnd: nameSpace('record', templateChannel.componentResizeEnd)
})

/**
 * @type {Readonly<Record<Template.BuiltinComponentType, string>>}
 */
export const recordTypeMap = readonly({
  [templateChannel.stageScaleChange]: '画布 缩放变化',
  [templateChannel.stageSizeChange]: '画布 大小变化',
  [templateChannel.stagePaddingChange]: '画布 边距变化',
  [templateChannel.stageMove]: '画布 移动',
  [templateChannel.stageClear]: '画布 清空',
  [templateChannel.groupPack]: '组 组合',
  [templateChannel.groupUn]: '组 解散',
  [templateChannel.componentAdd]: '组件 添加',
  [templateChannel.componentDel]: '组件 删除',
  [templateChannel.componentSelect]: '组件 选择',
  [templateChannel.componentSelectUn]: '组件 取消选择',
  [templateChannel.componentMoveStart]: '组件 定位变化开始',
  [templateChannel.componentMove]: '组件 定位变化',
  [templateChannel.componentMoveEnd]: '组件 定位变化结束',
  [templateChannel.componentFontChange]: '组件 字体变化',
  [templateChannel.componentFontSizeChange]: '组件 字体大小变化',
  [templateChannel.componentResizeStart]: '组件 大小变化开始',
  [templateChannel.componentResize]: '组件 大小变化',
  [templateChannel.componentResizeEnd]: '组件 大小变化结束'
})
```

**NameSpace** 很简单，加个前缀不就好了

## 实现

```js
import moment from 'moment'
import { onBeforeUnmount, onMounted } from 'vue'
import { recordChannel, recordTypeMap } from '@/views/template/constant'
import { createRecord } from '@/views/template/utils/record'
import eventBus from '@/utils/eventBus'

/**
 * @this {Template.Store}
 * @param {Template.BuiltinComponentRecordType} type
 * @param {Template.BuiltinComponent} component
 * @param {boolean} [record] 是否记录
 */
function recordHandle(type, component = null, record = true) {
  if (component) {
    const recordData = createRecord(type, component)

    console.group('record')
    console.info('事件', recordTypeMap[type])
    console.info('组件id', component.id)
    console.info('组件uid', component.uid)
    console.info('组件props', component.props)
    console.info('时间戳', moment().format('yyyy-MM-DD HH:mm:ss'))
    console.groupEnd()

    if (record && this.record.length <= 20) {
      this.record.push(recordData)
    }

    return
  }

  console.group('record')
  console.info('事件', recordTypeMap[type])
  console.info('时间戳', moment().format('yyyy-MM-DD HH:mm:ss'))
  console.groupEnd()
}

/**
 * @param {Template.Store} store
 */
export function useRecord(store) {
  let move = false
  let resize = false

  /**
   * @param {Template.Event<Template.BuiltinComponent | null>} e
   */
  const componentChange = function (e) {
    switch (e.type) {
      case 'component:add':
      case 'component:del':
      case 'component:font:change':
        recordHandle.apply(store, [e.type, e.detail])
        break
      case 'component:resize:start':
        resize = true
        break
      case 'component:resize':
        recordHandle.apply(store, [e.type, e.detail, false])
        break
      case 'component:resize:end':
        if (e.target === 'property') {
          recordHandle.apply(store, [e.type, e.detail])
        } else if (resize) {
          resize = false
          recordHandle.apply(store, [e.type, e.detail])
        }
        break
      case 'component:move:start':
        recordHandle.apply(store, [e.type, e.detail, false])
        break
      case 'component:move':
        move = true
        break
      case 'component:move:end':
        if (e.target === 'property') {
          recordHandle.apply(store, [e.type, e.detail])
        } else if (move) {
          move = false
          recordHandle.apply(store, [e.type, e.detail])
        }
    }
  }

  onMounted(function () {
    eventBus.$on(recordChannel.componentAdd, componentChange)
    eventBus.$on(recordChannel.componentDel, componentChange)
    eventBus.$on(recordChannel.componentMoveStart, componentChange)
    eventBus.$on(recordChannel.componentMove, componentChange)
    eventBus.$on(recordChannel.componentMoveEnd, componentChange)
    eventBus.$on(recordChannel.componentFontChange, componentChange)
    eventBus.$on(recordChannel.componentResizeStart, componentChange)
    eventBus.$on(recordChannel.componentResize, componentChange)
    eventBus.$on(recordChannel.componentResizeEnd, componentChange)
  })

  onBeforeUnmount(function () {
    eventBus.$off(recordChannel.componentAdd, componentChange)
    eventBus.$off(recordChannel.componentDel, componentChange)
    eventBus.$off(recordChannel.componentMoveStart, componentChange)
    eventBus.$off(recordChannel.componentMove, componentChange)
    eventBus.$off(recordChannel.componentMoveEnd, componentChange)
    eventBus.$off(recordChannel.componentFontChange, componentChange)
    eventBus.$off(recordChannel.componentSizeChange, componentChange)
    eventBus.$off(recordChannel.componentResizeStart, componentChange)
    eventBus.$off(recordChannel.componentResize, componentChange)
    eventBus.$off(recordChannel.componentResizeEnd, componentChange)
  })
}
```

因为历史记录不涉及到视图层的东西，所以写个hooks即可，首先注册这些历史记录事件，编辑器操作后触发该事件。

**这里要说明一下 `componentChange` 的参数是 `TemplateEvent` 这是自定义的事件对象，为什么要这样做**

> 因为需要规范化事件对象，去传递我们需要的参数

**为什么不采用 `Event` 呢？**

> 因为Event有很多属性是用不上的，编辑器触发的也不是传统dom事件

函数 **componentChange**

主要是过滤和处理一些事件压入历史记录栈，但是，有些事件是不必要全部记录。例如移动事件，这个当拖动控件时会一直触发，我们只需要记录 `component:move:end` 事件即可，得到最终移动的位置。

函数 **recordHandle**

在这个函数里，才真正的开始往历史记录栈里压入数据，当然可以做最大历史记录限制。

## 撤销&重做

```js
const recordActionHandle = {
  componentAdd: {
    /**
     * @this {Template.Store}
     * @param {Template.BuiltinComponentRecord} record
     */
    undo(record) {
      this.restore.push(record)

      eventBus.$emit(
        templateChannel.componentDel,
        new TemplateEvent(templateChannel.componentDel, {
          detail: record.component,
          target: 'stage'
        }),
        false
      )
    },
    /**
     * @this {Template.Store}
     * @param {Template.BuiltinComponentRecord} record
     */
    restore(record) {
      eventBus.$emit(
        templateChannel.componentAdd,
        new TemplateEvent(templateChannel.componentAdd, {
          detail: record.component,
          target: 'stage'
        }),
        false
      )
    }
  },
  componentDel: {
    /**
     * @this {Template.Store}
     * @param {Template.BuiltinComponentRecord} record
     */
    undo(record) {
      this.restore.push(record)

      eventBus.$emit(
        templateChannel.componentAdd,
        new TemplateEvent(templateChannel.componentAdd, {
          detail: record.component,
          target: 'stage'
        }),
        false
      )
    },
    /**
     * @this {Template.Store}
     * @param {Template.BuiltinComponentRecord} record
     */
    restore(record) {
      eventBus.$emit(
        templateChannel.componentDel,
        new TemplateEvent(templateChannel.componentDel, {
          detail: record.component,
          target: 'stage'
        }),
        false
      )
    }
  },
  componentGeneral: {
    /**
     * @this {Template.Store}
     * @param {Template.BuiltinComponentRecord} record
     */
    undo(record) {
      undoGeneral.apply(this, [record])
    },
    /**
     * @this {Template.Store}
     * @param {Template.BuiltinComponentRecord} record
     */
    restore(record) {
      restoreGeneral.apply(this, [record])
    }
  }
}
```

**撤销和重做分为2种类型**

1. 常规类型

2. 非常规类型

**为什么这样讲？**

> 控件的添加和删除是一个比较特殊的操作，会涉及到控件的初始化销毁，而普通的，像位置调整、各种属性的调整、这些是不影响控件的声明周期，所以称之为普通操作。

上述代码可以看到，具体实现也不是说直接在这里写具体的撤销和重写，因为完全没必要，因为本身这些创建和删除等等操作都有一个事件来通知完成。所以，只需要反着触发事件即可（默认所有编辑器的事件都会被log日志打印出来，但是操作历史记录不需要log，所以`emit`的第二个参数是`false`）

```js
/**
 * @this {Template.Store}
 * @param {'undo'|'restore'} action
 * @param {Template.BuiltinComponentRecord} record
 */
export function recordHandle(action, record) {
  switch (record.type) {
    case 'component:add':
      recordActionHandle.componentAdd[action].apply(this, [record])
      break
    case 'component:del':
      recordActionHandle.componentDel[action].apply(this, [record])
      break
    case 'component:move:end':
    case 'component:resize:end':
    case 'component:font:change':
      recordActionHandle.componentGeneral[action].apply(this, [record])
      break
  }
}
```

编辑器监听undo 和 restore 事件，调用此方法

```js
// /template/index.vue

/**
 * 撤销
 */
const stageUndo = function () {
  const popRecord = store.record.pop()

  if (popRecord) {
    recordHandle.apply(store, ['undo', popRecord])
  }
}

/**
 * 重做
 */
const stageRestore = function () {
  const popRecord = store.restore.pop()

  if (popRecord) {
    recordHandle.apply(store, ['restore', popRecord])
  }
}

onMounted(function () {
  eventBus.$on(templateChannel.stageUndo, stageUndo)
  eventBus.$on(templateChannel.stageRestore, stageRestore)
})

onUnmounted(function () {
  eventBus.$off(templateChannel.stageUndo, stageUndo)
  eventBus.$off(templateChannel.stageRestore, stageRestore)
})
```

编辑器撤销时需要判断一下是否还有历史记录存在

在这里我并没有使用一个队列来存放历史记录，可能我当时想错了，正常来讲是维护一个队列即可。

*感慨一句*

*Vue3把事件移除还有不在支持监听组件的原生事件（必须手动声明emit），不再支持过滤器，真不适应，当然我也相信这些改动也是经过深思熟虑的。*

## 最后

希望我的设计能给你带来一点点的启发，如果有，请不要忘了点赞转发留言哦

![请问小姐你的心怎么走](https://static-1256180570.cos.ap-nanjing.myqcloud.com/image/1731947600.jpg)
