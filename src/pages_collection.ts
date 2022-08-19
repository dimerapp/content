/*
 * @dimerapp/content
 *
 * (c) Harminder Virk
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { Zone } from './zone.js'
import type { LookupPage, Page } from './types.js'

/**
 * Exposes the API to register pages and render their
 * markdown contents
 */
export class PagesCollection {
  /**
   * Parent zone
   */
  zone?: Zone

  /**
   * Registered pages
   */
  pages: Page[] = []

  /**
   * The method to invoke to render a page
   */
  renderCallback: (page: LookupPage, ...args: any[]) => Promise<string> | string

  /**
   * Removes the sourrounded slashes from the permalink
   */
  #removeSorroundedSlashes(permalink: string) {
    return permalink === '/' ? permalink : permalink.replace(/^\//, '').replace(/\/$/, '')
  }

  /**
   * Creates the lookup page
   */
  #createLookupPage(page: Page) {
    return {
      ...page,
      url: this.zone ? `/${this.zone.slug}/${page.permalink}` : `/${page.permalink}`,
      makeUrl: (pagePermalink: string) => {
        pagePermalink = this.#removeSorroundedSlashes(pagePermalink)
        return this.zone ? `/${this.zone.slug}/${pagePermalink}` : `/${pagePermalink}`
      },
      zone: this.zone ? { name: this.zone.name, slug: this.zone.slug } : undefined,
    }
  }

  /**
   * Creates the render function to the lookedup doc
   */
  #createRenderFunction(page: LookupPage) {
    return (...args: any[]) => {
      return this.renderCallback(page, ...args)
    }
  }

  constructor(pages: Page[], zone?: Zone) {
    this.pages = pages
    this.zone = zone
  }

  /**
   * Define a render callback to render the page
   */
  render(callback: (page: LookupPage, ...args: any[]) => Promise<string> | string): this {
    this.renderCallback = callback
    return this
  }

  /**
   * Lookup a page by its permalink.
   */
  lookup(
    permalink: string
  ): null | (LookupPage & { render(...args: any[]): Promise<string> | string }) {
    for (const page of this.pages) {
      page.permalink = this.#removeSorroundedSlashes(page.permalink)

      if (page.permalink === permalink || page.permalink === `/${permalink}`) {
        const lookupPage = this.#createLookupPage(page)
        return {
          ...lookupPage,
          render: this.#createRenderFunction(lookupPage),
        }
      }
    }

    return null
  }
}
