/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferSchemaOutput } from '@orpc/contract';
import { implement } from '@orpc/server';
import { type GetterService } from '@features/api/backend/transport/GetterService.js';
import { type IdService } from '@features/runtime/backend/services/IdService.js';
import * as v from 'valibot';
import { type ChatEntityService } from '../../../serializers/ChatEntityService.js';
import { type ChatService } from '../../../services/ChatService.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import { readErrorId } from '../../../request.schema.js';
import { chatMessagesUserTimelineContract, chatMessagesUserTimelinePolicy, chatMessagesUserTimelineErrors } from './user-timeline.contract.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface ChatMessagesUserTimelineDependencies {
	chatEntityService: ChatEntityService;
	chatService: ChatService;
	getterService: GetterService;
	idService: IdService;
}
export function createChatMessagesUserTimelineProcedure(deps: ChatMessagesUserTimelineDependencies) {
	async function execute(ps: InferSchemaOutput<NonNullable<typeof chatMessagesUserTimelineContract['~orpc']['inputSchema']>>, me: MiLocalUser): Promise<InferSchemaOutput<NonNullable<typeof chatMessagesUserTimelineContract['~orpc']['outputSchema']>>> {
		return v.parse(requiredSchema(chatMessagesUserTimelineContract['~orpc'].outputSchema), await run(ps, me));
	}

	async function run(ps: InferSchemaOutput<NonNullable<typeof chatMessagesUserTimelineContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		const untilId = ps.untilId ?? (ps.untilDate ? deps.idService.gen(ps.untilDate!) : null);
		const sinceId = ps.sinceId ?? (ps.sinceDate ? deps.idService.gen(ps.sinceDate!) : null);

		await deps.chatService.checkChatAvailability(me.id, 'read');

		const other = await deps.getterService.getUser(ps.userId).catch((err: unknown) => {
			if (readErrorId(err) === '15348ddd-432d-49c2-8a5a-8069753becff') throw apiError(chatMessagesUserTimelineErrors.noSuchUser);
			throw err;
		});

		const messages = await deps.chatService.userTimeline(me.id, other.id, ps.limit, sinceId, untilId);

		deps.chatService.readUserChatMessage(me.id, other.id);

		return await deps.chatEntityService.packMessagesLiteFor1on1(messages);
	}

	return implement(chatMessagesUserTimelineContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>(chatMessagesUserTimelinePolicy))
		.use(requirePrincipal<MiLocalUser>())
		.handler(({ input, context }) => execute(input, context.principal));
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
