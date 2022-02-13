import {
  ITransitionDetail, 
  ITimelineMotionConnectOptions, 
  TDirection
} from '../../typings';
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
  static connect(begin: One, end: One, options?: ITimelineMotionConnectOptions) {
    const motionIns = new TimelineMotion(options);
    initMotion(begin, end, motionIns, TimelineMotion.motions, options?.id);
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

    // 初始化运动渐变参数
    const initTransition = (transition: any, direction: TDirection) => {
      const fadeVar = `__${direction}Transition` as '__forwardTransition'|'__backwardTransition';
      if (typeof transition === 'number') {
        this[fadeVar] = {
          duration: transition,
          delay: 0,
        };
      } else if (typeof transition === 'object') {
        if (transition.duration > 0) {
          this[fadeVar] = {
            duration: transition.duration,
            delay: transition.delay || 0,
          };
        } else if (direction === 'forward' && transition.forward) {
          initTransition(transition.forward, direction);
        } else if (direction === 'backward' && transition.backward) {
          initTransition(transition.backward, direction);
        }
      }
    };
    if (options?.transition) {
      initTransition(options?.transition, 'forward');
      initTransition(options?.transition, 'backward');
    }
  }

  /**
   * 执行前进动画，即beginElement到endElement
   */
  forward(onEnd?: () => void) {
    validateBeforeRun(this.ones);
    if (this.__running) return;
    const [beginOne, endOne] = this.ones;
    this.__running = true;
    runAnimation(
      'forward', 
      beginOne, 
      endOne, 
      this.beginEl || beginOne.el(),
      this.endEl || endOne.el(),
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
  }
  /**
   * 执行后退动画，即endElement到beginElement
   */
  backward(onEnd?: () => void) {
    validateBeforeRun(this.ones);
    if (this.__running) return;
    const [beginOne, endOne] = this.ones;
    this.__running = true;
    runAnimation(
      'backward', 
      endOne, 
      beginOne, 
      this.endEl || endOne.el(),
      this.beginEl || beginOne.el(),
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
  }
}