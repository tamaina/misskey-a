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

export interface ApiAuthorization<Actor extends ApiActor> {
	rootUserId(): string | null;
	roles(actor: Actor): Promise<readonly { isModerator: boolean; isAdministrator: boolean }[]>;
	policyAllowed(actor: Actor, key: string): Promise<boolean>;
}

export interface ApiToken { id?: string; name?: string | null; iconUrl?: string | null; permission: readonly string[] }
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
	authorization?: ApiAuthorization<Actor>;
	credential: string | null | undefined;
	ip: string;
	headers: Record<string, string | string[] | undefined>;
	upload?: UploadResource;
	response?: { header(name: string, value: string): void };
	mapError?: (error: unknown) => ORPCError<string, unknown>;
}
