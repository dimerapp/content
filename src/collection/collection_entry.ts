/*
 * @dimerapp/content
 *
 * (c) DimerApp
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { Edge } from 'edge.js'
import { dirname, join } from 'node:path'
import type { MarkdownFile } from '@dimerapp/markdown'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

import urlResolver from './url_resolver.js'
import { BaseEntry } from '../base_entry.js'
import type { DatabaseEntry } from '../types.js'
import { toString } from 'mdast-util-to-string'

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
    mdFile.frontmatter = {
      ...this.meta,
      title: this.title,
      permalink: this.permalink,
      ...mdFile.frontmatter,
    }

    /**
     * Registering a hook to listen for anchor tags only if
     * the filePath exists.
     */
    if (filePath) {
      mdFile.on('link', (node, $file) => {
        if (!node.url) {
          const message = $file.report(
            `No href found in link "${toString(node)}"`,
            node.position,
            'broken-link-reference'
          )
          message.fatal = true
          return
        }

        const resolvedUrl = urlResolver.resolve(node.url, filePath)

        if (resolvedUrl === null) {
          const message = $file.report(
            `Invalid href "${node.url}" in link "${toString(node)}"`,
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

      mdFile.on('image', (node) => {
        const resolvedUrl = urlResolver.resolve(node.url, filePath)
        if (resolvedUrl) {
          node.url = resolvedUrl
        }
      })
    }
  }

  /**
   * Writes the collection entry HTML to the disk
   */
  async writeToDisk(
    outputDir: string,
    state?: Record<string, any>,
    filePath?: string,
    edgeRenderer?: ReturnType<Edge['createRenderer']>
  ) {
    filePath = filePath || `${this.#permalinkToFilePath(this.permalink)}.html`
    const outputPath = join(outputDir, filePath)

    await mkdir(dirname(outputPath), { recursive: true })
    await writeFile(outputPath, await this.render(state, edgeRenderer))

    return {
      outputDir,
      outputPath,
      filePath: filePath!,
    }
  }
}
