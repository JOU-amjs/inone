<template>
  <slot />
</template>

<script>
import { createOne } from 'inone';

export default {
  props: {
    name: String,
  },
  created() {
    if ((this.$slots.default || []).length !== 1) {
      throw new Error('must have a root node in `One` component');
    }

    const handleEmit = evName => e => this.$emit(evName, e);
    const instance = createOne({
      name: this.name,
      el: () => this.$slots.default[0].elm,
      onForwardStart: handleEmit('forward-start),
      onForwardEnd: handleEmit('forward-end'),
      onBackwardStart: handleEmit('backward-start'),
      onBackwardEnd: handleEmit('backward-end'),
    });
    this.$emit('created', instance);
  },
};
</script>