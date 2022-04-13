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
import { createOne, TimelineMotion } from 'inone';

// 创建起始元素包装类
const beginOne = createOne({
  name: 'begin',
  el: () => document.getElementById('begin'),   // 获取元素的函数，只能用函数
});
// 创建结束元素包装类
const endOne = createOne({
  name: 'end',
  el: () => document.getElementById('end'),
});

// 创建一个TimelineMotion
let timeline = TimelineMotion.create();

// 通过调用connect方法连接两个元素，如果结尾元素在DOM树上，那么连接后会将它与起始元素合二为一
timeline.connect(beginOne, endOne);
// 也可以直接传入one对象的name连接两个元素对象
timeline.connect('begin', 'end');

// 然后调用forward方法执行从起始元素到结束元素的过渡运动
timeline.forward();

// 执行从结尾元素到起始元素的过渡运动
timeline.backward();
```
这样就创建了一个最简单的过渡运动，但我们提供了许多自定义参数给你设定，以下为常用的参数。
```javascript
const timeline = TimelineMotion.create({
  // 为创建的对象取名，然后可通过TimelineMotion.forName(name)快速获取此对象
  name: 'demoTl',

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
}).connect('begin', 'end');

timeline.forward(connectEvent => {
  // 运动结束时的回调函数...
  // connectEvent对象包含带有id的One对象
});
timeline.connect('begin', 'end').backward(connectEvent => {
  // 运动结束时的回调函数...
  // connectEvent对象包含带有id的One对象
});

// 也可以通过对象名称获取timeline对象
TimelineMotion.forName('demoTl').forward();
```

**2. 以进度值为基准的元素移动类`ProgressMotion`，可以让用户自定义控制元素运动进度，如随着窗口滚动，元素运动逐渐从0%到100%。**
> 以下为简单示例
```javascript
import { createOne, ProgressMotion } from 'inone';

// 创建起始元素包装类
const beginOne = createOne({
  // 获取元素的函数，只能用函数
  el: () => document.getElementById('begin'),
  onForwardStart: event => {
    // 执行forward过渡时的开始钩子函数
    // event包含过渡元素等数据
  },
  onForwardEnd: event => {
    // 执行forward过渡时的结束钩子函数
  },
  onBackwardStart: event => {
    // 执行backward过渡时的开始钩子函数
  },
  onBackwardEnd: event => {
    // 执行backward过渡时的结束钩子函数
  },
});
// 创建结束元素包装类
const endOne = createOne({
  el: () => document.getElementById('end'),
});

// 用ProgressMotion连接两个包装对象，并返回ProgressMotion对象
// 使用ProgressMotion连接的两个元素必须在DOM树上
const progress = ProgressMotion.create().connect(beginOne, endOne);

window.addEventListener(() => {
  const pgs = Math.min(document.documentElement.scrollTop / 2, 100);

  // 设置进度，参数为0-100的数字，可传小数，小于0或大于100，或非数字都将抛出错误
  progress.set(pgs);
});
```
对于ProgressMotion也提供了许多自定义参数。
```javascript
const timeline = ProgressMotion.create({
  // (可选)与TimelineMotion相同
  name: 'customProgressId',

  // (可选)与TimelineMotion相同
  zIndex: 100,

  // (可选)与TimelineMotion相同
  offsetLeft: 0,
  offsetTop: 0,

  // (可选)元素运动过渡参数，[0, 20]表示从进度0-20进行淡入淡出过渡
  // 如果未设置此参数，则没有过渡效果，将在进度0和100时立刻显示和隐藏两个元素
  transition: [0, 20],
}).connect(beginOne, endOne);

