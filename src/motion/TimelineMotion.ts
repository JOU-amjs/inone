import {
  TransitionDetail, 
  TimelineMotionConnectOptions, 
  Direction,
  onEndHandler,
  ConnectEvent,
} from '../../typings';
import myAssert from '../myAssert';
import { noop } from '../utils/helper';
import BaseMotion from './BaseMotion';
import {
  runAnimation,  
  checkVisibleStyle,
  checkConnectorBeforeRun,
  checkConnectorStatus,
} from './fn';


const timelineMotionManager: Record<string, TimelineMotion> = {};
let lastUsedMotion: TimelineMotion|undefined = undefined;   // 用来保存上次使用的对象
export default class TimelineMotion extends BaseMotion {
  public __forwardDuration = 500;
  public __backwardDuration = 500;
  public __timing?: string;
  public __forwardTransition?: TransitionDetail;
  public __backwardTransition?: TransitionDetail;

  static create(options?: TimelineMotionConnectOptions) {
    const inst = new TimelineMotion(options);
    const name = options?.name;
    if (name) {
      timelineMotionManager[name] = inst;
    }
    return inst;
  }
  static forName(name: string) {
    myAssert(typeof name === 'string', 'name must be a string');
    return timelineMotionManager[name];
  }
  static getLastUsed = () => lastUsedMotion;

  constructor(options?: TimelineMotionConnectOptions) {
    super(options);
    if (typeof options?.duration === 'number') {
      this.__forwardDuration = options.duration;
      this.__backwardDuration = options.duration;
    } else if (typeof options?.duration === 'object') {
      const duration = options.duration;
      this.__forwardDuration = duration.forward || this.__forwardDuration;
      this.__backwardDuration = duration.backward || this.__backwardDuration;
    }
    this.__timing = options?.timing || undefined;

    const isEmpty = (arg: any) => arg === undefined || arg === null;
    // 初始化运动渐变参数
    const initTransition = (transition: any, direction: Direction) => {
      const fadeVar = `__${direction}Transition` as '__forwardTransition'|'__backwardTransition';
      if (typeof transition === 'number') {
        this[fadeVar] = {
          duration: transition,
          delay: 0,
        };
      } else if (typeof transition === 'object') {
        const forward = transition.forward;
        const backward = transition.backward;
        if (typeof transition.duration === 'number') {
          this[fadeVar] = {
            duration: transition.duration,
            delay: transition.delay || 0,
          };
        } else if (direction === 'forward' && !isEmpty(forward)) {
          initTransition(forward, direction);
        } else if (direction === 'backward' && !isEmpty(backward)) {
          initTransition(backward, direction);
        }
      }
    };
    const transition = options?.transition;
    if (!isEmpty(transition)) {
      initTransition(transition, 'forward');
      initTransition(transition, 'backward');
    }
    // 检查元素显示隐藏的样式类是否存在，如果不存在则添加上去
    checkVisibleStyle();
  }

  /**
   * 执行前进动画，即beginElement到endElement
   */
  forward(onEnd: onEndHandler = noop) {
    const { connectors } = this;
    checkConnectorBeforeRun(connectors);
    const direction = 'forward';
    checkConnectorStatus(connectors, direction);
    const connectorEvent = {
      direction,
    } as ConnectEvent;
    lastUsedMotion = this;
    connectors.forEach(({ beginOne, endOne }, i) => {
      const beginEl = beginOne.el();
      const endEl = endOne.el();
      const beginName = beginOne.options.name;
      const endName = endOne.options.name;
      if (beginName) {
        connectorEvent[beginName] = beginEl;
      }
      if (endName) {
        connectorEvent[endName] = endEl;
      }
      runAnimation(
        direction,
        beginOne,
        endOne,
        beginEl,
        endEl,
        this.__forwardDuration, 
        this.__zIndex, 
        this.__timing,
        this.__offsetTop,
        this.__offsetLeft,
        this.__forwardTransition,
        () => i === connectors.length - 1 && onEnd(connectorEvent),
      );
    });
  }

  /**
   * 执行后退动画，即endElement到beginElement
   */
  backward(onEnd: onEndHandler = noop, __useLast = false) {
    const { connectors } = this;
    checkConnectorBeforeRun(connectors);
    const direction: Direction = 'backward';
    checkConnectorStatus(connectors, direction);
    const connectorEvent = {
      direction,
    } as ConnectEvent;
    lastUsedMotion = this;
    connectors.forEach(({ beginOne, endOne }, i) => {
      const beginEl = beginOne.el();
      const endEl = endOne.el();
      const beginName = beginOne.options.name;
      const endName = endOne.options.name;
      if (beginName) {
        connectorEvent[beginName] = beginEl;
      }
      if (endName) {
        connectorEvent[endName] = endEl;
      }
      runAnimation(
        direction,
        endOne,
        beginOne,
        endEl,
        beginEl,
        this.__backwardDuration, 
        this.__zIndex, 
        this.__timing,
        0,
        0,
        this.__backwardTransition,
        () => i === connectors.length - 1 && onEnd(connectorEvent)
      );
    });
  }
}