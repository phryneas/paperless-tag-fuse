#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises'
import { API } from './api.js'
import { startFs } from './fuse.js'
import { existsSync } from 'node:fs'
import { join } from 'node:path';

import dotenvx from "@dotenvx/dotenvx";
dotenvx.config({ path: ['.env.local', '.env'] });

const cache = process.env.CACHE_FILE
if (!existsSync(cache)) {
    const api = new API(process.env.BASE_URL, process.env.TOKEN)
    const {
        documents,
        tags
    } = await api.getAllData()
    await writeFile(cache, JSON.stringify({ documents, tags }, null, 2), "utf-8")
}
const { documents, tags } = /** @type {Awaited<ReturnType<API['getAllData']>>} */ (JSON.parse(await readFile(cache, "utf-8")))


startFs(process.env.TARGET_DIR, tags, documents.map(
    document => {
        return ({
            ...document,
            fileName: document.archived_file_name || document.media_filename,
            realPath: join(process.env.MEDIA_ARCHIVE_ROOT, document.media_filename),
            created: new Date(document.created),
            added: new Date(document.added)
        })
    }
))