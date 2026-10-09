/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { ORPCError } from '@orpc/server';
import type { RateLimit } from './policy.types.js';
export type { RateLimit } from './policy.types.js';

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

/** The host binds existing services to these narrow ports once per server role. */
export interface ApiServices<Actor extends ApiActor> {
	authenticate(credential: string | null | undefined): Promise<[Actor | null, ApiToken | null]>;
	limitActor(actor: Actor | null, ip: string): string | null;
	rateLimitFactor(actor: Actor): Promise<number>;
	limit(limit: RateLimit, actor: string, factor: number): Promise<{ info: Record<string, unknown> } | null>;
}

export interface ApiContext<Actor extends ApiActor = ApiActor> {
	services: ApiServices<Actor>;
	authorization?: ApiAuthorization<Actor>;
	credential: string | null | undefined;
	ip: string;
	headers: Record<string, string | string[] | undefined>;
	/** Actual HTTP method before compatibility routing adapts a GET alias. */
	httpMethod?: string;
	upload?: UploadResource;
	response?: { header(name: string, value: string): void };
	mapError?: (error: unknown) => ORPCError<string, unknown>;
}
