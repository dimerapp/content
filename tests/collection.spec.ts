/*
 * @dimerapp/content
 *
 * (c) DimerApp
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { EOL } from 'node:os'
import { Edge } from 'edge.js'
import { join } from 'node:path'
import { test } from '@japa/runner'
import { RenderingPipeline, dimer } from '@dimerapp/edge'

import { Renderer } from '../src/renderer.js'
import { Collection } from '../src/collection/main.js'
import urlResolver from '../src/collection/url_resolver.js'

test.group('Collection', (group) => {
  group.each.setup(() => {
    return () => urlResolver.clear()
  })

  test('fail when trying to boot collection without a db file', async ({ assert }) => {
    const collection = Collection.create()
    await assert.rejects(
      () => collection.boot(),
      'Cannot boot collection without a JSON database file. Use "collection.db" method to define one'
    )
  })

  test('boot collection only once', async ({ assert, fs }) => {
    await fs.create(
      'db.json',
      JSON.stringify([
        {
          permalink: '/hello',
          contentPath: 'home.md',
          title: 'Hello world',
        },
        {
          permalink: '/hi',
          contentPath: 'hi.md',
          title: 'Hi world',
        },
      ])
    )

    const collection = Collection.create().db(join(fs.basePath, 'db.json'))
    await collection.boot()

    await fs.remove('db.json')
    await assert.doesNotRejects(() => collection.boot())
  })

  test('find collection entry by file permalink', async ({ assert, fs }) => {
    await fs.create(
      'db.json',
      JSON.stringify([
        {
          permalink: '/hello',
          contentPath: 'home.md',
          title: 'Hello world',
        },
        {
          permalink: '/hi',
          contentPath: 'hi.md',
          title: 'Hi world',
        },
      ])
    )

    const collection = Collection.create()
    collection.db(new URL('db.json', fs.baseUrl))
    await collection.boot()

    assert.isDefined(collection.findByPermalink('/hello'))
    assert.isDefined(collection.findByPermalink('/hi'))
    assert.isUndefined(collection.findByPermalink('/bar'))
  })

  test('define prefix for all permalinks', async ({ assert, fs }) => {
    await fs.create(
      'db.json',
      JSON.stringify([
        {
          permalink: '/hello',
          contentPath: 'home.md',
          title: 'Hello world',
        },
        {
          permalink: '/hi',
          contentPath: 'hi.md',
          title: 'Hi world',
        },
      ])
    )

    const collection = Collection.create()
    collection.db(new URL('db.json', fs.baseUrl)).urlPrefix('/docs')
    await collection.boot()

    assert.isDefined(collection.findByPermalink('/docs/hello'))
    assert.isDefined(collection.findByPermalink('/docs/hi'))
    assert.isUndefined(collection.findByPermalink('/docs/bar'))

    assert.isDefined(collection.findByPermalink('/hello'))
    assert.isDefined(collection.findByPermalink('/hi'))
    assert.isUndefined(collection.findByPermalink('/bar'))
  })

  test('get an array of collection entries', async ({ assert, fs }) => {
    await fs.create(
      'db.json',
      JSON.stringify([
        {
          permalink: '/hello',
          contentPath: 'home.md',
          title: 'Hello world',
        },
        {
          permalink: '/hi',
          contentPath: 'hi.md',
          title: 'Hi world',
        },
      ])
    )

    const collection = Collection.create()
    collection.db(new URL('db.json', fs.baseUrl)).urlPrefix('/docs')
    await collection.boot()

    assert.containsSubset(collection.all(), [
      {
        permalink: '/docs/hello',
        contentPath: join(fs.basePath, 'home.md'),
        title: 'Hello world',
      },
      {
        permalink: '/docs/hi',
        contentPath: join(fs.basePath, 'hi.md'),
        title: 'Hi world',
      },
    ])
  })

  test('render collection entry', async ({ assert, fs }) => {
    await fs.create(
      'db.json',
      JSON.stringify([
        {
          permalink: '/hello',
          contentPath: 'home.md',
          title: 'Hello world',
        },
        {
          permalink: '/hi',
          contentPath: 'hi.md',
          title: 'Hi world',
        },
      ])
    )

    await fs.create('home.md', ['# Hello world', '', 'This is a simple markdown file'].join(EOL))

    const collection = Collection.create()
    collection.db(new URL('db.json', fs.baseUrl)).urlPrefix('/docs')

    await collection.boot()

    assert.equal(
      await collection.findByPermalink('/hello')!.render(),
      [
        '<h1 id="hello-world"><a href="#hello-world" aria-hidden="true" tabindex="-1"><span class="icon icon-link"></span></a>Hello world</h1>',
        '<p>This is a simple markdown file</p>',
      ].join(EOL)
    )
  })

  test('render collection entry with a custom renderer', async ({ assert, fs }) => {
    await fs.create(
      'db.json',
      JSON.stringify([
        {
          permalink: '/hello',
          contentPath: 'home.md',
          title: 'Hello world',
        },
        {
          permalink: '/hi',
          contentPath: 'hi.md',
          title: 'Hi world',
        },
      ])
    )

    await fs.create('home.md', ['# Hello world', '', 'This is a simple markdown file'].join(EOL))
    await fs.create(
      'docs.edge',
      [
        '<html>',
        '',
        `@!component('dimer_contents', { nodes: file.ast.children, pipeline })~`,
        '',
        '</html>',
      ].join(EOL)
    )

    const renderer = new Renderer(new Edge().mount(fs.basePath).use(dimer), new RenderingPipeline())
    renderer.useTemplate('docs.edge')

    const collection = Collection.create()
    collection.db(new URL('db.json', fs.baseUrl)).urlPrefix('/docs').useRenderer(renderer)

    await collection.boot()

    assert.equal(
      await collection.findByPermalink('/hello')!.render(),
      [
        '<html>',
        '<h1 id="hello-world"><a href="#hello-world" aria-hidden=true tabindex=-1><span class="icon icon-link"></span></a>Hello world</h1>',
        '<p>This is a simple markdown file</p>',
        '</html>',
      ].join(EOL)
    )
  })

  test('resolve links to files inside collection', async ({ assert, fs }) => {
    await fs.create(
      'db.json',
      JSON.stringify([
        {
          permalink: '/hello',
          contentPath: 'home.md',
          title: 'Hello world',
        },
        {
          permalink: '/hi',
          contentPath: 'hi.md',
          title: 'Hi world',
        },
      ])
    )

    await fs.create('home.md', ['# Hello world', '', '[Say hi](./hi.md)'].join(EOL))

    const collection = Collection.create()
    collection.db(new URL('db.json', fs.baseUrl)).urlPrefix('/docs')

    await collection.boot()

    assert.equal(
      await collection.findByPermalink('/hello')!.render(),
      [
        '<h1 id="hello-world"><a href="#hello-world" aria-hidden="true" tabindex="-1"><span class="icon icon-link"></span></a>Hello world</h1>',
        '<p><a href="/docs/hi">Say hi</a></p>',
      ].join(EOL)
    )
  })

  test('do not attempt to resolve non-content links', async ({ assert, fs }) => {
    await fs.create(
      'db.json',
      JSON.stringify([
        {
          permalink: '/hello',
          contentPath: 'home.md',
          title: 'Hello world',
        },
        {
          permalink: '/hi',
          contentPath: 'hi.md',
          title: 'Hi world',
        },
      ])
    )

    await fs.create('home.md', ['# Hello world', '', '[Say hi](./foo)'].join(EOL))

    const collection = Collection.create()
    collection.db(new URL('db.json', fs.baseUrl)).urlPrefix('/docs')

    await collection.boot()

    assert.equal(
      await collection.findByPermalink('/hello')!.render(),
      [
        '<h1 id="hello-world"><a href="#hello-world" aria-hidden="true" tabindex="-1"><span class="icon icon-link"></span></a>Hello world</h1>',
        '<p><a href="./foo">Say hi</a></p>',
      ].join(EOL)
    )
  })

  test('report error when unable to resolve content links', async ({ assert, fs }) => {
    await fs.create(
      'db.json',
      JSON.stringify([
        {
          permalink: '/hello',
          contentPath: 'home.md',
          title: 'Hello world',
        },
      ])
    )

    await fs.create('home.md', ['# Hello world', '', '[Say hi](./hi.md)'].join(EOL))

    let messages: any[] = []
    const collection = Collection.create().db(new URL('db.json', fs.baseUrl)).urlPrefix('/docs')
    await collection.boot()

    const doc = collection.findByPermalink('/hello')!

    doc.rendering((file) => {
      messages = file.messages
    })

    assert.equal(
      await doc.render(),
      [
        '<h1 id="hello-world"><a href="#hello-world" aria-hidden="true" tabindex="-1"><span class="icon icon-link"></span></a>Hello world</h1>',
        '<p><a href="./hi.md">Say hi</a></p>',
      ].join(EOL)
    )

    assert.equal(messages[0].reason, 'Broken link to "./hi.md"')
  })

  test('resolve links to the same file', async ({ assert, fs }) => {
    await fs.create(
      'db.json',
      JSON.stringify([
        {
          permalink: '/hello',
          contentPath: 'home.md',
          title: 'Hello world',
        },
        {
          permalink: '/hi',
          contentPath: 'hi.md',
          title: 'Hi world',
        },
      ])
    )

    await fs.create('home.md', ['# Hello world', '', '[Say hi](./home.md#hello-world)'].join(EOL))

    const collection = Collection.create()
    collection.db(new URL('db.json', fs.baseUrl)).urlPrefix('/docs')

    await collection.boot()

    assert.equal(
      await collection.findByPermalink('/hello')!.render(),
      [
        '<h1 id="hello-world"><a href="#hello-world" aria-hidden="true" tabindex="-1"><span class="icon icon-link"></span></a>Hello world</h1>',
        '<p><a href="#hello-world">Say hi</a></p>',
      ].join(EOL)
    )
  })
})
