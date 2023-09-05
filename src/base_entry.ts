/*
 * @dimerapp/content
 *
 * (c) DimerApp
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { Edge } from 'edge.js'
import { codeblocks } from '@dimerapp/shiki'
import { toHtml } from '@dimerapp/markdown/utils'
import { MarkdownFile } from '@dimerapp/markdown'
import * as macros from '@dimerapp/markdown/macros'

import { Renderer } from './renderer.js'
import type { RendererHook } from './types.js'
import { MarkdownFileOptions } from '@dimerapp/markdown/types'

/**
 * The default shiki renderer to use when no custom renderer
 * is defined.
 */
const DEFAULT_RENDERER = new Renderer()

/**
 * Base entry class abstracts the repetitive parts of rendering
 * a markdown file to HTML
 */
export abstract class BaseEntry {
  abstract contentPath?: string
  protected abstract getFileContents(): Promise<string> | string
  protected prepare?(mdFile: MarkdownFile, view?: ReturnType<Edge['createRenderer']>): Promise<void>

  /**
   * Options passed to the markdown file
   */
  #markdownOptions: MarkdownFileOptions = {
    allowHtml: true,
    enableDirectives: true,
    generateToc: true,
    tocDepth: 3,
  }

  /**
   * Registered hooks
   */
  #hooks: {
    rendering: Set<RendererHook>
  } = {
    rendering: new Set(),
  }

  /**
   * A custom renderer to use when rendering the content file. If not
   * defined, we will do a standard markdown to HTML conversion
   */
  #renderer: Renderer = DEFAULT_RENDERER

  /**
   * Load markdown file contents and create an instance of the
   * MarkdownFile.
   */
  async #load() {
    const md = new MarkdownFile(await this.getFileContents(), {
      ...this.#markdownOptions,
      filePath: this.contentPath,
    })

    md.use(macros.codegroup)
    md.use(macros.codesandbox)
    md.use(macros.note)
    md.use(macros.tip)
    md.use(macros.warning)
    md.use(macros.video)
    md.use(macros.youtube)
    md.macro('caption', function (node: any) {
      node.data = node.data || {}
      node.data.hName = 'div'
      node.data.hProperties = {
        className: ['caption', `caption-${node.attributes.for}`],
      }
    })

    return md
  }

  /**
   * Set markdown options for markdown files
   */
  setMarkdownOptions(options: MarkdownFileOptions): this {
    this.#markdownOptions = { ...this.#markdownOptions, ...options }
    return this
  }

  /**
   * Define a custom renderer to use to render the markdown file.
   */
  useRenderer(renderer: Renderer) {
    this.#renderer = renderer
    return this
  }

  /**
   * Register a callback to hook into the markdown rendering processing
   */
  rendering(callback: RendererHook): this {
    this.#hooks.rendering.add(callback)
    return this
  }

  /**
   * Render collection entry
   */
  async render(state?: Record<string, any>): Promise<string> {
    const file = await this.#load()

    /**
     * Use rendering options
     */
    const { shiki, view } = this.#renderer.getRenderingOptions()
    const viewInstance = view ? view.engine.createRenderer() : undefined
    await shiki.boot()

    /**
     * Executing hooks before processing the markdown file
     */
    for (let hook of this.#hooks.rendering) {
      await hook(file, viewInstance)
    }

    /**
     * Invoking the prepare template method
     */
    if (this.prepare) {
      await this.prepare(file, viewInstance)
    }

    file.transform(codeblocks, shiki)
    await file.process()

    /**
     * Render to HTML without edge template
     */
    if (!viewInstance || !view) {
      return toHtml(file).contents
    }

    /**
     * Use edge for converting markdown AST to HTML
     */
    return viewInstance.render(view.template, {
      file,
      pipeline: view.pipeline,
      ...state,
    })
  }
}
