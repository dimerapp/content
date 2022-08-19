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
import { Store } from '../src/store.js'

test.group('Pages collection', () => {
  test('add pages to the zone', ({ assert }) => {
    const zone = new Zone('guides')
    zone.pages([{ contentPath: './', permalink: '/', title: 'Home' }])

    assert.deepEqual(zone.pagesCollection.pages, [
      { contentPath: './', permalink: '/', title: 'Home' },
    ])
  })

  test('lookup a page by permalink', ({ assert }) => {
    const zone = new Zone('guides')
    zone.pages([{ contentPath: './', permalink: '/', title: 'Home' }])

    const page = zone.pages().lookup('/')!
    assert.equal(page.permalink, '/')
    assert.deepEqual(page.zone, { name: 'guides', slug: 'guides' })
  })

  test('add pages to the store', ({ assert }) => {
    const store = new Store()
    store.pages([{ contentPath: './', permalink: '/', title: 'Home' }])

    assert.deepEqual(store.pagesCollection.pages, [
      { contentPath: './', permalink: '/', title: 'Home' },
    ])
  })

  test('lookup a page by permalink', ({ assert }) => {
    const store = new Store()
    store.pages([{ contentPath: './', permalink: '/', title: 'Home' }])

    const page = store.pages().lookup('/')!
    assert.equal(page.permalink, '/')
    assert.isUndefined(page.zone)
  })
})
