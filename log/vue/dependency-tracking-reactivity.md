---
url: /log/vue/dependency-tracking-reactivity.md
description: >-
  从依赖收集机制讲清 buttonProps 函数写法为何能保持 loading 响应式，并分析 loading 变化时的渲染粒度，以及 index 作为
  key 在静态列表中的影响。
---

# 配置驱动按钮列表：函数返回的 loading 为什么还是响应式的

> 背景：运营管理系统的资源列表页上有两个 tab，两个 tab 下的操作按钮（更新、批量分配、下载、新增……）一模一样，唯一的区别是同一个按钮对应的权限码不同。如果两套模板各写一遍，就是两份几乎重复的代码；为了少写代码，我们把按钮抽象成了配置——每个按钮只声明「权限码集合 + 文案 + 按钮属性 + 点击行为」，模板循环渲染一遍，权限码按当前 tab 取。本文以其中一个真实的「下载」按钮为例，讨论几个容易踩坑的问题：
>
> 1. `buttonProps` 明明是个函数，为什么它的返回值（`loading`）还能响应式更新？
> 2. `loading` 变化时，组件到底会重新渲染多大范围？
> 3. 循环里用 `index` 作为 `key` 到底有没有影响？

## 一、场景还原

典型的配置驱动写法如下：

```ts
interface Actions {
  codes: string[]
  label: string
  buttonProps?: () => ButtonProps
  handle(): void
}

const actions: Actions[] = [
  // ...其他按钮
  {
    codes: ['sale:resource:list:download', 'sale:resource:list:download:all'],
    label: '下载',
    buttonProps() {
      return {
        type: 'primary',
        loading: loading.value
      }
    },
    handle() {
      createExportTask()
    }
  }
]
```

其中 `codes` 数组的下标与 tab 一一对应（第 0 项是第一个 tab 的权限码，第 1 项是第二个 tab 的），`form.tab` 是当前 tab 的下标，所以同一份配置可以同时服务两个 tab。

模板里循环渲染：

```vue
<app-access v-for="(item, index) of actions" :key="index" :codes="[item.codes.at(form.tab)!]">
  <a-button v-bind="item.buttonProps?.()" @click="item.handle()">{{ item.label }}</a-button>
</app-access>
```

其中 `loading` 来自一个 `useExportTask` 组合式函数：

```ts
export function useExportTask(option: Options) {
  const loading = ref(false)

  const createExportTask = useDebounceFn(async function () {
    try {
      loading.value = true
      await option.request()
      message.success('导出任务创建成功，请到任务管理查看')
    } catch (error) {
      message.error('导出任务创建失败，请重试')
    } finally {
      loading.value = false
    }
  }, 500)

  return { loading, createExportTask }
}
```

直观的疑问是：`buttonProps` 是个普通函数，`loading` 是 `ref`，函数返回的是一个「新建的对象」。这个对象每次调用都是全新的，为什么按钮的 loading 还能跟着请求状态实时变化？

## 二、核心结论

**正因为它是函数，所以才能响应式。**

函数本身不产生响应式；响应式来自「在渲染 effect 运行期间读取 `loading.value`」。函数的作用，只是让这个读取动作在每次渲染时都重新发生一次，从而让依赖被持续追踪。

## 三、原理拆解

### 1. 依赖是在「渲染时」被收集的

Vue 的响应式依赖追踪，靠的是「谁在执行时读了响应式变量」。

模板里这行：

```vue
<a-button v-bind="item.buttonProps?.()" />
```

在编译后会进到组件的渲染函数中。每次组件渲染，渲染函数都会重新执行，而 `item.buttonProps?.()` 就是渲染函数里的一次普通函数调用。

它被调用的那一刻，正处于 Vue 的「渲染 effect」运行期间。此时函数内部读 `loading.value`：

```ts
buttonProps() {
  return { type: 'primary', loading: loading.value }  // ← 读 ref
}
```

`loading.value` 这个读取动作，会被 Vue 记下来——即「当前这个渲染 effect 依赖了 `loading` 这个 ref」。

### 2. 完整链路

```text
1. 渲染 → 执行 buttonProps() → 读 loading.value → 建立依赖
2. createExportTask 里 loading.value = true → 触发依赖（通知渲染 effect）
3. 组件重渲染 → 又执行一遍 buttonProps() → 读到最新的 true
4. loading.value = false → 再触发 → 再渲染 → 读到 false
```

所以按钮的 loading 会跟随请求进度实时开关。

### 3. 底层机制：track / trigger 是怎么工作的

上一节解释了「依赖在渲染时被收集」，这一节深入到底层：Vue 具体靠什么机制把「响应式变量」和「渲染函数」关联起来。

