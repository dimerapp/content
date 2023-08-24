/*
 * @dimerapp/content
 *
 * (c) DimerApp
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'node:path'
import { test } from '@japa/runner'

import { Db } from '../src/collection/db.js'

test.group('Db', () => {
  test('fail when database file is missing', async ({ assert, fs }) => {
    const db = new Db(new URL('db.json', fs.baseUrl))
    await assert.rejects(async () => {
      await db.load()
    }, /ENOENT/)
  })

  test('fail when database file contents are not valid JSON', async ({ assert, fs }) => {
    await fs.create('db.json', 'hello world')

    const db = new Db(new URL('db.json', fs.baseUrl))
    await assert.rejects(async () => {
      await db.load()
    }, /Unexpected token/)
  })

  test('fail when database file contents are not an array of entries', async ({ assert, fs }) => {
    await fs.create('db.json', JSON.stringify({}))

    const db = new Db(new URL('db.json', fs.baseUrl))
    await assert.rejects(
      async () => {
        await db.load()
      },
      `Invalid database structure. Expected "${join(
        fs.basePath,
        'db.json'
      )}" to contain an array of objects`
    )
  })

  test('fail when database entry is missing permalink', async ({ assert, fs }) => {
    await fs.create('db.json', JSON.stringify([{}]))

    const db = new Db(new URL('db.json', fs.baseUrl))
    await assert.rejects(async () => {
      await db.load()
    }, 'Invalid database entry at index "0". Missing "permalink"')
  })

  test('fail when database entry is missing contentPath', async ({ assert, fs }) => {
    await fs.create('db.json', JSON.stringify([{ permalink: '/', title: 'Hello world' }]))

    const db = new Db(new URL('db.json', fs.baseUrl))
    await assert.rejects(async () => {
      await db.load()
    }, 'Invalid database entry at index "0". Missing "contentPath"')
  })

  test('fail when database entry is missing title', async ({ assert, fs }) => {
    await fs.create('db.json', JSON.stringify([{ permalink: '/', contentPath: 'home.md' }]))

    const db = new Db(new URL('db.json', fs.baseUrl))
    await assert.rejects(async () => {
      await db.load()
    }, 'Invalid database entry at index "0". Missing "title"')
  })

  test('fail when duplicate permalinks are found', async ({ assert, fs }) => {
    await fs.create(
      'db.json',
      JSON.stringify([
        {
          permalink: '/',
          contentPath: 'home.md',
          title: 'Hello world',
        },
        {
          permalink: '/',
          contentPath: 'hi.md',
          title: 'Hi world',
        },
      ])
    )

    const db = new Db(new URL('db.json', fs.baseUrl))
    await assert.rejects(async () => {
      await db.load()
    }, 'Duplicate permalink "/" found at index "1"')
  })

  test('return database entries', async ({ assert, fs }) => {
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

    const db = new Db(new URL('db.json', fs.baseUrl))
    assert.deepEqual(await db.load(), [
      {
        permalink: '/hello',
        contentPath: join(fs.basePath, 'home.md'),
        title: 'Hello world',
      },
      {
        permalink: '/hi',
        contentPath: join(fs.basePath, 'hi.md'),
        title: 'Hi world',
      },
    ])
  })

  test('load db file from absolute file path', async ({ assert, fs }) => {
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

    const db = new Db(join(fs.basePath, 'db.json'))
    assert.deepEqual(await db.load(), [
      {
        permalink: '/hello',
        contentPath: join(fs.basePath, 'home.md'),
        title: 'Hello world',
      },
      {
        permalink: '/hi',
        contentPath: join(fs.basePath, 'hi.md'),
        title: 'Hi world',
      },
    ])
  })
})
