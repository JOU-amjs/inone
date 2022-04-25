import {
  ProgressMotionConnectOptions,
  Direction,
  ProgressMotionTransition,
  OneEvent
} from '../../typings';
import myAssert from '../myAssert';
import { createRandomCode, getElementOffsets, isStaticPosition, noop } from '../utils/helper';
import BaseMotion from './BaseMotion';
import {
  buildStyleTransform,
  checkConnectorBeforeRun,
  checkVisibleStyle,
  switchConnectorStatus,
  visibilityClsName,
} from './fn';
import CssModelMapper from '../utils/CssModelMapper';
import { motionManager } from './forName';


class ProgressMotion extends BaseMotion {
  private __progress = 0;
  private __beginProgressCls: string;
  private __endProgressCls: string;
  private __transition?: ProgressMotionTransition;
  private __animationStyleNode: HTMLStyleElement;
  constructor(options?: ProgressMotionConnectOptions) {
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
    
    checkVisibleStyle();
    const randomCode = createRandomCode();
    this.__beginProgressCls = '__one_progress_begin_' + randomCode;
    this.__endProgressCls = '__one_progress_end_' + randomCode;
    const animationStyleNode = this.__animationStyleNode = document.createElement('style');
    document.head.appendChild(animationStyleNode);
  }
  
