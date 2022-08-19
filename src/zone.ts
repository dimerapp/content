/*
 * @dimerapp/content
 *
 * (c) Harminder Virk
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Page } from './types.js'
import { Version } from './version.js'
import { PagesCollection } from './pages_collection.js'

/**
 * Exposes the API to configure a zone
 */
export class Zone {
  /**
   * Zone unique slug
   */
  slug: string

  /**
   * Zone name. Falls back to slug, if not set explicitly
   */
  name: string

  /**
   * Tracked versions inside the zone
   */
  versions: Version[] = []

  pagesCollection: PagesCollection

  constructor(slug: string) {
    this.slug = slug
    this.name = slug
  }

  /**
   * Set the zone display name
   */
  setName(name: string): this {
    this.name = name
    return this
  }

  /**
   * Register a pages collection with the zone. Calling this
   * method without the pages array will return the existing
   * instantiated collection.
   */
  pages(pages?: Page[]): PagesCollection {
    this.pagesCollection = this.pagesCollection || new PagesCollection(pages || [], this)
    return this.pagesCollection
  }

  /**
   * Add a new zone version or fetch an existing one. A new version
   * is created unless "createIfMissing" is set to "false".
   */
  version(slug: string, createIfMissing: false): Version | null
  version(slug: string, createIfMissing?: true): Version
  version(slug: string, createIfMissing = true): Version | null {
    const existingVersion = this.versions.find((version) => version.slug === slug)
    if (existingVersion) {
      return existingVersion
    }

    if (!createIfMissing) {
      return null
    }

    const version = new Version(slug, this)
    this.versions.push(version)

    return version
  }
}
