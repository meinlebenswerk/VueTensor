<template>
<div class="visualizer-wrapper">
  <canvas ref="canvas"></canvas>
</div>
</template>


<script lang="ts">
import Vue from 'vue';

interface VisualizerTensor {
  shape: Array<number>;
  data: Array<number>;
}

interface VisualizerData {
  ctx2D: CanvasRenderingContext2D | null | undefined;
  contextInitialized: boolean;
  canvasCenter: { x: number; y: number };
  minSize: number | null;
  localTensor: VisualizerTensor;
}

export default /*#__PURE__*/Vue.extend({
  name: 'TensorVisualizer',
  props: {
    backgroundColor: {
      type: String,
      default: '#191919',
    },
    foregroundColor: {
      type: String,
      default: '#e3e3e3',
    },
    tensor: {
      type: Object,
      default: () => ({
        shape: [6, 1, 16],
        data: [],
      }),
    },
    indexType: {
      type: String,
      default: 'vector',
    },
    alphaFalloffConstant: {
      type: Number,
      default: 4,
    },
    fillPercentage: {
      type: Number,
      default: 80,
    },
    showBoundingBox: {
      type: Boolean,
      default: false,
    },
  },
  data(): VisualizerData {
    return {
      ctx2D: null,
      contextInitialized: false,
      canvasCenter: { x: 0, y: 0 },
      minSize: null,
      localTensor: {
        shape: [],
        data: [],
      },
    };
  },
  mounted() {
    console.log('Visualizer component mounted:', this.$refs.canvas);
    this.localTensor = this.tensor;

    // generate test-data:
    const totalSize = this.localTensor.shape.reduce((ts, e) => e * ts);
    for(let i=this.localTensor.data.length; i<totalSize; i++){
      this.localTensor.data.push(Math.random());
    }

    window.addEventListener('resize', this.setCanvasSize);

    this.initializeCanvas();
  },

  methods: {
    // setup
    setCanvasSize() {
      const canvas = this.$refs.canvas as HTMLCanvasElement | undefined;
      if (!canvas) return;
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
      this.canvasCenter = { x: width / 2, y: height / 2 };
      this.minSize = Math.min(width, height);
      this.redrawCanvas();
    },
    initializeCanvas() {
      // intialize canvas
      const canvas = this.$refs.canvas as HTMLCanvasElement | undefined;
      this.ctx2D = canvas?.getContext('2d');
      if (!this.ctx2D || !canvas) return;
      this.contextInitialized = true;
      this.setCanvasSize();
    },
    redrawCanvas() {
      const canvas = this.$refs.canvas as HTMLCanvasElement | undefined;
      if (!this.ctx2D || !canvas || !this.contextInitialized) return;
      const { width, height } = canvas;

      // Intialize Colors
      this.ctx2D.fillStyle = this.backgroundColor;
      this.ctx2D.strokeStyle = this.foregroundColor;
      this.ctx2D.setLineDash([5]);

      // blank out canvas
      this.ctx2D.fillRect(0, 0, width, height);

      this.drawTensor();
    },

    // helper functions
    drawTensor() {
      if (!this.ctx2D) return;

      // 1-3d tensors only
      if (this.localTensor.shape.length > 3) return;

      // extend shape to 3d
      const shape = new Array(3).fill(0).map((_, i) => this.localTensor.shape[i] ?? 1);
      const tensorSizeX = shape[0];
      const tensorSizeY = shape[1];
      const tensorSizeZ = shape[2];

      const maxValueLength = Math.max(...this.localTensor.data.map((e) => e.toFixed(1).length));

      // calculate the size of the drawn tensor-plane
      // based on the min-sidelength of the canvas
      const minCanvasSize = this.minSize ?? 0;
      const tensorDrawSize = (minCanvasSize / 100) * this.fillPercentage;

      const zInducedSizeOffset = (tensorSizeZ - 1) / 2;
      const maxSize = Math.max(tensorSizeY + zInducedSizeOffset, tensorSizeX + zInducedSizeOffset);
      const elementSize = Math.floor(tensorDrawSize / maxSize);

      // calculate offset of the z-planes
      const zOffset = elementSize / 2;

      const elementFontSize = (elementSize - 5) / (maxValueLength);

      if (this.showBoundingBox) {
        const tmp = this.ctx2D.strokeStyle;
        this.ctx2D.strokeStyle = '#ff0';
        this.drawCenteredRect(tensorDrawSize, this.canvasCenter);
        this.ctx2D.strokeStyle = tmp;
      }

      for (let z = tensorSizeZ - 1; z >= 0; z -= 1) {
        const center = this.isoCenterShift(z, tensorSizeZ, zOffset, this.canvasCenter);
        // const center = this.canvasCenter;
        const startX = center.x - (elementSize * tensorSizeX) / 2 + elementSize / 2;
        const startY = center.y - (elementSize * tensorSizeY) / 2 + elementSize / 2;

        // set layer alpha based on z-depth
        const alpha = Math.E ** (-this.alphaFalloffConstant * (z / tensorSizeZ)) * 0xe3 + 32;
        this.ctx2D.strokeStyle = this.addAlpha(this.foregroundColor, alpha);
        this.ctx2D.fillStyle = this.addAlpha(this.foregroundColor, alpha);

        for (let x = 0; x < tensorSizeX; x += 1) {
          for (let y = 0; y < tensorSizeY; y += 1) {
            const elementCenter = {
              x: startX + (elementSize * (x)),
              y: startY + (elementSize * (y)),
            };
            this.drawCenteredRect(elementSize, elementCenter);
            const index = (z * tensorSizeX + y) * tensorSizeY + x;

            this.ctx2D.font = `${elementFontSize / 2}px monospace`;
            let indexString = '';
            switch (this.indexType) {
              case 'vector_base0':
                indexString = `(${x}, ${y}, ${z})`;
                break;
              case 'vector':
                indexString = `(${x + 1}, ${y + 1}, ${z + 1})`;
                break;
              case 'scalar':
                indexString = index.toString();
                break;
              case 'scalar_hex':
                indexString = index.toString(16);
                break;
              default:
              case 'none':
                break;
            }

            if (this.indexType !== 'none') this.drawIndex(elementSize, elementCenter, indexString);

            this.ctx2D.font = `${elementFontSize}px monospace`;
            const value = this.localTensor.data[index].toFixed(1);
            this.drawCenteredText(elementSize, elementCenter, value);
          }
        }
      }
    },

    addAlpha(color: string, strength: number) {
      const alpha = Math.min(255, Math.floor(strength));
      return `${color}${alpha.toString(16)}`;
    },

    isoCenterShift(index: number, nSlices: number, offset: number, center: {x: number; y: number}) {
      // eslint-disable-next-line no-underscore-dangle
      const _index = index - ((nSlices - 1) / 2);
      // console.log(`Iso index: ${_index}`);
      return { x: center.x + (_index * offset), y: center.y - (_index * offset) };
    },

    drawCenteredRect(size: number, center: {x: number; y: number}) {
      const canvas = this.$refs.canvas as HTMLCanvasElement | undefined;
      if (!this.ctx2D || !canvas || !this.contextInitialized) return;

      const sh = size / 2;
      this.ctx2D.strokeRect(center.x - sh, center.y - sh, size, size);
    },

    drawCenteredText(size: number, center: {x: number; y: number}, text: string) {
      const canvas = this.$refs.canvas as HTMLCanvasElement | undefined;
      if (!this.ctx2D || !canvas || !this.contextInitialized) return;
      // this.ctx2D.strokeRect(center.x - sh, center.y - sh, size, size);
      this.ctx2D.textAlign = 'center';
      const fontsize = parseInt(this.ctx2D.font.split('px')[0], 10);
      this.ctx2D.fillText(text, center.x, center.y + fontsize / 2, size);
    },

    drawIndex(size: number, center: {x: number; y: number}, text: string) {
      const canvas = this.$refs.canvas as HTMLCanvasElement | undefined;
      if (!this.ctx2D || !canvas || !this.contextInitialized) return;

      const sh = size / 2;
      this.ctx2D.textAlign = 'start';
      const offset = (size / 20);
      this.ctx2D.fillText(text, center.x - sh + offset, center.y + sh - offset, size);
    },
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.setCanvasSize);
  },
});
</script>

<style scoped>
.visualizer-wrapper {
  width: 100%;
  height: 100%;
}

.visualizer-wrapper canvas {
  width: 100%;
  height: 100%;
}
</style>
