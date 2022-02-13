# [Inone](https://github.com/JOU-amjs/inone)
[![npm](https://img.shields.io/npm/v/inone)](https://www.npmjs.com/package/inone)
![size](https://img.shields.io/bundlephobia/min/inone)
![license](https://img.shields.io/badge/license-MIT-blue.svg)

一个Web元素位移过渡库，使用它你可以很方便地实现任意位置的两个元素的平滑过渡，就像它们是同一个元素一样。

### **Demo**

> **已全面支持Typescript**

### **安装**
```bash
npm install inone

# or
yarn add inone
```

### **使用方法**
```javascript
import { One, TimelineMotion, ProgressMotion } from 'inone';


const beginOne = new One({
  // 获取元素的函数，只能用函数
  el: () => document.getElementById('begin'),

  // 开始执行时被回调，第一个参数为当前元素，第二个参数为方向，值为forward或backward
  // ProgressMotion时，进度从0开始(direction=forward)，或从100开始时回调(direction=backward)
  before: (el, direction) => {},

  // 结束执行时被回调，第一个参数为当前元素，第二个参数为方向，值为forward或backward
  // ProgressMotion时，进度回到0(direction=backward)，或回到100时回调(direction=forward)
  after: (el, direction) => {},
});
const endOne = beginOne.mixin({   // mixin暂时不实现
  el: () => document.getElementById('end'),
});

// 用时间线运动对象连接两个孪生对象
const timeline = TimelineMotion.connect(beginOne, endOne, {
  id: 'first',

  // 运动曲线函数，参数与animation-timing-function相同
  timing: 'linear',

  // 运动过渡参数，运动淡入淡出效果
  // 如果未设置此参数，则没有淡入淡出效果，将在动画结束后立刻显示和隐藏两个元素
  // 直接设置为数字时，表示立即执行淡入淡出，且持续时间为该数字
  // 设置为{ duration: 300, delay: 500 }时，表示延迟500毫秒开始淡入淡出持续300毫秒
  // 也可以为前进和后退单独设置持续时间，格式为{ forward: 300, backward: 500 }
  transition: 300, 

  // 过渡持续时间，单位为毫秒，默认500ms
  // 直接设置数字时，表示正向和反向相同
  // 也可以设置对象{ forward: 3000, backward: 4000 }，单独设置持续时间
  duration: 3000,

  // 运动时结束节点的层级，默认为0
  zIndex: 100,

  // 偏移量
  // 左偏移量和顶部偏移量，只对forward阶段有效
  offsetLeft: 80,
  offsetTop: 100,
});

// 时间线的执行函数
timeline.forward();    // 正向执行
timeline.backward();   // 反向执行


TimelineMotion.id('first').forward();
TimelineMotion.id('first').backward();

// 用自定义控制的进度运动对象连接两个孪生对象
const progress = ProgressMotion.connect(beginOne, endOne, {
  id: 'second',

  // 运动时结束节点的层级，默认为0
  zIndex: 100,

  // 偏移量
  // 左偏移量和顶部偏移量
  offsetLeft: 80,
  offsetTop: 100,

  // 运动过渡参数，[0, 20]表示从进度0-20进行淡入淡出过渡
  // 如果未设置此参数，则没有过渡效果，将在进度0和100时立刻显示和隐藏两个元素
  transition: [0, 20],
});
progress.set(20);    // 改变进度，0-100的数字，可传小数点，小于0按0处理，大于100按100处理，传其他报错

ProgressMotion.id('second').set(20);
```