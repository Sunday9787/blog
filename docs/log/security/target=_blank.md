---
title: "target='_blank'"
date: 2019-09-16 22:19:20
categories: [Web安全]
tags: [web安全]
---

不知道有没有人跟我一样 打开一个网站喜欢 `ctrl + shift + i` 😀 不过有时候会发现 a 标签 加了一些东西

```html
<a href="xxx" target="_blank" rel="nofollow noopener noreferrer">
```

<!-- more -->

先解释一下 a 标签 `rel` 属性是什么意思 [引用MDN](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/a)

> 该属性指定了目标对象到链接对象的关系。该值是空格分隔的列表类型值。

- `noreferrer` 阻止浏览器跳到另一个页面时，通过HTTP头，发送当前页面的名字或其他值，以及把当前页设为另一个页面的引用(另一个页面的referrer值 )
- `noopener` 单击链接时隐藏引用者信息 阻止打开不受信任的链接时 以确保它们不会通过 `window.opener` ([返回打开当前窗口的那个窗口的引用](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/opene)) 属性篡改原始文档
- `nofollow` 表示本文档的作者不想宣传链接的文档，例如，它是不受控的，它是一个坏的例子或如果它们有商业关系（销售环节）。nofollow主要是被一些使用人气排名技术的搜索引擎所使用

ok 为什么要用这个呢
想一下 如果你的网站内 有其他网站链接的时候，有时候 新页面白了一下就没了，原页面发现不见了 变成了其他网站。 很可能是 中了钓鱼网站
如果新打开的tab 页面没有关闭，它会持续的保持对原页面的访问权，这样一来别人就可以做很多事情

在用户点击到钓鱼链接后 **主要是由用户发布的链接** 攻击者可以通过使用 `window.opener.location` 强迫用户的前一个页面跳转到钓鱼页面，欺骗用户在钓鱼页面上登录，窃取用户口令。

```html
<html lang="en">
<body>
  <a href="http://www.b.com" target="_blank">http://www.b.com</a>
</body>
</html>
```

```html
<!-- b.com下的页面 -->
<html lang="en">
<body>
  <script type="text/javascript">
    if (opener) {
      opener.window.location.href="https://google.com";
    }
  </script>
</body>
</html>
```

有些高版本浏览器已修复这个bug 但是 为了确保安全建议所有站外链接全部添加 `nofollow noopener noreferrer`