先给结论：**Vue 绑定的不是 DOM 节点，而是「渲染函数」这个 effect**。链路是「响应式变量 → 渲染 effect → 新 VNode → diff → 更新 DOM」，DOM 更新只是这条链的间接结果。

**三个核心角色**

| 角色                           | 是什么                      | 作用                          |
| ------------------------------ | --------------------------- | ----------------------------- |
| 响应式对象（`reactive`/`ref`） | 用 `Proxy` 拦截 `get`/`set` | 在读写时发出钩子              |
| effect（渲染函数）             | 可被重复执行的函数          | 组件 `render` 就是一个 effect |
| dep（依赖集合）                | 每个属性一个 `Set<effect>`  | 记录「谁依赖了我」            |

**依赖建立（track）**

关键是一个全局变量 `activeEffect`，记录「当前正在运行的 effect」。渲染 effect 运行时先把自己标记为 `activeEffect`，再执行 render；render 里每读一个响应式属性，`Proxy` 的 `get` 触发 `track`，把当前 effect 塞进该属性的 dep：

```text
渲染 effect 运行
  └─ activeEffect = 渲染 effect
      └─ render() 读 loading.value
           └─ get 拦截 → track → loading 的 dep.add(渲染 effect)
```

**更新派发（trigger）**

反过来，`loading.value = true` 触发 `set` 拦截 → `trigger` → 遍历 dep → 重新执行记录的 effect。

**简化伪代码**

```ts
let activeEffect: ReactiveEffect | undefined

// 每个响应式对象 → Map(key → Set(effects))
const targetMap = new WeakMap<object, Map<PropertyKey, Set<ReactiveEffect>>>()

// 收集依赖：get 时调用
function track(target: object, key: PropertyKey) {
  let depsMap = targetMap.get(target)
  if (!depsMap) targetMap.set(target, (depsMap = new Map()))
  let dep = depsMap.get(key)
  if (!dep) depsMap.set(key, (dep = new Set()))
  if (activeEffect) dep.add(activeEffect)
}

// 派发更新：set 时调用
function trigger(target: object, key: PropertyKey) {
  const dep = targetMap.get(target)?.get(key)
  dep?.forEach(effect => effect.run())
}

// reactive：Proxy 拦截 get/set
function reactive<T extends object>(obj: T): T {
  return new Proxy(obj, {
    get(target, key, receiver) {
      track(target, key)
      return Reflect.get(target, key, receiver)
    },
    set(target, key, value, receiver) {
      const result = Reflect.set(target, key, value, receiver)
      trigger(target, key)
      return result
    }
  })
}

// ref：.value 的 getter/setter 做同样的事
class RefImpl<T> {
  private _value: T
  constructor(value: T) {
    this._value = value
  }
  get value() {
    track(this, 'value')
    return this._value
  }
  set value(v: T) {
    this._value = v
    trigger(this, 'value')
  }
}

// effect：运行时标记自己为「正在运行」
class ReactiveEffect {
  run() {
    activeEffect = this // 真实实现还有 effect 栈 + 依赖清理
    return this.fn()
  }
}
```

组件挂载时，`componentUpdateFn`（生成 VNode + 挂载/更新）被包成一个 `ReactiveEffect`：首渲染 `effect.run()` 读 `data.a` → track 收集；`data.a` 被改 → trigger → 重新 run → 新 VNode → diff → patch 真实 DOM。

**动态依赖收集**

依赖不是初始化时一次性固定的。每次 effect 运行前会先清理旧依赖，再执行时重新收集。所以 `v-if`、三元表达式等分支切换后，新旧依赖能自动更正——不再访问的变量自动解绑，新访问的变量自动绑定。

## 四、对比：静态对象 vs 函数

这是最容易踩坑的地方。关键在于「读 `loading.value` 必须在渲染期间发生」，而不是在渲染之外提前读好快照。

```ts
// ❌ 静态对象：定义时就读了一次，且不在渲染 effect 里，不会建立依赖
const actions = [{ buttonProps: { loading: loading.value } }]

// ✅ 函数：每次渲染都重新调用、重新读，读的那一下正好在渲染 effect 里
const actions = [
  {
    buttonProps() {
      return { loading: loading.value }
    }
  }
]
```

静态对象里，`loading.value` 在 `<script setup>` 顶层（组件 setup 初始化阶段）被读取了一次，值被「冻结」在对象里。之后 `loading` 再怎么变，那个对象里的 `loading` 字段都不会更新。

而函数写法，等价于一个 `computed` getter：渲染时求值 → 依赖被收集 → 变更时重新求值。

## 五、渲染粒度：`loading` 变化会渲染多大范围

直观的疑问是：`loading` 一变，只会重新渲染「下载按钮」，还是同级的全部按钮（甚至整个页面）都被渲染？

答案是分层的，需要区分「重新渲染」和「更新 DOM」这两个概念。

