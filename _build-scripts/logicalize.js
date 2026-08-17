/**
 * logicalize.js
 *
 * Stage 1 - rewrite unambiguous physical properties as logical ones. These are
 *           direction-agnostic, so they need no flipping at all.
 * Stage 2 - run rtlcss over what is left, which is the direction-dependent
 *           material logical properties cannot express: transforms, keyframe
 *           offsets, background-position, border-radius shorthand, shadows.
 */
const postcss = require('postcss');
const rtlcss = require('rtlcss');
const fs = require('fs');

const MAP = {
  'margin-left': 'margin-inline-start',
  'margin-right': 'margin-inline-end',
  'padding-left': 'padding-inline-start',
  'padding-right': 'padding-inline-end',
  'border-left': 'border-inline-start',
  'border-right': 'border-inline-end',
  'border-left-width': 'border-inline-start-width',
  'border-right-width': 'border-inline-end-width',
  'border-left-style': 'border-inline-start-style',
  'border-right-style': 'border-inline-end-style',
  'border-left-color': 'border-inline-start-color',
  'border-right-color': 'border-inline-end-color',
  'scroll-margin-left': 'scroll-margin-inline-start',
  'scroll-margin-right': 'scroll-margin-inline-end',
  'scroll-padding-left': 'scroll-padding-inline-start',
  'scroll-padding-right': 'scroll-padding-inline-end',
};

// `left`/`right` are only offsets when the element is positioned. Converting
// them blindly is safe here because inset-inline-* is inert on static
// elements, exactly like left/right.
const OFFSET = { left: 'inset-inline-start', right: 'inset-inline-end' };

const VALUE_MAP = {
  'text-align': { left: 'start', right: 'end' },
  'float': { left: 'inline-start', right: 'inline-end' },
  'clear': { left: 'inline-start', right: 'inline-end' },
};

const stats = {
  props: 0, offsets: 0, values: 0, skippedShorthand: 0,
};

const logicalize = () => ({
  postcssPlugin: 'logicalize',
  Declaration(decl) {
    const p = decl.prop.toLowerCase();

    if (MAP[p]) {
      // the border shorthand takes width/style/color, which the logical
      // shorthand also accepts - safe to map directly
      decl.prop = MAP[p];
      stats.props++;
      return;
    }

    if (OFFSET[p]) {
      decl.prop = OFFSET[p];
      stats.offsets++;
      return;
    }

    if (VALUE_MAP[p]) {
      const v = decl.value.trim().toLowerCase();
      const bare = v.replace(/\s*!important$/, '');
      if (VALUE_MAP[p][bare]) {
        const bang = /!important/.test(v) ? ' !important' : '';
        decl.value = VALUE_MAP[p][bare] + bang;
        stats.values++;
      }
    }
  },
});
logicalize.postcss = true;

const src = process.argv[2];
const out = process.argv[3];
const css = fs.readFileSync(src, 'utf8');

postcss([logicalize()])
  .process(css, { from: src })
  .then((r1) =>
    postcss([rtlcss({ useCalc: true })])
      .process(r1.css, { from: src })
      .then((r2) => {
        fs.writeFileSync(out, r2.css);
        const before = (css.match(/(margin|padding|border)-(left|right)|(^|[;{])(left|right):/g) || []).length;
        const after = (r2.css.match(/(margin|padding|border)-(left|right)|(^|[;{])(left|right):/g) || []).length;
        console.log(JSON.stringify({
          logical_props: stats.props,
          logical_offsets: stats.offsets,
          logical_values: stats.values,
          physical_before: before,
          physical_after: after,
          bytes_in: css.length,
          bytes_out: r2.css.length,
        }, null, 2));
      })
  )
  .catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
