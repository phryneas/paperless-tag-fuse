
import Fuse from "@cocalc/fuse-native";
import { format, join, parse, sep } from "node:path";
import { constants } from "node:fs";
import assert from "node:assert";
import { MemoizedSet, ReadonlyMemoizedSet } from "./MemoizedSet.js";
/**
 * @import {EventEmitter} from 'node:events'
 * @import {EventMap, Tag, Document, File } from './types'
 */

const date = new Date();

/** @typedef {Omit<Fuse.Stats, "dev"|"ino"|"rdev"|"blksize"|"blocks">} FStats */

/** @type {FStats} */
const DIR = {
    mtime: date,
    atime: date,
    ctime: date,
    nlink: 1,
    size: 12,
    mode: constants.S_IFDIR | 0o555,
    uid: 0,
    gid: 0,
};
/** @type {FStats} */
const SYMLINK = {
    mtime: date,
    atime: date,
    ctime: date,
    nlink: 1,
    size: 12,
    mode: constants.S_IFLNK | 0o444,
    uid: 0,
    gid: 0,
};

/** @implements {Fuse.OPERATIONS} */
export class TagFs {
    /** @type {Map<File['displayName'], File>} */
    fileByDisplayName = new Map();
    /** @type {Map<File['id'], File>} */
    fileById = new Map();
    /** @type {Map<Tag['name'], MemoizedSet<File>>} */
    filesByTagName = new Map();
    /** @type {Set<File>} */
    allFiles = new MemoizedSet()

    /** @type {Map<Tag['name'], Tag>} */
    tagsByName = new Map();
    /** @type {Set<string>} */
    tagNames = new Set()
    /** @type {Map<Tag['id'], Tag>} > */
    tagsById = new Map();

    debug = process.env.DEBUG_TAGFS === 'true' ? console.log : () => { }

    mount(
    /** @type {string} */ target,
    ) {
        const fuse = new Fuse(target, this, {
            debug: process.env.FUSE_DEBUG === "true",
            force: process.env.FUSE_FORCE === "true",
            mkdir: process.env.FUSE_MKDIR === "true",
            allowOther: process.env.FUSE_ALLOW_OTHER === "true",
        });
        fuse.mount((err) => {
            if (err) throw err;
            console.log("filesystem mounted on " + fuse.mnt);
        });

        process.once("SIGINT", function () {
            fuse.unmount((err) => {
                if (err) {
                    console.log("filesystem at " + fuse.mnt + " not unmounted", err);
                } else {
                    console.log("filesystem at " + fuse.mnt + " unmounted");
                }
            });
        });
    }

    startListening(
      /** @type {EventEmitter<EventMap>} */ events,
    ) {
        events.on('added_documents', documents => {
            for (const document of documents) {
                try {
                    const {
                        id,
                        added,
                        archived_file_name,
                        created,
                        archive_media_filename,
                        has_archive_version,
                        modified,
                        original_filename,
                        media_filename,
                        tags
                    } = document
                    const fileName = archived_file_name || archive_media_filename || media_filename
                    const parsed = parse(fileName);
                    assert(process.env.PAPERLESS_MEDIA_ROOT)
                    this.addFile({
                        id: "" + id,
                        fileName,
                        realPath: has_archive_version ?
                            join(
                                process.env.PAPERLESS_MEDIA_ROOT,
                                'documents',
                                'archive',
                                archive_media_filename
                            ) : join(
                                process.env.PAPERLESS_MEDIA_ROOT,
                                'documents',
                                'originals',
                                media_filename
                            ),
                        created: new Date(created),
                        added: new Date(added),
                        tags,
                        displayName: format({
                            name: `${parsed.name}.${id}`,
                            ext: parsed.ext,
                        }),
                    });
                } catch (e) {
                    console.warn(`Error occured handling document ${document?.id} - skipping`, document)
                }
            }
        })
        events.on('added_tags', tags => {
            for (const tag of tags) {
                this.addTag(tag)
            }
        })
        events.on('updated_all_document_ids', (documentIds) => {
            const removed = new Set(this.fileById.keys()).difference(new Set(documentIds.map(id => "" + id)))
            for (const id of removed) {
                this.removeFile(id)
            }
        })
        events.on('updated_all_tag_ids', (tagIds) => {
            const removed = new Set(this.tagsById.keys()).difference(new Set(tagIds))
            for (const id of removed) {
                this.removeTag(id)
            }
        })
    }

