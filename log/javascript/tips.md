---
url: /log/javascript/tips.md
---

# dom-tips

时常看别人博客添加了各种效果，有些好奇 想自己实现一个，今天就来实现一个 点击 页面 弹出 一个tips块

```ts
interface TipsOptions {
  messages: string | string[]
  className?: string
}

export class Tips {
  public className?: string
  public messages: string[]
  public count = 0
  constructor(options: TipsOptions) {
    this.messages = options.messages instanceof Array ? options.messages : [options.messages]
    this.className = options.className
  }

  public render(): void {
    const self = this
    const messageLength = this.messages.length

    document.addEventListener('click', function (event: MouseEvent) {
      self.count++

      const el = this.createElement('div')
      // el.innerText = self.messages[self.count % messageLength];
      el.innerText = self.messages[Math.floor(Math.random() * messageLength)]

      if (self.className) {
        el.classList.add(self.className)
      }

      el.style.maxWidth = '60px'
      el.style.color = 'red'
      el.style.cursor = 'default'
      el.style.userSelect = 'none'
      el.style.opacity = '0'
      el.style.transitionDuration = '200ms'
      el.style.position = 'absolute'
      el.style.top = event.pageY + 'px'

      this.body.appendChild(el)

      /*
       * 水平 点击 位置居中
       * offsetWidth 必须要等元素插入dom中后才能获取到
       */
      el.style.left = event.pageX - el.offsetWidth / 2 + 'px'

      console.log(event.pageX, el.style.left, el.offsetWidth, event.pageX - el.offsetWidth / 2)

      // 等待 前面执行栈执行完毕 立即插入任务队列
      setTimeout(function () {
        el.style.opacity = '1'
        // 垂直浮动 最高 50px 距离
        el.style.transform = `translateY(${-Math.floor(Math.random() * 50)}px)`
      }, 0)

      setTimeout(() => {
        el.style.opacity = '0'
        // 过渡动画 是 200ms 故 延时200 移除dom
        setTimeout(() => {
          this.body.removeChild(el)
        }, 200)
      }, 3000)
    })
  }
}
```

效果
![效果](http://qiniu.daixiu8.cn/images/20200705172533.gif)
完工
