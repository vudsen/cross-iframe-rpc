import typescript from '@rollup/plugin-typescript'
import { defineConfig } from 'rollup'
import dts from 'rollup-plugin-dts'
import del from 'rollup-plugin-delete'
import alias from '@rollup/plugin-alias'
import * as path from 'node:path'

export default defineConfig([
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'es',
        sourcemap: true,
      }
    ],
    plugins: [
      typescript(),
      alias({
        entries: [
          {
            find: /@\/(.*)/, replacement: './$1'
          }
        ]
      })
    ],
  },
  {
    input: 'dist/types/index.d.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'esm',
    },
    plugins: [
      alias({
        entries: [
          {
            find: /@\/(.*)/, replacement: path.resolve('./dist/types') + '/$1'
          }
        ]
      }),
      dts(),
      del({
        targets: 'dist/types',
        hook: 'buildEnd',
        verbose: true,
      }),
    ],
  }
])