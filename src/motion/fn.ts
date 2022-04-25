import { One } from '../One';
import {
  TransitionDetail,
  Direction,
  Connector,
  OneStatus,
  OneEvent,
} from '../../typings';
import myAssert from '../myAssert';
import {
  createRandomCode,
  getElementOffsets,
  isStaticPosition,
  noop,
  parseStyleValue
} from '../utils/helper';
import CssModelMapper from '../utils/CssModelMapper';
import KeyframesModelMapper from '../utils/KeyframesModelMapper';


export const visibilityClsName = `__one_visibility_${createRandomCode()}`;
let styleNode: HTMLStyleElement;
export function checkVisibleStyle() {
  // 当元素隐藏的style node不存在时添加到head中
  if (!styleNode) {
    styleNode = document.createElement('style');
    styleNode.innerHTML = `.${visibilityClsName} {visibility: hidden !important;}`;
    document.head.appendChild(styleNode);
  }
}

/**
 * 运行动画前验证ones参数
 * @param connectors 连接ones数组
 */
export function checkConnectorBeforeRun(connectors: Connector[]) {
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  connectors.forEach(({ beginOne, endOne }) => {
    myAssert(
      beginOne instanceof One && endOne instanceof One, 
      'must provide 2 transit element which object is One'
    );
    myAssert(!!beginOne.el, 'begin one must specify el function');
    const beginEl = beginOne.el();
    const beginElStyle = window.getComputedStyle(beginEl);
    myAssert(
      beginEl && beginElStyle.getPropertyValue('display') !== 'none',
      'begin element is not found or not visible'
    );
    
    myAssert(!!endOne.el, 'end one must specify el function');
    const endEl = endOne.el();
    const endElStyle = window.getComputedStyle(endEl);
    myAssert(
      endEl && endElStyle.getPropertyValue('display') !== 'none',
      'end element is not found or not visible'
    );
  });
}

/**
 * 检查连接one的状态
 * @param connectors 连接one的数组
 */
export function checkConnectorStatus(connectors: Connector[], direction: Direction) {
  const assertMsg = (
    name = 'unknown',
    expectStatus: OneStatus,
    currentStatus: OneStatus
  ) => `the state of One's object named \`${name}\` requires ${expectStatus} but got ${currentStatus}`;
  connectors.forEach(({ beginOne, endOne }) => {
    // 如果要检查forward，则对象的begin状态是正确的，反之是对象的end状态是正确的
    let expectStatus: OneStatus = direction === 'forward' ? 'begin' : 'end';
    const beginStatus = beginOne.status;
    const endStatus = endOne.status;
    myAssert(beginStatus === expectStatus, assertMsg(beginOne.options.name, expectStatus, beginStatus));
    myAssert(endStatus === expectStatus, assertMsg(endOne.options.name, expectStatus, endStatus));
  });
}

/**
 * 切换One对象的状态
 * @param beginOne 开始的one对象
 * @param endOne 结尾的one对象
 * @param status 状态
 */
export function switchConnectorStatus(beginOne: One, endOne: One, status: OneStatus) {
  beginOne.status = status;
  endOne.status = status;
}


// 构造transform样式
export const buildStyleTransform = (tx: number, ty: number, sx: number, sy: number) => 
  `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`;

// animation-fill-mode: both;是在淡入淡出时，为了执行前保持from内样式，完成后保持to内样式
const buildAnimClassCss = (el: HTMLElement, clsName: string, animationVal: string, zIndex: number) => {
  const cssMapper = new CssModelMapper('.' + clsName)
    .add('animation', animationVal, true)
    .add('animation-fill-mode', 'both')
    .add('transform-origin', 'left top')
    .add('z-index', zIndex, false, true);
  if (isStaticPosition(el)) {
    cssMapper.add('position', 'relative');
  }
  return cssMapper.toString();
};

/**
 * 运行过渡动画
 * @param direction 动画方向
 * @param ones 开始节点对象
 * @param endOne 结束节点对象
 * @param duration 持续时间
 * @param zIndex 节点运动时的层级
 * @param timing  运动曲线函数
 * @param offsetTop top偏移值
 * @param offsetLeft left偏移值
 * @param transitionDetail 运动渐变参数
 * @param onEnd 运动结束的回调函数
 */
