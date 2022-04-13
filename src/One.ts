import {
  OneOptions,
  OneStatus
} from '../typings';

export class One {
  public options: OneOptions;
  public el: OneOptions['el'];
  public onForwardStart?: OneOptions['onForwardStart'] = undefined;
  public onForwardEnd?: OneOptions['onForwardEnd'] = undefined;
  public onBackwardStart?: OneOptions['onBackwardStart'] = undefined;
  public onBackwardEnd?: OneOptions['onBackwardEnd'] = undefined;
  public status: OneStatus = 'begin';
  constructor(options: OneOptions) {
    this.options = options;
    this.el = options.el;
    this.onForwardStart = options.onForwardStart;
    this.onForwardEnd = options.onForwardEnd;
    this.onBackwardStart = options.onBackwardStart;
    this.onBackwardEnd = options.onBackwardEnd;
  }
}

// 统一管理One对象的缓存对象
export const oneManager = {} as Record<string, One>;
export default function createOne(options: OneOptions) {
  const instance = new One(options);
  const { name } = options;
  if (name) {
    oneManager[name] = instance;
  }
  return instance;
}