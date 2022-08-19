/*
 * @dimerapp/content
 *
 * (c) Harminder Virk
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Page } from './types.js'
import { Zone } from './zone.js'
import { PagesCollection } from './pages_collection.js'

/**
 * Exposes the API to register and fetch zones
 */
export class Store {
  zones: Zone[] = []
  pagesCollection: PagesCollection

  /**
   * Register a pages collection with the store. Calling this
   * method without the pages array will return the existing
   * instantiated collection.
   */
  pages(pages?: Page[]): PagesCollection {
    this.pagesCollection = this.pagesCollection || new PagesCollection(pages || [])
    return this.pagesCollection
  }

  /**
   * Register or fetch a pre-registered zone. By default, a new zone
   * is created if not already exists. However, you can disable
   * creation of zone by passing "createIfMissing = false"
   */
  zone(slug: string, createIfMissing: false): Zone | null
  zone(slug: string, createIfMissing?: true): Zone
  zone(slug: string, createIfMissing = true): Zone | null {
    const existingZone = this.zones.find((zone) => zone.slug === slug)
    if (existingZone) {
      return existingZone
    }

    if (!createIfMissing) {
      return null
    }

    const zone = new Zone(slug)
    this.zones.push(zone)
    return zone
  }
}
