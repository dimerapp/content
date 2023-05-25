/*
 * @dimerapp/markdown
 *
 * (c) DimerApp
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Db } from './db.js'
import urlResolver from './url_resolver.js'
import type { Renderer } from '../renderer.js'
import type { RendererHook } from '../types.js'
import { CollectionEntry } from './collection_entry.js'

/**
 * A collection represents one or more markdown files meant to be rendered
 * as pages during HTTP requests. Therefore each collection entry must
 * have a permalink and associated markdown file content path.
 */
export class Collection {
  /**
   * Create a new instance of the collection
   */
  static create() {
    return new Collection()
  }

  /**
   * Keeping a track of whether we have booted the collection or not. The
   * boot phase must be performed only once
   */
  #booted: boolean = false

  /**
   * Path to the database file
   */
  #db?: Db

  /**
   * The prefix to apply to all permalinks inside this collection.
   */
  #urlPrefix?: string

  /**
   * A custom renderer to use when rendering the content file. If not
   * defined, we will do a standard markdown to HTML conversion
   */
  #renderer?: Renderer

  /**
   * A lookup collection for finding collection entries by permalink
   */
  #permalinks: Map<string, CollectionEntry> = new Map()

  /**
   * Registered hooks
   */
  #hooks: {
    rendering: Set<RendererHook>
  } = {
    rendering: new Set(),
  }
  /**
   * Removes the sourrounded slashes from a uri
   */
  #normalizeUri(uri: string) {
    return uri === '/' ? uri : `/${uri.replace(/^\//, '').replace(/\/$/, '')}`
  }

  /**
   * Removes the sourrounded slashes from the permalink
   */
  #applyPrefix(permalink: string) {
    return this.#urlPrefix ? `${this.#normalizeUri(this.#urlPrefix)}${permalink}` : permalink
  }

  /**
   * Loads the database during the boot phase.
   */
  async #loadDb() {
    if (!this.#db) {
      throw new Error(
        'Cannot boot collection without a JSON database file. Use "collection.db" method to define one'
      )
    }

    const dbEntries = await this.#db.load()
    dbEntries.forEach((entry) => {
      const collectionEntry = new CollectionEntry({
        ...entry,
        permalink: this.#applyPrefix(this.#normalizeUri(entry.permalink)),
      })

      this.#hooks.rendering.forEach((hook) => {
        collectionEntry.rendering(hook)
      })

      if (this.#renderer) {
        collectionEntry.useRenderer(this.#renderer)
      }

      this.#permalinks.set(collectionEntry.permalink, collectionEntry)
      urlResolver.trackFile(collectionEntry.contentPath, collectionEntry.permalink)
    })
  }

  /**
   * Boots collection by checking for required attributes and loading
   * database file.
   */
  async boot() {
    if (this.#booted) {
      return
    }

    this.#booted = true
    await this.#loadDb()
  }

  /**
   * Refreshes the database
   */
  async refresh() {
    await this.#loadDb()
  }

  /**
   * Define absolute path to the database file. The file contents will be used
   * as the source of truth for finding entries in this collection.
   * @required
   */
  db(dbPath: string | URL): this {
    this.#db = new Db(dbPath)
    return this
  }

  /**
   * Define a URL prefix for the collection. The permalinks inside this collection will
   * get the given URL prefix.
   */
  urlPrefix(urlPrefix: string): this {
    this.#urlPrefix = urlPrefix
    return this
  }

  /**
   * Define a custom renderer to use to render the markdown file.
   */
  useRenderer(renderer: Renderer) {
    this.#renderer = renderer
    return this
  }

  /**
   * Register a callback to hook into the markdown rendering processing.
   * Make sure to define the rendering hook before calling the
   * boot method
   */
  rendering(callback: RendererHook): this {
    this.#hooks.rendering.add(callback)
    return this
  }

  /**
   * Returns an array of collection entries
   */
  all(): CollectionEntry[] {
    return [...this.#permalinks.values()]
  }

  /**
   * Returns the collection entry for a given permalink
   */
  findByPermalink(permalink: string): CollectionEntry | undefined {
    return this.#permalinks.get(permalink) || this.#permalinks.get(this.#applyPrefix(permalink))
  }
}
