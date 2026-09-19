---
title: 前端数据权限模块设计实践
date: 2026-08-05
categories: [Vue]
tags: [Vue, TypeScript, Pinia, 权限, 设计模式]
---

![数据权限模块设计实践](https://static-1256180570.cos.ap-nanjing.myqcloud.com/image/20260807094056291.png)

如何在前端优雅地实现精细化数据权限控制

## 背景

在 B 端运营管理系统中，数据权限是一个绕不开的核心需求。不同角色、不同部门的用户，应该只能看到自己权限范围内的数据。比如：

- 华东区域管理员只能看到华东区域的任务和订单
- 财务人员只能看到城市为上海的账单
- 审核人员只能看到待审核的记录

如果只是简单的"管理员/普通用户"两级权限，显然无法满足这种精细化控制的需求。本文分享我们如何在 Vue 3 + TypeScript 的前端项目中设计和实现一个可扩展的数据权限模块。

## 从一个例子说起：这条权限是怎么"转"起来的

运营小李"只能看到城市为上海的订单"。这句话背后，系统依次做了四件事：

1. **配置**：管理员在"数据范围"配置页新建权限模板，勾选"城市 = 上海"、"生效页面 = 订单列表"，并把模板绑定给小李所在的角色。
2. **下发与合并**：小李登录时，后端把他名下所有权限模板数据返回。前端把多条模板按规则类型合并成一张"规则值表"，把生效页面合并成一张"页面范围表"，存入 Pinia。
3. **选项过滤**：订单列表页的下拉框由描述符（Descriptor）渲染，`options(ScopePage.OrderList)` 自动把小李无权使用的选项（北京、广州）过滤掉，界面上只留下"上海"。
4. **查询过滤**：小李用"上海"作为查询条件提交，后端据此只返回上海相关的订单。

四件事正好对应四层：**Views 负责配置与消费，Store 负责合并与校验，Model 负责业务逻辑与数据转换，Descriptor 负责把"配置"和"权限"绑成一个干净的接口**。

## 整体架构

```
┌─────────────────────────────────────────┐
│              Views（页面）               │  ① 配置权限模板 ② 消费过滤后的选项
├─────────────────────────────────────────┤
│              Store（校验）               │  合并模板数据，对外提供 hasScope 校验
├─────────────────────────────────────────┤
│              Model（实体）               │  业务逻辑、数据转换、规则合并
├─────────────────────────────────────────┤
│           Descriptor（描述符）           │  规则类型配置 + 按权限过滤选项
└─────────────────────────────────────────┘
```

依赖方向是单向的：View → Store / Descriptor，Store → Model → Descriptor。越底层的模块越"无知"——Descriptor 不知道权限数据从哪来，Model 不知道页面长什么样。

下面逐层拆解。

## 第一层：Descriptor — 数据字典与选项过滤

这是整个模块的地基。它的职责可以概括为一句话：**把"这个维度有哪些选项"和"当前用户能用哪些选项"这两件事，绑定成一个干净的接口**，让业务页面两行代码就拿到"可用选项"。

### 1.1 规则类型：先定义"能限制哪些维度"

数据权限要限制的维度是有限的：城市、区域、时间、地理位置、状态……用一个枚举全部定义出来（`src/descriptor/config.ts`）：

```typescript
export enum ScopeRuleType {
  City = 'city', // 城市
  Region = 'region', // 区域
  CreatedTime = 'created_time', // 创建时间
  OrderTime = 'order_time', // 订单时间
  OrderLocation = 'order_location', // 订单位置
  StoreLocation = 'store_location', // 门店位置
  MemberStatus = 'member_status', // 会员状态
  AuditNode = 'audit_node' // 审核节点
}
```

同理，权限可以作用在哪些页面上，也用枚举定义（`ScopePage`）：订单列表、门店列表、用户列表、审核列表……每个页面一个值，供"生效页面范围"使用。

### 1.2 选项配置：每种规则有哪些可选值

每种规则类型都有一组自己的"选项"。比如城市有 3 个选项，每个选项除了展示文字，还带一个颜色标签用于 UI 高亮：

```typescript
// src/descriptor/config.ts
export const scopeConfig = new Map<ScopeRuleType, ScopeRuleConfig>([
  [
    ScopeRuleType.City,
    {
      label: '城市',
      value: new Map([
        [1, { label: '全部城市', color: 'red' }],
        [2, { label: '北京', color: 'green' }],
        [3, { label: '上海', color: 'blue' }]
      ])
    }
  ],
  [ScopeRuleType.Region, {/* 华东 / 华北 / 华南 */}],
  [ScopeRuleType.MemberStatus, {/* 不限 / 正常 / 停用 */}],
  [ScopeRuleType.AuditNode, {/* 不限 / 待审核 / 审核中 / ... */}],
  // 时间、位置等"非枚举型"规则没有固定选项，value 留空，由页面用特殊控件配置
  [ScopeRuleType.CreatedTime, { label: '创建时间' }],
  [ScopeRuleType.OrderLocation, { label: '订单位置' }]
])
```

注意 `value` 是可选的：城市这类**枚举型**规则有固定选项；创建时间、订单位置这类**非枚举型**规则没有固定选项（用户要填日期范围、选省市区），所以 `value` 不配置。只有枚举型规则才谈得上"选项"，所以 Descriptor 只服务于枚举型规则——而且即便同为枚举型，也只有需要前端参与判断的维度才值得接入（见后文「前端的能力边界：只管选项过滤」）。

### 1.3 描述符：把配置和权限绑在一起的封装

有了配置表之后，我们希望有一个对象能同时做两件事：

- **读配置**：这个规则有哪些选项？某个选项长什么样？
- **读权限**：当前用户能不能用某个选项？

`Descriptor` 类就是干这个的（`src/descriptor/descriptor.ts`）：

```typescript
class Descriptor {
  private scope: ScopeRuleType // 描述哪种规则
  private map: Map<number, ConfigItemOption> // 该规则的选项表（来自 scopeConfig）

  constructor(option: { scope: ScopeRuleType }) {
    const scope = scopeConfig.get(option.scope)
    if (!scope?.value) throw new Error(`Descriptor scope not found: ${option.scope}`)
    this.map = scope.value
    this.scope = option.scope
  }

  /** 读取单个选项的完整信息（label/color），用于表格列反查标签 */
  item(key: number) {
    return this.map.get(key)
  }

  /** 读取全部选项（Map.entries()），用于"展示全量选项"的场景 */
  items() {
    return this.map.entries()
  }

  /** 核心：按当前用户权限过滤，返回可用的选项列表 */
  options(scopePage: ScopePage) {
    return Array.from(this.map)
      .filter(([key]) => Dictionary.hasScope(this.scope, scopePage, key))
      .map(([key, data]) => ({ label: data.label, value: key }))
  }
}

export function createDescriptor(config: { scope: ScopeRuleType }) {
  return new Descriptor(config)
}
```

三个方法各有用途：

- `item(key)`：数据里存的是数字 3，表格渲染时用 `item(3)` 反查 `{ label: '上海', color: 'blue' }`，既能展示文字也能给标签上色。
- `items()`：不考虑权限，展示全部选项。比如订单录入表单时，由用户自己选择城市，不需要过滤。
- `options(scopePage)`：**考虑权限**。拿到全部选项后逐个调用 `Dictionary.hasScope` 过滤，用户没有权限的选项根本不出现。

### 1.4 Provider：把"权限从哪来"完全解耦

注意 `options()` 里用的是 `Dictionary.hasScope`，而不是直接访问某个 store。`Dictionary` 是一个静态 Provider（`src/descriptor/provider.ts`）：

```typescript
export class Dictionary {
  private static provider?: DictionaryProvider

  /** 应用启动时注入权限校验实现 */
  static install(provider: DictionaryProvider) {
    Dictionary.provider = provider
  }

  static hasScope(scope: ScopeRuleType, pageScope: ScopePage, value: number): boolean {
    if (!Dictionary.provider) {
      throw new Error('Dictionary.install not called')
    }
    return Dictionary.provider.hasScope(scope, pageScope, value)
  }
}
```

Descriptor 层只认识 `Dictionary`，不认识 Pinia、不认识 Vuex。权限数据从哪来，由注入方决定。在当前项目中，注入发生在应用启动时（`src/App.vue`）：

```typescript
const { hasScope } = useScope() // store 层暴露的校验函数

Dictionary.install({
  hasScope(scope, pageScope, value) {
    return hasScope(scope, pageScope, value)
  }
})
```

这样描述符层就完全不关心权限数据从哪里来，实现了关注点分离。以后如果要把 Pinia 换成其他状态管理，只需要改这一处注入。

### 1.5 预置单例：避免到处 new

因为描述符是"一个规则类型一个"，所以直接预创建好单例导出（`src/descriptor/option.ts`）：

```typescript
export const cityDescriptor = createDescriptor({
  scope: ScopeRuleType.City
})

export const regionDescriptor = createDescriptor({
  scope: ScopeRuleType.Region
})
```

业务页面 import 即可用，不需要关心内部怎么构造。

### 1.6 业务页面怎么用

**场景 A：下拉选项按权限过滤。** 订单列表页，城市筛选项只显示当前用户有权限的城市：

```typescript
const cityOptions = cityDescriptor.options(ScopePage.OrderList)
```

小李只有"上海"的权限，这个数组里就只会有一个 `{ label: '上海', value: 3 }`。他不可能选到无权限的值——因为选项根本没渲染出来。**这就是 Descriptor 的核心价值：把权限判断从"提交时校验"前移到"渲染时过滤"，从源头杜绝用户选中无权限的值。**

**场景 B：表单里展示全部选项。** 订单录入表单让用户自己选城市：

```vue
<a-radio v-for="[key, item] of cityDescriptor.items()" :key :value="key">
  {{ item.label }}
</a-radio>
```

**场景 C：表格列里反查标签。** 列表数据存的是数字，渲染时用 `item(key)` 拿回带颜色的标签。

一句话总结第一层：**`scopeConfig` 定义"有哪些选项"，`Descriptor` 包装成 item/items/options 三个方法，`options` 通过 `Dictionary` 按当前用户权限过滤。** 规则类型是有限的，所以一切都可以用配置驱动；权限来源是可变的，所以用 Provider 解耦。

## 第二层：Model — 实体即业务逻辑

这一层用的是 class-transformer 的实体模式。每个权限模板是一个 `ScopeEntity`，包含多条规则 `ScopeRuleEntity`（`src/model/system/scope.entity.ts`）。

### 规则实体：一条规则 = 哪个维度 + 允许哪些值

```typescript
export class ScopeRuleEntity extends AbstractEntity {
  /** 数据权限字段：城市 / 区域 ... */
  @Expose()
  fieldName: ScopeRuleType

  /** 规则具体值：如城市 [3]（上海） */
  @Expose()
  @Transform(...)  // 复杂转换逻辑，见下文
  ruleValue: number | number[] | ScopeRuleTimeDimensionEntity | ScopeRuleLocationEntity

  /** 从 scopeConfig 里取该规则的配置，供 UI 渲染 */
  get config() {
    return scopeConfig.get(this.fieldName)
  }
}
```

### 复杂的数据转换

服务端存储的是 JSON 字符串，前端组件需要的是对象和数组。这中间的"翻译"工作，全部由 `@Transform` 装饰器完成。class-transformer 会在三个方向上触发转换，`params.type` 就是当前的方向：

| `TransformationType` | 触发时机        | 要解决的问题                       |
| -------------------- | --------------- | ---------------------------------- |
| `PLAIN_TO_CLASS`     | 接口响应 → 实体 | JSON 字符串 → 数组 / 子实体实例    |
| `CLASS_TO_PLAIN`     | 实体 → 请求体   | 数组 / 子实体 → JSON 字符串        |
| `CLASS_TO_CLASS`     | 实体 → 实体     | 拷贝值，避免多个实体共享同一份引用 |

#### 第一层：按规则类型分发

`ruleValue` 的类型是不确定的（数组、时间范围、省市区），所以它上面的 `@Transform` 先做一次分发：根据 `fieldName` 判断这条规则属于哪一组，再交给对应的转换器处理。

```typescript
  @Transform(function (param) {
    // NOTE: 时间维度规则 则 初始化为 ScopeRuleTimeDimensionEntity 实例
    if (ScopeRuleEntity.isTimeDimensionGroup(param.obj)) {
      return ScopeRuleTimeDimensionEntity.transform(param)
    } else if (ScopeRuleEntity.isLocationGroup(param.obj)) {
      return ScopeRuleLocationEntity.transform(param)
    } else if (ScopeRuleEntity.isComplianceGroup(param.obj)) {
      return ScopeRuleEntity.transformComplianceGroup(param)
    } else {
      // 枚举型规则：JSON 字符串 ⇄ 数组
      switch (param.type) {
        case TransformationType.CLASS_TO_PLAIN:
          return JSON.stringify(param.value)
        case TransformationType.PLAIN_TO_CLASS:
          return safeParseJSON(param.value)
        default:
          return clone(param.value)
      }
    }
  })
  @Expose()
  ruleValue: number | number[] | ScopeRuleTimeDimensionEntity | ScopeRuleLocationEntity
```

枚举型规则的转换最简单，就是 `JSON.stringify` 与 `safeParseJSON` 的互转；复杂的是时间维度、地理位置、合规完成度这三种，它们各自实现一个 `static transform`。

#### 第二层：各类型自己的 transform

以时间维度为例。后端存的是 `{ startTime: '2024-01-01', endTime: '2024-12-31' }` 这样的 JSON 字符串，而 RangePicker 需要的是 `[dayjs, dayjs]` 数组：

```typescript
export class ScopeRuleTimeDimensionEntity extends ScopeRuleBaseValueEntity {
  static transform(params: TransformFnParams) {
    switch (params.type) {
      case TransformationType.PLAIN_TO_CLASS:
        const json = safeParseJSON(params.value)
        const instance = plainToInstance(ScopeRuleTimeDimensionEntity, json)

        // 解析出有效范围 → 顺手把勾选状态置为 true
        if (instance.dateRange) {
          instance.checked = true
        }

        return instance
      case TransformationType.CLASS_TO_PLAIN:
        return JSON.stringify((params.value as ScopeRuleTimeDimensionEntity).toJSON())
      case TransformationType.CLASS_TO_CLASS:
        return (params.value as ScopeRuleTimeDimensionEntity).copy()
    }
  }

  @Expose()
  private startTime?: string

  @Expose()
  private endTime?: string

  get dateRange() {
    if (this.startTime && this.endTime) {
      return [dayjs(this.startTime), dayjs(this.endTime)]
    }
    return void 0
  }
  set dateRange(val: [dayjs.Dayjs, dayjs.Dayjs] | undefined) {
    this.startTime = val && val[0].startOf('day').format(DATE.valueFormat)
    this.endTime = val && val[1].endOf('day').format(DATE.valueFormat)
  }
}
```

这里有两个细节值得单独拎出来说：

- **存储格式与展示格式解耦**：接口和数据库里只有 `startTime` / `endTime` 两个字符串，组件直接用的却是 `dateRange` 这个 `[dayjs, dayjs]` 数组。getter / setter 就是这座桥——setter 在赋值时顺手做了 `startOf('day')` / `endOf('day')` 边界归一，组件不用关心日期边界怎么算。
- **UI 状态由数据推导，而不是另外维护**：`PLAIN_TO_CLASS` 阶段只要解析出有效的 `dateRange`，就把 `checked = true`（`checked` 定义在基类 `ScopeRuleBaseValueEntity` 上）。这样配置页的勾选框不需要额外存一份状态，勾选状态永远和真实数据一致，不会出现"勾上了但没值"或"有值却没勾"的脏状态。

地理位置的转换结构与之完全对称，区别只有两处：判空条件换成 `provinceCode || cityCode`，并用自定义装饰器 `@NumberAsString()` 处理行政区划码在数字与字符串之间的互通：

```typescript
export class ScopeRuleLocationEntity extends ScopeRuleBaseValueEntity {
  static transform(params: TransformFnParams) {
    switch (params.type) {
      case TransformationType.PLAIN_TO_CLASS:
        const json = safeParseJSON(params.value)
        const instance = plainToInstance(ScopeRuleLocationEntity, json)

        if (instance.provinceCode || instance.cityCode) {
          instance.checked = true
        }

        return instance
      // CLASS_TO_PLAIN → JSON.stringify(...toJSON())
      // CLASS_TO_CLASS → copy()
    }
  }

  @NumberAsString()
  @Expose()
  provinceCode?: number

  @NumberAsString()
  @Expose()
  cityCode?: number
}
```

合规完成度（签约、认证状态）这类规则更特殊：它虽然是一个布尔值，但后端统一按数组存放，所以转换时要"包装 / 解包"一次：

```typescript
static transformComplianceGroup(params: TransformFnParams) {
  switch (params.type) {
    case TransformationType.PLAIN_TO_CLASS:
      const json = safeParseJSON(params.value) || []
      return json[0] // 解包：前端实体只关心第一个元素
    case TransformationType.CLASS_TO_PLAIN:
      const value = params.value !== void 0 ? [params.value] : []
      return JSON.stringify(value) // 包装：统一还原成数组再提交
    case TransformationType.CLASS_TO_CLASS:
      return clone(params.value)
  }
}
```

把这套转换串起来看：**`@Transform` 负责"分发给谁"，各类型的 `static transform` 负责"怎么变"，`TransformationType` 保证双向可逆**。最终效果是——接口拿到的 JSON 字符串，进实体就变成有 `dateRange`、有 `checked` 的对象；实体提交时又原样还原成后端的存储格式。业务代码和组件只面对实体，永远不用手写 `JSON.parse` / `JSON.stringify`。

顺便一提，同样是"按 `fieldName` 分组"这个判断，`isTimeDimensionGroup` / `isLocationGroup` 这类静态方法被转换、`normalizeGroup` 分组、`create` 初始化三处复用。分组语义只定义一次，避免了在多个 `switch` 里重复罗列枚举值。

### 核心合并逻辑

当用户被绑定多个权限模板时，需要合并所有模板的规则。合并逻辑是所有数据权限计算的基础，分两部分：

**规则值合并**（`ScopeRuleEntity.mergeScopeRules`）——把多条模板按 `fieldName` 聚合：

1. 过滤：指定页面生效但 `pageScope` 为空的模板直接剔除（该模板不生效）；
2. 只处理枚举型规则（城市 / 区域）：时间、位置这类范围型规则前端判断不了，合并时直接跳过，交由后端执行；
3. 按 `fieldName` 合并取值，优先级如下：
   - 已有规则是全部权限（`ruleValue` 为空数组）→ 不再合并，全部权限保留；
   - 当前规则是全部权限 → 结果直接置为全部权限；
   - 否则两个规则的 `ruleValue` 取并集去重。

**页面范围合并**（`ScopeEntity.mergePageConfig`）：

```typescript
static mergePageConfig(data: ScopeEntity[]): Set<string> {
  let scope: string[] = []
  let checkAllPages = false

  for (const rule of data) {
    // 存在"全平台生效"模板 → 标记后直接跳出
    if (rule.scopeType === ScopePageType.All) {
      checkAllPages = true
      break
    }
    scope = union(scope, rule.pageScope)  // 合并所有 pageScope 去重
  }

  // 全平台生效，或没有任何生效页面 → 返回空 Set（无限制）
  if (checkAllPages || !scope.length) {
    return new Set<string>()
  }
  return new Set(scope)
}
```

这里有一个贯穿全模块的设计细节：**空 Set 表示"无限制"，而不是"没有权限"**。这是一个重要的语义约定，后面校验时会用到。

## 第三层：Store — 权限校验的入口

权限数据在用户登录时从后端获取，存储在 Pinia 的 user store 中（`src/store/modules/user.ts`）：

```typescript
state: {
  scope: [] as ScopeEntity[]   // 登录时拉取的权限模板列表
},
getters: {
  // 合并所有模板的规则值：Map<ScopeRuleType, ScopeRuleEntity>
  scopeRuleMap: state => ScopeRuleEntity.mergeScopeRules(state.scope),
  // 合并所有模板的生效页面：Set<ScopePage>，空 Set = 无限制
  pageConfigSet: state => ScopeEntity.mergePageConfig(state.scope)
}
```

然后提供 `useScope()` hook 作为权限校验的统一入口（`src/store/permissions.ts`）：

```typescript
export function useScope() {
  const userModule = useUserModule()

  /**
   * 检查是否有数据权限
   *
   * - 全部页面配置范围（pageConfigSet 为空）：直接校验数据权限值
   * - 指定页面配置范围：需同时校验页面配置和数据权限值
   * - 未绑定规则或规则值为空时默认有权限
   */
  const hasScope = function (scope: ScopeRuleType, page: string, value: number) {
    const rule = userModule.scopeRuleMap.get(scope)

    // NOTE: 不存在规则，默认有权限
    if (!rule) {
      return true
    }

    if (!Array.isArray(rule.ruleValue)) {
      return false
    }

    // NOTE: 不存在规则值，默认有权限
    if (!rule.ruleValue.length) {
      return true
    }

    // NOTE: 全部页面配置范围：直接校验数据权限值
    if (!userModule.pageConfigSet.size) {
      return rule.ruleValue.includes(value)
    }

    // NOTE: 指定页面配置范围: 选定的页面校验，数据权限值校验，未选定的页面默认不校验，默认有权限
    if (userModule.pageConfigSet.has(page)) {
      return rule.ruleValue.includes(value)
    }

    return true
  }

  return { hasScope }
}
```

这里有三处"默认有权限"的兜底，我们称之为**白名单模式**：只有"规则存在 + 规则值存在 + 页面命中"三个条件同时满足时才真正做值校验，其余情况一律放行。

- **未绑定该规则**：这个维度根本没有配置限制，直接通过；
- **规则值不存在**：`ruleValue` 为空数组，表示全部权限，直接通过；
- **页面不在生效范围**：规则存在且有值，但当前页面没被配置进 `pageConfigSet`，说明这条规则不约束该页面，同样放行。

新功能上线时即使忘记配置权限，也不会导致功能不可用。

校验路径可以走两条：

- **Descriptor 的 `options()`** → `Dictionary` → 这里的 `hasScope`（用于渲染时过滤选项）；
- **页面代码直接调用** `useScope().hasScope()`（用于按钮显隐、字段显隐等）。

## 第四层：Views — 配置页与业务消费

### 配置页：把用户选择组装成实体

有了下面三层的支撑，配置页（`src/views/system/scope/components/scope-action-drawer.vue`）的核心工作就只剩两件：**把配置项渲染出来，把用户的选择组装成实体对象提交**。

服务端返回的 `rules` 是扁平的规则列表，而 UI 需要按"城市 / 区域 / 时间维度 / 地理位置 / 状态 / 生效范围"分组展示。这一步用 `normalizeGroup` 完成重组（`src/views/system/scope/hooks/index.ts`）：

```typescript
const normalizeGroups = computed(function () {
  if (!data.value.rules || !data.value.rules.length) return void 0
  return ScopeEntity.normalizeGroup(data.value.rules)
})

/** 高级数据过滤 分组 */
const advancedGroups = computed(function () {
  const data = Array.from(normalizeGroups.value.entries())
  return data.filter(([key]) => isAdvancedGroup(key))
})
```

模板中再按组循环渲染，每种组有不同的 UI 形态：

- 枚举型（城市 / 区域）→ CheckboxGroup（选项来自 `rule.config.value`，即第一层的 `scopeConfig`）
- 时间维度 → 勾选 + RangePicker（`ScopeRuleTimeDimensionEntity`）
- 地理位置 → 勾选 + 省市区级联选择（`ScopeRuleLocationEntity`）
- 布尔状态（会员状态 / 审核节点）→ RadioGroup

一个细节：新增权限模板时，用 `fillMissingConfig` 按 `scopeConfig` 的 key 补齐所有规则，保证提交的实体结构完整。

### 业务消费页：两行代码拿到可用选项

业务页面不关心权限怎么算，只关心"我现在能用哪些选项"：

```typescript
// 订单列表页：筛选项只显示有权限的城市
const cityOptions = cityDescriptor.options(ScopePage.OrderList)
```

选项过滤发生在渲染时，用户从头到尾"看不见"无权选项，也就不会提交无权条件。

## 串起来：一次完整的权限判断

把四层串起来看，一次权限判断的完整链路是这样的：

```text
用户登录
  └─> user store.scope = 后端返回的模板列表
  └─> scopeRuleMap  = mergeScopeRules(scope)   // 合并所有模板的规则值
  └─> pageConfigSet = mergePageConfig(scope)   // 合并所有模板的生效页面

App.vue 启动
  └─> Dictionary.install({ hasScope })          // 把 store 校验注入 Descriptor

页面渲染（如订单列表）
  └─> cityDescriptor.options(ScopePage.OrderList)
        └─> 遍历全部选项，逐个 Dictionary.hasScope('city', 'order_list', value)
              └─> useScope().hasScope(...)
                    ├─ 该规则无配置          → 通过（白名单）
                    ├─ 规则值不存在          → 通过（全部权限）
                    ├─ pageConfigSet 为空    → 值命中即通过（全部页面范围）
                    ├─ 页面命中配置范围      → 值命中即通过
                    └─ 页面不在配置范围      → 通过（该规则不约束此页面）
  └─> 下拉框只保留通过的选项（如"上海"）

用户查询
  └─> 选中的值作为查询条件提交后端 → 后端按值过滤数据
```

整个模块就是围绕这条链路设计的：**Descriptor 负责"提供选项"，Store 负责"判断权限"，Model 负责"合并模板"，Views 负责"配置与消费"**。每一层只解决一个问题。

## 一些设计思考

### 为什么用 class 而不是 Plain Object？

数据权限涉及大量数据转换和业务逻辑（合并、分组、校验），用 class 可以把这些逻辑内聚在实体上，而不是散落在各个工具函数或组件中。`ScopeRuleEntity.mergeScopeRules()`、`ScopeEntity.mergePageConfig()`、`ScopeRuleTimeDimensionEntity.dateRange` 都是典型的例子。

### 为什么用空数组语义？

`ruleValue` 为空数组、`pageConfigSet` 为空 Set，都表示"无限制"，而不是"没有权限"。这个设计来自 RESTful 的常见语义：**空集合表示没有约束，而不是没有数据**。所有值都在集合中，自然就是全部权限。

### Provider 模式的好处

`Dictionary.install()` 让 Descriptor 层不依赖具体的 Store 实现。如果需要切换权限数据来源（比如从 Pinia 换到 Vuex），只需要换一个 provider，Descriptor 的代码完全不需要改动。这也让 Descriptor 层可以被独立测试——注入一个 mock 的 provider 即可。

### 为什么选项过滤放在渲染时，而不是提交时？

如果只在提交时校验，用户先看到无权选项、提交后才被拦截，体验差且泄露了规则结构。**渲染时过滤**让无权选项从视觉上就不存在，用户既不会误选，也无从猜测。付出的代价是每次渲染都要走一遍 `hasScope`，但因为规则合并结果在 getter 里缓存、选项数量又很有限，性能完全不是问题。

### 前端的能力边界：只管选项过滤

前面几节都在讲"过滤"，但有一条边界必须先划清楚：**前端只负责过滤"有选项"的维度，范围类规则全权交给后端。**

按这个标准，规则分两类：

- **枚举型**（城市、区域、会员状态……）：候选值是一张固定的表，前端知道"全部选项有哪些"，也就能算出"当前用户能用哪些"，于是可以在渲染时把无权选项摘掉。这类规则前端参与判断。
- **范围型**（时间区间、地理位置……）：它们没有固定选项，用户填的是日期范围、省市区，前端根本无从判断"某条数据在不在这个范围内"，选项过滤也就无从谈起。这类规则只是随模板一起下发，由后端在查询时执行。

所以 `mergeScopeRules` 合并时只处理枚举型规则，范围型规则直接跳过——不是它们不重要，而是前端对它们无能为力。反过来说，筛选下拉框、单选按钮这类 UI 天生只服务于枚举型维度，正好和 Descriptor 的能力范围重合。

这条边界还有一个推论：**前端这套机制是体验优化，不是安全边界**。它保证的是"用户看不到无权选项，也就不会误提交"，但真正的数据裁剪必须落在后端查询层——否则用户绕过页面直接调接口，前端过滤就形同虚设。同理，"未配置即放行"的默认在白名单语义下是合理的：前端的职责是"把不该出现的选项藏起来"，而不是"兜住所有越权访问"，最后那道闸门始终在后端。

也正因为这条边界被写死在合并逻辑里，新增一个前端可判定的维度时，必须同时接入三处——`scopeConfig` 里的选项、Descriptor 单例、合并逻辑的白名单。**三者不同步的后果是静默失效**：配置页能配、能保存，前端却永远放行，看起来一切正常。

## 总结

这个数据权限模块从最简单的"写死几个 if-else"开始，经过几轮迭代演进到今天的分层架构。设计过程中，我们一直在平衡三个因素：

1. **灵活性**：能够覆盖城市、时间、地理位置等不同类型的规则
2. **可维护性**：每层职责清晰，新增规则类型只需要添加配置
3. **简单性**：对使用方来说，`options()` / `hasScope()` 一两个函数搞定校验

回头看，最有价值的设计决策是"配置驱动"和"Provider 模式"——它们让这个模块在面对不断变化的业务需求时，依然能够保持整洁和可扩展性。

---

> 说明：文中代码为便于理解做了通用化改写（如用"城市 / 订单列表"举例），实际项目中的规则类型与页面以 `src/descriptor/config.ts` 的真实枚举为准。

_以上就是数据权限模块的设计分享，希望对正在做类似需求的你有所帮助。_
