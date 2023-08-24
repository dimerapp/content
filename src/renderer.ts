/*
 * @dimerapp/content
 *
 * (c) DimerApp
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { Edge } from 'edge.js'
import { type RenderingPipeline } from '@dimerapp/edge'
import { type Theme, type IShikiTheme, type ILanguageRegistration, Shiki } from '@dimerapp/shiki'

import type { RenderingOptions } from './types.js'

/**
 * Renderers are used to define the markdown rendering config using a fluent
 * API.
 */
export class Renderer {
  #templateEngine?: Edge
  #templatePath?: string
  #shiki: Shiki = new Shiki()
  #renderingPipeline?: RenderingPipeline

  constructor()
  constructor(edge: Edge, renderingPipeline: RenderingPipeline)
  constructor(edge?: Edge, renderingPipeline?: RenderingPipeline) {
    this.#templateEngine = edge
    this.#renderingPipeline = renderingPipeline
  }

  /**
   * Define a custom code blocks theme to use for rendering the codeblocks.
   */
  codeBlocksTheme(theme: Theme | string | URL | IShikiTheme): this {
    this.#shiki.useTheme(theme)
    return this
  }

  /**
   * Register a custom VSCode language to use when rendering codeblocks
   */
  registerLanguage(language: ILanguageRegistration): this {
    this.#shiki.loadLanguage(language)
    return this
  }

  /**
   * Define an Edge template to use when converting AST to HTML via edge.
   */
  useTemplate(templatePath: string): this {
    if (!this.#templateEngine) {
      throw new Error(`Cannot use template without configuring a template engine first`)
    }

    this.#templatePath = templatePath
    return this
  }

  /**
   * Returns rendering options
   */
  getRenderingOptions(): RenderingOptions {
    if (this.#templateEngine) {
      if (!this.#templatePath) {
        throw new Error(
          'Missing template path. Use "renderer.useTemplate" method to assign a template'
        )
      }

      return {
        view: {
          engine: this.#templateEngine,
          template: this.#templatePath,
          pipeline: this.#renderingPipeline!,
        },
        shiki: this.#shiki,
      }
    }

    return {
      shiki: this.#shiki,
    }
  }
}
