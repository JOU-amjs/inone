
/**
 * 获取元素离body的left、top偏移量
 * @param el 目标元素
 * @returns 该元素离body的left、top值
 */
export function getElementOffsets(el: HTMLElement) {
  let left = el.offsetLeft;
  let top = el.offsetTop;
  let parent = el.offsetParent as HTMLElement;
  while (parent !== null) {
    left += parent.offsetLeft;
    top += parent.offsetTop;
    parent = parent.offsetParent as HTMLElement;
  }
  return { left, top };
}

/**
 * 创建随机码
 * @returns 随机码
 */
export function createRandomCode() {
  const chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
  const len = 6;
  const codes: string[] = [];
  for (let i = 0; i < len; i++) {
    let randomNum = Math.floor(Math.random() * chars.length);
    codes.push(chars[randomNum]);
  }
  return codes.join('');
}

export type TStyleBody = Record<string, string|number>;
/**
 * 添加一条样式行
 * @param key 样式key
 * @param val 样式内容
 * @param withPrefix 是否生成多条带不同后缀的样式行
 * @param isImportant 是否添加!important后缀
 * @returns 当前对象
 */
export function addStyleRow(ctx: TStyleBody, key: string, val: string|number, withPrefix?: boolean, isImportant?: boolean) {
  const prefixs = ['-webkit-', '-moz-', '-o-'];
  const importantSuffix = isImportant ? ' !important' : '';
  ctx[key] = val + importantSuffix;
  if (withPrefix) {
    prefixs.forEach(prefix => {
      ctx[prefix + key] = val + importantSuffix;
    });
  }
}

/**
 * 判断一个元素position值是否为static
 * @param el 目标元素
 * @returns position是否为static值
 */
export function isStaticPosition(el: HTMLElement) {
  const elPosition = window.getComputedStyle(el).getPropertyValue('position');
  return elPosition === undefined || elPosition === null || elPosition === '' || elPosition === 'static';
}


/**
 * 空函数，做兼容处理
 */
export function noop() {}


/**
 * 解析样式值，如10px -> 10和px
 * @param styleVal 带单位的字符串
 * @returns 转换后的数值和单位
 */
export function parseStyleValue(styleVal: string) {
  const number = (styleVal.match(/^[0-9.]+/) || ['0'])[0];
  return {
    value: Number(number),
    unit: styleVal.replace(number, ''),
  };
}