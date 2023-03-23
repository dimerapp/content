/*
 * @dimerapp/content
 *
 * (c) DimerApp
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { Shiki } from '@dimerapp/shiki'
import type { MarkdownFile } from '@dimerapp/markdown'
import type { DimerEdgeRenderer } from '@dimerapp/edge'
import type { Edge, EdgeRendererContract } from 'edge.js'

/**
 * Representation of an entry inside the collection database
 * file.
 */
export type DatabaseEntry = {
  permalink: string
  contentPath: string
  title: string
} & {
  [key: string]: any
}

/**
 * Rendering options returned by the "Renderer" class
 */
export type RenderingOptions = {
  view?: {
    engine: Edge
    template: string
    renderer: DimerEdgeRenderer
  }
  shiki: Shiki
}

/**
 * Hook callback for the renderer
 */
export type RendererHook = (
  mdFile: MarkdownFile,
  view?: EdgeRendererContract
) => void | Promise<void>
