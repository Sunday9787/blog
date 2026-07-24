import '@vitepress-demo-preview/component/dist/style.css'
import 'vitepress-theme-teek/index.css'
import 'virtual:group-icons.css'
import 'vitepress-plugin-legend/dist/index.css'
import './style.css'

import Teek from 'vitepress-theme-teek'
import { initComponent } from 'vitepress-plugin-legend/component'
import { AntDesignContainer } from '@vitepress-demo-preview/component'
import Playground from 'vitepress-plugin-repl/components/index.vue'
import { enhanceAppWithTabs } from 'vitepress-plugin-tabs/client'

export default {
  extends: Teek,
  enhanceApp({ app }) {
    initComponent(app)
    enhanceAppWithTabs(app)
    app.component('demo-preview', AntDesignContainer)
    app.component('VuePlayground', Playground)
  }
}
