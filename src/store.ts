/*
 * @dimerapp/content
 *
 * (c) Harminder Virk
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Zone } from './zone.js'

/**
 * Exposes the API to register and fetch zones
 */
export class Store {
  zones: Zone[]

  zone(slug: string): Zone {
    const existingZone = this.zones.find((zone) => zone.slug === slug)
    if (existingZone) {
      return existingZone
    }

    const zone = new Zone(slug)
    this.zones.push(zone)
    return zone
  }
}
