import {
  ITransitionDetail, 
  ITimelineMotionConnectOptions, 
  TDirection
} from '../../typings';
import myAssert from '../myAssert';
import One from '../One';
import BaseMotion from './BaseMotion';
import {
  runAnimation, 
  validateBeforeRun, 
  initMotion
} from './fn';


export default class TimelineMotion extends BaseMotion {
  static motions: Record<string, TimelineMotion> = {};
  static id(id: string) {
    return TimelineMotion.motions[id];
  }
  static connect(ones: One[]|One[][], options?: ITimelineMotionConnectOptions) {
    myAssert(Array.isArray(ones), 'must specify a array which contains `One` objects');
    const newOnes = (Array.isArray(ones[0]) ? ones : ([ones] as One[][])) as One[][];
    const motionIns = new TimelineMotion(options);
    initMotion(newOnes, motionIns, TimelineMotion.motions, options?.id);
    return motionIns;
  }

  private __forwardDuration: number = 500;
  private __backwardDuration: number = 500;
  private __timing?: string;
  private __forwardTransition?: ITransitionDetail;
  private __backwardTransition?: ITransitionDetail;
  private __running = false;
  constructor(options?: ITimelineMotionConnectOptions) {
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
    const initTransition = (transition: any, direction: TDirection) => {
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
  }

  /**
   * 执行前进动画，即beginElement到endElement
   */
  forward(onEnd?: () => void) {
    validateBeforeRun(this);
    if (this.__running) return;
    this.__running = true;
    this.ones.forEach(([beginOne, endOne], i) => {
      const beginEl = this.els[i].begin = this.els[i].begin || beginOne.el();
      const endEl = this.els[i].end = this.els[i].end || endOne.el();
      runAnimation(
        'forward',
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
        () => {
          this.__running = false;
          onEnd && onEnd();
        }
      );
    });
  }

  /**
   * 执行后退动画，即endElement到beginElement
   */
  backward(onEnd?: () => void) {
    validateBeforeRun(this);
    if (this.__running) return;
    this.__running = true;
    this.ones.forEach(([beginOne, endOne], i) => {
      const beginEl = this.els[i].begin = this.els[i].begin || beginOne.el();
      const endEl = this.els[i].end = this.els[i].end || endOne.el();
      runAnimation(
        'backward', 
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
        () => {
          this.__running = false;
          onEnd && onEnd();
        }
      );
    });
  }
}