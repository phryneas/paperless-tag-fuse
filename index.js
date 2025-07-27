#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'
import { API } from './api.js'
import { TagFs } from './fuse.js'
import { existsSync } from 'node:fs'
import { join } from 'node:path';
import assert from 'node:assert';

import dotenvx from "@dotenvx/dotenvx";
import { Webhook } from './webhook.js';
dotenvx.config({ path: ['.env.local', '.env'] });

assert(process.env.PAPERLESS_URL)
assert(process.env.TOKEN)
assert(process.env.TARGET_DIR)
assert(process.env.WEBHOOK_PORT)

const api = new API(process.env.PAPERLESS_URL, process.env.TOKEN)
const fs = new TagFs();
fs.startListening(api)
fs.mount(process.env.TARGET_DIR)
api.getTags();
api.getDocucments()

const webhook = new Webhook(api)
webhook.listen(parseInt(process.env.WEBHOOK_PORT))