import { IOneOptions } from '../typings';

export default class One {
  public options: IOneOptions;
  public el: IOneOptions['el'];
  public before?: IOneOptions['before'] = undefined;
  public after?: IOneOptions['before'] = undefined;

  constructor(options: IOneOptions) {
    this.options = options;
    this.el = options.el;
    this.before = options.before;
    this.after = options.after;
  }
}