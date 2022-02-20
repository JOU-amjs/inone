# [Inone](https://github.com/JOU-amjs/inone)
[![npm](https://img.shields.io/npm/v/inone)](https://www.npmjs.com/package/inone)
![size](https://img.shields.io/bundlephobia/min/inone)
![license](https://img.shields.io/badge/license-MIT-blue.svg)

一个Web元素运动过渡库，使用它你可以很方便地实现任意位置的两个元素的平滑过渡，就像它们是同一个元素一样，你可以通过它在页面交互中，友好地进行用户注意力导向。

### **Demo**
使用前建议先选择性地欣赏以下示例，可以让你更好地了解这个js库。
- [Show modal with multiple card](https://codepen.io/jou-amjs/pen/wvPqzov)
- [Show modal with inner html](https://codepen.io/jou-amjs/pen/YzExZqJ)
- [Todo list](https://codepen.io/jou-amjs/pen/eYeEGWP)

> **已全面支持Typescript**

### **安装**
```bash
npm install inone

# or
yarn add inone
```

### **使用教程**
**1. 以时间线为基准的元素移动类`TimelineMotion`，可以创建在某个时间长度内让多个元素移动的过渡动画。**
```javascript
import { One, TimelineMotion } from 'inone';

// 创建起始元素包装类
const beginOne = new One({
  el: () => document.getElementById('begin'),   // 获取元素的函数，只能用函数
});
// 创建结束元素包装类
const endOne = new One({
  el: () => document.getElementById('end'),
});

// 用TimelineMotion连接两个包装对象，并返回TimelineMotion对象
// 如果结束元素在DOM树上，那么连接后会将它与起始元素合二为一
const timeline = TimelineMotion.connect([beginOne, endOne]);

// 执行从起始元素到结束元素的过渡运动
timeline.forward();

// 执行从结束元素到起始元素的过渡运动
timeline.backward();
```
这样就创建了一个最简单的过渡运动，但我们提供了许多自定义参数给你设定，以下为常用的参数。
```javascript
const timeline = TimelineMotion.connect([beginOne, endOne], {
  // (可选)TimelineMotion实例的id，可以通过此id获取该实例
  id: 'customTimelineId',

  // (可选)过渡持续时间，单位为毫秒，默认500ms
  // 参数更精细设置请查看下面的参数解释
  duration: 600,

  // (可选)运动曲线函数，参数与css的animation-timing-function相同
  // 详情参考：https://developer.mozilla.org/docs/Web/CSS/animation-timing-function
  timing: 'linear',

  // (可选)元素过渡运动参数，运动中显示为淡入淡出效果
  // 直接设置为数字时，表示立即执行淡入淡出，且持续时间为该数字
  // 参数更精细设置请查看下面的参数解释
  transition: 300,

  // (可选)运动时起始元素和结束元素的z-index值，默认为0
  zIndex: 100,

  // (可选)偏移量
  // 左偏移量和顶部偏移量，只对forward阶段有效
  offsetLeft: 0,
  offsetTop: 0,
});

// 通过此对应id获取对应的TimelineMotion对象
// 这在不同位置创建对象和调用对象实例时会很有作用
const timeline = TimelineMotion.id('customTimelineId');
timeline.forward(() => {
  // 运动结束时的回调函数...
});
timeline.backward(() => {
  // 运动结束时的回调函数...
});
```

**2. 以进度值为基准的元素移动类`ProgressMotion`，可以让用户自定义控制元素运动进度，如随着窗口滚动，元素运动逐渐从0%到100%。**
> 以下为简单示例
```javascript
import { One, ProgressMotion } from 'inone';

// 创建起始元素包装类
const beginOne = new One({
  el: () => document.getElementById('begin'),   // 获取元素的函数，只能用函数
});
// 创建结束元素包装类
const endOne = new One({
  el: () => document.getElementById('end'),
});

// 用ProgressMotion连接两个包装对象，并返回ProgressMotion对象
// 使用ProgressMotion连接的两个元素必须在DOM树上
const progress = ProgressMotion.connect([beginOne, endOne]);

window.addEventListener(() => {
  const pgs = Math.min(document.documentElement.scrollTop / 2, 100);

  // 设置进度，参数为0-100的数字，可传小数，小于0或大于100，或非数字都将抛出错误
  progress.set(pgs);
});
```
对于ProgressMotion我们也提供了许多自定义参数给你设定。
```javascript
const timeline = ProgressMotion.connect([beginOne, endOne], {
  // (可选)与TimelineMotion相同
  id: 'customProgressId',

  // (可选)与TimelineMotion相同
  zIndex: 100,

  // (可选)与TimelineMotion相同
  offsetLeft: 0,
  offsetTop: 0,

  // (可选)元素运动过渡参数，[0, 20]表示从进度0-20进行淡入淡出过渡
  // 如果未设置此参数，则没有过渡效果，将在进度0和100时立刻显示和隐藏两个元素
  transition: [0, 20],
});

// 通过此对应id获取对应的ProgressMotion对象
// 这在不同位置创建对象和调用对象实例时会很有作用
const progress = ProgressMotion.id('customProgressId');
progress.set(20);
```

## API
### **new One**
- 描述: 创建一个元素过渡的对象，通过配置参数指定目标元素，运动钩子函数。
- 参数: {Object} oneConfig配置对象，具体属性如下
- **oneConfig.el**: 
  - 描述: 以函数形式指定目标元素，该函数返回目标元素。
  - 类型: () => HTMLElement
- **oneConfig.before(可选)**: 
  - 描述: 该函数在动画开始执行时被回调，第一个参数为方向，值为forward或backward，第二个参数为当前元素对象。
  - 类型: (direction: 'forward'|'backward', el: HTMLElement) => void
- **oneConfig.after(可选)**:
  - 描述: 该函数在动画结束执行时被回调，第一个参数为方向，值为forward或backward，第二个参数为当前元素。
  - 类型: (direction: 'forward'|'backward', el: HTMLElement) => void

### **TimelineMotion.connect**
- 描述: 以时间线运动的方式连接两个元素过渡对象，连接后对应的元素将合并在一起，此时可以调用forward或backward函数执行两个元素的过渡运动。
- 参数:
  - {One[]|One[][]} 指定一组或多组元素过渡对象，如果指定了多组，它们将在调用forward或backward函数时同时执行过渡运动。
  - {Object} (可选)timelineConnectConfig配置参数
- 返回值: TimelineMotion对象

- **timelineConnectConfig.id(可选)**
  - 描述: 当前TimelineMotion对象的id，可通过TimelineMotion.id函数传入id查找指定的对象
  - 类型: string
- **timelineConnectConfig.duration(可选)**
  - 描述: (可选)过渡持续时间，单位为毫秒，默认500ms。也可以设置对象`{ forward: 3000, backward: 4000 }`，单独设置持续时间。
  - 类型: number|Object
- **timelineConnectConfig.timing(可选)**
  - 描述: (可选)运动曲线函数，参数与css的animation-timing-function相同
  // 详情参考：https://developer.mozilla.org/docs/Web/CSS/animation-timing-function
  - 类型: string
- **timelineConnectConfig.transition(可选)**
  - 描述: (可选)运动过渡参数，表现为淡入淡出，单位为毫秒，未设置此参数时没有淡入淡出效果，将在动画结束后立刻切换两个元素。
  也可以设置为`{ duration: 300, delay: 500 }`延迟500毫秒开始淡入淡出持续300毫秒。
  还可以为前进和后退单独设置持续时间，格式为`{ forward: 300, backward: 500 }`或`{ forward: { duration: 300, delay: 500 }, backward: { duration: 200, delay: 200 } }`
  - 类型: number|Object
- **timelineConnectConfig.zIndex(可选)**
  - 描述: 运动执行过程中过渡元素的层级，默认为0
  - 类型: number
- **timelineConnectConfig.offsetLeft(可选)**
  - 描述: 元素过渡的左偏移量值，只对forward阶段有效
  - 类型: number
- **timelineConnectConfig.offsetTop(可选)**
  - 描述: 元素过渡的顶部偏移量值，只对forward阶段有效
  - 类型: number

### **TimelineMotion.id**
- 描述: 通过id值查找对应的TimelineMotion对象
- 参数: 
  - {string} id值
- 返回值: TimelineMotion对象，未找到时返回undefined
### **TimelineMotion.forward**
- 描述: 执行元素前进过渡，即从第一个元素过渡到第二个元素
- 参数: 
  - {Function} 元素过渡运动完成后的钩子函数，无参数
### **TimelineMotion.backward**
- 描述: 执行元素回退过渡，即从第二个元素过渡到第一个元素
- 参数: 
  - {Function} 元素过渡运动完成后的钩子函数，无参数


### **ProgressMotion.connect**
- 描述: 以进度值的方式连接两个元素过渡对象，ProgressMotion对象可以自定义设置元素过渡的进度，元素将过渡到指定进度的位置，它一般会与频繁触发的事件一同使用如`scroll`事件、`mousemove`事件等。连接后对应的元素将合并在一起。
- 参数:
  - {One[]|One[][]} 指定一组或多组元素过渡对象，如果指定了多组，它们将在调用set函数设置进度后同时移动到对应位置。
  - {Object} (可选)progressConnectConfig配置参数
- 返回值: ProgressMotion对象

- **progressConnectConfig.id(可选)**
  - 描述: 当前ProgressMotion对象的id，可通过ProgressMotion.id函数传入id查找指定的对象
  - 类型: string
- **progressConnectConfig.transition(可选)**
  - 描述: (可选)运动过渡参数，表现为淡入淡出，如[0, 20]表示从进度0-20进行淡入淡出过渡，
  如果未设置此参数，则没有过渡效果，将在进度0和100时立刻显示和隐藏两个元素。
  - 类型: [number, number]
- **progressConnectConfig.zIndex(可选)**
  - 描述: 运动执行过程中过渡元素的层级，默认为0
  - 类型: number
- **progressConnectConfig.offsetLeft(可选)**
  - 描述: 元素过渡的左偏移量值，只对forward阶段有效
  - 类型: number
- **progressConnectConfig.offsetTop(可选)**
  - 描述: 元素过渡的顶部偏移量值，只对forward阶段有效
  - 类型: number

### **ProgressMotion.id**
- 描述: 通过id值查找对应的ProgressMotion对象
- 参数: 
  - {string} id值
- 返回值: ProgressMotion对象，未找到时返回undefined

### **ProgressMotion.set**
- 描述: 设置元素过渡的进度值，它一般会在频繁触发的事件回调中被调用。
- 参数: 
  - {number} 进度值，0-100的数字，可传小数点。如果小于0、大于100或其他类型值都将报错