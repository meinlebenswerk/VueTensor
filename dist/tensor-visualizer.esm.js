import Vue from 'vue';

var script = /*#__PURE__*/Vue.extend({
  name: 'TensorVisualizer',
  props: {
    backgroundColor: {
      type: String,
      default: '#191919'
    },
    foregroundColor: {
      type: String,
      default: '#e3e3e3'
    },
    tensor: {
      type: Object,
      default: () => ({
        shape: [6, 1, 16],
        data: []
      })
    },
    indexType: {
      type: String,
      default: 'vector'
    },
    alphaFalloffConstant: {
      type: Number,
      default: 4
    },
    showBoundingBox: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      ctx2D: null,
      contextInitialized: false,
      canvasCenter: {
        x: 0,
        y: 0
      },
      maxFit: 80,
      minSize: null,
      localTensor: {
        shape: [],
        data: []
      }
    };
  },

  mounted() {
    console.log('Visualizer component mounted:', this.$refs.canvas);
    this.localTensor = this.tensor; // generate test-data:

    const totalSize = this.localTensor.shape.reduce((ts, e) => e * ts);
    this.localTensor.data = new Array(totalSize).fill(0).map(() => Math.random());
    window.addEventListener('resize', this.setCanvasSize);
    this.initializeCanvas();
  },

  methods: {
    // setup
    setCanvasSize() {
      const canvas = this.$refs.canvas;
      if (!canvas) return;
      const {
        width,
        height
      } = canvas.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
      this.canvasCenter = {
        x: width / 2,
        y: height / 2
      };
      this.minSize = Math.min(width, height);
      this.redrawCanvas();
    },

    initializeCanvas() {
      // intialize canvas
      const canvas = this.$refs.canvas;
      this.ctx2D = canvas === null || canvas === void 0 ? void 0 : canvas.getContext('2d');
      if (!this.ctx2D || !canvas) return;
      this.contextInitialized = true;
      this.setCanvasSize();
    },

    redrawCanvas() {
      const canvas = this.$refs.canvas;
      if (!this.ctx2D || !canvas || !this.contextInitialized) return;
      const {
        width,
        height
      } = canvas; // Intialize Colors

      this.ctx2D.fillStyle = this.backgroundColor;
      this.ctx2D.strokeStyle = this.foregroundColor;
      this.ctx2D.setLineDash([5]); // blank out canvas

      this.ctx2D.fillRect(0, 0, width, height);
      this.drawTensor();
    },

    // helper functions
    drawTensor() {
      var _this$minSize;

      if (!this.ctx2D) return; // 1-3d tensors only

      if (this.localTensor.shape.length > 3) return; // extend shape to 3d

      const shape = new Array(3).fill(0).map((_, i) => {
        var _this$localTensor$sha;

        return (_this$localTensor$sha = this.localTensor.shape[i]) !== null && _this$localTensor$sha !== void 0 ? _this$localTensor$sha : 1;
      });
      const tensorSizeX = shape[0];
      const tensorSizeY = shape[1];
      const tensorSizeZ = shape[2];
      const maxValueLength = Math.max(...this.localTensor.data.map(e => e.toFixed(1).length)); // calculate the size of the drawn tensor-plane
      // based on the min-sidelength of the canvas

      const minCanvasSize = (_this$minSize = this.minSize) !== null && _this$minSize !== void 0 ? _this$minSize : 0;
      const tensorDrawSize = minCanvasSize / 100 * this.maxFit;
      const zInducedSizeOffset = (tensorSizeZ - 1) / 2;
      const maxSize = Math.max(tensorSizeY + zInducedSizeOffset, tensorSizeX + zInducedSizeOffset);
      const elementSize = Math.floor(tensorDrawSize / maxSize); // calculate offset of the z-planes

      const zOffset = elementSize / 2;
      const elementFontSize = (elementSize - 5) / maxValueLength;

      if (this.showBoundingBox) {
        const tmp = this.ctx2D.strokeStyle;
        this.ctx2D.strokeStyle = '#ff0';
        this.drawCenteredRect(tensorDrawSize, this.canvasCenter);
        this.ctx2D.strokeStyle = tmp;
      }

      for (let z = tensorSizeZ - 1; z >= 0; z -= 1) {
        const center = this.isoCenterShift(z, tensorSizeZ, zOffset, this.canvasCenter); // const center = this.canvasCenter;

        const startX = center.x - elementSize * tensorSizeX / 2 + elementSize / 2;
        const startY = center.y - elementSize * tensorSizeY / 2 + elementSize / 2; // set layer alpha based on z-depth

        const alpha = Math.E ** (-this.alphaFalloffConstant * (z / tensorSizeZ)) * 0xe3 + 32;
        this.ctx2D.strokeStyle = this.addAlpha(this.foregroundColor, alpha);
        this.ctx2D.fillStyle = this.addAlpha(this.foregroundColor, alpha);

        for (let x = 0; x < tensorSizeX; x += 1) {
          for (let y = 0; y < tensorSizeY; y += 1) {
            const elementCenter = {
              x: startX + elementSize * x,
              y: startY + elementSize * y
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

    addAlpha(color, strength) {
      const alpha = Math.min(255, Math.floor(strength));
      return `${color}${alpha.toString(16)}`;
    },

    isoCenterShift(index, nSlices, offset, center) {
      // eslint-disable-next-line no-underscore-dangle
      const _index = index - (nSlices - 1) / 2; // console.log(`Iso index: ${_index}`);


      return {
        x: center.x + _index * offset,
        y: center.y - _index * offset
      };
    },

    drawCenteredRect(size, center) {
      const canvas = this.$refs.canvas;
      if (!this.ctx2D || !canvas || !this.contextInitialized) return;
      const sh = size / 2;
      this.ctx2D.strokeRect(center.x - sh, center.y - sh, size, size);
    },

    drawCenteredText(size, center, text) {
      const canvas = this.$refs.canvas;
      if (!this.ctx2D || !canvas || !this.contextInitialized) return; // this.ctx2D.strokeRect(center.x - sh, center.y - sh, size, size);

      this.ctx2D.textAlign = 'center';
      const fontsize = parseInt(this.ctx2D.font.split('px')[0], 10);
      this.ctx2D.fillText(text, center.x, center.y + fontsize / 2, size);
    },

    drawIndex(size, center, text) {
      const canvas = this.$refs.canvas;
      if (!this.ctx2D || !canvas || !this.contextInitialized) return;
      const sh = size / 2;
      this.ctx2D.textAlign = 'start';
      const offset = size / 20;
      this.ctx2D.fillText(text, center.x - sh + offset, center.y + sh - offset, size);
    }

  },

  beforeDestroy() {
    window.removeEventListener('resize', this.setCanvasSize);
  }

});

function normalizeComponent(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier /* server only */, shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
    if (typeof shadowMode !== 'boolean') {
        createInjectorSSR = createInjector;
        createInjector = shadowMode;
        shadowMode = false;
    }
    // Vue.extend constructor export interop.
    const options = typeof script === 'function' ? script.options : script;
    // render functions
    if (template && template.render) {
        options.render = template.render;
        options.staticRenderFns = template.staticRenderFns;
        options._compiled = true;
        // functional template
        if (isFunctionalTemplate) {
            options.functional = true;
        }
    }
    // scopedId
    if (scopeId) {
        options._scopeId = scopeId;
    }
    let hook;
    if (moduleIdentifier) {
        // server build
        hook = function (context) {
            // 2.3 injection
            context =
                context || // cached call
                    (this.$vnode && this.$vnode.ssrContext) || // stateful
                    (this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext); // functional
            // 2.2 with runInNewContext: true
            if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
                context = __VUE_SSR_CONTEXT__;
            }
            // inject component styles
            if (style) {
                style.call(this, createInjectorSSR(context));
            }
            // register component module identifier for async chunk inference
            if (context && context._registeredComponents) {
                context._registeredComponents.add(moduleIdentifier);
            }
        };
        // used by ssr in case component is cached and beforeCreate
        // never gets called
        options._ssrRegister = hook;
    }
    else if (style) {
        hook = shadowMode
            ? function (context) {
                style.call(this, createInjectorShadow(context, this.$root.$options.shadowRoot));
            }
            : function (context) {
                style.call(this, createInjector(context));
            };
    }
    if (hook) {
        if (options.functional) {
            // register for functional component in vue file
            const originalRender = options.render;
            options.render = function renderWithStyleInjection(h, context) {
                hook.call(context);
                return originalRender(h, context);
            };
        }
        else {
            // inject component registration as beforeCreate hook
            const existing = options.beforeCreate;
            options.beforeCreate = existing ? [].concat(existing, hook) : [hook];
        }
    }
    return script;
}

const isOldIE = typeof navigator !== 'undefined' &&
    /msie [6-9]\\b/.test(navigator.userAgent.toLowerCase());
function createInjector(context) {
    return (id, style) => addStyle(id, style);
}
let HEAD;
const styles = {};
function addStyle(id, css) {
    const group = isOldIE ? css.media || 'default' : id;
    const style = styles[group] || (styles[group] = { ids: new Set(), styles: [] });
    if (!style.ids.has(id)) {
        style.ids.add(id);
        let code = css.source;
        if (css.map) {
            // https://developer.chrome.com/devtools/docs/javascript-debugging
            // this makes source maps inside style tags work properly in Chrome
            code += '\n/*# sourceURL=' + css.map.sources[0] + ' */';
            // http://stackoverflow.com/a/26603875
            code +=
                '\n/*# sourceMappingURL=data:application/json;base64,' +
                    btoa(unescape(encodeURIComponent(JSON.stringify(css.map)))) +
                    ' */';
        }
        if (!style.element) {
            style.element = document.createElement('style');
            style.element.type = 'text/css';
            if (css.media)
                style.element.setAttribute('media', css.media);
            if (HEAD === undefined) {
                HEAD = document.head || document.getElementsByTagName('head')[0];
            }
            HEAD.appendChild(style.element);
        }
        if ('styleSheet' in style.element) {
            style.styles.push(code);
            style.element.styleSheet.cssText = style.styles
                .filter(Boolean)
                .join('\n');
        }
        else {
            const index = style.ids.size - 1;
            const textNode = document.createTextNode(code);
            const nodes = style.element.childNodes;
            if (nodes[index])
                style.element.removeChild(nodes[index]);
            if (nodes.length)
                style.element.insertBefore(textNode, nodes[index]);
            else
                style.element.appendChild(textNode);
        }
    }
}

/* script */
const __vue_script__ = script;
/* template */

var __vue_render__ = function () {
  var _vm = this;

  var _h = _vm.$createElement;

  var _c = _vm._self._c || _h;

  return _c('div', {
    staticClass: "visualizer-wrapper"
  }, [_c('canvas', {
    ref: "canvas"
  })]);
};

var __vue_staticRenderFns__ = [];
/* style */

const __vue_inject_styles__ = function (inject) {
  if (!inject) return;
  inject("data-v-64893bde_0", {
    source: ".visualizer-wrapper[data-v-64893bde]{width:100%;height:100%}.visualizer-wrapper canvas[data-v-64893bde]{width:100%;height:100%}",
    map: undefined,
    media: undefined
  });
};
/* scoped */


const __vue_scope_id__ = "data-v-64893bde";
/* module identifier */

const __vue_module_identifier__ = undefined;
/* functional template */

const __vue_is_functional_template__ = false;
/* style inject SSR */

/* style inject shadow dom */

const __vue_component__ = /*#__PURE__*/normalizeComponent({
  render: __vue_render__,
  staticRenderFns: __vue_staticRenderFns__
}, __vue_inject_styles__, __vue_script__, __vue_scope_id__, __vue_is_functional_template__, __vue_module_identifier__, false, createInjector, undefined, undefined);

// Import vue component

// Default export is installable instance of component.
// IIFE injects install function into component, allowing component
// to be registered via Vue.use() as well as Vue.component(),
var entry_esm = /*#__PURE__*/(() => {
  // Assign InstallableComponent type
  const installable = __vue_component__; // Attach install function executed by Vue.use()

  installable.install = Vue => {
    Vue.component('TensorVisualizer', installable);
  };

  return installable;
})(); // It's possible to expose named exports when writing components that can
// also be used as directives, etc. - eg. import { RollupDemoDirective } from 'rollup-demo';
// export const RollupDemoDirective = directive;

export default entry_esm;
