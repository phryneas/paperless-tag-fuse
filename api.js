import { Agent } from 'undici';

/**
 * @typedef {{
 * id: number
 * slug: string
 * name: string
 * }} Tag
 */

/** 
 * @typedef {{
 * id: number
 * tags: number[]
 * archived_file_name: string
 * created: string
 * modified: string
 * added: string
 * }} ApiDocument 
 */

/** 
 * @typedef  {{
 * media_filename: string
 * original_filename: string
 * }} ApiDocumentMetadata
 */

export class API {
  /** @type {string} */
  base
  /** @type {string} */
  token

  constructor(
    /** @type {string} */
    base,
    /** @type {string} */
    token
  ) {
    this.base = base
    this.token = token
  }

  async json(
    /** @type {string} */
    url,
    /** @type {RequestInit} */
    options = {}
  ) {
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
    headers.set("Authorization", `Token ${this.token}`)
    requestOptions.headers = headers

    try {
      if (url.includes('://')) {
        // absolute url returned by paperless might not always have the right base. Correct to the same as `this.base`
        const parsed = new URL(url)
        const parsedBase = new URL(this.base)
        parsed.host = parsedBase.host
        parsed.protocol = parsedBase.protocol
        url = parsed.toString()
      }
      else {
        url = `${this.base}/api/${url}`
      }
      console.log(url)
      const result = await (fetch(url, requestOptions))
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

  async getAllFromApi(
    /** @type {string} */
    url
  ) {
    const results = []
    let next = url;
    while (next) {
      const response = await this.json(next);
      next = response.next
      results.push(...response.results)
    }
    return results;
  }

  /** @returns {Promise<Array<Tag>>} */
  getTags() {
    return this.getAllFromApi('tags/').then(tags => tags.map(pick('id', 'slug', 'name')))
  }

  /** @returns {Promise<Array<ApiDocument>>} */
  getDocuments() {
    return this.getAllFromApi('documents/').then(tags => tags.map(pick("id", "tags", "archived_file_name", "created", "modified", "added")))
  }

  /** @returns {Promise<ApiDocument>} */
  getDocumentInfo(/** @type {string|number} */ id) {
    return this.json(`documents/${id}/`).then(pick("id", "tags", "archived_file_name", "created", "modified", "added"));
  }

  /** @returns {Promise<ApiDocumentMetadata>} */
  getDocumentMetadata(/** @type {string|number} */ id) {
    return this.json(`documents/${id}/metadata/`).then(pick('media_filename', 'original_filename'));
  }

  async getAllData() {
    const tags = await this.getTags()
    const partialDocuments = await this.getDocuments();
    /** @type {Array<Omit<ApiDocument & ApiDocumentMetadata, 'id'> & {id:string}>} */
    const documents = []
    for (const document of partialDocuments) {
      documents.push({
        ...document,
        ...(await this.getDocumentMetadata(document.id)),
        id: "" + document.id
      })
    }

    return {
      documents, tags
    }
  }
}

/**
 * @type {<T extends string>(...args: T[]) => (<O extends Record<T, any>>(obj: O) => Pick<O, T>)}
 */
function pick(...keys) {
  return obj => /** @type {any} */(keys.reduce((acc, /** @type {any} */key) => { acc[key] = obj[key]; return acc }, {}))
}