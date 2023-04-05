/*
 * @dimerapp/content
 *
 * (c) DimerApp
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { dirname, join } from 'node:path'
import type { MarkdownFile } from '@dimerapp/markdown'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

import urlResolver from './url_resolver.js'
import { BaseEntry } from '../base_entry.js'
import type { DatabaseEntry } from '../types.js'

/**
 * Collection entry represents a markdown file with a permalink
 * defined inside the collection database file.
 */
export class CollectionEntry extends BaseEntry {
  title: string
  permalink: string
  contentPath: string
  meta: Record<string, any>

  constructor(options: DatabaseEntry) {
    super()
    const { title, permalink, contentPath, ...rest } = options
    this.title = title
    this.permalink = permalink
    this.contentPath = contentPath
    this.meta = rest
  }

  /**
   * Converts permalink to file path
   */
  #permalinkToFilePath(uri: string) {
    return uri === '/' ? 'index' : `${uri.replace(/^\//, '').replace(/\/$/, '')}`
  }

  /**
   * Returns the file contents
   */
  protected async getFileContents() {
    return readFile(this.contentPath, 'utf8')
  }

  /**
   * Template method to hook into markdown processing
   */
  protected async prepare(mdFile: MarkdownFile) {
    const filePath = mdFile.filePath

    /**
     * Registering a hook to listen for anchor tags only if
     * the filePath exists.
     */
    if (filePath) {
      mdFile.on('link', (node, $file) => {
        const resolvedUrl = urlResolver.resolve(node.url, filePath)

        /**
         * Pointing to a content file not tracked by URL resolver.
         */
        if (resolvedUrl === null) {
          const message = $file.report(
            `Broken link to "${node.url}"`,
            node.position,
            'broken-md-reference'
          )
          message.fatal = true
          return
        }

        if (resolvedUrl) {
          node.url = resolvedUrl
        }
      })
    }
  }

  /**
   * Writes the collection entry HTML to the disk
   */
  async writeToDisk(outputDir: string, state?: Record<string, any>, filePath?: string) {
    filePath = filePath || `${this.#permalinkToFilePath(this.permalink)}.html`
    const outputPath = join(outputDir, filePath)

    await mkdir(dirname(outputPath), { recursive: true })
    await writeFile(outputPath, await this.render(state))

    return {
      outputDir,
      outputPath,
      filePath: filePath!,
    }
  }
}
