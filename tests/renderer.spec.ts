/*
 * @dimerapp/content
 *
 * (c) DimerApp
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Edge } from 'edge.js'
import { test } from '@japa/runner'
import { Renderer } from '../src/renderer.js'
import { RenderingPipeline } from '@dimerapp/edge'

test.group('Renderer', () => {
  test('get rendering options without configuring template engine', async ({ assert }) => {
    const renderingOptions = new Renderer().getRenderingOptions()
    assert.notProperty(renderingOptions, 'view')
    assert.property(renderingOptions, 'shiki')
  })

  test('get rendering options with template engine', async ({ assert }) => {
    const edge = new Edge()
    const renderingOptions = new Renderer(edge, new RenderingPipeline())
      .useTemplate('docs.edge')
      .getRenderingOptions()

    assert.properties(renderingOptions, ['view', 'shiki'])
    assert.strictEqual(renderingOptions.view!.engine, edge)
    assert.equal(renderingOptions.view!.template, 'docs.edge')
  })

  test('fail when trying to configure template without engine', async ({ assert }) => {
    assert.throws(
      () => new Renderer().useTemplate('docs.edge'),
      'Cannot use template without configuring a template engine first'
    )
  })

  test('fail when not template is registered', async ({ assert }) => {
    const edge = new Edge()
    assert.throws(
      () => new Renderer(edge, new RenderingPipeline()).getRenderingOptions(),
      'Missing template path. Use "renderer.useTemplate" method to assign a template'
    )
  })
})
