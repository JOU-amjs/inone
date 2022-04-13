import {
  Connector,
  MotionConnectOptions
} from '../../typings';
import myAssert from '../myAssert';
import { One, oneManager } from '../One';
import { visibilityClsName } from './fn';

export default abstract class BaseMotion {
  public connectors: Connector[] = [];
  public options: MotionConnectOptions;
  public __zIndex = 0;
  public __offsetTop = 0;
  public __offsetLeft = 0;
  constructor(options?: MotionConnectOptions) {
    this.options = options || {};
    this.__zIndex = options?.zIndex || this.__zIndex;
    this.__offsetTop = options?.offsetTop || 0;
    this.__offsetLeft = options?.offsetLeft || 0;
  }

  connect(beginOne: string|One, endOne: string|One) {
    if (typeof beginOne === 'string') {
      beginOne = oneManager[beginOne];
    }
    if (typeof endOne === 'string') {
      endOne = oneManager[endOne];
    }
    const errorMsg = ` requires id of One\'s or instance of One\'s class`;
    myAssert(beginOne instanceof One, 'beginOne' + errorMsg);
    myAssert(endOne instanceof One, 'endOne' + errorMsg);
    
    // 如果endEl存在，则先隐藏它，由此实现合二为一
    const endEl = endOne.el();
    if (endEl) {
      endEl.classList.add(visibilityClsName);
    }
    this.connectors.push({
      beginOne,
      endOne,
    });
    return this;
  }
}