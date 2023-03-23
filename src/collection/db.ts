/*
 * @dimerapp/content
 *
 * (c) DimerApp
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFile } from 'node:fs/promises'
import type { DatabaseEntry } from '../types.js'

/**
 * Abstraction to load collection entries from a JSON file and validates
 * each entry to have certain properties.
 */
export class Db {
  #filePath: string

  constructor(filePath: string | URL) {
    this.#filePath = typeof filePath === 'string' ? filePath : fileURLToPath(filePath)
  }

  /**
   * Loads the database JSON file to disk and validates the entries to have all
   * the required properties
   */
  async load(): Promise<DatabaseEntry[]> {
    const dbContents = await readFile(this.#filePath, 'utf8')
    const dbEntries = JSON.parse(dbContents)

    /**
     * Ensure the db.json file has a top level array
     */
    if (!Array.isArray(dbEntries)) {
      throw new Error(
        `Invalid database structure. Expected "${this.#filePath}" to contain an array of objects`
      )
    }

    const collectedPermalinks = new Set()

    /**
     * Validate each entry
     */
    dbEntries.forEach((entry, index) => {
      if (!entry.permalink) {
        throw new Error(`Invalid database entry at index "${index}". Missing "permalink"`)
      }
      if (!entry.title) {
        throw new Error(`Invalid database entry at index "${index}". Missing "title"`)
      }
      if (!entry.contentPath) {
        throw new Error(`Invalid database entry at index "${index}". Missing "contentPath"`)
      }
      if (collectedPermalinks.has(entry.permalink)) {
        throw new Error(`Duplicate permalink "${entry.permalink}" found at index "${index}"`)
      }

      entry.contentPath = join(dirname(this.#filePath), entry.contentPath)
      collectedPermalinks.add(entry.permalink)
    })

    collectedPermalinks.clear()
    return dbEntries
  }
}
