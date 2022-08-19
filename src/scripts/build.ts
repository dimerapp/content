/*
 * @dimerapp/content
 *
 * (c) Harminder Virk
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'node:path'
import { outputFile } from 'fs-extra'
import { logger } from '@poppinss/cliui'

import { Store } from '../store.js'
import { Version } from '../version.js'
import { PagesCollection } from '../pages_collection.js'

/**
 * Writes the file to the disk
 */
async function write(options: { basePath: string; permalink: string }, content: string) {
  await outputFile(join(options.basePath, `${options.permalink}.html`), content)
  logger.action('create').succeeded(`${options.permalink}.html`)
}

/**
 * Builds docs for a given version
 */
async function buildVersionDocs(version: Version, outputPath: string) {
  for (const category of version.categories) {
    for (const doc of category.docs) {
      const lookupDoc = version.lookup(doc.permalink)!

      try {
        const contents = await lookupDoc.render()
        await write({ basePath: outputPath, permalink: lookupDoc.makeUrl(doc.permalink) }, contents)
      } catch (error) {
        logger.action('create').failed(lookupDoc.makeUrl(doc.permalink), error.message)
      }
    }
  }
}

/**
 * Build pages inside a pages collection
 */
async function buildPages(pagesCollection: PagesCollection, outputPath: string) {
  for (const page of pagesCollection.pages) {
    const lookupPage = pagesCollection.lookup(page.permalink)!

    try {
      const contents = await lookupPage.render()
      await write({ basePath: outputPath, permalink: lookupPage.makeUrl(page.permalink) }, contents)
    } catch (error) {
      logger.action('create').failed(lookupPage.makeUrl(page.permalink), error.message)
    }
  }
}

/**
 * Build pages inside a pages collection
 */
async function buildCustomPages(
  pages: Record<string, () => string | Promise<string>>,
  outputPath: string
) {
  for (const page of Object.keys(pages)) {
    try {
      const contents = await pages[page]()
      await write({ basePath: outputPath, permalink: page === '/' ? 'index' : page }, contents)
    } catch (error) {
      logger.action('create').failed(page === '/' ? 'index' : page, error.message)
    }
  }
}

/**
 * Create a static build for all the pages and docs inside the store
 */
export async function build(
  store: Store,
  pages: Record<string, () => string | Promise<string>>,
  outputPath: string
) {
  if (!pages['404']) {
    pages['404'] = function () {
      return 'Page not found'
    }
  }

  try {
    for (const zone of store.zones) {
      /**
       * Build version docs
       */
      for (const version of zone.versions) {
        await buildVersionDocs(version, outputPath)
      }

      /**
       * Build zone pages
       */
      await buildPages(zone.pages(), outputPath)
    }

    /**
     * Render all top level store pages
     */
    await buildPages(store.pages(), outputPath)

    /**
     * Render all custom pages
     */
    await buildCustomPages(pages, outputPath)
  } catch (error) {
    logger.fatal(error)
  }
}
