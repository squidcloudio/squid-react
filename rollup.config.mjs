import glob from 'glob';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import MagicString from 'magic-string';

import del from 'rollup-plugin-delete';
import polyfills from 'rollup-plugin-node-polyfills';
import external from 'rollup-plugin-peer-deps-external';
import typescript from 'rollup-plugin-typescript2';

import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

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
  preserveDirectives(),
];

export default [
  {
    external: ['@squidcloud/client', '@squidcloud/common'],
    input: Object.fromEntries(
      glob
        .sync('src/**/*.{tsx,ts}')
        .map((file) => [
          path.relative(
            'src',
            file.slice(0, file.length - path.extname(file).length),
          ),

          fileURLToPath(new URL(file, import.meta.url)),
        ]),
    ),
    output: [
      {
        dir: 'dist/cjs',
        format: 'cjs',
        sourcemap: true,
      },
      // {
      //   preserveModules: true,
      //   dir: 'dist',
      //   format: 'esm',
      //   sourcemap: true,
      // },
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

function preserveDirectives() {
  return {
    name: 'preserve-directives',
    // Capture directives metadata during the transform phase
    transform(code) {
      const ast = this.parse(code);

      if (ast.type === 'Program' && ast.body) {
        const directives = [];
        let i = 0;

        // Nodes in body should never be falsy, but issue #5 tells us otherwise
        // so just in case we filter them out here
        const filteredBody = ast.body.filter(Boolean);

        // .type must be defined according to the spec, but just in case..
        while (filteredBody[i]?.type === 'ExpressionStatement') {
          const node = filteredBody[i];
          if (node.directive) {
            directives.push(node.directive);
          }
          i += 1;
        }

        if (directives.length > 0) {
          return {
            code,
            ast,
            map: null,
            meta: { preserveDirectives: directives },
          };
        }
      }
      return { code, ast, map: null };
    },
    renderChunk: {
      order: 'post',
      handler(code, chunk) {
        let chunkHasDirectives = false;

        if ('modules' in chunk) {
          for (const moduleId of Object.keys(chunk.modules)) {
            const directives =
              this.getModuleInfo(moduleId)?.meta?.preserveDirectives;
            if (directives) {
              chunkHasDirectives = directives;
            }
          }

          if (chunkHasDirectives) {
            const directiveStrings = chunkHasDirectives
              .map((directive) => `'${directive}'`)
              .join(';\n');

            const s = new MagicString(code);
            s.prepend(`${directiveStrings};\n`);
            const srcMap = s.generateMap({ includeContent: true });
            return { code: s.toString(), map: srcMap };
          }
        }
        return null;
      },
    },
  };
}
