/*
 * @dimerapp/content
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { readFile } from 'fs-extra'
import { Renderer } from '@dimerapp/edge'
import { join, resolve, dirname } from 'path'
import { ShikiRenderer } from '@dimerapp/shiki'
import { MarkdownFile, MarkdownFileOptions, macros, mdastTypes } from '@dimerapp/markdown'

import { ContentManager } from '../Content'
import { GroupNode, GroupTree, ProcessedDoc } from '../Contracts'

/**
 * Default options used when rendering markdown
 */
const DEFAULT_MARKDOWN_OPTIONS: MarkdownFileOptions = {
	allowHtml: true,
	enableDirectives: true,
	generateToc: true,
	tocDepth: 3,
}

/**
 * Zone represents a section of docs on your website
 */
export class Zone<Options extends any> {
	private config: {
		baseUrl: string
		docs: GroupNode[]
		template: string
		markdownOptions: MarkdownFileOptions
		baseContentPath?: string
	} = {
		baseUrl: this.name,
		docs: [],
		template: 'dimer::base_template',
		markdownOptions: DEFAULT_MARKDOWN_OPTIONS,
	}

	/**
	 * Track if register method has been called or not
	 */
	private registered: boolean = false

	/**
	 * Tree created from the docs
	 */
	private groupsTree: GroupTree[] = []

	/**
	 * Shiki renderer for rendering codeblocks
	 */
	private shiki = new ShikiRenderer(this.appRoot)

	/**
	 * Edge renderer to render dimer markdown ast using edge
	 */
	private edgeRenderer = new Renderer()

	constructor(
		private name: string,
		private appRoot: string,
		private manager: ContentManager,
		public options?: Options
	) {}

	/**
	 * Normalize slashes inside a url
	 */
	private normalizeUrl(url: string): string {
		return `/${url
			.replace(/\/{2,}/g, '/')
			.replace(/\/$/, '')
			.replace(/^\//, '')}`
	}

	/**
	 * Makes complete url to a given doc.
	 */
	private makeUrl(permalink: string, prefix?: string): string {
		let url = this.config.baseUrl
		if (prefix) {
			url = `${url}/${prefix}`
		}

		url = `${url}/${permalink}`
		return this.normalizeUrl(url)
	}

	/**
	 * Makes absolute path to the doc file.
	 */
	private makePath(docPath: string): string {
		return this.config.baseContentPath
			? join(this.appRoot, this.config.baseContentPath, docPath)
			: join(this.appRoot, docPath)
	}

	/**
	 * Apply macros to the markdown file
	 */
	private applyMacros(file: MarkdownFile) {
		if (file.options.enableDirectives) {
			Object.keys(macros).forEach((name) => macros[name](file))
		}
	}

	/**
	 * Apply macros to the markdown file
	 */
	private async applyShiki(file: MarkdownFile) {
		await this.shiki.boot()
		file.transform(this.shiki.transform)
	}

	/**
	 * Apply macros to the markdown file
	 */
	private async resolveUrls(file: MarkdownFile) {
		file.on('link', (node: mdastTypes.Link, $file) => {
			if (
				node.url &&
				(node.url.startsWith('./') || node.url.startsWith('../')) &&
				node.url.endsWith('.md') &&
				$file.filePath
			) {
				const resolvedUrl = resolve(dirname($file.filePath), node.url)
				const doc = this.manager.getDocFromPath(resolvedUrl)

				/**
				 * Report errors
				 */
				if (!doc) {
					const message = $file.report(
						`Broken link to "${node.url}"`,
						node.position,
						'broken-md-reference'
					)
					message.fatal = true
					return
				}

				node.url = doc.path === $file.filePath ? '' : doc.url
			}
		})
	}

	/**
	 * Define the base url for docs
	 */
	public baseUrl(url: string): this {
		this.config.baseUrl = url
		return this
	}

	/**
	 * Define the base content path for the zone. Doc
	 * links must be relative to this path
	 */
	public baseContentPath(contentPath: string): this {
		this.config.baseContentPath = contentPath
		return this
	}

	/**
	 * Define markdown options
	 */
	public markdownOptions(options: MarkdownFileOptions): this {
		this.config.markdownOptions = options
		return this
	}

