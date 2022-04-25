export interface DetailParam<T> {
  forward?: T,
  backward?: T,
}

export type Direction = 'forward'|'backward';
export interface OneEvent {
  readonly direction: Direction,
  readonly beginEl: HTMLElement,
  readonly endEl: HTMLElement,
  readonly currentEl: HTMLElement,
}
export interface OneOptions {
  // One对象的name，可以在motion对象中调用connect时指定name获取对应的One对象
  name?: string,

  // 获取元素的函数，只能用函数
  el: () => HTMLElement,

  // TimelineMotion开始执行时被回调，第一个参数为方向，值为forward或backward，第二个参数为当前元素
  // ProgressMotion时，进度从0开始(direction=forward)，或从100开始时回调(direction=backward)
  onForwardStart?: (event: OneEvent) => void,

  // TimelineMotion结束执行时被回调，第一个参数为方向，值为forward或backward，第二个参数为当前元素
  // ProgressMotion时，进度回到0(direction=backward)，或回到100时回调(direction=forward)
  onForwardEnd?: (event: OneEvent) => void,

  onBackwardStart?: (event: OneEvent) => void,
  onBackwardEnd?: (event: OneEvent) => void,
}

export interface TransitionDetail {
  duration: number,
  delay: number,
}
// 通用的Motion连接参数
export interface MotionConnectOptions {
  // motion对象的名字，可以通过motion.forName传入name获取指定motion对象
  name?: string,

  // 运动时结束节点的层级，默认为0
  zIndex?: number,

  // 偏移量
  // 左偏移量和顶部偏移量，只对forward阶段有效
  offsetLeft?: number,
  offsetTop?: number,
}
// TimelineMotion连接参数
export interface TimelineMotionConnectOptions extends MotionConnectOptions {
  // 运动曲线函数，参数与animation-timing-function相同
  timing?: string,
  
  // 运动过渡参数，运动淡入淡出效果
  // 如果未设置此参数，则没有淡入淡出效果，将在动画结束后立刻显示和隐藏两个元素
  // 直接设置为数字时，表示立即执行淡入淡出，且持续时间为该数字
  // 设置为{ duration: 300, delay: 500 }时，表示延迟500毫秒开始淡入淡出持续300毫秒
  // 也可以为前进和后退单独设置持续时间，格式为{ forward: 300, backward: 500 }
  transition?: number|TransitionDetail|DetailParam<number|TransitionDetail>,

  // 过渡持续时间，单位为毫秒，默认500ms
  // 直接设置数字时，表示正向和反向相同
  // 也可以设置对象{ forward: 3000, backward: 4000 }，单独设置持续时间
  duration?: number|DetailParam<number>,
}
// ProgressMotion连接参数
export type ProgressMotionTransition = [number, number];
export interface ProgressMotionConnectOptions extends MotionConnectOptions {

  // 运动过渡参数，[0, 20]表示从进度0-20进行淡入淡出过渡
  // 如果未设置此参数，则没有过渡效果，将在进度0和100时立刻显示和隐藏两个元素
  transition?: ProgressMotionTransition,
}

type OneStatus = 'begin'|'end'|'running';
export class One {
  public options: OneOptions;
  public el: OneOptions['el'];
  public onForwardStart?: OneOptions['onForwardStart'];
  public onForwardEnd?: OneOptions['onForwardEnd'];
  public onBackwardStart?: OneOptions['onBackwardStart'];
  public onBackwardEnd?: OneOptions['onBackwardEnd'];
  public status: OneStatus;
  constructor(options: OneOptions);
}

// 该函数用于创建One对象
export function createOne(options?: OneOptions): One;

// 结束回调函数的事件对象
export interface ConnectEvent {
  [x: string]: HTMLElement,
  direction: any,
}
// 调用forward、backward和backwardWithLastOnes的结束回调函数
export type onEndHandler = (event: ConnectEvent) => void;
export interface Connector {
  beginOne: One,
  endOne: One,
}
declare abstract class BaseMotion {
  public connectors: Connector[];
  public options: MotionConnectOptions;
  protected __zIndex: number;
  protected __offsetTop: number;
  protected __offsetLeft: number;

  // 缓存上次执行动画时的ones对象
  protected __lastConnectors: Connector[];
  constructor(options?: MotionConnectOptions);
  public connect(beginOne: string|One, endOne: string|One);
}
export class TimelineMotion extends BaseMotion {
  public forward(onEnd?: () => void): void;
  public backward(onEnd?: () => void): void;
}
export class ProgressMotion extends BaseMotion {
  public set(v: number): void;
}

export function createTimelineMotion(options?: TimelineMotionConnectOptions): TimelineMotion;
export function createProgressMotion(options?: ProgressMotionConnectOptions): ProgressMotion;
export function forName<T extends BaseMotion>(name: string): T;
export function useLastTimelineMotion(): TimelineMotion|undefined;