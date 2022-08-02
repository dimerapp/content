Dimer Content
> Manage metadata for docs

[![gh-workflow-image]][gh-workflow-url] [![typescript-image]][typescript-url] [![npm-image]][npm-url] [![license-image]][license-url]

> **Note**: This package is ESM only

Dimer content allows you to manage the metadata for docs. Following are some of the terms used by this package.

- **Zone**: You can think of a zones as multiple documentation areas on your website. For example: You can have one zone for `guides`, another zone for `API docs` and another zone for `tutorial`.
- **Version**: Each zone can have multiple versions. For example: You can have documentation for version `v4` and then separate docs for version `v5` and so on.
- **Categories and docs**: Within each version you can define a flat list of categories and docs.

## Usage
Install the package from the npm registry as follows:

```sh
npm i @dimerapp/content

# Yarn
yarn add @dimerapp/content
```

Next step is to import the `Store` class. You must use a single instance of a store through out the entire website.

```ts
import { Store } from '@dimerapp/content'
const store = new Store()
```

## Registering zones and versions.
Following is a minimal example for defining a zone, its version and some docs.

```ts
const guides = store.zone('guides')

guides
  .version('master')
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

## Lookup docs
You can lookup docs inside a given zone and version using the `lookup` method. Usually, you can extract the zone, the version and the permalink of the doc from the request URL.

```ts
const url = request.url
const [,zoneName,versionName,...permalink] = url.split('/')

const zone = store.zone(zoneName, false)
if (!zone) {
  return
}

const version = zone.version(versionName, false)
if (!version) {
  return
}

const doc = version.lookup(permalink.join('/'))
if (!doc) {
  return
}

return doc.render()
```

## Rendering docs
You can define a `render` function on the version to render the doc. The render function must return a string back, which is usually going to be HTML.

```ts
const guides = store.zone('guides')

guides
  .version('master')
  .setCategories([])
  .render(async (doc) => {
    // return HTML from here
  })
```

That's pretty much all this package does. The main goal of this package is to help you manage the metadata of docs using fluent API.

[typescript-image]: https://img.shields.io/badge/Typescript-294E80.svg?style=for-the-badge&logo=typescript
[typescript-url]:  "typescript"

[npm-image]: https://img.shields.io/npm/v/@dimerapp/content.svg?style=for-the-badge&logo=npm
[npm-url]: https://npmjs.org/package/@dimerapp/content "npm"

[license-image]: https://img.shields.io/npm/l/@dimerapp/content?color=blueviolet&style=for-the-badge
[license-url]: LICENSE.md "license"

[gh-workflow-image]: https://img.shields.io/github/workflow/status/dimerapp/content/test?style=for-the-badge
[gh-workflow-url]: https://github.com/dimerapp/content/actions/workflows/test.yml "Github actions"
