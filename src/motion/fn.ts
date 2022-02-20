import One from '../One';
import {
  ITransitionDetail,
  TDirection
} from '../../typings';
import myAssert from '../myAssert';
import {
  createRandomCode,
  getElementOffsets,
  isStaticPosition
} from '../utils/helper';
import BaseMotion from './BaseMotion';
import CssModelMapper from '../utils/CssModelMapper';
import KeyframesModelMapper from '../utils/KeyframesModelMapper';


export const visibilityClsName = `__one_visibility_${createRandomCode()}`;
let styleNode: HTMLStyleElement;
export function initMotion<M extends BaseMotion>(
  ones: One[][],
  motionIns: M,
  motions: Record<string, M>,
  id?: string
) {
  id && (motions[id] = motionIns);
  motionIns.ones = ones;
  
  // 当元素隐藏的style node不存在时添加到head中
  if (!styleNode) {
    styleNode = document.createElement('style');
    styleNode.innerHTML = `.${visibilityClsName} {visibility: hidden !important;}`;
    document.head.appendChild(styleNode);
  }

  ones.forEach(([beginOne, endOne], i) => {
    let els = motionIns.els[i];
    if (!els) {
      els = motionIns.els[i] = {
        begin: undefined,
        end: undefined,
      };
    }
    els.begin = beginOne.el();
    const endElement = els.end = endOne.el();
    if (endElement) {
      endElement.classList.add(visibilityClsName);
    }
  });
}

/**
 * 运行动画前验证参数
 * @param param0 动画节点
 */
export function validateBeforeRun(ctx: BaseMotion) {
  const ones: any[] = ctx.ones;
  ones.forEach(([beginOne, endOne], i) => {
    myAssert(
      beginOne instanceof One && endOne instanceof One, 
      'must provide 2 transit element which object is One'
    );
    myAssert(!!beginOne.el, 'begin one must specify el function');
    const els = ctx.els;
    const beginElement = els[i].begin || beginOne.el();
    const beginElementStyle = window.getComputedStyle(beginElement);
    myAssert(
      beginElement && beginElementStyle.getPropertyValue('display') !== 'none',
      'begin element is not found or not visible'
    );
    
    myAssert(!!endOne.el, 'end one must specify el function');
    const endElement = els[i].end || endOne.el();
    const endElementStyle = window.getComputedStyle(endElement);
    myAssert(
      endElement && endElementStyle.getPropertyValue('display') !== 'none',
      'end element is not found or not visible'
    );
  });
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
 * @param gradientDetail 运动渐变参数
 * @param onEnd 运动结束的回调函数
 */
export function runAnimation(
  direction: TDirection,
  beginOne: One, 
  endOne: One, 
  beginElement: HTMLElement,
  endElement: HTMLElement,
  duration: number,
  zIndex: number,
  timing?: string,
  offsetTop = 0,
  offsetLeft = 0,
  gradientDetail?:
  ITransitionDetail,
  onEnd?: () => void
) {
  const beginOffset = getElementOffsets(beginElement);
  const endOffset = getElementOffsets(endElement);
  const diffOffsetTop = endOffset.top - beginOffset.top;
  const diffOffsetLeft = endOffset.left - beginOffset.left;
  const timesScaleEnd2BeginX = endElement.offsetWidth / beginElement.offsetWidth;
  const timesScaleEnd2BeginY = endElement.offsetHeight / beginElement.offsetHeight;
  const timesScaleBegin2EndX = beginElement.offsetWidth / endElement.offsetWidth;
  const timesScaleBegin2EndY = beginElement.offsetHeight / endElement.offsetHeight;
  
  // 调用运动前的钩子函数
  beginOne.before && beginOne.before(direction, beginElement);
  endOne.before && endOne.before(direction, endElement);

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
      timesScaleEnd2BeginX, 
      timesScaleEnd2BeginY
    ));
  const animationEndMapper = new KeyframesModelMapper(animationEndName)
    .addFrom('transform', buildStyleTransform(
      -diffOffsetLeft, 
      -diffOffsetTop, 
      timesScaleBegin2EndX, 
      timesScaleBegin2EndY
    ))
    .addTo('transform', buildStyleTransform(offsetLeft, offsetTop, 1, 1));
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
  if (gradientDetail) {
    endElement.classList.remove(visibilityClsName);
    const gradientDuration = gradientDetail.duration;
    const gradientDelay = gradientDetail.delay;
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
  styleNode.innerHTML = `${buildAnimClassCss(beginElement, beginAnimCls, beginElementAnimVal.join(','), zIndex + 1)}
  ${buildAnimClassCss(endElement, endAnimCls, endElementAnimVal.join(','), zIndex)}
  ${animationBeginMapper.toString()}
  ${animationEndMapper.toString()}
  ${animationBeginTransitionMapper.toString()}
  ${animationEndTransitionMapper.toString()}`;
  document.head.appendChild(styleNode);

  // 开始执行运动
  // 赋予动画给开始和结束元素
  beginElement.classList.add(beginAnimCls);
  endElement.classList.add(endAnimCls);

  // 处理动画完成后的事项
  setTimeout(() => {
    beginElement.classList.add(visibilityClsName);
    endElement.classList.remove(visibilityClsName);

    beginElement.classList.remove(beginAnimCls);
    endElement.classList.remove(endAnimCls);
    beginOne.after && beginOne.after(direction, beginElement);
    endOne.after && endOne.after(direction, endElement);
    
    // 执行完成后移除动画css
    styleNode.parentNode?.removeChild(styleNode);
    onEnd && onEnd();
  }, duration);
}