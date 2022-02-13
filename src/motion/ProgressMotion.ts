import {
  IMotionConnectOptions,
  IProgressMotionConnectOptions,
  TDirection,
  TProgressMotionTransition
} from '../../typings';
import myAssert from '../myAssert';
import { createRandomCode, getElementOffsets } from '../helper';
import One from '../One';
import BaseMotion from './BaseMotion';
import {
  buildStyleTransform,
  initMotion,
  validateBeforeRun,
  visibilityClsName,
} from './fn';

let animationStyleNode: HTMLStyleElement|undefined = undefined;
export default class ProgressMotion extends BaseMotion {
  static motions: Record<string, ProgressMotion> = {};
  static id(id: string) {
    return ProgressMotion.motions[id];
  }
  static connect(begin: One, end: One, options?: IMotionConnectOptions) {
    validateBeforeRun([begin, end]);    // progress motion只允许两个存在的元素间过渡
    const motionIns = new ProgressMotion(options);
    initMotion(begin, end, motionIns, ProgressMotion.motions, options?.id);
    return motionIns;
  }

  private progress = 0;
  private __beginProgressCls: string;
  private __endProgressCls: string;
  private __transition?: TProgressMotionTransition;
  constructor(options?: IProgressMotionConnectOptions) {
    super(options);
    if (options?.transition) {
      const [startProgress, stopProgress] = options.transition;
      myAssert(
        typeof startProgress === 'number' && startProgress >= 0 && startProgress < 100,
        'start progress in \`transition\` parameter must greater or equal 0, and less than 100'
      );
      myAssert(
        typeof stopProgress === 'number' && stopProgress > 0 && stopProgress <= 100,
        'stop progress in \`transition\` parameter must greater than 0, and less or equal 100'
      );
      myAssert(
        startProgress < stopProgress,
        'start progress in \`transition\` parameter must less than stop progress'
      );
      this.__transition = [options.transition[0] / 100, options.transition[1] / 100];
    }

    const randomCode = createRandomCode();
    this.__beginProgressCls = '__one_progress_begin_' + randomCode;
    this.__endProgressCls = '__one_progress_end_' + randomCode;
  }
  
