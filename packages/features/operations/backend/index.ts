/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createProcedureClient, implement } from '@orpc/server';
import type { JsonSchema } from '@valibot/to-json-schema';
import { operationsContract, operationsInputs, QUEUE_CLEAR_STATES } from '../contract/index.js';
import type { QueueType } from '../../runtime/shared/queue-types.js';
import { toLegacyJsonSchema } from '../../api/backend/index.js';

export type OperationsActor = { id: string };
export type QueueClearState = typeof QUEUE_CLEAR_STATES[number];
export type QueueAuditAction = 'pauseQueue' | 'resumeQueue' | 'clearQueue' | 'promoteQueue';

export interface OperationsContext {
	actor: OperationsActor;
}

export interface OperationsDependencies {
	queuePause(queue: QueueType): Promise<unknown>;
	queueResume(queue: QueueType): Promise<unknown>;
	queueClear(queue: QueueType, state: QueueClearState): Promise<unknown>;
	queuePromoteJobs(queue: QueueType): Promise<unknown>;
	queueRetryJob(queue: QueueType, jobId: string): Promise<unknown>;
	queueRemoveJob(queue: QueueType, jobId: string): Promise<unknown>;
	log(actor: OperationsActor, action: QueueAuditAction): unknown;
}

function requireActor(context: OperationsContext | null | undefined): OperationsActor {
	if (context == null || context.actor == null || typeof context.actor.id !== 'string' || context.actor.id.length === 0) {
		throw new Error('A trusted operations actor is required');
	}

	return { id: context.actor.id };
}

/** Create the queue command clients with authenticated actor identity supplied per call. */
export function createOperations(deps: OperationsDependencies) {
	const clientContext = (context: OperationsContext) => context;

	return {
		'admin/queue/pause': createProcedureClient(implement(operationsContract['admin/queue/pause'])
			.$context<OperationsContext>()
			.handler(async ({ input, context }) => {
				const actor = requireActor(context);
				await deps.queuePause(input.queue);
				void deps.log(actor, 'pauseQueue');
			}), { context: clientContext }),
		'admin/queue/resume': createProcedureClient(implement(operationsContract['admin/queue/resume'])
			.$context<OperationsContext>()
			.handler(async ({ input, context }) => {
				const actor = requireActor(context);
				await deps.queueResume(input.queue);
				void deps.log(actor, 'resumeQueue');
			}), { context: clientContext }),
		'admin/queue/clear': createProcedureClient(implement(operationsContract['admin/queue/clear'])
			.$context<OperationsContext>()
			.handler(({ input, context }) => {
				const actor = requireActor(context);
				void deps.queueClear(input.queue, input.state);
				void deps.log(actor, 'clearQueue');
			}), { context: clientContext }),
		'admin/queue/promote-jobs': createProcedureClient(implement(operationsContract['admin/queue/promote-jobs'])
			.$context<OperationsContext>()
			.handler(({ input, context }) => {
				const actor = requireActor(context);
				void deps.queuePromoteJobs(input.queue);
				void deps.log(actor, 'promoteQueue');
			}), { context: clientContext }),
		'admin/queue/retry-job': createProcedureClient(implement(operationsContract['admin/queue/retry-job'])
			.$context<OperationsContext>()
			.handler(({ input, context }) => {
				requireActor(context);
				void deps.queueRetryJob(input.queue, input.jobId);
			}), { context: clientContext }),
		'admin/queue/remove-job': createProcedureClient(implement(operationsContract['admin/queue/remove-job'])
			.$context<OperationsContext>()
			.handler(({ input, context }) => {
				requireActor(context);
				void deps.queueRemoveJob(input.queue, input.jobId);
			}), { context: clientContext }),
	};
}

export type OperationsFeature = ReturnType<typeof createOperations>;

export const legacyOperationsSchemas: Record<keyof typeof operationsInputs, { input: JsonSchema }> = {
	'admin/queue/pause': { input: toLegacyJsonSchema(operationsInputs['admin/queue/pause']) },
	'admin/queue/resume': { input: toLegacyJsonSchema(operationsInputs['admin/queue/resume']) },
	'admin/queue/clear': { input: toLegacyJsonSchema(operationsInputs['admin/queue/clear']) },
	'admin/queue/promote-jobs': { input: toLegacyJsonSchema(operationsInputs['admin/queue/promote-jobs']) },
	'admin/queue/retry-job': { input: toLegacyJsonSchema(operationsInputs['admin/queue/retry-job']) },
	'admin/queue/remove-job': { input: toLegacyJsonSchema(operationsInputs['admin/queue/remove-job']) },
};
