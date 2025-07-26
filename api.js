import { Agent } from 'undici';

export async function getAllData(
  /** @type {string} */ base,
  /** @type {string} */ token
) {

  async function json(url, options = {}) {
    /** @type {RequestInit} */
    const requestOptions = { ...options }
    if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
      // @ts-ignore
      requestOptions.dispatcher = new Agent({
        connect: {
          rejectUnauthorized: false,
        },
      });
    }
    const headers = new Headers(options.headers)
    headers.set("Authorization", `Token ${token}`)
    requestOptions.headers = headers

    try {
      console.log(`${base}/api/${url}`)
      const result = await (fetch(`${base}/api/${url}`, requestOptions))
      if (!result.ok) {
        throw new Error(result.statusText)
      }
      return result.json()
    } catch (e) {
      const err = new Error(`Error while fetching ${url} with options ${JSON.stringify(options)}`)
      err.cause = e
      throw err
    }
  }

  /**
   * @typedef {object} Tag
   * @property {number} id
   * @property {string} slug
   * @property {string} name
   */

  /** @type {Array<Tag>} */
  const tags = (await json(`tags/?page_size=1000`)).results


  async function getDocumentInfo(/** @type {string} */ id) {
    /** @type {{
     * id: number
     * tags: number[]
     * archived_file_name: string
     * created: string
     * modified: string
     * added: string
     * }} */
    const document = await json(`documents/${id}/`);
    const {
      tags, added, archived_file_name, created, modified
    } = document

    /** @type {{
     * media_filename: string
     * original_filename: string
     * }} */
    const metadata = await json(`documents/${id}/metadata/`);
    const {
      media_filename,
      original_filename
    } = metadata

    return {
      id, archived_file_name, media_filename, original_filename, tags, added, created, modified
    }
  }

  const documents = []
  const allDocs = await json("documents/")
  for (const id of allDocs.all) {
    documents.push(await getDocumentInfo(id))
  }

  return {
    documents, tags
  }
}