  /**
   * 通过进度信息，将过渡进度设置到对应位置
   * @param p 进度值
   */
  set(p: number) {
    validateBeforeRun(this.ones);
    myAssert(typeof p === 'number' && p >= 0 && p <= 100, 'progress value must be a number which between 0 and 100');
    if (!animationStyleNode) {
      animationStyleNode = document.createElement('style');
      document.head.appendChild(animationStyleNode);
    }
    const [beginOne, endOne] = this.ones;
    const beginElement = this.beginEl || beginOne.el();
    const endElement = this.endEl || endOne.el();

    // 当progress为0时，隐藏结束节点，并调用对应回调函数
    // 当progress为100时，隐藏开始节点，并调用对应回调函数
    // 当progress为0-100时，设置样式到当前位置，必要时调用对应回调函数
    // p<=0和p>=100时，需要通过判断控制调用次数，避免重复回调
    if (p <= 0 && this.progress > 0) {
      beginElement.classList.remove(visibilityClsName, this.__beginProgressCls);
      endElement.classList.remove(this.__endProgressCls);
      endElement.classList.add(visibilityClsName);

      // 进度回到0时调用after(direction=backward)
      beginOne.after && beginOne.after(beginElement, 'backward');
      endOne.after && endOne.after(endElement, 'backward');
      // 【注意】this.progress表示上一次的进度值，会在set函数最末尾更新进度值
    } else if (p >= 100 && this.progress < 100) {
      if (this.progress < 100) {
        endElement.classList.remove(visibilityClsName, this.__endProgressCls);
        beginElement.classList.remove(this.__beginProgressCls);
        beginElement.classList.add(visibilityClsName);

        // 或回到100时回调after(direction=forward)
        beginOne.after && beginOne.after(beginElement, 'forward');
        endOne.after && endOne.after(endElement, 'forward');
      }
    } else if (p > 0 && p < 100) {
      const beginOffset = getElementOffsets(beginElement);
      const endOffset = getElementOffsets(endElement);
      const diffOffsetTop = endOffset.top - beginOffset.top;
      const diffOffsetLeft = endOffset.left - beginOffset.left;
      const diffTimesScaleEnd2BeginX = endElement.offsetWidth / beginElement.offsetWidth - 1;
      const diffTimesScaleEnd2BeginY = endElement.offsetHeight / beginElement.offsetHeight - 1;
      const diffTimesScaleBegin2EndX = beginElement.offsetWidth / endElement.offsetWidth - 1;
      const diffTimesScaleBegin2EndY = beginElement.offsetHeight / endElement.offsetHeight - 1;
      const percentProgress = p / 100;    // 0-1的进度
      const reverseProgress = 1 - percentProgress;  // 0-1的反进度

      // 计算透明度
      let beginOpacity: number|undefined = undefined;
      const gradient = this.__transition;
      if (gradient) {
        // 如果设置了运动渐变，那需要先去除隐藏类名
        const classList = beginElement.classList.contains(visibilityClsName) ? beginElement.classList : endElement.classList;
        classList.remove(visibilityClsName);

        // 分情况计算透明度
        if (percentProgress < gradient[0]) {
          beginOpacity = 1;
        } else if (percentProgress > gradient[1]) {
          beginOpacity = 0;
        } else {
          const diffGradientProgress = gradient[1] - gradient[0];
          beginOpacity = 1 - (percentProgress - gradient[0]) * (1 / diffGradientProgress);
        }
      }

      // 进度从0开始(direction=forward)，或从100开始时(direction=backward)回调before
      if (this.progress <= 0 || this.progress >= 100) {
        const direction: TDirection = this.progress <= 0 ? 'forward' : 'backward';
        beginOne.before && beginOne.before(beginElement, direction);
        endOne.before && endOne.before(endElement, direction);

        // 正向移动(direction=forward)
        if (this.progress <= 0) {
          beginElement.classList.remove(visibilityClsName);
          endElement.classList.add(visibilityClsName);
        } else if (this.progress >= 100) {
          if (this.progress <= 0) {
            beginElement.classList.add(visibilityClsName);
            endElement.classList.remove(visibilityClsName);
          }
        }
      }
      const buildProgressClassCss = (clsName: string, tx: number, ty: number, sx: number, sy: number, zIndex: number, opacity?: number) => `.${clsName} {
          ${buildStyleTransform(tx, ty, sx, sy)}
          transform-origin: left top;
          position: relative;
          z-index: ${zIndex} !important;${typeof opacity === 'number' ? `
          opacity: ${opacity} !important;` : ''}
        }`;
      animationStyleNode.innerHTML = `${buildProgressClassCss(
        this.__beginProgressCls,
        (diffOffsetLeft + this.__offsetLeft) * percentProgress,
        (diffOffsetTop + this.__offsetTop) * percentProgress,
        1 + diffTimesScaleEnd2BeginX * percentProgress,
        1 + diffTimesScaleEnd2BeginY * percentProgress,
        this.__zIndex + 1,
        beginOpacity
      )}
      ${buildProgressClassCss(
        this.__endProgressCls,
        -diffOffsetLeft * reverseProgress,
        -diffOffsetTop * reverseProgress,
        1 + diffTimesScaleBegin2EndX * reverseProgress,
        1 + diffTimesScaleBegin2EndY * reverseProgress,
        this.__zIndex,
        beginOpacity !== undefined ? (1 - beginOpacity) : undefined
      )}`;
      
      beginElement.classList.add(this.__beginProgressCls);
      endElement.classList.add(this.__endProgressCls);
    }
    this.progress = p;
  }

  /**
   * 返回当前进度值
   * @returns 当前进度值(0-100)
   */
  get() {
    return this.progress;
  }
}