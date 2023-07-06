import del from 'rollup-plugin-delete';
import typescript from 'rollup-plugin-typescript2';
import external from 'rollup-plugin-peer-deps-external';
import polyfills from 'rollup-plugin-node-polyfills';

import terser from '@rollup/plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

import pkg from './package.json' assert { type: 'json' };

const input = 'src/index.ts';
const plugins = [
  del({ targets: 'dist/*', runOnce: true }),
  typescript(),
  external(),
  resolve(),
  commonjs(),
  polyfills(),
  json(),
  terser(),
];

export default [
  {
    external: ['@squidcloud/client', '@squidcloud/common'],
    input,
    output: [
      {
        file: pkg.main,
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: pkg.module,
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins,
  },
];
