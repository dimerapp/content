/*
 * @dimerapp/content
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'japa'
import { join } from 'path'
import { Edge } from 'edge.js'
import dedent from 'ts-dedent'
import { Filesystem } from '@poppinss/dev-utils'
import { ContentManager } from '../src/Content'

const fs = new Filesystem(join(__dirname, '__app'))

test.group('Content Manager', (group) => {
	group.afterEach(async () => {
		await fs.cleanup()
	})

	test('registering a zone without any options should not complain', async (assert) => {
		const manager = new ContentManager(fs.basePath, new Edge())
		const zone = manager.zone('guides')
		zone.register()

		assert.deepEqual(zone.getGroups(), [])
	})

	test('register docs in a zone', async (assert) => {
		const manager = new ContentManager(fs.basePath, new Edge())
		const zone = manager.zone('guides').docs([
			{
				name: 'Http',
				categories: [
					{
						name: 'Basics',
						docs: [
							{
								permalink: '/introduction',
								title: 'Introduction',
								contentPath: './foo.md',
							},
						],
					},
				],
			},
		])

		zone.register()
		assert.deepEqual(zone.getGroups(), [
			{
				name: 'Http',
				landingDoc: {
					url: '/guides/introduction',
					title: 'Introduction',
					zone: 'guides',
					category: 'Basics',
					group: 'Http',
					path: join(fs.basePath, './foo.md'),
				},
				categories: [
					{
						name: 'Basics',
						landingDoc: {
							url: '/guides/introduction',
							title: 'Introduction',
							zone: 'guides',
							category: 'Basics',
							group: 'Http',
							path: join(fs.basePath, './foo.md'),
						},
						docs: [
							{
								url: '/guides/introduction',
								title: 'Introduction',
								zone: 'guides',
								category: 'Basics',
								group: 'Http',
								path: join(fs.basePath, './foo.md'),
							},
						],
					},
				],
			},
		])
	})

	test('return error when urls are duplicate', async (assert) => {
		const manager = new ContentManager(fs.basePath, new Edge())
		const zone = manager.zone('guides').docs([
			{
				name: 'Http',
				categories: [
					{
						name: 'Basics',
						docs: [
							{
								permalink: '/introduction',
								title: 'Introduction',
								contentPath: './foo.md',
							},
						],
					},
					{
						name: 'Session',
						docs: [
							{
								permalink: '/introduction',
								title: 'Introduction',
								contentPath: './session.md',
							},
						],
					},
				],
			},
		])

		const fn = () => zone.register()
		assert.throw(
			fn,
			`Duplicate url "/guides/introduction" shared between "${join(
				fs.basePath,
				'session.md'
			)}" && "${join(fs.basePath, 'foo.md')}"`
		)
	})

	test('return error when urls are duplicate across zones', async (assert) => {
		const manager = new ContentManager(fs.basePath, new Edge())
		const zone = manager.zone('guides').docs([
			{
				name: 'Http',
				categories: [
					{
						name: 'Basics',
						docs: [
							{
								permalink: '/introduction',
								title: 'Introduction',
								contentPath: './foo.md',
							},
						],
					},
				],
			},
		])

		const zone1 = manager
			.zone('tutorials')
			.baseUrl('/guides')
			.docs([
				{
					name: 'Http',
					categories: [
						{
							name: 'Basics',
							docs: [
								{
									permalink: '/introduction',
									title: 'Introduction',
									contentPath: './foo.md',
								},
							],
						},
					],
				},
			])

		zone.register()
		const fn = () => zone1.register()

		assert.throw(
			fn,
			`Duplicate url "/guides/introduction" across multiple zones "tutorials" && "guides"`
		)
	})

	test('find a doc by url', async (assert) => {
		const manager = new ContentManager(fs.basePath, new Edge())
		const zone = manager.zone('guides').docs([
			{
				name: 'Http',
				categories: [
					{
						name: 'Basics',
						docs: [
							{
								permalink: '/introduction',
								title: 'Introduction',
								contentPath: './foo.md',
							},
							{
								permalink: '/session',
								title: 'Introduction',
								contentPath: './session.md',
							},
						],
					},
				],
			},
		])
		zone.register()

		assert.deepEqual(manager.getDoc('/guides/session'), {
			category: 'Basics',
			group: 'Http',
			path: join(fs.basePath, './session.md'),
			title: 'Introduction',
			url: '/guides/session',
			zone: 'guides',
		})
	})

	test('render a doc by url', async (assert) => {
		const manager = new ContentManager(fs.basePath, new Edge())
		const zone = manager.zone('guides').docs([
			{
				name: 'Http',
				categories: [
					{
						name: 'Basics',
						docs: [
							{
								permalink: '/introduction',
								title: 'Introduction',
								contentPath: './foo.md',
							},
							{
								permalink: '/session',
								title: 'Introduction',
								contentPath: './session.md',
							},
						],
					},
				],
			},
		])

		zone.register()

		await fs.add(
			'./session.md',
			dedent`
			# Hello world

			This is a paragraph
		`
		)

		const html = await manager.render('/guides/session')
		assert.equal(
			html,
			'<h1 id="hello-world"><a href="#hello-world" aria-hidden=true tabindex=-1><span class="icon icon-link"></span></a>Hello world</h1>\n<p>This is a paragraph</p>'
		)
	})

	test('render codeblocks', async (assert) => {
		const manager = new ContentManager(fs.basePath, new Edge())
		const zone = manager.zone('guides').docs([
			{
				name: 'Http',
				categories: [
					{
						name: 'Basics',
						docs: [
							{
								permalink: '/introduction',
								title: 'Introduction',
								contentPath: './foo.md',
							},
							{
								permalink: '/session',
								title: 'Introduction',
								contentPath: './session.md',
							},
						],
					},
				],
			},
		])

		zone.register()

		await fs.add(
			'./session.md',
			['This is a paragraph', '', '```ts', `import 'foo'`, '```'].join('\n')
		)

		const html = await manager.render('/guides/session')

		assert.equal(
			html,
			dedent`<p>This is a paragraph</p>
			<pre class="language-typescript" data-lines-count="1" style="background-color: #263238;"><code><div class="line"><span style="color: #89DDFF;">import</span><span style="color: #EEFFFF;"> </span><span style="color: #89DDFF;">&#x27;</span><span style="color: #C3E88D;">foo</span><span style="color: #89DDFF;">&#x27;</span></div></code></pre>`
		)
	})
})