// 通过name获取对应的ProgressMotion对象
// 这在不同位置创建对象和调用对象实例时会很有作用
const progress = ProgressMotion.forName('customProgressId');
progress.set(20);
```

## API
### **createOne**
- 描述: 创建一个元素过渡的对象，通过配置参数指定目标元素，运动钩子函数。
- 参数: {Object} oneConfig配置对象，具体属性如下
- **el**: 
  - 描述: 以函数形式指定目标元素，该函数返回目标元素。
  - 类型: () => HTMLElement
- **name**: 
  - 描述: 为当前元素对象指定名称，指定后运动对象可直接指定名称获取到此对象。
  - 类型: string
- **onForwardStart(可选)**: 
  - 描述: 该函数在前进动画开始执行时被回调，可接收一个事件对象，它包含过渡元素对，以及当前元素。
  - 类型: (oneEvent: OneEvent) => void
- **onForwardEnd(可选)**: 
  - 描述: 该函数在前进动画结束执行时被回调，可接收一个事件对象，它包含过渡元素对，以及当前元素。
  - 类型: (oneEvent: OneEvent) => void
- **onBackwardStart(可选)**: 
  - 描述: 该函数在回退动画开始执行时被回调，可接收一个事件对象，它包含过渡元素对，以及当前元素。
  - 类型: (oneEvent: OneEvent) => void
- **onBackwardEnd(可选)**: 
  - 描述: 该函数在回退动画结束执行时被回调，可接收一个事件对象，它包含过渡元素对，以及当前元素。
  - 类型: (oneEvent: OneEvent) => void

### **[静态方法]TimelineMotion.create**
- 描述: 创建一个时间线运动对象，该对象可以连接一或多组过渡元素，并让它们执行过渡动画。
- 参数: {Object} (可选)TimelineMotion对象的options，详情如下：
- **name(可选)**
  - 描述: 当前TimelineMotion对象的名称，可通过静态函数TimelineMotion.forName并传入name获取指定的对象
  - 类型: string
- **duration(可选)**
  - 描述: (可选)过渡持续时间，单位为毫秒，默认500ms。也可以设置对象`{ forward: 3000, backward: 4000 }`，单独设置持续时间。
  - 类型: number|Object
- **timing(可选)**
  - 描述: (可选)运动曲线函数，参数与css的animation-timing-function相同
  // 详情参考：https://developer.mozilla.org/docs/Web/CSS/animation-timing-function
  - 类型: string
- **transition(可选)**
  - 描述: (可选)运动过渡参数，表现为淡入淡出，单位为毫秒，未设置此参数时没有淡入淡出效果，将在动画结束后立刻切换两个元素。
  也可以设置为`{ duration: 300, delay: 500 }`延迟500毫秒开始淡入淡出持续300毫秒。
  还可以为前进和后退单独设置持续时间，格式为`{ forward: 300, backward: 500 }`或`{ forward: { duration: 300, delay: 500 }, backward: { duration: 200, delay: 200 } }`
  - 类型: number|Object
- **zIndex(可选)**
  - 描述: 运动执行过程中过渡元素的层级，默认为0
  - 类型: number
- **offsetLeft(可选)**
  - 描述: 元素过渡的左偏移量值，只对forward阶段有效
  - 类型: number
- **offsetTop(可选)**
  - 描述: 元素过渡的顶部偏移量值，只对forward阶段有效
  - 类型: number
- 返回值: TimelineMotion对象

### **[静态方法]TimelineMotion.forName**
- 描述: 通过name查找对应的TimelineMotion对象
- 参数: 
  - {string} name
- 返回值: TimelineMotion对象，未找到时返回undefined

### **[对象方法]timeline.connect**
- 描述: 以时间线运动的方式连接两个元素过渡对象，连接后对应的元素将合并在一起，也可以多次调用此方法链接多组过渡元素，此时可以调用forward或backward函数执行一或多组元素的过渡运动。
- 参数:
  - {One|string} beginOne 起始过渡元素，即通过createOne创建的对象。
  - {One|string} endOne 结尾过渡元素。
- 返回值: 当前对象
### **[对象方法]timeline.forward**
- 描述: 执行元素前进过渡，即从第一个元素过渡到第二个元素
- 参数: 
  - {Function} 元素过渡运动完成后的钩子函数，可接收一个ConnectEvent事件对象，包含正在执行动画的指定了名称的html元素对象
### **[对象方法]timeline.backward**
- 描述: 执行元素回退过渡，即从第二个元素过渡到第一个元素
- 参数: 
  - {Function} 元素过渡运动完成后的钩子函数，可接收一个ConnectEvent事件对象，包含正在执行动画的指定了名称的html元素对象

### **[静态方法]ProgressMotion.create**
- 描述: 创建一个进度值的方式运动的描述对象，该对象可以连接一或多组过渡元素，并让它们同时执行过渡动画。
- 参数:
  - {Object} (可选)ProgressMotion对象的options参数,具体如下：
- **name(可选)**
  - 描述: 当前ProgressMotion对象的name，可通过ProgressMotion.forName函数传入name查找指定的对象
  - 类型: string
- **transition(可选)**
  - 描述: (可选)运动过渡参数，表现为淡入淡出，如[0, 20]表示从进度0-20进行淡入淡出过渡，
  如果未设置此参数，则没有过渡效果，将在进度0和100时立刻显示和隐藏两个元素。
  - 类型: [number, number]
- **zIndex(可选)**
  - 描述: 运动执行过程中过渡元素的层级，默认为0
  - 类型: number
- **offsetLeft(可选)**
  - 描述: 元素过渡的左偏移量值，只对forward阶段有效
  - 类型: number
- **offsetTop(可选)**
  - 描述: 元素过渡的顶部偏移量值，只对forward阶段有效
  - 类型: number
- 返回值: ProgressMotion对象

### **[静态方法]ProgressMotion.forName**
- 描述: 通过name查找对应的ProgressMotion对象
- 参数: 
  - {string} name
- 返回值: ProgressMotion对象，未找到时返回undefined

### **[对象方法]progress.connect**
- 描述: 以进度值的方式连接两个元素过渡对象，ProgressMotion对象可以自定义设置元素过渡的进度，元素将过渡到指定进度的位置，它一般会与频繁触发的事件如`scroll`事件、`mousemove`事件等一同使用。连接后对应的元素将合并在一起。
- 参数:
  - {One|string} beginOne 起始过渡元素，即通过createOne创建的对象。
  - {One|string} endOne 结尾过渡元素。
- 返回值: 当前对象

### **[对象方法]progress.set**
- 描述: 设置元素过渡的进度值，它一般会与频繁触发的事件如`scroll`事件、`mousemove`事件等一同使用。
- 参数: 
  - {number} 进度值，0-100的数字，可传小数点。如果小于0、大于100或其他类型值都将报错