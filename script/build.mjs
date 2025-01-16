import child_process from 'node:child_process'
import path from 'node:path'

child_process.execSync('pnpm run build', {
  stdio: 'inherit',
  cwd: path.resolve('cross-iframe-rpc')
})

