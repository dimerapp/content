/*
 * @dimerapp/content
 *
 * (c) DimerApp
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { SnippetEntry } from './snippet_entry.js'

/**
 * Affordance to create snippet entry from either the content
 * file or the raw contents.
 */
export class Snippet {
  static create(filePath: string) {
    return new SnippetEntry({ contentPath: filePath })
  }

  static createFromContents(contents: string) {
    return new SnippetEntry({ contents })
  }
}
