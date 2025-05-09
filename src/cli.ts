
import { readFileSync } from 'node:fs'
import { cac } from 'cac'
import semver from 'semver'

import { main } from './index'
import { logger } from './utils'
import { runServer } from './server'

import type { ICliOptions, IServerCliOptions } from './types'

const cli = cac('yuque-dl')

// 不能直接使用 import {version} from '../package.json'
// 否则declaration 生成的d.ts 会多一层src目录
const { version, engines } = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url)).toString(),
)

function checkVersion() {
  const version = engines.node
  if (!semver.satisfies(process.version, version)) {
    logger.error(`✕ nodejs 版本需 ${version}, 当前版本为 ${process.version}`)
    process.exit(1)
  }
}

// 检查node版本
checkVersion()

cli
  .command('<url>', '语雀知识库url')
  .option('-d, --dist-dir <dir>', '下载的目录 eg: -d download', {
    default: 'download',
  })
  .option('-i, --ignore-img', '忽略图片不下载', {
    default: false
  })
  .option('-k, --key <key>', '语雀的cookie key， 默认是 "_yuque_session"， 在某些企业版本中 key 不一样')
  .option('-t, --token <token>', '语雀的cookie key 对应的值')
  .option('--toc', '是否输出文档toc目录', {
    default: false
  })
  .option('--incremental', '开启增量下载(初次下载加不加该参数没区别)', {
    default: false
  })
  .option('--convertMarkdownVideoLinks', '转化markdown视频链接为video标签', {
    default: false
  })
  .option('--hideFooter', '是否禁用页脚显示(更新时间、原文地址...)', {
    default: false
  })
  .action(async (url: string, options: ICliOptions) => {
    try {
      await main(url, options)
      process.exit(0)
    } catch (err) {
      logger.error(err.message || 'unknown exception')
      process.exit(1)
    }
  })

cli
  .command('server <serverPath>', '启动web服务')
  .option('-p, --port <port>', ' --port 1234', {
    default: 5173,
  })
  .option('--host [host]', ' --host 0.0.0.0 或 --host', {
    default: 'localhost',
  })
  .option('--force', '强制重新生成.vitepress', {
    default: false,
  })
  .action(async (serverPath: string, options: IServerCliOptions) => {
    try {
      await runServer(serverPath, options)
    } catch (err) {
      logger.error(err.message || 'unknown exception')
      process.exit(1)
    }
  })

cli.help()
cli.version(version)

try {
  cli.parse()
} catch (err) {
  logger.error(err.message || 'unknown exception')
  process.exit(1)
}
