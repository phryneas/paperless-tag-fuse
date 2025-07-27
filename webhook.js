import assert from 'node:assert';
import http, { Server } from 'node:http'
import url from 'node:url'
/**
 * @import {API} from './api'
 */

export class Webhook {
    /** @type {http.Server} */
    server
    constructor(
        /** @type {API} */
        api
    ) {
        this.server = http.createServer((req, res) => {
            if (!req.url) return;
            const parsedUrl = url.parse(req.url, true);

            try {
                switch (parsedUrl.pathname) {
                    case '/document/added':
                    case '/document/modified':
                        assert(typeof parsedUrl.query.id === "string")
                        return api.getDocument(parsedUrl.query.id).then(ok)
                    case '/document/deleted':
                        return api.getAllDocumentIds().then(ok)
                    case '/tag/added':
                    case '/tag/modified':
                    case '/tag/deleted':
                        return api.getTags().then(ok)
                    default:
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end('{}');
                }
            } catch (e) {
                console.error(e)
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end('{}');
            }
            function ok() {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end('{}');
            }
        });
    }
    listen(
        /** @type {number} */ port
    ) {
        this.server.listen(port);
        console.log(`
Listening on port ${port} for these webhooks:
/document/added?id=<id>
/document/modified?id=<id>
/document/deleted?id=<id>
/tag/added?id=<id>
/tag/modified?id=<id>
/tag/deleted?id=<id>
            `)
        process.once("SIGINT", () => {
            this.server.close()
        });
    }
}