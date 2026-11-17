/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { oc } from '@orpc/contract';
import { upstreamInspectionSchema } from '../shared/upstream-backup.schema.js';
import { commonErrors, apiErrorData } from '../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../api/backend/transport/input.schema.js';
import { sourceIdSchema } from '../shared/material.schema.js';
import { backupInspectionSchema, backupRestoreResultSchema } from '../shared/backup.schema.js';
import type { ApiProcedureMetadata } from '../../../api/backend/transport/policy.types.js';
import type { Meta } from '@orpc/contract';

export const backupErrors = {
	UPSTREAM_INSPECTION_LIMIT: { code: 'UPSTREAM_INSPECTION_LIMIT', message: 'The archive exceeds this upstream inspection pilot record limit.', id: '42d67417-6a50-4d1b-8a01-242e696f811d' },
	BACKUP_CONFLICT: { code: 'BACKUP_CONFLICT', message: 'Destination IDs already exist. No data was restored.', id: '221ef257-aaba-4c28-aa54-5093f1d7831a', status: 409 },
	BACKUP_LIMIT: { code: 'BACKUP_LIMIT', message: 'The complete backup exceeds the destination quota. No data was restored.', id: 'db0f2eaa-47dc-4818-8453-55d563ed5463' },
	INVALID_BACKUP: { code: 'INVALID_BACKUP', message: 'Invalid or inconsistent Fukushu backup.', id: '1c61eaa5-8d25-4a3b-87e1-3459e4e5fc0f' },
	BACKUP_TOO_LARGE: { code: 'BACKUP_TOO_LARGE', message: 'This pilot supports backups up to 8 MiB.', id: '36ae4fa7-bd82-43c7-a057-5feb3637d022' },
	UPSTREAM_BACKUP_UNSUPPORTED: { code: 'UPSTREAM_BACKUP_UNSUPPORTED', message: 'Upstream Fukushu restore is not supported by this native snapshot inspector.', id: '53d4d2c1-9dc6-44c0-8824-f03234763039' },
	BACKUP_FAILED: { code: 'BACKUP_FAILED', message: 'Could not read the original backup.', id: 'd18eaee7-0320-4ce4-92f4-ac98bf15ebef' },
} as const;
const base = oc.errors({ ...commonErrors,
																									UPSTREAM_INSPECTION_LIMIT: { status: 400, data: apiErrorData },
																									BACKUP_CONFLICT: { status: 409, data: apiErrorData }, BACKUP_LIMIT: { status: 400, data: apiErrorData },
																									NO_SUCH_MATERIAL: { status: 404, data: apiErrorData }, NO_SUCH_FILE: { status: 404, data: apiErrorData },
																									INVALID_BACKUP: { status: 400, data: apiErrorData }, BACKUP_TOO_LARGE: { status: 400, data: apiErrorData },
																									UPSTREAM_BACKUP_UNSUPPORTED: { status: 400, data: apiErrorData }, BACKUP_FAILED: { status: 400, data: apiErrorData },
});
export const backupContract = {
	upstreamInspect: base.$meta({ requestName: 'fukushu/backup/inspect-upstream', requireCredential: true, secure: true, limit: { duration: 60000, max: 5 } } as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/fukushu/backup/inspect-upstream', tags: ['fukushu'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.input(objectInput({ fileId: v.pipe(v.string(), v.metadata({ format: 'misskey:id' })) })).output(upstreamInspectionSchema),
	backupRestore: base.$meta({ requestName: 'fukushu/backup/restore', requireCredential: true, secure: true, limit: { duration: 60000, max: 5 } } as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/fukushu/backup/restore', tags: ['fukushu'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.input(objectInput({ fileId: v.pipe(v.string(), v.metadata({ format: 'misskey:id' })), confirmRestore: v.literal(true) })).output(backupRestoreResultSchema),
	backupExport: base.$meta({ requestName: 'fukushu/backup/export', requireCredential: true, secure: true, limit: { duration: 86400000, max: 5 } } as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/fukushu/backup/export', successStatus: 204, tags: ['fukushu'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.input(objectInput({ id: sourceIdSchema, acknowledgeDriveVisibility: v.literal(true) })).output(v.void()),
	backupInspect: base.$meta({ requestName: 'fukushu/backup/inspect', requireCredential: true, secure: true, limit: { duration: 60000, max: 5 } } as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/fukushu/backup/inspect', tags: ['fukushu'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.input(objectInput({ fileId: v.pipe(v.string(), v.metadata({ format: 'misskey:id' })) })).output(backupInspectionSchema),
};
