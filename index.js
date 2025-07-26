import { readFile, writeFile } from 'node:fs/promises'
import { getAllData } from './api.js'
import { startFs } from './fuse.js'
import { existsSync } from 'node:fs'

const cache = '.cache.json'
if (!existsSync(cache)) {
    const {
        documents,
        tags
    } = await getAllData(process.env.BASE_URL, process.env.TOKEN)
    await writeFile(cache, JSON.stringify({ documents, tags }, null, 2), "utf-8")
}
const { documents, tags } = /** @type {Awaited<ReturnType<getAllData>>} */ (JSON.parse(await readFile(cache, "utf-8")))


startFs(process.env.TARGET_DIR, tags, documents.map(
    document => {
        return ({
            ...document,
            fileName: document.archived_file_name || document.media_filename,
            realPath: '/tmp/' + document.media_filename,
            created: new Date(document.created),
            added: new Date(document.added)
        })
    }
))