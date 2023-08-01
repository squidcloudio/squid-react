import del from 'rollup-plugin-delete';
import polyfills from 'rollup-plugin-node-polyfills';
import external from 'rollup-plugin-peer-deps-external';
import typescript from 'rollup-plugin-typescript2';

import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import preserveDirectives from 'rollup-plugin-preserve-directives';

const input = 'src/index.ts';
const plugins = [
  del({ targets: 'dist/*', runOnce: true }),
  typescript(),
  external(),
  resolve(),
  commonjs(),
  polyfills(),
  json(),
  terser({
    compress: { directives: false },
  }),
  preserveDirectives({
    supressPreserveModulesWarning: true,
  }),
];

export default [
  {
    external: ['@squidcloud/client', '@squidcloud/common'],
    input,
    output: [
      {
        preserveModules: true,
        dir: 'dist/cjs',
        format: 'cjs',
        sourcemap: true,
      },
      {
        preserveModules: true,
        dir: 'dist',
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins,
    onwarn(warning, warn) {
      if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
        return;
      }
      warn(warning);
    },
  },
];
