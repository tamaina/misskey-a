/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as v from 'valibot';
import type { ApiActor, ApiContext, ApiToken } from '../../api/backend/transport/context.js';
import type { listInput, listOutput } from './endpoints/i/notifications.contract.js';
import type { groupedInput, groupedOutput } from './endpoints/i/notifications-grouped.contract.js';
import type { createInput, createOutput } from './endpoints/notifications/create.contract.js';
import type { flushInput, flushOutput } from './endpoints/notifications/flush.contract.js';
import type { markAllAsReadInput, markAllAsReadOutput } from './endpoints/notifications/mark-all-as-read.contract.js';
import type { testNotificationInput, testNotificationOutput } from './endpoints/notifications/test-notification.contract.js';
import type { registerInput, registerOutput } from './endpoints/sw/register.contract.js';
import type { showRegistrationInput, showRegistrationOutput } from './endpoints/sw/show-registration.contract.js';
import type { unregisterInput, unregisterOutput } from './endpoints/sw/unregister.contract.js';
import type { updateRegistrationInput, updateRegistrationOutput } from './endpoints/sw/update-registration.contract.js';

export interface NotificationsOperations<Actor extends ApiActor> {
	list(input: v.InferOutput<typeof listInput>, principal: Actor): Promise<v.InferOutput<typeof listOutput>>;
	grouped(input: v.InferOutput<typeof groupedInput>, principal: Actor): Promise<v.InferOutput<typeof groupedOutput>>;
	create(input: v.InferOutput<typeof createInput>, principal: Actor, token: ApiToken | null): Promise<v.InferOutput<typeof createOutput>>;
	flush(input: v.InferOutput<typeof flushInput>, principal: Actor): Promise<v.InferOutput<typeof flushOutput>>;
	markAllAsRead(input: v.InferOutput<typeof markAllAsReadInput>, principal: Actor): Promise<v.InferOutput<typeof markAllAsReadOutput>>;
	testNotification(input: v.InferOutput<typeof testNotificationInput>, principal: Actor): Promise<v.InferOutput<typeof testNotificationOutput>>;
	register(input: v.InferOutput<typeof registerInput>, principal: Actor): Promise<v.InferOutput<typeof registerOutput>>;
	showRegistration(input: v.InferOutput<typeof showRegistrationInput>, principal: Actor): Promise<v.InferOutput<typeof showRegistrationOutput>>;
	unregister(input: v.InferOutput<typeof unregisterInput>, principal: Actor | null): Promise<v.InferOutput<typeof unregisterOutput>>;
	updateRegistration(input: v.InferOutput<typeof updateRegistrationInput>, principal: Actor): Promise<v.InferOutput<typeof updateRegistrationOutput>>;
}
export type NotificationsContext<Actor extends ApiActor> = ApiContext<Actor> & {
	operations: { notifications: NotificationsOperations<Actor> };
};
