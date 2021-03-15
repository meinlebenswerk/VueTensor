<script lang="ts">
import Vue from 'vue';
import TensorVisualizer from '@/tensor-visualizer.vue';

export default Vue.extend({
  name: 'ServeDev',
  components: {
    TensorVisualizer
  }
});
</script>

<template>
  <div id="app">
    <tensor-visualizer />
  </div>
</template>

<style>
body {
  margin: 0;
  height: 100vh;
  width: 100vw;
}

#app {
  width: 100%;
  height: 100%;
}
</style>
