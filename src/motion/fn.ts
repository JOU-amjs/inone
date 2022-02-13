import One from '../One';
import {
  ITransitionDetail,
  TDirection
} from '../../typings';
import myAssert from '../myAssert';
import { createRandomCode, getElementOffsets } from '../helper';
import BaseMotion from './BaseMotion';


export const visibilityClsName = `__one_visibility_${createRandomCode()}`;
export function initMotion<M extends BaseMotion>(
  beginOne: One,
  endOne: One,
  motionIns: M, 
  motions: Record<string, M>,
  id?: string
) {
  id && (motions[id] = motionIns);
  [beginOne, endOne].forEach(one => motionIns.add(one));
  motionIns.beginEl = beginOne.el();
  const endElement = motionIns.endEl = endOne.el();

  // 当元素隐藏的style node不存在时添加到head中
  const visibilityStyleNodeId = `__one_persist_style__`;
  if (!document.getElementById(visibilityStyleNodeId)) {
    const styleNode = document.createElement('style');
    styleNode.id = visibilityStyleNodeId;
    styleNode.innerHTML = `.${visibilityClsName} {visibility: hidden !important;}`;
    document.head.appendChild(styleNode);
  }
  if (endElement) {
    endElement.classList.add(visibilityClsName);
  }
}

/**
 * 运行动画前验证参数
 * @param param0 动画节点
 */
export function validateBeforeRun([beginOne, endOne]: any[]) {
  myAssert(
    beginOne instanceof One && endOne instanceof One, 
    'must provide 2 transit element which object is One'
  );
  myAssert(
    !!beginOne.el && !!beginOne.el(), 
    'begin element is not found!'
  );
  myAssert(
    !!endOne.el && !!endOne.el(), 
    'end element is not found!'
  );
}

// 构造transform样式
export const buildStyleTransform = (tx: number, ty: number, sx: number, sy: number) => 
  `transform: translate(${tx}px, ${ty}px) scale(${sx}, ${sy});`;


const buildKeyFrameWithPrefix = (name: string, body: string) => `@keyframes ${name} ${body}
  @-webkit-keyframes ${name} ${body}`;
// animation-fill-mode: both;是在淡入淡出时，为了执行前保持from内样式，完成后保持to内样式
const buildAnimClassCss = (clsName: string, animationVal: string, zIndex: number) => `.${clsName} {
  animation: ${animationVal};
  -webikt-animation: ${animationVal};
  -o-animation: ${animationVal};
  animation-fill-mode: both;
  transform-origin: left top;
  position: relative;
  z-index: ${zIndex} !important;
}`;

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
  beginOne.before && beginOne.before(beginElement, direction);
  endOne.before && endOne.before(endElement, direction);

  // 构造动画css内容
  const styleNode = document.createElement('style');
  const randomCode = createRandomCode();
  const animationBeginName = '__one_begin_anim_' + randomCode;
  const animationEndName = '__one_end_anim_' + randomCode;
  const animationBeginFadeName = '__one_begin_anim_fade_' + randomCode;
  const animationEndFadeName = '__one_end_anim_fade_' + randomCode
  const animationBeginBody = `{
    from {${buildStyleTransform(0, 0, 1, 1)}}
    to {${buildStyleTransform(
      diffOffsetLeft + offsetLeft, 
      diffOffsetTop + offsetTop, 
      timesScaleEnd2BeginX, 
      timesScaleEnd2BeginY
    )}}
  }`;
  const animationEndBody = `{
    from {${buildStyleTransform(
      -diffOffsetLeft, 
      -diffOffsetTop, 
      timesScaleBegin2EndX, 
      timesScaleBegin2EndY
    )}}
    to {${buildStyleTransform(offsetLeft, offsetTop, 1, 1)}}
  }`
  const animationBeginFadeBody = `{
    from { opacity: 1; }
    to { opacity: 0; }
  }`;
  const animationEndFadeBody = `{
    from { opacity: 0; }
    to { opacity: 1; }
  }`;

  timing = timing || 'ease';
  const durationSeconds = duration / 1000;
  let beginElementAnimVal = `${animationBeginName} ${durationSeconds}s ${timing}`;
  let endElementAnimVal = `${animationEndName} ${durationSeconds}s ${timing}`;
  // 如果有渐变动画，则需要先移除endElement的visibility class才能起作用
  if (gradientDetail) {
    endElement.classList.remove(visibilityClsName);
    const fadeDurationSeconds = gradientDetail.duration / 1000;
    const delayMillisecond = gradientDetail.delay / 1000;
    beginElementAnimVal += `, ${animationBeginFadeName} ${fadeDurationSeconds}s ease ${delayMillisecond}s`;
    endElementAnimVal += `, ${animationEndFadeName} ${fadeDurationSeconds}s ease ${delayMillisecond}s`;
  }
  const beginAnimCls = '__one_anim_begin_' + randomCode;
  const endAnimCls = '__one_anim_end_' + randomCode;
  styleNode.innerHTML = `${buildAnimClassCss(beginAnimCls, beginElementAnimVal, zIndex + 1)}
  ${buildAnimClassCss(endAnimCls, endElementAnimVal, zIndex)}
  ${buildKeyFrameWithPrefix(animationBeginName, animationBeginBody)}
  ${buildKeyFrameWithPrefix(animationEndName, animationEndBody)}
  ${buildKeyFrameWithPrefix(animationBeginFadeName, animationBeginFadeBody)}
  ${buildKeyFrameWithPrefix(animationEndFadeName, animationEndFadeBody)}`;
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
    beginOne.after && beginOne.after(beginElement, direction);
    endOne.after && endOne.after(endElement, direction);

    // 执行完成后移除动画css
    // styleNode.parentNode?.removeChild(styleNode);
    onEnd && onEnd();
  }, duration);
}