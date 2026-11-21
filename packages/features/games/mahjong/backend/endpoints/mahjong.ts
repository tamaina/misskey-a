/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { RoomError } from '../room.js';
import { mahjongCancelContract, mahjongCreateContract, mahjongErrors, mahjongReadyContract, mahjongRoomsContract, mahjongShowContract, mahjongSubmitContract } from './mahjong.contract.js';
import type { MahjongStore } from '../store.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export interface MahjongDependencies { mahjong: Pick<MahjongStore, 'create' | 'list' | 'access'> }

async function invoke<T>(operation: () => Promise<T>): Promise<T> {
	try { return await operation(); } catch (error) {
		if (error instanceof RoomError) throw apiError(mahjongErrors[error.code]);
		throw error;
	}
}

export function createMahjongProcedures({ mahjong }: MahjongDependencies) {
	const procedure = createApiProcedure<MiLocalUser>();
	const principal = requirePrincipal<MiLocalUser>();
	return {
		mahjongCreate: procedure(mahjongCreateContract).use(principal).handler(({ input, context }) => invoke(() => mahjong.create(context.principal.id, input.invitees))),
		mahjongRooms: procedure(mahjongRoomsContract).use(principal).handler(({ context }) => invoke(() => mahjong.list(context.principal.id))),
		mahjongShow: procedure(mahjongShowContract).use(principal).handler(({ input, context }) => invoke(() => mahjong.access(context.principal.id, input.roomId, 'show'))),
		mahjongReady: procedure(mahjongReadyContract).use(principal).handler(({ input, context }) => invoke(() => mahjong.access(context.principal.id, input.roomId, 'ready'))),
		mahjongCancel: procedure(mahjongCancelContract).use(principal).handler(({ input, context }) => invoke(() => mahjong.access(context.principal.id, input.roomId, 'cancel'))),
		mahjongSubmit: procedure(mahjongSubmitContract).use(principal).handler(({ input, context }) => invoke(() => mahjong.access(context.principal.id, input.roomId, 'submit', input))),
	};
}
