
import Fuse from "@cocalc/fuse-native";
import { format, parse, sep } from "node:path";
import { constants } from "node:fs";

/**
 * @typedef {{
 *   id: number
 *   name: string
 *   [key: string]: unknown
 * }} Tag
 */

/**
 * @typedef {{
 *   id: string
 *   fileName: string
 *   realPath: string
 *   created: Date
 *   added: Date
 *   tags: number[]
 * }} File
 */

/**
 * @typedef {File & {
 *   displayName: string
 * }} FileWithDisplayName
 */

export function startFs(
  /** @type {string} */ target,
  /** @type {Tag[]} */ tags,
  /** @type {File[]} */ files
) {
    /** @type {Map<string, FileWithDisplayName>} */
    const fileByDisplayName = new Map();
    /** @type {Map<string, FileWithDisplayName>} */
    const fileById = new Map();
    /** @type {Map<string, Set<FileWithDisplayName>>} */
    const filesByTagName = new Map();
    /** @type {Set<FileWithDisplayName>} */
    const allFiles = new Set()

    const tagsByName = new Map(Object.values(tags).map((tag) => [tag.name, tag]));
    const tagNames = new Set(tagsByName.keys())
    const tagsById = new Map(Object.values(tags).map((tag) => [tag.id, tag]));

    for (const _file of files) {
        const parsed = parse(_file.fileName);
        /** @type {FileWithDisplayName} */
        const file = {
            ..._file,
            displayName: format({
                name: `${parsed.name}.${_file.id}`,
                ext: parsed.ext,
            }),
        };
        fileByDisplayName.set(file.displayName, file);
        fileById.set(file.id, file);
        allFiles.add(file)
        for (const tag of file.tags) {
            const tagName = tagsById.get(tag)?.name
            const byTag = filesByTagName.get(tagName) || new Set();
            filesByTagName.set(tagName, byTag);
            byTag.add(file);
        }
    }

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

    function filesIn(/** @type {Set<string>} */ tags) {
        let files = allFiles;
        for (const tag of tags) {
            const byTag = filesByTagName.get(tag)
            if (!byTag) return []
            files = files.intersection(byTag)
        }
        return files.values().map(file => file.displayName)
    }

    /** @type {Fuse.OPERATIONS} */
    const ops = {
        readdir: function (path, cb) {
            const tags = new Set(path.split(sep).filter((v) => !!v));
            const unusedTags = tagNames.difference(tags);
            return process.nextTick(cb, 0, [...unusedTags, ...filesIn(tags)]);
        },
        getattr: function (path, cb) {
            const parsed = parse(path);

            if (path === "/" || (parsed.ext == "" && tagsByName.has(parsed.base))) {
                return process.nextTick(cb, 0, DIR);
            }
            const file = fileByDisplayName.get(parsed.base)
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
        },
        readlink: function (path, cb) {
            const parsed = parse(path);
            const file = fileByDisplayName.get(parsed.base);
            if (file) {
                return process.nextTick(cb, 0, file.realPath);
            }
            return process.nextTick(cb, Fuse.ENOENT);
        },
    };

    const fuse = new Fuse(target, ops, {
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