### 1. 组件粒度：整个页面都会重新渲染

`loading` 是在当前组件（`index.vue`）的 `<script setup>` 里创建的，属于**当前组件的作用域**。读取 `loading.value` 虽然写在 `buttonProps()` 里，但那是在**当前组件的渲染 effect** 内发生的，所以收集到 `loading` 依赖的是「整个页面的渲染 effect」，而不是「下载按钮」这个局部。

因此 `loading` 一变，整个 `PageResourceList` 的 render 函数会重新跑一遍——不只是这 6 个按钮，页面里的表格、表单、级联选择器等全部节点都会重新执行、重新生成 VNode。这是「组件级」的响应式更新，Vue 并不会精确到「只更新某个按钮」。

### 2. DOM patch 粒度：实际只更新下载按钮

「重新渲染」不等于「全部重绘 DOM」。render 重跑只是重新生成 VNode 树（纯 JS 计算），真正昂贵的是后续的 diff / patch。

| 层次                     | 范围              | 是否只涉及下载按钮  |
| ------------------------ | ----------------- | ------------------- |
| render（生成 VNode）     | 整个页面重新执行  | ❌ 全部             |
| diff（新旧 VNode 对比）  | 遍历整个 VNode 树 | ❌ 全部遍历         |
| patch（真实 DOM 写操作） | 只有变化的节点    | ✅ 基本只有下载按钮 |

所以「只更新下载按钮」准确指的是第三层：只有下载按钮发生实际的 DOM 变更；而前两层（render + diff）仍然是全量执行 / 遍历的。

### 3. 为什么其他按钮不会被误 patch

其他按钮的 `buttonProps()` 也在 render 重跑时被重新执行，返回了新的对象。但 `v-bind` 会把它展开成扁平的 prop，展开后每个值都是原始类型（`'primary'`、`true`），Vue diff 时按值比较：

* 下载按钮：`loading: false → true` → 值变了 → patch
* 其它按钮：`type` / `danger` 与旧值相同 → 跳过

所以「新对象」本身不会触发 patch，决定 patch 与否的是展开后的原始值是否变化。

### 4. 边界与优化

「只更新下载按钮」的结论，建立在 `buttonProps()` 返回的都是原始值这个前提上。如果返回对象 / 数组 / 函数引用，每次都是全新引用，diff 会误判为「变了」，导致这些按钮每次都被无谓 patch。

想连 render / diff 也缩小到单个按钮，需要把按钮抽成独立子组件，让 `loading` 作为 prop 传进去：

```vue
<download-button :loading="loading" @click="createExportTask" />
```

这样 `loading` 只在子组件内部被读取，依赖被收进子组件自己的渲染 effect，`loading` 变化时就只有该子组件重新渲染。

## 六、引申：`index` 作为 `key` 有没有影响

在这个场景下，`index` 作为 key **几乎没有任何影响**。原因是 `actions` 是一个**静态且固定长度**的数组：

* 不是 `ref` / `reactive`，定义后从不修改（不 push、不 splice、不重排）；
* 长度永远固定，顺序永远不变。

因此每次渲染 `index` 和每个按钮的对应关系完全一致，`index` 作为 key 和用一个稳定 id 的效果等价，Vue 的 diff 不会复用错组件。

### 为什么连「按钮内部状态错位」也不会发生

`index` 作为 key 的经典坑，通常发生在列表会增删、重排、过滤时，导致 Vue 错误复用旧 DOM / 组件实例，保留内部状态（如表单输入框内容、展开态）。

而这里的 `a-button` 的 loading 并不是按钮的内部状态，而是每次渲染通过 `v-bind="item.buttonProps?.()"` 从父级 `loading` ref 重新传入的 **prop**。每次渲染 `buttonProps()` 都返回最新值并覆盖按钮的 prop，所以即使 Vue 复用了某个按钮实例，新的 prop 也会被重新传进去，不会残留旧 loading。

### 什么时候才需要担心

只有当 `actions` 将来变成动态时才有影响，例如按权限过滤导致 items 增减 / 重排：

```ts
const visibleActions = computed(() => actions.filter(...))
```

那时 `index` 会随过滤结果漂移，key 和实际项错位，就需要换成稳定 key（如 `item.codes[0]` 或 `item.label`）。

## 七、总结

1. **响应式来自「渲染期间读取 ref」**：`buttonProps()` 在渲染 effect 里被调用，读取 `loading.value` 时建立了依赖，之后 `loading` 变化会触发重渲染。
2. **函数写法的价值**：让读取在每次渲染都重新发生，等价于一个 `computed`，而不是定义一个「一次性快照」。
3. **`index` 作为 key**：在静态、固定顺序、无内部关键状态的列表里是无害的；一旦列表动态化，应换成唯一稳定 key。