    addTag(/** @type {Tag} */ tag) {
        this.removeTag(tag.id)
        this.debug('adding tag', tag)
        this.tagsByName.set(tag.name, tag)
        this.tagsById.set(tag.id, tag)
        this.tagNames.add(tag.name)
    }

    removeTag(/** @type {number} */id) {
        const tag = this.tagsById.get(id)
        if (tag) {
            this.debug('removing tag', tag)
            this.tagsByName.delete(tag.name)
            this.tagsById.delete(tag.id)
            this.tagNames.delete(tag.name)
        }
    }

    addFile(/** @type {File} */file) {
        this.removeFile(file.id)
        this.debug('adding file', file)
        this.fileByDisplayName.set(file.displayName, file);
        this.fileById.set(file.id, file);
        this.allFiles.add(file)
        for (const tag of file.tags) {
            const tagName = this.tagsById.get(tag)?.name
            assert(tagName)
            const byTag = this.filesByTagName.get(tagName) || new MemoizedSet();
            this.filesByTagName.set(tagName, byTag);
            byTag.add(file);
        }
    }

    removeFile(/** @type {string} */id) {
        const file = this.fileById.get(id)
        if (file) {
            this.debug('removing file', file)
            this.fileByDisplayName.delete(file.displayName);
            this.fileById.delete(file.id);
            this.allFiles.delete(file)
            for (const tag of file.tags) {
                const tagName = this.tagsById.get(tag)?.name
                assert(tagName)
                const byTag = this.filesByTagName.get(tagName)
                if (byTag) {
                    byTag.delete(file);
                }
            }
        }
    }

    /** @returns {Set<File>} */
    filesIn(/** @type {Set<string>} */ tags) {
        let files = this.allFiles;
        for (const tag of tags) {
            const byTag = this.filesByTagName.get(tag)
            if (!byTag) return emptySet
            files = files.intersection(byTag)
        }
        return files
    }

    /** @type {Fuse.OPERATIONS['readdir']} */
    readdir = (path, cb) => {
        const tags = new Set(path.split(sep).filter((v) => !!v));
        const files = this.filesIn(tags)
        const fileNames = files.values().map(file => file.displayName)
        const unusedTags = [...this.tagNames.difference(tags)].filter(
            tag => this.filesByTagName.get(tag)?.intersection(files).size
        );
        return process.nextTick(cb, 0, [...unusedTags, ...fileNames]);
    }
    /** @type {Fuse.OPERATIONS['getattr']} */
    getattr = (path, cb) => {
        const parsed = parse(path);

        if (path === "/" || (parsed.ext == "" && this.tagsByName.has(parsed.base))) {
            return process.nextTick(cb, 0, DIR);
        }
        const file = this.fileByDisplayName.get(parsed.base)
        if (file) {
            return process.nextTick(
                cb,
                0,
                {
                    ...SYMLINK,
                    ctime: file.created,
                    mtime: file.created,
                    atime: file.added
                }
            );
        }
        return process.nextTick(cb, Fuse.ENOENT);
    }
    /** @type {Fuse.OPERATIONS['readlink']} */
    readlink = (path, cb) => {
        const parsed = parse(path);
        const file = this.fileByDisplayName.get(parsed.base);
        if (file) {
            return process.nextTick(cb, 0, file.realPath);
        }
        return process.nextTick(cb, Fuse.ENOENT);
    }
};

const emptySet = new ReadonlyMemoizedSet();