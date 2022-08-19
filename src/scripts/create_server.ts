/*
 * @dimerapp/content
 *
 * (c) Harminder Virk
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { createServer as httpServer, Server, ServerResponse } from 'node:http'
import { Store } from '../store.js'

/**
 * Sends the HTTP response
 */
function respond(res: ServerResponse, content: string, statusCode = 200) {
  res.statusCode = statusCode
  res.setHeader('content-type', 'text/html')
  res.end(content)
}

/**
 * Create HTTP server to render docs on-demand during development
 */
export function createServer(
  store: Store,
  pages: Record<string, () => string | Promise<string>>
): Server {
  if (!pages['404']) {
    pages['404'] = function () {
      return 'Page not found'
    }
  }

  return httpServer(async (req, res) => {
    try {
      /**
       * Render the custom page if defined
       */
      const page = pages[req.url!]
      if (page) {
        return respond(res, await page())
      }

      const segments = req.url!.split('/').slice(1)

      /**
       * If the URL is registered as a top level page
       * then render it
       */
      const storePage = store.pages().lookup(segments.join('/'))
      if (storePage) {
        return respond(res, await storePage.render())
      }

      /**
       * Check if the zone exists. If not, then respond with 404
       */
      const zone = store.zone(segments.shift()!, false)
      if (!zone) {
        return respond(res, await pages['404'](), 404)
      }

      /**
       * Render the page if the URL is registered as a top level
       * page within a zone
       */
      const zonePage = zone.pages().lookup(segments.join('/'))
      if (zonePage) {
        return respond(res, await zonePage.render())
      }

      /**
       * Otherwise check if a version for the next segment
       * exists. If not, respond with a 404
       */
      const version = zone.version(segments.shift()!, false)
      if (!version) {
        return respond(res, await pages['404'](), 404)
      }

      /**
       * Lookup for the doc inside the version
       */
      const doc = version.lookup(segments.join('/'))
      if (!doc) {
        return respond(res, await pages['404'](), 404)
      }

      respond(res, await doc.render())
    } catch (error) {
      respond(res, error.stack, 500)
    }
  })
}