	/**
	 * Load a custom shiki language
	 */
	public loadLanguage(
		...args: Parameters<InstanceType<typeof ShikiRenderer>['loadLanguage']>
	): this {
		this.shiki.loadLanguage(...args)
		return this
	}

	/**
	 * Load a custom shiki theme
	 */
	public loadTheme(...args: Parameters<InstanceType<typeof ShikiRenderer>['loadTheme']>): this {
		this.shiki.loadTheme(...args)
		return this
	}

	/**
	 * Use a custom shiki them
	 */
	public useTheme(...args: Parameters<InstanceType<typeof ShikiRenderer>['useTheme']>): this {
		this.shiki.useTheme(...args)
		return this
	}

	/**
	 * Register a group of docs. We allow two level of nesting
	 *
	 * Group > Category > Doc
	 */
	public docs(docs: GroupNode[]): this {
		this.config.docs = docs
		return this
	}

	/**
	 * Define base template for rendering the doc
	 */
	public template(templatePath: string): this {
		this.config.template = templatePath
		return this
	}

	/**
	 * Register zone
	 */
	public register() {
		if (this.registered) {
			return
		}

		this.registered = true

		/**
		 * Collecting group names to avoid duplicates
		 */
		const groupNames: string[] = []

		/**
		 * Loop over doc groups and collect all the file paths and urls
		 */
		this.config.docs.forEach((group) => {
			if (groupNames.includes(group.name)) {
				throw new Error(`Duplicate group "${group.name}" in "${this.name}" zone`)
			}

			groupNames.push(group.name)

			/**
			 * Collecting category names to avoid duplicates
			 */
			let categoryNames: string[] = []

			/**
			 * Landing doc for the group and the categories
			 */
			let landingDoc = {} as any

			/**
			 * Create the tree group node
			 */
			const treeGroup: GroupTree = {
				name: group.name,
				landingDoc,
				categories: [],
			}
			this.groupsTree.push(treeGroup)

			group.categories.forEach((category) => {
				if (categoryNames.includes(category.name)) {
					throw new Error(`Duplicate category "${category.name}" in "${this.name}" zone`)
				}

				/**
				 * Create the tree category node
				 */
				const treeCategory: GroupTree['categories'][0] = {
					name: category.name,
					docs: [],
					landingDoc,
				}

				treeGroup.categories.push(treeCategory)

				category.docs.forEach((doc, index) => {
					const absPath = this.makePath(doc.contentPath)
					const url = this.makeUrl(doc.permalink, group.baseUrl)

					const processedDoc = {
						url,
						title: doc.title,
						path: absPath,
						zone: this.name,
						category: category.name,
						group: group.name,
					}

					this.manager.collectDoc(processedDoc)

					/**
					 * Update landing doc
					 */
					if (doc.isLandingDoc || index === 0) {
						Object.assign(landingDoc, processedDoc)
					}

					treeCategory.docs.push(processedDoc)
				})
			})
		})
	}

	/**
	 * Get groups tree
	 */
	public getGroups() {
		return this.groupsTree
	}

	/**
	 * Returns an array of categories for a given group or null
	 * when group for the given name is missing
	 */
	public getCategories(groupName: string) {
		const group = this.groupsTree.find(({ name }) => name === groupName)
		if (!group) {
			return null
		}

		return group.categories
	}

	/**
	 * Returns an array of categories for a given group
	 */
	public getDocs(groupName: string, categoryName: string) {
		const categories = this.getCategories(groupName)
		if (!categories) {
			return null
		}

		const category = categories.find(({ name }) => name === categoryName)
		if (!category) {
			return null
		}

		return category.docs
	}

	/**
	 * Render doc for a given url
	 */
	public async render(
		doc: ProcessedDoc
	): Promise<{ error: null; html: string } | { error: any; html: null }> {
		try {
			const fileContents = await readFile(doc.path, 'utf-8')
			const file = new MarkdownFile(fileContents, this.config.markdownOptions)
			file.filePath = doc.path

			this.applyMacros(file)
			this.resolveUrls(file)
			await this.applyShiki(file)

			await file.process()

			const html = this.manager.view
				.share({ dimerRenderer: this.edgeRenderer, groups: this.getGroups(), doc })
				.render(this.config.template, { file })

			return {
				html,
				error: null,
			}
		} catch (error) {
			return {
				error,
				html: null,
			}
		}
	}
}
