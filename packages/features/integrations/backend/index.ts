/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createProcedureClient, implement } from '@orpc/server';
import type { JsonSchema } from '@valibot/to-json-schema';
import type { ApiErrorDefinition } from '../../api/contract/index.js';
import { toLegacyJsonSchema } from '../../api/backend/index.js';
import { webhookContract, webhookErrors, webhookInputs } from '../contract/index.js';
import type { WebhookEventTypes } from '../contract/index.js';

export interface WebhookActor {
	id: string;
}

export interface WebhookContext {
	actor: WebhookActor;
}

export interface WebhookUpdateValues {
	name: string | undefined;
	url: string | undefined;
	secret: string | undefined;
	on: WebhookEventTypes[] | undefined;
	active: boolean | undefined;
}

export interface WebhookCommandsDependencies<Webhook extends { id: string }> {
	findOwnedById(id: string, userId: string): Promise<Webhook | null>;
	update(id: string, values: WebhookUpdateValues): Promise<unknown>;
	findByIdOrFail(id: string): Promise<Webhook>;
	delete(id: string): Promise<unknown>;
	publishUpdated(webhook: Webhook): unknown;
	publishDeleted(webhook: Webhook): unknown;
	createError(definition: ApiErrorDefinition): Error;
}

function requireActor(context: WebhookContext | null | undefined): WebhookActor {
	const id = context?.actor?.id;
	if (typeof id !== 'string' || id.length === 0) {
		throw new Error('An authenticated actor is required for webhook commands.');
	}

	return { id };
}

/** Create webhook commands that scope lookups to the trusted actor supplied by the adapter. */
export function createWebhookCommands<Webhook extends { id: string }>(deps: WebhookCommandsDependencies<Webhook>) {
	const clientContext = (context: WebhookContext) => context;

	const updateWebhook = createProcedureClient(implement(webhookContract['i/webhooks/update'])
		.$context<WebhookContext>()
		.handler(async ({ input, context }) => {
			const actor = requireActor(context);
			const webhook = await deps.findOwnedById(input.webhookId, actor.id);
			if (webhook == null) {
				throw deps.createError(webhookErrors['i/webhooks/update'].noSuchWebhook);
			}

			await deps.update(webhook.id, {
				name: input.name,
				url: input.url,
				secret: input.secret === null ? '' : input.secret,
				on: input.on,
				active: input.active,
			});

			const updated = await deps.findByIdOrFail(input.webhookId);
			void deps.publishUpdated(updated);
		}), { context: clientContext });

	const deleteWebhook = createProcedureClient(implement(webhookContract['i/webhooks/delete'])
		.$context<WebhookContext>()
		.handler(async ({ input, context }) => {
			const actor = requireActor(context);
			const webhook = await deps.findOwnedById(input.webhookId, actor.id);
			if (webhook == null) {
				throw deps.createError(webhookErrors['i/webhooks/delete'].noSuchWebhook);
			}

			await deps.delete(webhook.id);
			void deps.publishDeleted(webhook);
		}), { context: clientContext });

	return {
		'i/webhooks/update': updateWebhook,
		'i/webhooks/delete': deleteWebhook,
	};
}

export type WebhookCommandsFeature<Webhook extends { id: string }> = ReturnType<typeof createWebhookCommands<Webhook>>;

export const legacyWebhookSchemas: Record<keyof typeof webhookInputs, { input: JsonSchema }> = {
	'i/webhooks/update': { input: toLegacyJsonSchema(webhookInputs['i/webhooks/update'], { target: 'openapi-3.0' }) },
	'i/webhooks/delete': { input: toLegacyJsonSchema(webhookInputs['i/webhooks/delete'], { target: 'openapi-3.0' }) },
};
