/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { createProcedureClient } from '@orpc/server';
import { createPortabilityOperations, type PortabilityDependencies } from '../../backend/operations.js';
import { iExportFollowingInput } from '../../backend/endpoints/i/export-following.contract.js';
import { iImportAntennasInput } from '../../backend/endpoints/i/import-antennas.contract.js';
import { iImportFollowingInput } from '../../backend/endpoints/i/import-following.contract.js';
import { createIImportFollowingProcedure } from '../../backend/endpoints/i/import-following.js';
import { importedAntennaSchema, parseAntennaArtifact } from '../../backend/antenna-artifact.schema.js';
import type { ApiActor, ApiServices } from '@features/api/backend/transport/context.js';
import type { PortabilityContext } from '../../backend/api.router.js';

type ImportedFile = { id: string; size: number; url: string };
const actor: ApiActor = { id: 'owner1', isSuspended: false, movedToUri: null };

function fixture() {
	const dependencies = mockDeep<PortabilityDependencies<ApiActor, ImportedFile>>();
	dependencies.userExists.mockResolvedValue(true);
	dependencies.findOwnedFile.mockResolvedValue({ id: 'file1', size: 12, url: 'https://example.test/file' });
	dependencies.countAntennas.mockResolvedValue(0);
	dependencies.getAntennaLimit.mockResolvedValue(10);
	dependencies.isMovingDuringGracePeriod.mockResolvedValue(false);
	return { dependencies, operations: createPortabilityOperations(dependencies) };
}

test('native export preserves defaults and accepts the queue without awaiting completion', async () => {
	const { dependencies, operations } = fixture();
	expect(await operations['i/export-following'](v.parse(iExportFollowingInput, {}), actor)).toBeUndefined();
	expect(dependencies.createExportFollowingJob).toHaveBeenCalledWith({ id: 'owner1' }, false, false);
});

test('antenna JSON queues before domain validation and retains reserved JSON business keys', async () => {
	const { dependencies, operations } = fixture();
	dependencies.downloadTextFile.mockResolvedValue('[{"id":"unvalidated","__proto__":{"retained":true}}]');
	await operations['i/import-antennas'](v.parse(iImportAntennasInput, { fileId: 'file1' }), actor);
	const artifact = parseAntennaArtifact('[{"id":"unvalidated","__proto__":{"retained":true}}]');
	expect(dependencies.createImportAntennasJob).toHaveBeenCalledWith(actor, artifact);
	expect(v.safeParse(importedAntennaSchema, { id: 'unvalidated' }).success).toBe(false);
});

test('import limits retain normal 64KiB and account-move 32MiB boundaries', async () => {
	const { dependencies, operations } = fixture();
	dependencies.findOwnedFile.mockResolvedValue({ id: 'file1', size: 65537, url: 'https://example.test/file' });
	const input = v.parse(iImportFollowingInput, { fileId: 'file1' });
	await expect(operations['i/import-following'](input, actor)).rejects.toMatchObject({ code: 'TOO_BIG_FILE', data: { id: 'dee9d4ed-ad07-43ed-8b34-b2856398bc60' } });
	expect(dependencies.createImportFollowingJob).not.toHaveBeenCalled();
	dependencies.isMovingDuringGracePeriod.mockResolvedValue(true);
	await operations['i/import-following'](input, actor);
	expect(dependencies.createImportFollowingJob).toHaveBeenCalledWith(actor, 'file1', undefined);
	dependencies.findOwnedFile.mockResolvedValue({ id: 'file1', size: 33554433, url: 'https://example.test/file' });
	await expect(operations['i/import-following'](input, actor)).rejects.toMatchObject({ code: 'TOO_BIG_FILE' });
});

test('native import secure policy runs before malformed input validation', async () => {
	const { operations } = fixture();
	const services = mockDeep<ApiServices<ApiActor>>();
	services.authenticate.mockResolvedValue([actor, { permission: [] }]);
	const context: PortabilityContext<ApiActor> = { credential: 'appToken', services, ip: '127.0.0.1', headers: {}, operations: { portability: operations } };
	const client = createProcedureClient(createIImportFollowingProcedure<ApiActor>(), { context });
	// @ts-expect-error Intentionally malformed native wire input.
	await expect(client({ fileId: 123 })).rejects.toMatchObject({ code: 'ACCESS_DENIED', data: { id: '56f35758-7dd5-468b-8439-5d6fb8ec9b8e' } });
});
