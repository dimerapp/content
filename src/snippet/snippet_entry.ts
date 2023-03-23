/*
 * @dimerapp/content
 *
 * (c) DimerApp
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { readFile } from 'node:fs/promises'
import { BaseEntry } from '../base_entry.js'

/**
 * Snippet entry represents a markdown file or raw contents
 * to be converted to HTML
 */
export class SnippetEntry extends BaseEntry {
  contentPath?: string
  contents?: string

  constructor(options: { contentPath?: string; contents?: string }) {
    super()
    this.contentPath = options.contentPath
    this.contents = options.contents
  }

  /**
   * Returns the file contents
   */
  async getFileContents() {
    if (this.contents) {
      return this.contents
    }

    if (!this.contentPath) {
      throw new Error(
        'Cannot render snippet. Make sure to define the snippet contents or the path to the snippet markdown file'
      )
    }

    return readFile(this.contentPath, 'utf8')
  }
}
