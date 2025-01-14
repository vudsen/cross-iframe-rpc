import typescript from '@rollup/plugin-typescript'
import { defineConfig } from 'rollup'
import dts from 'rollup-plugin-dts'
import del from 'rollup-plugin-delete'
import aliasPlugin from '@rollup/plugin-alias'

const alias = aliasPlugin({
  entries: [
    {
      find: /@\/(.*)/, replacement: './$1'
    }
  ]
})
export default defineConfig([
  {
    input: ['src/index.ts'],
    output: {
      dir: 'dist',
      format: 'es',
    },
    plugins: [
      typescript(),
      alias
    ],
  },
  {
    input: 'dist/types/index.d.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'esm',
    },
    plugins: [
      alias,
      dts(),
      del({
        targets: 'dist/types',
        hook: 'buildEnd',
        verbose: true,
      }),
    ],
  }
])