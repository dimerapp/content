/*
 * @dimerapp/content
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { EdgeContract } from 'edge.js'
import dimerEdge from '@dimerapp/edge'

import { Zone } from './Zone'
import { ProcessedDoc, GroupTree } from '../Contracts'

/**
 * Content manager to parse and render markdown files for a documentation
 * website
 */
export class ContentManager {
  /**
   * Registered zones
   */
  private zones: { [name: string]: Zone<any> } = {}

  /**
   * Key-value pair of "file-path" and "complete urls"
   */
  private zoneFiles: { [path: string]: ProcessedDoc } = {}

  /**
   * Key-value pair of "urls" and "absolute file paths"
   */
  private zoneUrls: { [url: string]: ProcessedDoc } = {}

  /**
   * Rendered html cache
   */
  private cacheStore: {
    [url: string]: { error: null; html: string } | { error: string; html: null }
  } = {}

  /**
   * Boolean to know if html should be cached
   */
  public cachingStrategy: 'full' | 'markup' | 'none' = 'none'

  /**
   * Zones tree shared with the templates
   */
  public zonesTree: { [name: string]: GroupTree[] } = {}

  constructor(private appRoot: string, public view: EdgeContract) {
    view.use(dimerEdge)
    view.registerTemplate('dimer::base_template', {
      template: '@dimerTree(file.ast.children)~',
    })
  }

  /**
   * Returns the relative path of a give file
   */
  private relativePath(absPath: string) {
    return absPath.replace(this.appRoot, '.')
  }

  /**
   * Add response to the cache store when "cachingStrategy = 'full'"
   */
  private cacheResponse(
    url: string,
    response: { error: null; html: string } | { error: string; html: null }
  ) {
    if (this.cachingStrategy === 'full') {
      this.cacheStore[url] = response
    }
  }

  /**
   * Register a custom zone
   */
  public zone<Options extends any>(name: string, options?: Options) {
    const zone = new Zone(name, this.appRoot, this, options)
    if (this.zones[name]) {
      throw new Error(`Duplicate zone "${name}"`)
    }

    this.zones[name] = zone
    return zone
  }

  /**
   * Enable/disable cache
   */
  public cache(strategy: 'full' | 'markup' | 'none'): this {
    this.cachingStrategy = strategy
    return this
  }

  /**
   * Register doc with the manager. Docs with duplicate urls
   * will result in an error
   */
  public collectDoc(doc: ProcessedDoc): this {
    const preRegisteredUrl = this.zoneUrls[doc.url]
    const preRegisteredPath = this.zoneFiles[doc.path]

    /**
     * Dis-allow duplicate urls
     */
    if (preRegisteredUrl) {
      if (doc.zone !== preRegisteredUrl.zone) {
        throw new Error(
          `Duplicate url "${doc.url}" across multiple zones "${doc.zone}" && "${preRegisteredUrl.zone}"`
        )
      }

      throw new Error(
        `Duplicate url "${doc.url}" shared between "${this.relativePath(
          doc.path
        )}" && "${this.relativePath(preRegisteredUrl.path)}"`
      )
    }

    /**
     * Dis-allow duplication file paths as we will resolve
     * urls to files using their absolute path
     */
    if (preRegisteredPath) {
      throw new Error(
        `Doc path "${this.relativePath(doc.path)}" cannot be shared across multiple doc files`
      )
    }

    this.zoneFiles[doc.path] = doc
    this.zoneUrls[doc.url] = doc
    return this
  }

  /**
   * Find if a doc for the given complete url exists or not
   */
  public hasDoc(url: string): boolean {
    return !!this.getDoc(url)
  }

  /**
   * Find if a doc for the given complete url exists or not
   */
  public getDoc(url: string): null | ProcessedDoc {
    return this.zoneUrls[url] || null
  }

  /**
   * Returns the doc for a given file path
   */
  public getDocFromPath(path: string) {
    return this.zoneFiles[path] || null
  }

  /**
   * Find if a doc for the given complete url exists or not
   */
  public async render(
    url: string
  ): Promise<{ error: null; html: string } | { error: string; html: null }> {
    if (this.cacheStore[url]) {
      return this.cacheStore[url]
    }

    let response: { error: null; html: string } | { error: string; html: null }
    const doc = this.getDoc(url)

    if (!doc) {
      response = {
        error: `Unable to lookup doc for "${url}"`,
        html: null,
      }
    } else {
      response = await this.zones[doc.zone].render(doc)
    }

    this.cacheResponse(url, response)
    return response
  }
}
