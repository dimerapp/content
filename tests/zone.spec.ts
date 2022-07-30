/*
 * @dimerapp/content
 *
 * (c) Harminder Virk
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { Zone } from '../src/zone.js'

test.group('Zone', () => {
  test('add a new zone', ({ assert }) => {
    const zone = new Zone('guides')
    assert.equal(zone.name, 'guides')
    assert.equal(zone.slug, 'guides')
    assert.deepEqual(zone.versions, [])
  })

  test('set name for the zone', ({ assert }) => {
    const zone = new Zone('guides')
    zone.setName('Framework guides')

    assert.equal(zone.name, 'Framework guides')
    assert.equal(zone.slug, 'guides')
    assert.deepEqual(zone.versions, [])
  })
})
