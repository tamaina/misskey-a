/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: MIT
 */
import { expectType, expectAssignable } from 'tsd';
import type { PilotEndpoints } from '../src/pilot.types.js';
import { APIClient } from '../built/api.js';

type Assert<T extends true> = T;
export type FiniteNames = Assert<string extends keyof PilotEndpoints ? false : true>;
export type RouteNames = Assert<'ping' | 'charts/notes' | 'i/registry/set' | 'notifications/flush' extends keyof PilotEndpoints ? true : false>;
const client = new APIClient({ origin: 'https://example.test' });
expectType<Promise<{ pong: number }>>(client.request('ping', {}));
expectType<Promise<null>>(client.request('notifications/flush', {}));
expectAssignable<Promise<void>>(client.orpc.notifications.flush());
expectAssignable<Promise<{ pong: number }>>(client.orpc.instance.ping());
client.request('charts/notes', { span: 'day' });
client.request('i/registry/set', { key: 'theme', value: { constructor: [null, true, 1] } });

expectType<Promise<{ sourceLang: string; text: string } | null>>(client.request('notes/translate', { noteId: 'note1', targetLang: 'en' }));
expectType<{ sourceLang: string; text: string } | undefined>(await client.orpc.notes.notesTranslate({ noteId: 'note1', targetLang: 'en' }));
expectType<{ params: { name: string; type: string; }[] } | null>(await client.orpc.instance.endpoint({ endpoint: 'unknown' }));
