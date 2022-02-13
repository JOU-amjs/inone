

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