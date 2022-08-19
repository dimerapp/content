/*
 * @dimerapp/content
 *
 * (c) Harminder Virk
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { Zone } from './zone.js'
import type { Category, Doc, LookupDoc } from './types.js'

/**
 * Exposes the API to configure a version and render
 * docs
 */
export class Version {
  /**
   * Version unique slug
   */
  slug: string

  /**
   * Version name. Falls back to slug, if not set explicitly
   */
  name: string

  /**
   * Parent zone
   */
  zone: Zone

  /**
   * Registered categories
   */
  categories: Category[] = []

  /**
   * The method to invoke to render a doc
   */
  renderCallback: (doc: LookupDoc, ...args: any[]) => Promise<string> | string

  /**
   * Reference to the hero doc (the first doc) of the version.
   * Returns null if not categories and docs are defined
   */
  get heroDoc() {
    return this.categories[0]?.docs[0] || null
  }

  /**
   * Removes the sourrounded slashes from the permalink
   */
  #removeSorroundedSlashes(permalink: string) {
    return permalink.replace(/^\//, '').replace(/\/$/, '')
  }

  /**
   * Creates the lookup doc
   */
  #createLookupDoc(doc: Doc, category: string) {
    return {
      ...doc,
      category,
      url: `/${this.zone.slug}/${this.slug}/${doc.permalink}`,
      makeUrl: (docPermalink: string) => {
        return `/${this.zone.slug}/${this.slug}/${this.#removeSorroundedSlashes(docPermalink)}`
      },
      version: {
        name: this.name,
        slug: this.slug,
      },
      zone: { name: this.zone.name, slug: this.zone.slug },
      categories: this.categories,
    }
  }

  /**
   * Creates the render function to the lookedup doc
   */
  #createRenderFunction(doc: LookupDoc) {
    return (...args: any[]) => {
      return this.renderCallback(doc, ...args)
    }
  }

  constructor(slug: string, zone: Zone) {
    this.slug = slug
    this.name = slug
    this.zone = zone
  }

  /**
   * Set the version display name
   */
  setName(name: string): this {
    this.name = name
    return this
  }

  /**
   * Set the categories tree
   */
  setCategories(categories: Category[]): this {
    this.categories = categories
    return this
  }

  /**
   * Define a render callback to render the doc
   */
  render(callback: (doc: LookupDoc, ...args: any[]) => Promise<string> | string): this {
    this.renderCallback = callback
    return this
  }

  /**
   * Lookup a doc by its permalink.
   */
  lookup(
    permalink: string
  ): null | (LookupDoc & { render(...args: any[]): Promise<string> | string }) {
    for (const category of this.categories) {
      for (const doc of category.docs) {
        doc.permalink = this.#removeSorroundedSlashes(doc.permalink)

        if (doc.permalink === permalink || doc.permalink === `/${permalink}`) {
          let lookupDoc = this.#createLookupDoc(doc, category.name)
          return {
            ...lookupDoc,
            render: this.#createRenderFunction(lookupDoc),
          }
        }
      }
    }

    return null
  }
}
