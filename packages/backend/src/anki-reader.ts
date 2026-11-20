/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createRequire } from 'node:module';

/** Resolve the WASM from the reader's own sql.js, not an unrelated workspace version. */
export function resolveAnkiReaderWasm(): string {
	return createRequire(import.meta.resolve('@aqz/anki-reader/archive')).resolve('sql.js/dist/sql-wasm.wasm');
}
