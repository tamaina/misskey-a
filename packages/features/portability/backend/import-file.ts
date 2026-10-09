/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { apiError, type ErrorDefinition } from '../../api/backend/transport/orpc-error.js';
import type { ApiActor } from '../../api/backend/transport/context.js';
import type { AntennaArtifact } from './antenna-artifact.schema.js';
import type { PortabilityDependencies } from './api.dependencies.js';
export function exceedsAntennaLimit(count: number, artifact: AntennaArtifact, limit: number): boolean {
	if (artifact === null) throw new TypeError('Cannot read properties of null (reading length)');
	const length = Array.isArray(artifact) || typeof artifact === 'string' ? artifact.length : typeof artifact === 'object' ? artifact.length : undefined;
	const combined = typeof length === 'string' || (length !== null && typeof length === 'object')
		? String(count) + String(length)
		: count + Number(length);
	return Number(combined) >= limit;
}
export async function importFile<Actor extends ApiActor, File extends { id: string; size: number; url: string }>(deps: Pick<PortabilityDependencies<Actor, File>, 'findOwnedFile' | 'isMovingDuringGracePeriod'>, actor: Actor, fileId: string, errors: { noSuchFile: ErrorDefinition; emptyFile: ErrorDefinition; tooBigFile: ErrorDefinition }): Promise<File> {
	const file = await deps.findOwnedFile(fileId, actor.id);
	if (file == null) throw apiError(errors.noSuchFile);
	if (file.size === 0) throw apiError(errors.emptyFile);
	const moving = await deps.isMovingDuringGracePeriod(actor);
	if (moving ? file.size > 32 * 1024 * 1024 : file.size > 64 * 1024) throw apiError(errors.tooBigFile);
	return file;
}
