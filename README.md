Dimer Content
> Manage metadata for docs

[![gh-workflow-image]][gh-workflow-url] [![typescript-image]][typescript-url] [![npm-image]][npm-url] [![license-image]][license-url]

> **Note**: This package is ESM only

Dimer content allows you to manage the metadata for docs. Following are some of the terms used by this package.

- **Zone**: You can think of zones as multiple documentation areas on your website. For example, You can have one zone for `guides`, another zone for `API docs`, and another zone for `tutorial`.
- **Version**: Each zone can have multiple versions. For example, You can have documentation for version `v4` and then separate docs for version `v5` and so on. You can define a single `main` version if you don't need multiple versions.
- **Categories and docs**: You can define a flat list of categories and docs within each version.
- **Pages collection**: Define a set of markdown-driven pages at the top level or within a zone.

## Usage
Install the package from the npm registry as follows:

```sh
npm i @dimerapp/content

# Yarn
yarn add @dimerapp/content
```

The next step is to import the `Store` class. You must use a single instance of a store throughout the entire website.

```ts
import { Store } from '@dimerapp/content'
const store = new Store()
```

## Registering zones and versions
Following is a minimal example for defining a zone, its version, and some docs.

```ts
const guides = store.zone('guides')

guides
  .version('main')
  .setCategories([
    {
      name: 'HTTP',
      docs: [
        {
          title: 'Routing',
          permalink: 'http/routing',
          contentPath: './routing.md'
        }
      ]
    }
  ])
```

## Defining the render function
When registering a new version, you must define a `render` function, which is called when rendering the doc.

```ts
guides
  .version('main')
  .setCategories([])
  .render(async (doc) => {
    console.log(doc)
    // Render doc and return HTML
  })
```

## Development HTTP server
Once you have registered a zone and defined the render function, you can start the development HTTP server using the `create_server` script.

```ts
import { store } from './store.js'
import './zones/docs/index.js'
import { createServer } from '@dimerapp/content/scripts/create_server'

createServer(store, {}).listen(3000, () => {
  console.log('Listening on http://localhost:3000')
})
```

The HTTP server will use the `store` instance to lookup the docs based on the request URL. For example: The `/guides/main/http/routing` route will call the `render` function to render the `routing.md` doc.

## Production build
You can create the production build using the `build` script. The production build is a collection of static HTML files, and thefore you can host it on any CDN server.

```ts
import { store } from './store.js'
import './zones/docs/index.js'

import { fileURLToPath } from 'node:url'
import { build } from '@dimerapp/content/scripts/build'

const outputPath = fileURLToPath(new URL('./public', import.meta.url))
await build(store, {}, outputPath)
```

## Markdown driven pages
Apart from registering versions and docs, you can also register pages with content written using markdown.

You can register the pages at the top level within the store.

```ts
store
  .pages([
    {
      title: 'Why AdonisJS?',
      permalink: 'why-adonisjs',
      contentPath: './why-adonisjs.md'
    }
  ])
  .render(async (page) => {
    console.log(page)
    // Render page markdown and return HTML
  })
```

You can register the pages at the zone level as well.

```ts
const features = store.zone('features')

features
  .pages([
    {
      title: 'SQL ORM',
      permalink: 'sql-orm',
      contentPath: './sql-orm.md'
    },
    {
      title: 'Validator',
      permalink: 'validator',
      contentPath: './validator.md'
    },
    {
      title: 'Ace commandline',
      permalink: 'ace-cli',
      contentPath: './ace-cli.md'
    }
  ])
  .render(async (page) => {
    console.log(page)
    // Render page markdown and return HTML
  })
```

## Custom pages
Finally, you can register a set of pages with a callback. The callback method can be async and must return the HTML to display in the response.

```ts
import { store } from './store.js'
import './zones/docs/index.js'
import { build } from '@dimerapp/content/scripts/build'
import { createServer } from '@dimerapp/content/scripts/create_server'

const pages = {
  '/': () => {
    return 'home page'
  },
  '/team': () => {
    return 'team page'
  }
}

createServer(store, pages).listen(3000, () => {
  console.log('Listening on http://localhost:3000')
})

await build(store, pages, outputPath)
```


[typescript-image]: https://img.shields.io/badge/Typescript-294E80.svg?style=for-the-badge&logo=typescript
[typescript-url]:  "typescript"

[npm-image]: https://img.shields.io/npm/v/@dimerapp/content.svg?style=for-the-badge&logo=npm
[npm-url]: https://npmjs.org/package/@dimerapp/content "npm"

[license-image]: https://img.shields.io/npm/l/@dimerapp/content?color=blueviolet&style=for-the-badge
[license-url]: LICENSE.md "license"

[gh-workflow-image]: https://img.shields.io/github/workflow/status/dimerapp/content/test?style=for-the-badge
[gh-workflow-url]: https://github.com/dimerapp/content/actions/workflows/test.yml "Github actions"
