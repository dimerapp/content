/*
 * @dimerapp/content
 *
 * (c) Harminder Virk
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { Store } from '../src/store.js'
import { createServer } from '../src/scripts/create_server.js'

test.group('Create server', () => {
  test('lookup version doc and render', async ({ client }) => {
    const store = new Store()
    store
      .zone('docs')
      .version('main')
      .setCategories([
        {
          name: '',
          docs: [
            {
              contentPath: './foo.md',
              permalink: '/foo',
              title: 'Foo',
            },
          ],
        },
      ])
      .render(() => 'Hello world')

    const server = createServer(store, {})
    server.listen('3333')

    const response = await client.get('/docs/main/foo')
    server.close()

    response.assertStatus(200)
    response.assertTextIncludes('Hello world')
  })

  test('return 404 when unable to lookup doc', async ({ client }) => {
    const store = new Store()
    store
      .zone('docs')
      .version('main')
      .setCategories([
        {
          name: '',
          docs: [
            {
              contentPath: './foo.md',
              permalink: '/foo',
              title: 'Foo',
            },
          ],
        },
      ])
      .render(() => 'Hello world')

    const server = createServer(store, {})
    server.listen('3333')

    const response = await client.get('/docs/main/bar')
    server.close()

    response.assertStatus(404)
    response.assertTextIncludes('Page not found')
  })

  test('render store page', async ({ client }) => {
    const store = new Store()
    store
      .pages([
        {
          contentPath: './foo.md',
          permalink: '/foo',
          title: 'Foo',
        },
      ])
      .render(() => 'Hello world')

    const server = createServer(store, {})
    server.listen('3333')

    const response = await client.get('/foo')
    server.close()

    response.assertStatus(200)
    response.assertTextIncludes('Hello world')
  })

  test('render zone page', async ({ client }) => {
    const store = new Store()
    store
      .zone('features')
      .pages([
        {
          contentPath: './foo.md',
          permalink: '/foo',
          title: 'Foo',
        },
      ])
      .render(() => 'Hello world')

    const server = createServer(store, {})
    server.listen('3333')

    const response = await client.get('/features/foo')
    server.close()

    response.assertStatus(200)
    response.assertTextIncludes('Hello world')
  })

  test('render 404 when version not found', async ({ client }) => {
    const store = new Store()
    store
      .zone('docs')
      .version('main')
      .setCategories([
        {
          name: '',
          docs: [
            {
              contentPath: './foo.md',
              permalink: '/foo',
              title: 'Foo',
            },
          ],
        },
      ])
      .render(() => 'Hello world')

    const server = createServer(store, {})
    server.listen('3333')

    const response = await client.get('/docs/8.x/foo')
    server.close()

    response.assertStatus(404)
    response.assertTextIncludes('Page not found')
  })

  test('render 404 when zone not found', async ({ client }) => {
    const store = new Store()
    store
      .zone('docs')
      .version('main')
      .setCategories([
        {
          name: '',
          docs: [
            {
              contentPath: './foo.md',
              permalink: '/foo',
              title: 'Foo',
            },
          ],
        },
      ])
      .render(() => 'Hello world')

    const server = createServer(store, {})
    server.listen('3333')

    const response = await client.get('/api/main/foo')
    server.close()

    response.assertStatus(404)
    response.assertTextIncludes('Page not found')
  })
})
