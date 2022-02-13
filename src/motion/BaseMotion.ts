import { IMotionConnectOptions } from '../../typings';
import One from '../One';

export default abstract class BaseMotion {
  public ones: One[] = [];
  public options: IMotionConnectOptions;
  public id: string;
  public beginEl?: HTMLElement;
  public endEl?: HTMLElement;
  protected __zIndex = 0;
  protected __offsetTop = 0;
  protected __offsetLeft = 0;
  constructor(options?: IMotionConnectOptions) {
    this.options = options || {};
    this.id = options?.id || '';
    this.__zIndex = options?.zIndex || this.__zIndex;
    this.__offsetTop = options?.offsetTop || 0;
    this.__offsetLeft = options?.offsetLeft || 0;
  }
  
  add(one: One) {
    this.ones.length < 2 && this.ones.push(one);
  }
}