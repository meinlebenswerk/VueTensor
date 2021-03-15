'use strict';var Vue=require('vue');function _interopDefaultLegacy(e){return e&&typeof e==='object'&&'default'in e?e:{'default':e}}var Vue__default=/*#__PURE__*/_interopDefaultLegacy(Vue);function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
}

function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
}

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) return _arrayLikeToArray(arr);
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArray(iter) {
  if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
}

function _iterableToArrayLimit(arr, i) {
  if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return;
  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

  return arr2;
}

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}var script = /*#__PURE__*/Vue__default['default'].extend({
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
      default: function _default() {
        return {
          shape: [6, 1, 16],
          data: []
        };
      }
    },
    indexType: {
      type: String,
      default: 'vector'
    },
    alphaFalloffConstant: {
      type: Number,
      default: 4
    },
    fillPercentage: {
      type: Number,
      default: 80
    },
    showBoundingBox: {
      type: Boolean,
      default: false
    }
  },
  data: function data() {
    return {
      ctx2D: null,
      contextInitialized: false,
      canvasCenter: {
        x: 0,
        y: 0
      },
      minSize: null,
      localTensor: {
        shape: [],
        data: []
      }
    };
  },
  mounted: function mounted() {
    console.log('Visualizer component mounted:', this.$refs.canvas);
    this.localTensor = this.tensor; // generate test-data:

    var totalSize = this.localTensor.shape.reduce(function (ts, e) {
      return e * ts;
    });

    for (var i = this.localTensor.data.length; i < totalSize; i++) {
      this.localTensor.data.push(Math.random());
    }

    window.addEventListener('resize', this.setCanvasSize);
    this.initializeCanvas();
  },
  methods: {
    // setup
    setCanvasSize: function setCanvasSize() {
      var canvas = this.$refs.canvas;
      if (!canvas) return;

      var _canvas$getBoundingCl = canvas.getBoundingClientRect(),
          width = _canvas$getBoundingCl.width,
          height = _canvas$getBoundingCl.height;

      canvas.width = width;
      canvas.height = height;
      this.canvasCenter = {
        x: width / 2,
        y: height / 2
      };
      this.minSize = Math.min(width, height);
      this.redrawCanvas();
    },
    initializeCanvas: function initializeCanvas() {
      // intialize canvas
      var canvas = this.$refs.canvas;
      this.ctx2D = canvas === null || canvas === void 0 ? void 0 : canvas.getContext('2d');
      if (!this.ctx2D || !canvas) return;
      this.contextInitialized = true;
      this.setCanvasSize();
    },
    redrawCanvas: function redrawCanvas() {
      var canvas = this.$refs.canvas;
      if (!this.ctx2D || !canvas || !this.contextInitialized) return;
      var width = canvas.width,
          height = canvas.height; // Intialize Colors

      this.ctx2D.fillStyle = this.backgroundColor;
      this.ctx2D.strokeStyle = this.foregroundColor;
      this.ctx2D.setLineDash([5]); // blank out canvas

      this.ctx2D.fillRect(0, 0, width, height);
      this.drawTensor();
    },
    // helper functions
    drawTensor: function drawTensor() {
      var _this = this,
          _this$minSize;

      if (!this.ctx2D) return; // 1-3d tensors only

      if (this.localTensor.shape.length > 3) return; // extend shape to 3d

      var shape = new Array(3).fill(0).map(function (_, i) {
        var _this$localTensor$sha;

        return (_this$localTensor$sha = _this.localTensor.shape[i]) !== null && _this$localTensor$sha !== void 0 ? _this$localTensor$sha : 1;
      });
      var tensorSizeX = shape[0];
      var tensorSizeY = shape[1];
      var tensorSizeZ = shape[2];
      var maxValueLength = Math.max.apply(Math, _toConsumableArray(this.localTensor.data.map(function (e) {
        return e.toFixed(1).length;
      }))); // calculate the size of the drawn tensor-plane
      // based on the min-sidelength of the canvas

      var minCanvasSize = (_this$minSize = this.minSize) !== null && _this$minSize !== void 0 ? _this$minSize : 0;
      var tensorDrawSize = minCanvasSize / 100 * this.fillPercentage;
      var zInducedSizeOffset = (tensorSizeZ - 1) / 2;
      var maxSize = Math.max(tensorSizeY + zInducedSizeOffset, tensorSizeX + zInducedSizeOffset);
      var elementSize = Math.floor(tensorDrawSize / maxSize); // calculate offset of the z-planes

      var zOffset = elementSize / 2;
      var elementFontSize = (elementSize - 5) / maxValueLength;

      if (this.showBoundingBox) {
        var tmp = this.ctx2D.strokeStyle;
        this.ctx2D.strokeStyle = '#ff0';
        this.drawCenteredRect(tensorDrawSize, this.canvasCenter);
        this.ctx2D.strokeStyle = tmp;
      }

      for (var z = tensorSizeZ - 1; z >= 0; z -= 1) {
        var center = this.isoCenterShift(z, tensorSizeZ, zOffset, this.canvasCenter); // const center = this.canvasCenter;

        var startX = center.x - elementSize * tensorSizeX / 2 + elementSize / 2;
        var startY = center.y - elementSize * tensorSizeY / 2 + elementSize / 2; // set layer alpha based on z-depth

        var alpha = Math.pow(Math.E, -this.alphaFalloffConstant * (z / tensorSizeZ)) * 0xe3 + 32;
        this.ctx2D.strokeStyle = this.addAlpha(this.foregroundColor, alpha);
        this.ctx2D.fillStyle = this.addAlpha(this.foregroundColor, alpha);

        for (var x = 0; x < tensorSizeX; x += 1) {
          for (var y = 0; y < tensorSizeY; y += 1) {
            var elementCenter = {
              x: startX + elementSize * x,
              y: startY + elementSize * y
            };
            this.drawCenteredRect(elementSize, elementCenter);
            var index = (z * tensorSizeX + y) * tensorSizeY + x;
            this.ctx2D.font = "".concat(elementFontSize / 2, "px monospace");
            var indexString = '';

            switch (this.indexType) {
              case 'vector_base0':
                indexString = "(".concat(x, ", ").concat(y, ", ").concat(z, ")");
                break;

              case 'vector':
                indexString = "(".concat(x + 1, ", ").concat(y + 1, ", ").concat(z + 1, ")");
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
            this.ctx2D.font = "".concat(elementFontSize, "px monospace");
            var value = this.localTensor.data[index].toFixed(1);
            this.drawCenteredText(elementSize, elementCenter, value);
          }
        }
      }
    },
    addAlpha: function addAlpha(color, strength) {
      var alpha = Math.min(255, Math.floor(strength));
      return "".concat(color).concat(alpha.toString(16));
    },
    isoCenterShift: function isoCenterShift(index, nSlices, offset, center) {
      // eslint-disable-next-line no-underscore-dangle
      var _index = index - (nSlices - 1) / 2; // console.log(`Iso index: ${_index}`);


      return {
        x: center.x + _index * offset,
        y: center.y - _index * offset
      };
    },
    drawCenteredRect: function drawCenteredRect(size, center) {
      var canvas = this.$refs.canvas;
      if (!this.ctx2D || !canvas || !this.contextInitialized) return;
      var sh = size / 2;
      this.ctx2D.strokeRect(center.x - sh, center.y - sh, size, size);
    },
    drawCenteredText: function drawCenteredText(size, center, text) {
      var canvas = this.$refs.canvas;
      if (!this.ctx2D || !canvas || !this.contextInitialized) return; // this.ctx2D.strokeRect(center.x - sh, center.y - sh, size, size);

      this.ctx2D.textAlign = 'center';
      var fontsize = parseInt(this.ctx2D.font.split('px')[0], 10);
      this.ctx2D.fillText(text, center.x, center.y + fontsize / 2, size);
    },
    drawIndex: function drawIndex(size, center, text) {
      var canvas = this.$refs.canvas;
      if (!this.ctx2D || !canvas || !this.contextInitialized) return;
      var sh = size / 2;
      this.ctx2D.textAlign = 'start';
      var offset = size / 20;
      this.ctx2D.fillText(text, center.x - sh + offset, center.y + sh - offset, size);
    }
  },
  beforeDestroy: function beforeDestroy() {
    window.removeEventListener('resize', this.setCanvasSize);
  }
});function normalizeComponent(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier /* server only */, shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
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
}function createInjectorSSR(context) {
    if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
        context = __VUE_SSR_CONTEXT__;
    }
    if (!context)
        return () => { };
    if (!('styles' in context)) {
        context._styles = context._styles || {};
        Object.defineProperty(context, 'styles', {
            enumerable: true,
            get: () => context._renderStyles(context._styles)
        });
        context._renderStyles = context._renderStyles || renderStyles;
    }
    return (id, style) => addStyle(id, style, context);
}
function addStyle(id, css, context) {
    const group = css.media || 'default' ;
    const style = context._styles[group] || (context._styles[group] = { ids: [], css: '' });
    if (!style.ids.includes(id)) {
        style.media = css.media;
        style.ids.push(id);
        let code = css.source;
        style.css += code + '\n';
    }
}
function renderStyles(styles) {
    let css = '';
    for (const key in styles) {
        const style = styles[key];
        css +=
            '<style data-vue-ssr-id="' +
                Array.from(style.ids).join(' ') +
                '"' +
                (style.media ? ' media="' + style.media + '"' : '') +
                '>' +
                style.css +
                '</style>';
    }
    return css;
}/* script */
var __vue_script__ = script;
/* template */

