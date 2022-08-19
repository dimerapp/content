/*
 * @dimerapp/content
 *
 * (c) Harminder Virk
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

export type Category = {
  name: string
  docs: Doc[]
}

export type Doc = {
  permalink: string
  contentPath: string
  title: string
}

export type Page = Doc

export type LookupDoc = Doc & {
  url: string
  makeUrl(permalink: string): string
  version: { name: string; slug: string }
  zone: { name: string; slug: string }
  category: string
  categories: Category[]
}

export type LookupPage = Page & {
  url: string
  makeUrl(permalink: string): string
  zone?: { name: string; slug: string }
}