export function runAnimation(
  direction: Direction,
  beginOne: One,
  endOne: One,
  beginEl: HTMLElement,
  endEl: HTMLElement,
  duration: number,
  zIndex: number,
  timing?: string,
  offsetTop = 0,
  offsetLeft = 0,
  transitionDetail?: TransitionDetail,
  animationEnd = noop
) {
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

  // 调用运动前的钩子函数
  if (direction === 'forward') {
    beginOneForwardStartHook(createOneEvent(direction, beginEl));
    endOneForwardStartHook(createOneEvent(direction, endEl));
  } else {
    beginOneBackwardStartHook(createOneEvent(direction, beginEl));
    endOneBackwardStartHook(createOneEvent(direction, endEl));
  }

  const beginOffset = getElementOffsets(beginEl);
  const endOffset = getElementOffsets(endEl);
  const diffOffsetTop = endOffset.top - beginOffset.top;
  const diffOffsetLeft = endOffset.left - beginOffset.left;
  const timesScaleXBegin2End = endEl.offsetWidth / beginEl.offsetWidth;
  const timesScaleYBegin2End = endEl.offsetHeight / beginEl.offsetHeight;
  const timesScaleXEnd2Begin = beginEl.offsetWidth / endEl.offsetWidth;
  const timesScaleYEnd2Begin = beginEl.offsetHeight / endEl.offsetHeight;
  const beginElStyles = window.getComputedStyle(beginEl);
  const endElStyles = window.getComputedStyle(endEl);
  // 起始和结束元素的圆角值
  const beginElTopLeftRadius = parseStyleValue(beginElStyles.borderTopLeftRadius);
  const beginElTopRightRadius = parseStyleValue(beginElStyles.borderTopRightRadius);
  const beginElBottomRightRadius = parseStyleValue(beginElStyles.borderBottomRightRadius);
  const beginElBottomLeftRadius = parseStyleValue(beginElStyles.borderBottomLeftRadius);
  const endElTopLeftRadius = parseStyleValue(endElStyles.borderTopLeftRadius);
  const endElTopRightRadius = parseStyleValue(endElStyles.borderTopRightRadius);
  const endElBottomRightRadius = parseStyleValue(endElStyles.borderBottomRightRadius);
  const endElBottomLeftRadius = parseStyleValue(endElStyles.borderBottomLeftRadius);

  // 判断是否需要使用radius，并除以缩放倍数返回前项
  // 如果单位不同则不使用radius值
  type ParseStyleValueReturnType = typeof parseStyleValue extends (...args: any[]) => infer R ? R : any;
  const useRadiusIfDifferent = (
    prev: ParseStyleValueReturnType,
    next: ParseStyleValueReturnType,
    prevScale = 1,
    nextScale = 1
  ) => {
    if (prev.unit !== next.unit) {
      return;
    }
    const prevValue = prev.value;
    const divisor = Math.min(prevScale, nextScale);
    return prevValue === 0 && next.value === 0 ? undefined : `${prevValue / divisor}${prev.unit}`;
  };

  // 修改对象状态为running
  switchConnectorStatus(beginOne, endOne, 'running');

  // 构造动画css内容
  const styleNode = document.createElement('style');
  const randomCode = createRandomCode();
  const animationBeginName = '__one_begin_anim_' + randomCode;
  const animationEndName = '__one_end_anim_' + randomCode;
  const animationBeginTransitionName = '__one_begin_anim_transition_' + randomCode;
  const animationEndTransitionName = '__one_end_anim_transition_' + randomCode;
  const animationBeginMapper = new KeyframesModelMapper(animationBeginName)
    .addFrom('transform', buildStyleTransform(0, 0, 1, 1))
    .addTo('transform', buildStyleTransform(
      diffOffsetLeft + offsetLeft,
      diffOffsetTop + offsetTop, 
      timesScaleXBegin2End, 
      timesScaleYBegin2End
    ))
    .addFrom('border-top-left-radius', useRadiusIfDifferent(beginElTopLeftRadius, endElTopLeftRadius))
    .addFrom('border-top-right-radius', useRadiusIfDifferent(beginElTopRightRadius, endElTopRightRadius))
    .addFrom('border-bottom-right-radius', useRadiusIfDifferent(beginElBottomRightRadius, endElBottomRightRadius))
    .addFrom('border-bottom-left-radius', useRadiusIfDifferent(beginElBottomLeftRadius, endElBottomLeftRadius))
    .addTo('border-top-left-radius', useRadiusIfDifferent(endElTopLeftRadius, beginElTopLeftRadius, timesScaleXBegin2End, timesScaleYBegin2End))
    .addTo('border-top-right-radius', useRadiusIfDifferent(endElTopRightRadius, beginElTopRightRadius, timesScaleXBegin2End, timesScaleYBegin2End))
    .addTo('border-bottom-right-radius', useRadiusIfDifferent(endElBottomRightRadius, beginElBottomRightRadius, timesScaleXBegin2End, timesScaleYBegin2End))
    .addTo('border-bottom-left-radius', useRadiusIfDifferent(endElBottomLeftRadius, beginElBottomLeftRadius, timesScaleXBegin2End, timesScaleYBegin2End));

  const animationEndMapper = new KeyframesModelMapper(animationEndName)
    .addFrom('transform', buildStyleTransform(
      -diffOffsetLeft, 
      -diffOffsetTop, 
      timesScaleXEnd2Begin, 
      timesScaleYEnd2Begin
    ))
    .addTo('transform', buildStyleTransform(offsetLeft, offsetTop, 1, 1))
    .addFrom('border-top-left-radius', useRadiusIfDifferent(beginElTopLeftRadius, endElTopLeftRadius, timesScaleXEnd2Begin, timesScaleYEnd2Begin))
    .addFrom('border-top-right-radius', useRadiusIfDifferent(beginElTopRightRadius, endElTopRightRadius, timesScaleXEnd2Begin, timesScaleYEnd2Begin))
    .addFrom('border-bottom-right-radius', useRadiusIfDifferent(beginElBottomRightRadius, endElBottomRightRadius, timesScaleXEnd2Begin, timesScaleYEnd2Begin))
    .addFrom('border-bottom-left-radius', useRadiusIfDifferent(beginElBottomLeftRadius, endElBottomLeftRadius, timesScaleXEnd2Begin, timesScaleYEnd2Begin))
    .addTo('border-top-left-radius', useRadiusIfDifferent(endElTopLeftRadius, beginElTopLeftRadius))
    .addTo('border-top-right-radius', useRadiusIfDifferent(endElTopRightRadius, beginElTopRightRadius))
    .addTo('border-bottom-right-radius', useRadiusIfDifferent(endElBottomRightRadius, beginElBottomRightRadius))
    .addTo('border-bottom-left-radius', useRadiusIfDifferent(endElBottomLeftRadius, beginElBottomLeftRadius));
  
  // 过渡动画是通过transition参数控制过渡时机的
  // 而位置和尺寸过渡动画是全程过渡的
  // 因此需要分开创建
  const animationBeginTransitionMapper = new KeyframesModelMapper(animationBeginTransitionName)
    .addFrom('opacity', 1)
    .addTo('opacity', 0);
  const animationEndTransitionMapper = new KeyframesModelMapper(animationEndTransitionName)
    .addFrom('opacity', 0)
    .addTo('opacity', 1);

  let beginElementAnimVal = [KeyframesModelMapper.buildAnimationValue(
    animationBeginName,
    duration,
    timing
  )];
  let endElementAnimVal = [KeyframesModelMapper.buildAnimationValue(
    animationEndName,
    duration,
    timing
  )];
  // 如果有渐变动画，则需要先移除endElement的visibility class才能起作用
  if (transitionDetail) {
    endEl.classList.remove(visibilityClsName);
    const gradientDuration = transitionDetail.duration;
    const gradientDelay = transitionDetail.delay;
    beginElementAnimVal.push(KeyframesModelMapper.buildAnimationValue(
      animationBeginTransitionName,
      gradientDuration,
      'ease',
      gradientDelay
    ));
    endElementAnimVal.push(KeyframesModelMapper.buildAnimationValue(
      animationEndTransitionName,
      gradientDuration,
      'ease',
      gradientDelay
    ));
  }
  const beginAnimCls = '__one_anim_begin_' + randomCode;
  const endAnimCls = '__one_anim_end_' + randomCode;
  styleNode.innerHTML = `${buildAnimClassCss(beginEl, beginAnimCls, beginElementAnimVal.join(','), zIndex + 1)}
  ${buildAnimClassCss(endEl, endAnimCls, endElementAnimVal.join(','), zIndex)}
  ${animationBeginMapper.toString()}
  ${animationEndMapper.toString()}
  ${animationBeginTransitionMapper.toString()}
  ${animationEndTransitionMapper.toString()}`;
  document.head.appendChild(styleNode);

  // 开始执行运动
  // 赋予动画给开始和结束元素
  beginEl.classList.add(beginAnimCls);
  endEl.classList.add(endAnimCls);

  // 处理动画完成后的事项
  setTimeout(() => {
    beginEl.classList.add(visibilityClsName);
    endEl.classList.remove(visibilityClsName);

    beginEl.classList.remove(beginAnimCls);
    endEl.classList.remove(endAnimCls);

    // 修改对象状态为begin或end状态
    switchConnectorStatus(beginOne, endOne, direction === 'forward' ? 'end' : 'begin');

    // 调用结束的钩子函数
    if (direction === 'forward') {
      beginOneForwardEndHook(createOneEvent(direction, beginEl));
      endOneForwardEndHook(createOneEvent(direction, endEl));
    } else {
      beginOneBackwardEndHook(createOneEvent(direction, beginEl));
      endOneBackwardEndHook(createOneEvent(direction, endEl));
    }
    
    // 执行完成后移除动画css
    // styleNode.parentNode?.removeChild(styleNode);
    animationEnd();
  }, duration);
}