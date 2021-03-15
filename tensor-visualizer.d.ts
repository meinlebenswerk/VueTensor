import Vue, { PluginFunction, VueConstructor } from 'vue';

declare const TensorVisualizer: VueConstructor<Vue> & { install: PluginFunction<any>; };
export default TensorVisualizer;