  /**
   * 通过进度信息，将过渡进度设置到对应位置
   * @param p 进度值
   */
  set(p: number) {
    myAssert(typeof p === 'number' && p >= 0 && p <= 100, 'progress value must be a number which between 0 and 100');
    checkConnectorBeforeRun(this.connectors);
    this.connectors.forEach(({ beginOne, endOne }, i) => {
      const beginEl = beginOne.el();
      const endEl = endOne.el();

      // 开始节点的钩子函数
      const {
        onForwardStart: beginOneForwardStartHook = noop,
        onForwardEnd: beginOneForwardEndHook = noop,
        onBackwardStart: beginOneBackwardStartHook = noop,
        onBackwardEnd: beginOneBackwardEndHook = noop,
      } = beginOne;
    
      // 结尾节点的钩子函数
      const {
        onForwardStart: endOneForwardStartHook = noop,
        onForwardEnd: endOneForwardEndHook = noop,
        onBackwardStart: endOneBackwardStartHook = noop,
        onBackwardEnd: endOneBackwardEndHook = noop,
      } = endOne;

      // motion连接时的钩子函数
      const createOneEvent = (direction: Direction, currentEl: HTMLElement) => ({
        direction,
        beginEl,
        endEl,
        currentEl,
      } as OneEvent);

      // 当progress为0时，隐藏结束节点，并调用对应回调函数
      // 当progress为100时，隐藏开始节点，并调用对应回调函数
      // 当progress为0-100时，设置样式到当前位置，必要时调用对应回调函数
      // p<=0和p>=100时，需要通过判断控制调用次数，避免重复回调
      if (p <= 0 && this.__progress > 0) {
        beginEl.classList.remove(visibilityClsName, this.__beginProgressCls);
        endEl.classList.remove(this.__endProgressCls);
        endEl.classList.add(visibilityClsName);

        // 进度回到0时调用after(direction=backward)
        beginOneBackwardEndHook(createOneEvent('backward', beginEl));
        endOneBackwardEndHook(createOneEvent('backward', endEl));

        // backward时节点回到开始状态
        switchConnectorStatus(beginOne, endOne, 'begin');
        // 【注意】this.__progress表示上一次的进度值，会在set函数最末尾更新进度值
      } else if (p >= 100 && this.__progress < 100) {
        if (this.__progress < 100) {
          endEl.classList.remove(visibilityClsName, this.__endProgressCls);
          beginEl.classList.remove(this.__beginProgressCls);
          beginEl.classList.add(visibilityClsName);

          // 回到100时回调after(direction=forward)
          beginOneForwardEndHook(createOneEvent('forward', beginEl));
          endOneForwardEndHook(createOneEvent('forward', endEl));
          
          // forward时节点回到结束状态
          switchConnectorStatus(beginOne, endOne, 'end');
        }
      } else if (p > 0 && p < 100) {
        // 中间状态时节点为执行状态
        switchConnectorStatus(beginOne, endOne, 'running');

        const beginOffset = getElementOffsets(beginEl);
        const endOffset = getElementOffsets(endEl);
        const diffOffsetTop = endOffset.top - beginOffset.top;
        const diffOffsetLeft = endOffset.left - beginOffset.left;
        const diffTimesScaleEnd2BeginX = endEl.offsetWidth / beginEl.offsetWidth - 1;
        const diffTimesScaleEnd2BeginY = endEl.offsetHeight / beginEl.offsetHeight - 1;
        const diffTimesScaleBegin2EndX = beginEl.offsetWidth / endEl.offsetWidth - 1;
        const diffTimesScaleBegin2EndY = beginEl.offsetHeight / endEl.offsetHeight - 1;
        const percentProgress = p / 100;    // 0-1的进度
        const reverseProgress = 1 - percentProgress;  // 0-1的反进度

        // 计算透明度
        let beginOpacity: number|undefined = undefined;
        const transition = this.__transition;
        if (transition) {
          // 如果设置了运动渐变，那需要先去除隐藏类名
          const classList = beginEl.classList.contains(visibilityClsName) ? beginEl.classList : endEl.classList;
          classList.remove(visibilityClsName);

          // 分情况计算透明度
          if (percentProgress < transition[0]) {
            beginOpacity = 1;
          } else if (percentProgress > transition[1]) {
            beginOpacity = 0;
          } else {
            const diffTransitionProgress = transition[1] - transition[0];
            beginOpacity = 1 - (percentProgress - transition[0]) * (1 / diffTransitionProgress);
          }
        }

        // 进度从0开始(direction=forward)，或从100开始时(direction=backward)回调before
        if (this.__progress <= 0 || this.__progress >= 100) {
          const direction: Direction = this.__progress <= 0 ? 'forward' : 'backward';
          if (direction === 'forward') {
            beginOneForwardStartHook(createOneEvent(direction, beginEl));
            endOneForwardStartHook(createOneEvent(direction, endEl));
          } else {
            beginOneBackwardStartHook(createOneEvent(direction, beginEl));
            endOneBackwardStartHook(createOneEvent(direction, endEl));
          }

          // 正向移动(direction=forward)
          if (this.__progress <= 0) {
            beginEl.classList.remove(visibilityClsName);
            endEl.classList.add(visibilityClsName);
          } else if (this.__progress >= 100) {
            if (this.__progress <= 0) {
              beginEl.classList.add(visibilityClsName);
              endEl.classList.remove(visibilityClsName);
            }
          }
        }
        const buildProgressClassCss = (
          el: HTMLElement,
          clsName: string, 
          tx: number, 
          ty: number, 
          sx: number, 
          sy: number, 
          zIndex: number, 
          opacity?: number
        ) => {
          const cssMapper = new CssModelMapper(`.${clsName}`)
            .add('transform', buildStyleTransform(tx, ty, sx, sy))
            .add('transform-origin', 'left top')
            .add('z-index', zIndex, false, true);
          if (isStaticPosition(el)) {
            cssMapper.add('position', 'relative');
          }
          if (typeof opacity === 'number') {
            cssMapper.add('opacity', opacity, false, true);
          }
          return cssMapper.toString();
        };

        this.__animationStyleNode.innerHTML = `${buildProgressClassCss(
          beginEl,
          this.__beginProgressCls,
          (diffOffsetLeft + this.__offsetLeft) * percentProgress,
          (diffOffsetTop + this.__offsetTop) * percentProgress,
          1 + diffTimesScaleEnd2BeginX * percentProgress,
          1 + diffTimesScaleEnd2BeginY * percentProgress,
          this.__zIndex + 1,
          beginOpacity
        )}
        ${buildProgressClassCss(
          endEl,
          this.__endProgressCls,
          -diffOffsetLeft * reverseProgress,
          -diffOffsetTop * reverseProgress,
          1 + diffTimesScaleBegin2EndX * reverseProgress,
          1 + diffTimesScaleBegin2EndY * reverseProgress,
          this.__zIndex,
          beginOpacity !== undefined ? (1 - beginOpacity) : undefined
        )}`;
        
        beginEl.classList.add(this.__beginProgressCls);
        endEl.classList.add(this.__endProgressCls);
      }
      this.__progress = p;
    });
  }

  /**
   * 返回当前进度值
   * @returns 当前进度值(0-100)
   */
  get() {
    return this.__progress;
  }
}


/**
 * 创建ProgressMotion对象
 * @param options ProgressMotion连接参数
 * @returns ProgressMotion对象
 */
 export default function createProgressMotion(options?: ProgressMotionConnectOptions) {
  const inst = new ProgressMotion(options);
  const name = options?.name;
  if (name) {
    motionManager[name] = inst;
  }
  return inst;
}