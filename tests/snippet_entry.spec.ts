/*
 * @dimerapp/content
 *
 * (c) DimerApp
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Edge } from 'edge.js'
import { join } from 'node:path'
import { test } from '@japa/runner'

import { Renderer } from '../src/renderer.js'
import { Snippet } from '../src/snippet/main.js'
import { SnippetEntry } from '../src/snippet/snippet_entry.js'

test.group('Snippet file', () => {
  test('render a markdown file to HTML', async ({ assert, fs }) => {
    await fs.create(
      'hello_world.md',
      ['# Hello world', '', 'This is a simple markdown file'].join('\n')
    )

    const entry = Snippet.create(join(fs.basePath, 'hello_world.md'))
    const html = await entry.render()
    assert.equal(
      html,
      [
        '<h1 id="hello-world"><a href="#hello-world" aria-hidden="true" tabindex="-1"><span class="icon icon-link"></span></a>Hello world</h1>',
        '<p>This is a simple markdown file</p>',
      ].join('\n')
    )
  })

  test('render raw contents to HTML', async ({ assert }) => {
    const entry = Snippet.createFromContents(
      ['# Hello world', '', 'This is a simple markdown file'].join('\n')
    )

    const html = await entry.render()
    assert.equal(
      html,
      [
        '<h1 id="hello-world"><a href="#hello-world" aria-hidden="true" tabindex="-1"><span class="icon icon-link"></span></a>Hello world</h1>',
        '<p>This is a simple markdown file</p>',
      ].join('\n')
    )
  })

  test('raise error when both snippet contents and contentPath are not provided', async ({
    assert,
  }) => {
    const entry = new SnippetEntry({})
    await assert.rejects(
      () => entry.render(),
      'Cannot render snippet. Make sure to define the snippet contents or the path to the snippet markdown file'
    )
  })

  test('render a markdown file to HTML using custom renderer', async ({ assert, fs }) => {
    await fs.create(
      'hello_world.md',
      ['# Hello world', '', '```ts', 'const a = 22', '```'].join('\n')
    )

    const renderer = new Renderer()
    renderer.codeBlocksTheme('nord')

    const entry = Snippet.create(join(fs.basePath, 'hello_world.md'))
    const html = await entry.useRenderer(renderer).render()
    assert.match(html, /background-color: #2e3440ff;/)
  })

  test('render a markdown file to HTML using edge template', async ({ assert, fs }) => {
    await fs.create(
      'hello_world.md',
      ['# Hello world', '', 'This is a simple markdown file'].join('\n')
    )

    await fs.create(
      'docs.edge',
      [
        '<html>',
        '',
        `@!component('dimer_contents', { nodes: file.ast.children, renderer })~`,
        '',
        '</html>',
      ].join('\n')
    )

    const renderer = new Renderer(new Edge().mount(fs.basePath))
    renderer.codeBlocksTheme('nord').useTemplate('docs.edge')

    const entry = Snippet.create(join(fs.basePath, 'hello_world.md'))
    const html = await entry.useRenderer(renderer).render()
    assert.equal(
      html,
      [
        '<html>',
        '<h1 id="hello-world"><a href="#hello-world" aria-hidden=true tabindex=-1><span class="icon icon-link"></span></a>Hello world</h1>',
        '<p>This is a simple markdown file</p>',
        '</html>',
      ].join('\n')
    )
  })

  test('tap into AST rendering pipeline', async ({ assert, fs }) => {
    await fs.create(
      'hello_world.md',
      ['# Hello world', '', 'This is a simple markdown file'].join('\n')
    )

    await fs.create(
      'docs.edge',
      [
        '<html>',
        '',
        '<h1> {{ file.frontmatter.title }} </h1>',
        `@!component('dimer_contents', { nodes: file.ast.children, renderer })~`,
        '',
        '</html>',
      ].join('\n')
    )

    const renderer = new Renderer(new Edge().mount(fs.basePath))
    renderer
      .codeBlocksTheme('nord')
      .useTemplate('docs.edge')
      .tap((node) => {
        if (node.tagName === 'h1') {
          return false
        }
      })

    const entry = Snippet.create(join(fs.basePath, 'hello_world.md'))
    const html = await entry
      .useRenderer(renderer)
      .rendering((file) => {
        file.frontmatter.title = 'Hello universe'
      })
      .render()

    assert.equal(
      html,
      [
        '<html>',
        '',
        '<h1> Hello universe </h1>',
        '<p>This is a simple markdown file</p>',
        '</html>',
      ].join('\n')
    )
  })
})
