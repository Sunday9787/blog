---
url: /log/vue/element-form.md
---

# element-form resetFields 与 Vue $nextTick

公司之前一个管理后台做好了，拿给客户演示后，提了新的需求，url传递参数 页面自动显示 action form 表单，且 form表单内数据是传递来的参数

想了下这个需求很简单，router传递参数吗 easy,

mounted 后 把 query的参数 赋值到 form

本示例模拟 参数已经从url拿到

```vue
<template>
  <div>
    <el-button type="text" @click="dialogVisible = true">点击打开 Dialog</el-button>

    <el-dialog title="提示" v-model="dialogVisible" width="80%" @closed="closed">
      <el-form :model="form" size="small" label-width="100px" ref="form">
        <el-form-item label="审批人" prop="user">
          <el-input v-model="form.user" placeholder="审批人" />
        </el-form-item>
        <el-form-item label="活动区域" prop="region">
          <el-select v-model="form.region" placeholder="活动区域" style="width: 100%;">
            <el-option label="区域一" value="shanghai" />
            <el-option label="区域二" value="beijing" />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="dialogVisible = false">取 消</el-button>
        <el-button size="small" type="primary" @click="dialogVisible = false">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { ElDialog, ElButton, ElForm, ElInput, ElFormItem, ElOption, ElSelect } from 'element-plus'

export default defineComponent({
  components: {
    ElDialog,
    ElButton,
    ElInput,
    ElForm,
    ElFormItem,
    ElOption,
    ElSelect
  },
  data() {
    return {
      form: {
        user: '',
        region: ''
      },
      dialogVisible: false
    }
  },
  mounted() {
    if (true) {
      this.dialogVisible = true
      // 不可被重置默认值 ''
      // this.form.user = '55555'

      // 正常被 重置默认值 ''
      this.$nextTick(() => {
        this.form.user = '55555'
      })
    }
  },
  methods: {
    closed() {
      console.log(this.$refs.form)
      this.$refs.form.resetFields()
    }
  }
})
</script>
```

这样么错吧

```js
this.dialogVisible = true
this.form.user = '55555'
```

但是 关闭的时候 重置form 的时候，无法清空 值 [在线地址](https://codepen.io/SundayNine/pen/MWWaxdB)，不管你输入什么 关闭后还是 我们在 mounted 赋的新值 5555

我百思不得琪姐

忽然灵光一闪

`this.$nextTick` 没错就是它了

来理解一下 [Vue.$nextTick](https://cn.vuejs.org/v2/api/#Vue-nextTick)

> 在下次 DOM 更新循环结束之后执行延迟回调。在修改数据之后立即使用这个方法，获取更新后的 DOM

```js
// 修改数据
vm.msg = 'Hello'
// DOM 还没有更新
Vue.nextTick(function () {
  // DOM 更新了
})

// 作为一个 Promise 使用 (2.1.0 起新增，详见接下来的提示)
Vue.nextTick().then(function () {
  // DOM 更新了
})
```

为何数据修改后没有立即更新DOM?

Vue [异步更新队列](https://cn.vuejs.org/v2/guide/reactivity.html#%E5%BC%82%E6%AD%A5%E6%9B%B4%E6%96%B0%E9%98%9F%E5%88%97)

> Vue 在更新 DOM 时是异步执行的。只要侦听到数据变化，Vue 将开启一个队列，并缓冲在同一事件循环中发生的所有数据变更。
> 如果同一个 watcher 被多次触发，只会被推入到队列中一次。
> 这种在缓冲时去除重复数据对于避免不必要的计算和 DOM 操作是非常重要的。然后，在下一个的事件循环“tick”中，Vue 刷新队列并执行实际 (已去重的) 工作。

从Vue文档解释 再重新来 理解 这段代码

```javascript
this.dialogVisible = true
this.form.user = '55555'
```

先把 弹窗弹出

这个时候 Dialog 在初始化显示（此时并不能获取form），dom 没有完全更新完毕

然后 执行了 给form 赋值动作，
form这个时候并没有渲染，还未初始化（那么就相当于 form 的初始默认值是 '55555'）
全部初始化后 弹框内 form 表单默认值是 有了 '5555'，但是关闭的时候这个值并没有被清空
`this.$refs.form.resetFields()` 也执行了

这是因为 element的form `resetFields()`方法
这个方法 还原了 form 的默认值，默认值就是我们赋值的 '5555'

因为我们没有在 dom完全更新后 去赋新的值，element-form 没有初始化，我们赋新的值 '5555' 自然是 默认值

`this.$refs.form.resetFields()` 自然还原了"默认值"

小结

`this.$nextTick` 保证了数据更新后DOM完全渲染完毕后，数据，视图的正确性，要善于利用

::: playground

```vue
<template>
  <div>
    <el-button type="text" @click="dialogVisible = true">点击打开 Dialog</el-button>

    <el-dialog title="提示" v-model="dialogVisible" width="80%" @closed="closed">
      <el-form :model="form" size="small" label-width="100px" ref="form">
        <el-form-item label="审批人" prop="user">
          <el-input v-model="form.user" placeholder="审批人" />
        </el-form-item>
        <el-form-item label="活动区域" prop="region">
          <el-select v-model="form.region" placeholder="活动区域" style="width: 100%;">
            <el-option label="区域一" value="shanghai" />
            <el-option label="区域二" value="beijing" />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="dialogVisible = false">取 消</el-button>
        <el-button size="small" type="primary" @click="dialogVisible = false">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { ElDialog, ElButton, ElForm, ElInput, ElFormItem, ElOption, ElSelect } from 'element-plus'

export default defineComponent({
  components: {
    ElDialog,
    ElButton,
    ElInput,
    ElForm,
    ElFormItem,
    ElOption,
    ElSelect
  },
  data() {
    return {
      form: {
        user: '',
        region: ''
      },
      dialogVisible: false
    }
  },
  mounted() {
    if (true) {
      this.dialogVisible = true
      // 不可被重置默认值 ''
      // this.form.user = '55555'

      // 正常被 重置默认值 ''
      this.$nextTick(() => {
        this.form.user = '55555'
      })
    }
  },
  methods: {
    closed() {
      console.log(this.$refs.form)
      this.$refs.form.resetFields()
    }
  }
})
</script>

<style>
@import 'https://unpkg.com/element-plus/dist/index.css';
</style>
```

```json
{
  "imports": {
    "element-plus": "https://unpkg.com/element-plus@2.4.3/dist/index.full.mjs"
  }
}
```

:::
