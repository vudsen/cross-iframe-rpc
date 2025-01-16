import child_process from 'node:child_process'
import path from 'node:path'

child_process.execSync('pnpm run build', {
  stdio: 'inherit',
  cwd: path.resolve('cross-iframe-rpc')
})

child_process.execSync('pnpm run prepare:popup', {
  stdio: 'inherit',
  cwd: path.resolve('example')
})

// eslint-disable-next-line no-undef
console.log('\nLaunch example:\n  1. cd example\n  2. pnpm run dev')