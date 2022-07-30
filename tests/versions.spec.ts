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

test.group('Version', () => {
  test('add version to the zone', ({ assert }) => {
    const zone = new Zone('guides')
    zone.version('master')

    assert.equal(zone.name, 'guides')
    assert.equal(zone.slug, 'guides')
    assert.lengthOf(zone.versions, 1)
    assert.equal(zone.versions[0].slug, 'master')
  })

  test('add categories to the version', ({ assert }) => {
    const zone = new Zone('guides')
    const master = zone.version('master')
    master.setCategories([
      {
        name: 'HTTP',
        docs: [
          {
            contentPath: './foo.md',
            permalink: 'foo',
            title: 'Foo',
          },
        ],
      },
    ])

    assert.lengthOf(zone.versions, 1)
    assert.equal(zone.versions[0].slug, 'master')
    assert.deepEqual(zone.versions[0].categories, [
      {
        name: 'HTTP',
        docs: [
          {
            contentPath: './foo.md',
            permalink: 'foo',
            title: 'Foo',
          },
        ],
      },
    ])
  })

  test('look up a doc by permalink', ({ assert }) => {
    const zone = new Zone('guides')
    const master = zone.version('master')
    master.setCategories([
      {
        name: 'HTTP',
        docs: [
          {
            contentPath: './foo.md',
            permalink: 'foo',
            title: 'Foo',
          },
        ],
      },
    ])

    const doc = master.lookup('foo')!
    assert.equal(doc.permalink, 'foo')
    assert.equal(doc.category, 'HTTP')
    assert.equal(doc.contentPath, './foo.md')
    assert.deepEqual(doc.zone, { name: 'guides', slug: 'guides' })
    assert.containsSubset(doc.version, { name: 'master', slug: 'master' })
  })

  test('return null when unable to lookup doc', ({ assert }) => {
    const zone = new Zone('guides')
    const master = zone.version('master')
    master.setCategories([
      {
        name: 'HTTP',
        docs: [
          {
            contentPath: './foo.md',
            permalink: 'foo',
            title: 'Foo',
          },
        ],
      },
    ])

    const doc = master.lookup('bar')
    assert.isNull(doc)
  })

  test('render doc using the render callback', ({ assert }) => {
    const zone = new Zone('guides')
    const master = zone.version('master')
    master
      .setCategories([
        {
          name: 'HTTP',
          docs: [
            {
              contentPath: './foo.md',
              permalink: 'foo',
              title: 'Foo',
            },
          ],
        },
      ])
      .render(() => 'foo bar')

    const doc = master.lookup('foo')!
    assert.equal(doc.render(), 'foo bar')
  })
})
