/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as v from 'valibot';
import type { serverInfoOutput } from '../../../instance/backend/endpoints/server-info.contract.js';
import type { DriveCreateInput, DriveCreateOutput } from '../../../drive/backend/endpoints/drive/files/create.schema.js';
import type { ORPCError } from '@orpc/server';

export interface ApiActor {
	id: string;
	isSuspended: boolean;
	movedToUri: string | null;
}

export interface ApiToken { permission: readonly string[] }
export interface UploadResource { path: string; name: string | null; file: File }
export interface RateLimit { key: string; duration: number; max: number; minInterval?: number }

/** The host binds existing services to these narrow ports once per server role. */
export interface ApiServices<Actor extends ApiActor> {
	authenticate(credential: string | null | undefined): Promise<[Actor | null, ApiToken | null]>;
	limitActor(actor: Actor | null, ip: string): string | null;
	rateLimitFactor(actor: Actor): Promise<number>;
	limit(limit: RateLimit, actor: string, factor: number): Promise<{ info: Record<string, unknown> } | null>;
	serverInfo(): Promise<v.InferOutput<typeof serverInfoOutput>>;
	deleteNote(noteId: string, actor: Actor): Promise<void>;
	createFile(input: DriveCreateInput, actor: Actor, upload: UploadResource,
		request: { ip: string; headers: Record<string, string | string[] | undefined> }): Promise<DriveCreateOutput>;
}

export interface ApiContext<Actor extends ApiActor = ApiActor> {
	services: ApiServices<Actor>;
	credential: string | null | undefined;
	ip: string;
	headers: Record<string, string | string[] | undefined>;
	upload?: UploadResource;
	mapError?: (error: unknown) => ORPCError<string, unknown>;
}
