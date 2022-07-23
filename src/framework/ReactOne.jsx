import { createOne } from 'inone';
import {
  cloneElement,
  isValidElement,
  Children,
  useRef
} from 'react';

const noop = () => {};
export default function ({
  name,
  onCreated = noop,
  onForwardStart = noop,
  onForwardEnd = noop,
  onBackwardStart = noop,
  onBackwardEnd = noop,
  children,
}) {

  // 需要一个有效的子节点才通过
  try {
    Children.only(children);
    if (!isValidElement(children)) {
      throw new Error();
    }
  } catch(error) {
    throw new Error('must have a root node in `One` component');
  }
  
  const ref = useRef();
  useEffect(() => {
    const instance = createOne({
      name,
      el: () => ref.current,
      onForwardStart,
      onForwardEnd,
      onBackwardStart,
      onBackwardEnd,
    });
    onCreated(instance);
  });
  return cloneElement(children, { ref });
}
