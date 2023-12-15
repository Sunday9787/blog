import { defineClientConfig } from '@vuepress/client'
import Page from './layouts/page.vue'

export default defineClientConfig({
  layouts: {
    Page
  },
  enhance({ app, router, siteData }) {
  },
  setup() {}
})
