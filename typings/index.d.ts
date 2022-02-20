export interface IDetailParam<T> {
  forward?: T,
  backward?: T,
}

export type TDirection = 'forward'|'backward';
export interface IOneOptions {
  // 获取元素的函数，只能用函数
  el: () => HTMLElement,

  // TimelineMotion开始执行时被回调，第一个参数为方向，值为forward或backward，第二个参数为当前元素
  // ProgressMotion时，进度从0开始(direction=forward)，或从100开始时回调(direction=backward)
  before?: (direction: TDirection, el: HTMLElement) => void,

  // TimelineMotion结束执行时被回调，第一个参数为方向，值为forward或backward，第二个参数为当前元素
  // ProgressMotion时，进度回到0(direction=backward)，或回到100时回调(direction=forward)
  after?: (direction: TDirection, el: HTMLElement) => void,
}

export interface ITransitionDetail {
  duration: number,
  delay: number,
}
// 通用的Motion连接参数
export interface IMotionConnectOptions {
  // Motion实例的id，可以通过此id获取该实例
  id?: string,

  // 运动时结束节点的层级，默认为0
  zIndex?: number,

  // 偏移量
  // 左偏移量和顶部偏移量，只对forward阶段有效
  offsetLeft?: number,
  offsetTop?: number,
}
// TimelineMotion连接参数
export interface ITimelineMotionConnectOptions extends IMotionConnectOptions {
  // 运动曲线函数，参数与animation-timing-function相同
  timing?: string,
  
  // 运动过渡参数，运动淡入淡出效果
  // 如果未设置此参数，则没有淡入淡出效果，将在动画结束后立刻显示和隐藏两个元素
  // 直接设置为数字时，表示立即执行淡入淡出，且持续时间为该数字
  // 设置为{ duration: 300, delay: 500 }时，表示延迟500毫秒开始淡入淡出持续300毫秒
  // 也可以为前进和后退单独设置持续时间，格式为{ forward: 300, backward: 500 }
  transition?: number|IGradientDetail|IDetailParam<number|IGradientDetail>,

  // 过渡持续时间，单位为毫秒，默认500ms
  // 直接设置数字时，表示正向和反向相同
  // 也可以设置对象{ forward: 3000, backward: 4000 }，单独设置持续时间
  duration?: number|IDetailParam<number>,
}
// ProgressMotion连接参数
export type TProgressMotionTransition = [number, number];
export interface IProgressMotionConnectOptions extends IMotionConnectOptions {

  // 运动过渡参数，[0, 20]表示从进度0-20进行淡入淡出过渡
  // 如果未设置此参数，则没有过渡效果，将在进度0和100时立刻显示和隐藏两个元素
  transition?: TProgressMotionTransition,
}

export class One {
  public options: IOneOptions;
  public el: IOneOptions['el'];
  public before?: IOneOptions['before'] = undefined;
  public after?: IOneOptions['before'] = undefined;
  constructor(options: IOneOptions): void;
}

abstract class BaseMotion {
  public ones: One[][] = [];
  public options: IMotionConnectOptions;
  public id: string;
  public els: Record<string, Record<'begin'|'end', HTMLElement|undefined>> = {};
  protected __zIndex = 0;
  protected __offsetTop = 0;
  protected __offsetLeft = 0;
  constructor(options?: IMotionConnectOptions): void;
}
export class TimelineMotion extends BaseMotion {
  static motions: Record<string, TimelineMotion>;
  static id(id: string): TimelineMotion|undefined;
  static connect(ones: One[]|One[][], options?: ITimelineMotionConnectOptions): TimelineMotion;
  public forward(onEnd?: () => void): void;
  public backward(onEnd?: () => void): void;
}
export class ProgressMotion extends BaseMotion {
  static motions: Record<string, ProgressMotion>;
  static id(id: string): ProgressMotion|undefined;
  static connect(ones: One[]|One[][], options?: IProgressMotionConnectOptions): ProgressMotion;
  public set(v: number): void;
}