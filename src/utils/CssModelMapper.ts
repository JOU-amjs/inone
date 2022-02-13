import myAssert from "../myAssert";
import { addStyleRow, TStyleBody } from "./helper";

// css样式模型映射类，可构建诸如 [selector] { ...样式内容 }格式的样式内容
export default class CssModelMapper {
  private selector: string;
  private rows:  TStyleBody = {};
  constructor(selector: string) {
    this.selector = selector;
  }

  /**
   * 添加一条普通的样式行
   * @param key 样式key
   * @param val 样式内容
   * @param withPrefix 是否生成多条带不同后缀的样式行
   * @param isImportant 是否添加!important后缀
   * @returns 当前对象
   */
  public add(key: string, val: string|number, withPrefix = false, isImportant = false) {
    addStyleRow(this.rows, key, val, withPrefix, isImportant);
    return this;
  }

  /**
   * 输出css字符串
   * @returns css字符串
   */
  public toString() {
    const rows = this.rows;
    const rowKeys = Object.keys(rows);
    myAssert(rowKeys.length > 0, 'must add at least one style row');
    return `${this.selector} {${
      rowKeys
        .map(key => key + ': ' + rows[key] + ';')
        .join('')
    }}`;
  }
}