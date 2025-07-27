#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'
import { API } from './api.js'
import { TagFs } from './fuse.js'
import { existsSync } from 'node:fs'
import { join } from 'node:path';
import assert from 'node:assert';

import dotenvx from "@dotenvx/dotenvx";
dotenvx.config({ path: ['.env.local', '.env'] });

assert(process.env.BASE_URL)
assert(process.env.TOKEN)
assert(process.env.TARGET_DIR)

const api = new API(process.env.BASE_URL, process.env.TOKEN)
const fs = new TagFs();
fs.startListening(api)
fs.mount(process.env.TARGET_DIR)
api.getAllData()
