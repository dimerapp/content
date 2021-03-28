/*
 * @dimerapp/content
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

export type GroupNode = {
  name: string
  baseUrl?: string
  categories: {
    name: string
    docs: {
      permalink: string
      title: string
      contentPath: string
      isLandingDoc?: boolean
    }[]
  }[]
}

/**
 * Doc node after processing the group node
 */
export type ProcessedDoc = {
  title: string
  url: string // Unique across all the zones
  path: string
  zone: string
  group: string
  category: string
}

/**
 * Tree after register all the docs in a zone
 */
export type GroupTree = {
  name: string
  landingDoc: ProcessedDoc
  categories: {
    name: string
    landingDoc: ProcessedDoc
    docs: ProcessedDoc[]
  }[]
}
