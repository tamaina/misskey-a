/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';

import { mahjongViewSchema } from '../../shared/view.schema.js';
import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import type { Meta } from '@orpc/contract';

const uuid = v.pipe(v.string(), v.uuid());
const userId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/), v.maxLength(32));
const status = v.picklist(['waiting', 'playing', 'ended', 'cancelled']);
export const mahjongErrors = {
	NO_SUCH_ROOM: { code: 'NO_SUCH_ROOM', message: 'Room is unavailable.', id: '62820642-619a-4d67-9341-bdb90a0fa53a', status: 404 },
	STALE_ACTION: { code: 'STALE_ACTION', message: 'This action has already expired or been submitted.', id: '65f2a60f-3abd-4e92-87c6-46efb8d70890', status: 409 },
	INVALID_ACTION: { code: 'INVALID_ACTION', message: 'Invalid mahjong action.', id: 'ab17d14e-ac0a-4ca0-9024-dd2ad450efde' },
	ROOM_LIMIT: { code: 'ROOM_LIMIT', message: 'Close an existing room first.', id: 'a6b19650-551a-4494-860b-9a5180b27641' },
} as const;

function contract<const Name extends string>(name: Name, limit = 120) {
	const requestName = `mahjong/${name}` as const;
	return oc.$meta({ requestName, requireCredential: true, kind: 'write:account', limit: { duration: 60_000, max: limit } } as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: `/${requestName}`, tags: ['mahjong'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors, NO_SUCH_ROOM: { status: 404, data: apiErrorData }, STALE_ACTION: { status: 409, data: apiErrorData }, INVALID_ACTION: { status: 400, data: apiErrorData }, ROOM_LIMIT: { status: 400, data: apiErrorData } });
}

export const mahjongCreateContract = contract('create', 5).input(objectInput({ invitees: v.pipe(v.array(userId), v.length(3)) })).output(mahjongViewSchema);
export const mahjongRoomsContract = contract('rooms').input(objectInput({})).output(v.array(v.object({ id: uuid, users: v.array(v.string()), status, createdAt: v.string() })));
export const mahjongShowContract = contract('show').input(objectInput({ roomId: uuid })).output(mahjongViewSchema);
export const mahjongReadyContract = contract('ready').input(objectInput({ roomId: uuid })).output(mahjongViewSchema);
export const mahjongCancelContract = contract('cancel').input(objectInput({ roomId: uuid })).output(mahjongViewSchema);
export const mahjongSubmitContract = contract('submit').input(objectInput({ roomId: uuid, phaseId: uuid, actionId: v.pipe(v.string(), v.maxLength(80)), requestId: uuid })).output(mahjongViewSchema);
