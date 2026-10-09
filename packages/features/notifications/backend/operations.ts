/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferSchemaOutput } from '@orpc/contract';
import type { ApiActor, ApiContext, ApiToken } from '../../api/backend/transport/context.js';
import type { listContract } from './endpoints/i/notifications.contract.js';
import type { groupedContract } from './endpoints/i/notifications-grouped.contract.js';
import type { createContract } from './endpoints/notifications/create.contract.js';
import type { flushContract } from './endpoints/notifications/flush.contract.js';
import type { markAllAsReadContract } from './endpoints/notifications/mark-all-as-read.contract.js';
import type { testNotificationContract } from './endpoints/notifications/test-notification.contract.js';
import type { registerContract } from './endpoints/sw/register.contract.js';
import type { showRegistrationContract } from './endpoints/sw/show-registration.contract.js';
import type { unregisterContract } from './endpoints/sw/unregister.contract.js';
import type { updateRegistrationContract } from './endpoints/sw/update-registration.contract.js';

export interface NotificationsOperations<Actor extends ApiActor> {
	list(input: InferSchemaOutput<NonNullable<typeof listContract['~orpc']['inputSchema']>>, principal: Actor): Promise<InferSchemaOutput<NonNullable<typeof listContract['~orpc']['outputSchema']>>>;
	grouped(input: InferSchemaOutput<NonNullable<typeof groupedContract['~orpc']['inputSchema']>>, principal: Actor): Promise<InferSchemaOutput<NonNullable<typeof groupedContract['~orpc']['outputSchema']>>>;
	create(input: InferSchemaOutput<NonNullable<typeof createContract['~orpc']['inputSchema']>>, principal: Actor, token: ApiToken | null): Promise<InferSchemaOutput<NonNullable<typeof createContract['~orpc']['outputSchema']>>>;
	flush(input: InferSchemaOutput<NonNullable<typeof flushContract['~orpc']['inputSchema']>>, principal: Actor): Promise<InferSchemaOutput<NonNullable<typeof flushContract['~orpc']['outputSchema']>>>;
	markAllAsRead(input: InferSchemaOutput<NonNullable<typeof markAllAsReadContract['~orpc']['inputSchema']>>, principal: Actor): Promise<InferSchemaOutput<NonNullable<typeof markAllAsReadContract['~orpc']['outputSchema']>>>;
	testNotification(input: InferSchemaOutput<NonNullable<typeof testNotificationContract['~orpc']['inputSchema']>>, principal: Actor): Promise<InferSchemaOutput<NonNullable<typeof testNotificationContract['~orpc']['outputSchema']>>>;
	register(input: InferSchemaOutput<NonNullable<typeof registerContract['~orpc']['inputSchema']>>, principal: Actor): Promise<InferSchemaOutput<NonNullable<typeof registerContract['~orpc']['outputSchema']>>>;
	showRegistration(input: InferSchemaOutput<NonNullable<typeof showRegistrationContract['~orpc']['inputSchema']>>, principal: Actor): Promise<InferSchemaOutput<NonNullable<typeof showRegistrationContract['~orpc']['outputSchema']>>>;
	unregister(input: InferSchemaOutput<NonNullable<typeof unregisterContract['~orpc']['inputSchema']>>, principal: Actor | null): Promise<InferSchemaOutput<NonNullable<typeof unregisterContract['~orpc']['outputSchema']>>>;
	updateRegistration(input: InferSchemaOutput<NonNullable<typeof updateRegistrationContract['~orpc']['inputSchema']>>, principal: Actor): Promise<InferSchemaOutput<NonNullable<typeof updateRegistrationContract['~orpc']['outputSchema']>>>;
}
export type NotificationsContext<Actor extends ApiActor> = ApiContext<Actor> & {
	operations: { notifications: NotificationsOperations<Actor> };
};
