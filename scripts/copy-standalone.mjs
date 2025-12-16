import { cpSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const projectRoot = process.cwd()
const standaloneDir = join(projectRoot, '.next', 'standalone')
const standaloneNextDir = join(standaloneDir, '.next')

mkdirSync(standaloneNextDir, { recursive: true })

const copyDirectory = (source, destination) => {
  if (!existsSync(source)) return
  cpSync(source, destination, { recursive: true })
}

copyDirectory(join(projectRoot, '.next', 'static'), join(standaloneNextDir, 'static'))
copyDirectory(join(projectRoot, 'public'), standaloneDir)
