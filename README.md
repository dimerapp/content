Dimer Content

> Create markdown collections and snippets and later render them to HTML

[![gh-workflow-image]][gh-workflow-url] [![typescript-image]][typescript-url] [![npm-image]][npm-url] [![license-image]][license-url] [![snyk-image]][snyk-url]

> **Note**: This package is ESM only

Dimer content offers an API to create a collection of markdown files or define independent markdown snippets. Later, you can query the content files from the collection or snippets and render them to HTML.

The Markdown to HTML conversion process is powered by [@dimerapp/markdown](https://github.com/dimerapp/markdown), [@dimerapp/shiki](https://github.com/dimerapp/edge), and optionally you can use [@dimerapp/edge](https://github.com/dimerapp/edge) to render the AST to HTML using Edge templates.

Think of this package as a Swiss army knife for rendering Markdown to HTML with complete control over each Markdown node.

## Usage

Install the package from the npm packages registry.

```sh
npm i @dimerapp/content

yarn add @dimerapp/content
```

Let's start by creating a collection first. Each collection has a database file, a JSON file with one or more entries.

```ts
import { Collection } from '@dimerapp/content'

const docs = new Collection().db('./docs/db.json').urlPrefix('/docs')
await docs.boot()
```

The `docs.boot` method will load the database file from the disk and validates its contents. The JSON file must have an array of collection entries, and each must have the following properties.

- **permalink**: A unique URL for the collection entry.
- **title**: Human readable title for the collection entry.
- **contentPath**: The relative path to the markdown file.

```json
[
  {
    "permalink": "/introduction",
    "title": "Introduction",
    "contentPath": "./introduction.md"
  }
]
```

Once you have defined the collection, you can use the `findByPermalink` method to find entries and render them to HTML.

Following is a complete example of finding collection entries and rendering them during an HTTP request.

```ts
import { Collection } from '@dimerapp/content'
import { createServer } from 'node:http'
import { parse } from 'node:url'

const docs = new Collection().db('./docs/db.json').urlPrefix('/docs')
await docs.boot()

createServer((req, res) => {
  const { pathname } = parse(req.url, false)
  const entry = docs.findByPermalink(pathname)

  if (!entry) {
    res.statusCode = 404
    res.end('404')
    return
  }

  res.statusCode = 200
  res.setHeader('content-type', 'text/html')
  res.end(await entry.render())
})
```

The `entry.render` method will render the Markdown file to HTML. The real magic happens when you can control how the Markdown is rendered.

## Customize Markdown rendering

Use the Edge template engine and the [@dimer/edge](https://github.com/dimerapp/edge) package to customize markdown rendering.

#### Step 1. Install the required packages

```sh
npm i @dimerapp/edge edge.js
```

#### Step 2. Configure edge

The `edge.mount` method in the following example defines the root directory for finding templates.

```ts
import { Edge } from 'edge.js'
import { fileURLToPath } from 'node:url'
import { dimer, RenderingPipeline } from '@dimerapp/edge'
import { Collection, Renderer } from '@dimerapp/content'

const edge = new Edge()
const viewsDir = new URL('./views', import.meta.url)
edge.mount(fileURLToPath(viewsDir))
edge.use(dimer)
```

#### Step 3. Configure rendering pipeline

The rendering pipeline is used to hook into the Markdown AST to the HTML rendering process and use custom Edge components for rendering AST nodes.

```ts
import { Edge } from 'edge.js'
import { fileURLToPath } from 'node:url'
import { dimer, RenderingPipeline } from '@dimerapp/edge'
import { Collection, Renderer } from '@dimerapp/content'

const edge = new Edge()
const viewsDir = new URL('./views', import.meta.url)
edge.mount(fileURLToPath(viewsDir))
edge.use(dimer)

const pipeline = new RenderingPipeline()
const renderer = new Renderer(edge, pipeline)
```

#### Step 4. Pass renderer to the collection

Finally, we have to share the renderer instance with the collection and create a basic edge template to render the Markdown.

```ts
const renderer = new Renderer(edge, pipeline)

const collection = new Collection()
  .db('./content/db.json')
  .urlPrefix('/docs')
  .useRenderer(renderer)
  .useTemplate('docs')

await collection.boot()
```

```edge
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title></title>
</head>
<body>
  @!component('dimer_contents', { nodes: file.ast.children, pipeline })~
</body>
</html>
```

Once the initial setup is done, you can use the `collection.findByPermalink` method to find an entry and call the `entry.render` method to render the Markdown to HTML.

However, this time, you can use the `pipeline` instance to hook into the markdown rendering process.

In the following example, we check if an AST node has a CSS class `alert` and render an edge component `alert.edge` file. The `pipeline.component` method accepts the component file path as the first argument and its data as the second argument.

```ts
import { hasClass } from '@dimerapp/edge/utils'

const pipeline = new RenderingPipeline()
pipeline.use((node) => {
  if (hasClass(node, 'alert')) {
    return pipeline.component('alert', { node })
  }
})
```

Let's create the `alert.edge` template and write the following code inside it.

```edge
<div {{ dimer.utils.stringifyAttributes(node.properties) }}>
  <div class="alert_icon">
    @if(dimer.utils.hasClass('alert-info'))
      // Info icon svg
    @elseif(dimer.utils.hasClass('alert-tip'))
      // Tip icon svg
    @elseif(dimer.utils.hasClass('alert-warning'))
      // Warning icon svg
    @end
  </div>

  <div class="alert_contents">
    @!component('dimer_contents', { nodes: node.children, pipeline })~
  </div>
</div>
```

- The `node` is an AST node of the [HAST](https://github.com/syntax-tree/hast) syntax tree. It has the following properties.
  ```ts
  {
    type: 'element',
    tagName: 'div',
    properties: {
      className: ['alert', 'alert-tip'],
    },
    children: [
      // ...children nodes
    ]
  }
  ```
- The `dimer.utils.stringifyAttributes` method takes the `node.properties` object and converts it into a string of HTML attributes.
- Using the Edge conditionals, we render a different icon for each alert type.
- Finally, we use the `dimer_contents` component to render the children nodes of the alert node.

## Using a custom Shiki theme

Dimer content uses [Shiki](https://shiki.matsu.io/) for rendering code blocks, and you can define a custom theme using the `renderer.codeBlocksTheme` method.

See also: [List of inbuilt themes.](https://github.com/shikijs/shiki/blob/main/docs/themes.md#all-themes)

```ts
const renderer = new Renderer(edge, pipeline)

// Use an inbuilt theme
renderer.codeBlocksTheme('material-theme-palenight')

// Load custom them from a JSON file
renderer.codeBlocksTheme(new URL('./custom-theme.json', import.meta.url))
```

## Using custom language grammar

Register a custom VSCode language grammar file using the `renderer.registerLanguage` method.

See also: [List of inbuilt languages](https://github.com/shikijs/shiki/blob/main/docs/languages.md#all-languages)

```ts
const renderer = new Renderer(edge, pipeline)

Shiki.registerLanguage({
  scopeName: 'text.html.edge',
  id: 'edge',
  path: fileURLToPath(new URL('../edge.tmLanguage.json', import.meta.url)),
})
```

## Get all collection entries

You can get an array of collection entries using the `collection.all` method. The return value is an array of [CollectionEntry](https://github.com/dimerapp/content/blob/next/src/collection/collection_entry.ts) class instances.

```ts
const collection = new Collection().db('./content/db.json').urlPrefix('/docs')

await collection.boot()

console.log(collection.all())
```

## Linking between markdown files

When defining links in Markdown, you can link to Markdown files across all the collections, and Dimer content will replace the file path with the entry permalink.

In the following example, we create a link to the `./foo.md` file. However, this link will be replaced behind the scenes with the permalink of the `./foo.md` file defined inside the database JSON file.

```md
[Learn more](./foo.md)
```

## Snippets

Snippets are independent markdown files (without any collection) that you can register and render inside existing Edge templates.

For example, You are creating a homepage using HTML and want to display code examples. You can create a snippet for each code example and render it anywhere.

```ts
import { Snippet } from '@dimerapp/content'

const routeExampleFile = new URL('./routes.md', import.meta.url)
const routingExample = Snippet.create(routeExampleFile)

edge.render('home', {
  routingExample,
})
```

Inside the `home.edge` template, you can call the `routingExample.render` method to render the snippet to HTML.

```edge
{{{ await routingExample.render() }}}
```

Snippets can also be created from raw text. For example:

```ts
const routingExample = Snippet.createFromContents(`
router.get('posts', async ({ view }) => {
  return view.render('posts/index')
})

// Handle POST request
router.post('posts', async ({ request }) => {
  return request.body()
})
`)

edge.render('home', {
  routingExample,
})
```

[gh-workflow-image]: https://img.shields.io/github/actions/workflow/status/dimerapp/content/test.yml?style=for-the-badge
[gh-workflow-url]: https://github.com/dimerapp/content/actions/workflows/test.yml 'Github action'
[typescript-image]: https://img.shields.io/badge/Typescript-294E80.svg?style=for-the-badge&logo=typescript
[typescript-url]: "typescript"
[npm-image]: https://img.shields.io/npm/v/@dimerapp/content.svg?style=for-the-badge&logo=npm
[npm-url]: https://npmjs.org/package/@dimerapp/content 'npm'
[license-image]: https://img.shields.io/npm/l/@dimerapp/content?color=blueviolet&style=for-the-badge
[license-url]: LICENSE.md 'license'
[snyk-image]: https://img.shields.io/snyk/vulnerabilities/github/dimerapp/content?label=Synk%20Vulnerabilities&style=for-the-badge
[snyk-url]: https://snyk.io/test/github/dimerapp/content?targetFile=package.json 'snyk'
