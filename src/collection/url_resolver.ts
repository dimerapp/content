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
   * Check if pathname points to an asset file
   */
  #isAssetFile(pathname: string) {
    return (
      pathname.endsWith('.png') ||
      pathname.endsWith('.jpeg') ||
      pathname.endsWith('.jpg') ||
      pathname.endsWith('.mp4')
    )
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

    if (!pathname || !this.#isRelative(pathname)) {
      return false
    }

    /**
     * Resolve URL for the markdown file
     */
    if (this.#isMarkdownFile(pathname)) {
      const absoluteFilePath = resolve(dirname(fromFilePath), pathname)
      if (absoluteFilePath === fromFilePath) {
        return `${search}${hash}`
      }

      const filePermalink = this.#contentFiles.get(absoluteFilePath)
      return filePermalink ? `${filePermalink}${search}${hash}` : null
    }

    /**
     * Resolve URL for the assets
     */
    if (this.#isAssetFile(pathname)) {
      const absoluteFilePath = resolve(dirname(fromFilePath), pathname)
      return `${absoluteFilePath}${search}${hash}`
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
