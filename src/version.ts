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
  categories: Category[]

  /**
   * The method to invoke to render a doc
   */
  renderCallback: (doc: LookupDoc, ...args: any[]) => Promise<string> | string

  /**
   * Creates the lookup doc
   */
  #createLookupDoc(doc: Doc, category: string) {
    return {
      ...doc,
      category,
      version: {
        name: this.name,
        slug: this.slug,
        makeUrl: (docPermalink: string) => {
          return `/${this.zone.slug}/${this.slug}/${docPermalink}`
        },
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
        if (doc.permalink === permalink) {
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
