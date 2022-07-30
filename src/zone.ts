/*
 * @dimerapp/content
 *
 * (c) Harminder Virk
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Version } from './version.js'

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
   * Add a new content version to the zone
   */
  version(slug: string): Version {
    const existingVersion = this.versions.find((version) => version.slug === slug)
    if (existingVersion) {
      return existingVersion
    }

    const version = new Version(slug, this)
    this.versions.push(version)

    return version
  }
}
