/*
 * @dimerapp/content
 *
 * (c) DimerApp
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { Edge } from 'edge.js'
import type { Shiki } from '@dimerapp/shiki'
import type { MarkdownFile } from '@dimerapp/markdown'
import type { RenderingPipeline } from '@dimerapp/edge'
import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * Representation of an entry inside the collection database
 * file.
 */
export type DatabaseEntry = {
  absolute?: boolean
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
    pipeline: RenderingPipeline
  }
  shiki: Shiki
}

/**
 * Hook callback for the renderer
 */
export type RendererHook = (
  mdFile: MarkdownFile,
  view?: ReturnType<Edge['createRenderer']>
) => void | Promise<void>

/**
 * Callback function to render a page
 */
export type PageRenderer = (req: IncomingMessage, res: ServerResponse) => string | Promise<string>
