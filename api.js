import EventEmitter from 'node:events';
import { Agent } from 'undici';
/** 
 * @import { ApiDocument,ApiDocumentMetadata,Document,EventMap,Tag } from "./types" 
 */

export class API extends /** @type {typeof EventEmitter<EventMap>} */(EventEmitter) {
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
    super()
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

  /**
   * @template T
   * @param {string} url 
   * @param {(allIds: number[]) => void} [onAll]
   * 
   * @returns {Promise<T[]>}
   */
  async getAllFromApi(
    url,
    onAll,
  ) {
    const results = []
    let next = url;
    while (next) {
      const response = await this.json(next);
      next = response.next
      onAll?.(response.all)
      results.push(...response.results)
    }
    return results
  }

  /** @returns {Promise<Array<Tag>>} */
  async getTags() {
    const tags = await this.getAllFromApi(
      'tags/',
      allIds => this.emit('updated_all_tag_ids', allIds)
    ).then(tags => tags.map(pickTag))
    this.emit('added_tags', tags)
    return tags;
  }

  /** @returns {Promise<Array<ApiDocument>>} */
  getDocumentInfos() {
    return this.getAllFromApi(
      'documents/',
      allIds => this.emit('updated_all_document_ids', allIds)
    ).then(documents => documents.map(pickDocument))
  }

  /** @returns {Promise<number[]>} */
  async getAllDocumentIds() {
    const result = await this.json('documents/?page_size=1')
    this.emit('updated_all_document_ids', result.all)
    return result.all
  }

  /** @returns {Promise<ApiDocument>} */
  getDocumentInfo(/** @type {string|number} */ id) {
    return this.json(`documents/${id}/`).then(pickDocument);
  }

  /** @returns {Promise<ApiDocumentMetadata>} */
  getDocumentMetadata(/** @type {string|number} */ id) {
    return this.json(`documents/${id}/metadata/`).then(pickDocumentMetadata);
  }

  /** @returns {Promise<Document>} */
  async getDocument(/** @type {string|number} */ id) {
    const document = Object.assign({}, ...await Promise.all([this.getDocumentInfo(id), this.getDocumentMetadata(id)]))
    this.emit('added_documents', [document])
    return document
  }

  async getDocucments() {
    const partialDocuments = await this.getDocumentInfos();
    /** @type {Document[]} */
    const documents = []
    for (const apiDocument of partialDocuments) {
      const document = {
        ...apiDocument,
        ...(await this.getDocumentMetadata(apiDocument.id))
      }
      this.emit('added_documents', [document])
      documents.push(document)
    }

    return documents
  }
}

/**
 * @type {<T extends string>(...args: T[]) => (<O extends Record<T, any>>(obj: O) => Pick<O, T>)}
 */
function pick(...keys) {
  // @ts-ignore
  return obj => (keys.reduce((acc, key) => { acc[key] = obj[key]; return acc }, {}))
}

const pickTag = pick('id', 'slug', 'name')
const pickDocument = pick("id", "tags", "archived_file_name", "created", "modified", "added")
const pickDocumentMetadata = pick('archive_media_filename', 'media_filename', 'has_archive_version', 'original_filename')