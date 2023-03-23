/*
 * @dimerapp/content
 *
 * (c) DimerApp
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { parse } from 'node:url'
import { dirname, resolve } from 'node:path'

/**
 * URL resolver is used to resolve links for content files tracked
 * by collections.
 */
class URLResolver {
  #contentFiles: Map<string, string> = new Map()

  /**
   * Check if pathname is relative
   */
  #isRelative(pathname: string) {
    return pathname.startsWith('./') || pathname.startsWith('../')
  }

  /**
   * Check if pathname points to a markdown file
   */
  #isMarkdownFile(pathname: string) {
    return pathname.endsWith('.md') || pathname.endsWith('.markdown')
  }

  /**
   * Track a content file path and its permalink
   */
  trackFile(filePath: string, permalink: string) {
    this.#contentFiles.set(filePath, permalink)
  }

  /**
   * Resolves the permalink for a URI pointing to a markdown file. Also needs
   * absolute path to the file that has the link.
   *
   * ```
   * const link = '../foo.md'
   * const insideFilePath = '/var/apps/docs/content/bar.md'
   *
   * urlResolver.resolve(link, insideFilePath)
   * ```
   */
  resolve(uri: string, fromFilePath: string): false | null | string {
    let { pathname, hash, search } = parse(uri)
    hash = hash || ''
    search = search || ''

    /**
     * Making sure that we are only attempting to resolve path for
     * content files (aka markdown).
     */
    if (pathname && this.#isRelative(pathname) && this.#isMarkdownFile(pathname)) {
      const absoluteFilePath = resolve(dirname(fromFilePath), pathname)
      if (absoluteFilePath === fromFilePath) {
        return `${search}${hash}`
      }

      const filePermalink = this.#contentFiles.get(absoluteFilePath)
      return filePermalink ? `${filePermalink}${search}${hash}` : null
    }

    return false
  }

  /**
   * Clear any tracked content files
   */
  clear() {
    this.#contentFiles.clear()
  }
}

export default new URLResolver()