var __vue_render__ = function __vue_render__() {
  var _vm = this;

  var _h = _vm.$createElement;

  var _c = _vm._self._c || _h;

  return _c('div', {
    staticClass: "visualizer-wrapper"
  }, [_vm._ssrNode("<canvas data-v-1f11d0b2></canvas>")]);
};

var __vue_staticRenderFns__ = [];
/* style */

var __vue_inject_styles__ = function __vue_inject_styles__(inject) {
  if (!inject) return;
  inject("data-v-1f11d0b2_0", {
    source: ".visualizer-wrapper[data-v-1f11d0b2]{width:100%;height:100%}.visualizer-wrapper canvas[data-v-1f11d0b2]{width:100%;height:100%}",
    map: undefined,
    media: undefined
  });
};
/* scoped */


var __vue_scope_id__ = "data-v-1f11d0b2";
/* module identifier */

var __vue_module_identifier__ = "data-v-1f11d0b2";
/* functional template */

var __vue_is_functional_template__ = false;
/* style inject shadow dom */

var __vue_component__ = /*#__PURE__*/normalizeComponent({
  render: __vue_render__,
  staticRenderFns: __vue_staticRenderFns__
}, __vue_inject_styles__, __vue_script__, __vue_scope_id__, __vue_is_functional_template__, __vue_module_identifier__, false, undefined, createInjectorSSR, undefined);// Import vue component

// Default export is installable instance of component.
// IIFE injects install function into component, allowing component
// to be registered via Vue.use() as well as Vue.component(),
var component = /*#__PURE__*/(function () {
  // Assign InstallableComponent type
  var installable = __vue_component__; // Attach install function executed by Vue.use()

  installable.install = function (Vue) {
    Vue.component('TensorVisualizer', installable);
  };

  return installable;
})(); // It's possible to expose named exports when writing components that can
// also be used as directives, etc. - eg. import { RollupDemoDirective } from 'rollup-demo';
// export const RollupDemoDirective = directive;
var namedExports=/*#__PURE__*/Object.freeze({__proto__:null,'default': component});// only expose one global var, with named exports exposed as properties of
// that global var (eg. plugin.namedExport)

Object.entries(namedExports).forEach(function (_ref) {
  var _ref2 = _slicedToArray(_ref, 2),
      exportName = _ref2[0],
      exported = _ref2[1];

  if (exportName !== 'default') component[exportName] = exported;
});module.exports=component;