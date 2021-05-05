/*
 * @dimerapp/content
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import parse from 'parseurl'
import revHash from 'rev-hash'
import { readFile } from 'fs-extra'
import { Hooks } from '@poppinss/hooks'
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
   * A set of registered edge renderers. One can register multiple
   * renderers to render different parts of the page differently.
   * For example:
   *
   * - One renderer for docs.
   * - One for table of contents.
   */
  private edgeRenderers: { [name: string]: Renderer } = {
    dimerRenderer: new Renderer(),
  }

  /**
   * A collection of registered hooks
   */
  private hooks = new Hooks()

  /**
   * Cache store
   */
  private cacheStore: {
    [filePath: string]: {
      [hash: string]: MarkdownFile
    }
  } = {}

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
   * Find if uri is relative or not
   */
  private isRelativeFilePath(pathname: string) {
    return pathname.startsWith('./') || pathname.startsWith('../')
  }

  /**
   * Find if uri has a markdown extension or not
   */
  private isMarkdownFile(pathname: string) {
    return pathname.endsWith('.md')
  }

  /**
   * Apply macros to the markdown file
   */
  private async resolveUrls(file: MarkdownFile) {
    file.on('link', (node: mdastTypes.Link, $file) => {
      let { pathname, hash, search } = parse({ url: node.url })
      hash = hash || ''
      search = search || ''

      if (
        pathname &&
        this.isRelativeFilePath(pathname) &&
        this.isMarkdownFile(pathname) &&
        $file.filePath
      ) {
        const resolvedUrl = resolve(dirname($file.filePath), pathname)
        const doc = this.manager.getDocFromPath(resolvedUrl)

        /**
         * Report errors
         */
        if (!doc) {
          const message = $file.report(
            `Broken link to "${pathname}"`,
            node.position,
            'broken-md-reference'
          )
          message.fatal = true
          return
        }

        node.url = `${doc.path === $file.filePath ? '' : doc.url}${search}${hash}`
      }
    })
  }

  /**
   * Returns the compiled file from the cache
   */
  private getFromCache(hash: string, filePath?: string) {
    if (!filePath || !hash || this.manager.cachingStrategy !== 'markup') {
      return null
    }

    const fileCache = this.cacheStore[filePath]
    if (!fileCache) {
      return null
    }

    return fileCache[hash] || null
  }

  /**
   * Caches the compiled file instance
   */
  private setInCache(hash: string, file: MarkdownFile, filePath?: string) {
    if (!filePath || !hash || this.manager.cachingStrategy !== 'markup') {
      return null
    }

    this.cacheStore[filePath] = { [hash]: file }
  }

  /**
   * Process markdown content to the markdown file
   */
  private async processMarkdown(contents: string, filePath?: string) {
    const hash = this.manager.cachingStrategy === 'markup' ? revHash(contents) : ''

    /**
     * Get from cache when exists
     */
    const cachedFile = this.getFromCache(hash, filePath)
    if (cachedFile) {
      return cachedFile
    }

    const file = new MarkdownFile(contents, this.config.markdownOptions)
    file.filePath = filePath

    this.applyMacros(file)
    this.resolveUrls(file)
    await this.applyShiki(file)

    /**
     * Execute hooks and process file
     */
    await this.hooks.exec('before', 'compile', file, this)
    await file.process()
    await this.hooks.exec('after', 'compile', file, this)

    this.setInCache(hash, file, filePath)
    return file
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
   * Register a before hook
   */
  public before(
    event: 'compile',
    callback: (file: MarkdownFile, zone: this) => Promise<void> | void
  ): this {
    this.hooks.add('before', event, callback)
    return this
  }

  /**
   * Register an after hook
   */
  public after(
    event: 'compile',
    callback: (file: MarkdownFile, zone: this) => Promise<void> | void
  ): this {
    this.hooks.add('after', event, callback)
    return this
  }

  /**
   * Register custom renderers. It is recommended to prefix the
   * property name with `renderer`, since the renderers are
   * merged with the template state.
   */
  public renderer(name: string, renderer: Renderer): this {
    this.edgeRenderers[name] = renderer
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
          if (index === 0 && !landingDoc.url) {
            Object.assign(landingDoc, processedDoc)
          } else if (doc.isLandingDoc) {
            Object.assign(landingDoc, processedDoc)
          }

          treeCategory.docs.push(processedDoc)
        })
      })
    })

    this.config.docs = []
    this.manager.zonesTree[this.name] = this.groupsTree
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
  ): Promise<{ error: null; html: string } | { error: string; html: null }> {
    try {
      const fileContents = await readFile(doc.path, 'utf-8')
      const file = await this.processMarkdown(fileContents, doc.path)

      const html = await this.manager.view
        .share({
          ...this.edgeRenderers,
          groups: this.getGroups(),
          zones: this.manager.zonesTree,
          doc,
          file,
        })
        .render(this.config.template)

      return {
        html,
        error: null,
      }
    } catch (error) {
      return {
        error: error.message,
        html: null,
      }
    }
  }

  /**
   * Render raw markdown from raw string
   */
  public async renderRaw(
    contents: string
  ): Promise<{ error: null; html: string } | { error: string; html: null }> {
    try {
      const file = await this.processMarkdown(contents)

      const html = await this.manager.view
        .share({
          ...this.edgeRenderers,
          groups: this.getGroups(),
          zones: this.manager.zonesTree,
          file,
        })
        .render(this.config.template)

      return {
        html,
        error: null,
      }
    } catch (error) {
      return {
        error: error.message,
        html: null,
      }
    }
  }
}
