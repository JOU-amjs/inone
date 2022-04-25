import BaseMotion from './BaseMotion';
import myAssert from '../myAssert';

export const motionManager: Record<string, BaseMotion> = {};
export default function forName<T extends BaseMotion>(name: string) {
  myAssert(typeof name === 'string', 'name must be a string');
  return motionManager[name] as T;
}