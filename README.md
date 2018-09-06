# vue-gojs

> A Vue.js project

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev
```

## explain

> 1. 当前是交互式图表JavaScript库：[gojs](https://gojs.net/latest/index.html) 在vue 场景下使用的一个小demo，仅仅用学习探讨，如有谬误请多指教
> 2. 去水印方法： 可以用/static文件夹下的go.js 替换node_modules/gojs/release 中的go.js
> 3. 这个demo是使用gojs做的一个流程图组件，gojs渲染的一个个流程分支节点其实是由基础Panel面板渲染的，其它诸如Shape、TextBlock、Picture等都是一层层嵌套的，而且它们跟html 中的各种标签很像，同时gojs的这种渲染写法跟vue的render 渲染函数很相似，有兴趣的可以查阅gojs的[api文档](https://gojs.net/latest/api/index.html)
> 4. gojs中创建的面板、文字块、图片等其实是直接转换后绘制成canvas中的（审查元素可以看到，所以控制面板的样式并不能像在vue的render函数中写css样式一样控制它们的样式，它们仅有有限的几个样式可以控制：例如：字体颜色、边距、定位... 我们可以使用自定义的图片充当底板背景来让gojs的面板样式多样化，当前demo就是使用这种方式，可以结合注释来看。