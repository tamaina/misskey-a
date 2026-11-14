/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { implement } from '@orpc/server';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { apiError, internalError } from '@features/api/backend/transport/orpc-error.js';
import { emailContract } from './api.definition.js';
import { UserMailboxService } from './services/UserMailboxService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';

export type EmailInputs = InferContractRouterInputs<typeof emailContract>;
export type EmailOutputs = InferContractRouterOutputs<typeof emailContract>;

export interface EmailServicePort {
	state(userId: string): Promise<EmailOutputs['state']>;
	configure(userId: string, input: EmailInputs['configure']): Promise<void>;
	list(userId: string, input: EmailInputs['list']): Promise<EmailOutputs['list']>;
	show(userId: string, id: string): Promise<EmailOutputs['show']>;
	read(userId: string, id: string, isRead: boolean): Promise<void>;
	delete(userId: string, id: string): Promise<void>;
	raw(userId: string, id: string): Promise<EmailOutputs['raw']>;
	attachment(userId: string, id: string, attachmentId: number): Promise<EmailOutputs['attachment']>;
	send(userId: string, input: EmailInputs['send']): Promise<EmailOutputs['send']>;
	preview(userId: string, input: EmailInputs['preview']): Promise<EmailOutputs['preview']>;
	sent(userId: string, input: EmailInputs['sent']): Promise<EmailOutputs['sent']>;
	configureForwarding(userId: string, input: EmailInputs['configureForwarding']): Promise<void>;
	confirmForwarding(userId: string, input: EmailInputs['confirmForwarding']): Promise<void>;
}

const failures = {
	DISABLED: { status: 403, message: 'Mailbox is disabled.' },
	NOT_FOUND: { status: 404, message: 'Mail not found.' },
	INVALID_INPUT: { status: 400, message: 'Invalid mail request.' },
	QUOTA_EXCEEDED: { status: 400, message: 'Mailbox quota exceeded.' },
	CONFLICT: { status: 409, message: 'Mail request conflicts with an existing request.' },
	RATE_LIMITED: { status: 429, message: 'Mail rate limit exceeded.' },
	UNAVAILABLE: { status: 503, message: 'Mail service is unavailable.' },
} as const;

/** Never serialize SMTP exceptions, object storage keys, credentials or recipient envelopes. */
async function safely<T>(operation: () => Promise<T>): Promise<T> {
	try {
		return await operation();
	} catch (error) {
		const code = error !== null && typeof error === 'object' && 'code' in error ? error.code : undefined;
		if (typeof code === 'string' && Object.hasOwn(failures, code)) {
			const failure = failures[code as keyof typeof failures];
			throw apiError({ code: `MAIL_${code}`, id: '2f22ba27-a271-416b-8640-c491463327f3', ...failure });
		}
		throw apiError(internalError);
	}
}

export function createEmailRouter<Actor extends ApiActor>(deps: { mailbox: EmailServicePort }) {
	const api = createApiProcedure<Actor>();
	const principal = requirePrincipal<Actor>();
	return implement(emailContract).$context<ApiContext<Actor>>().router({
		state: api(emailContract.state).use(principal).handler(({ context }) => safely(() => deps.mailbox.state(context.principal.id))),
		configure: api(emailContract.configure).use(principal).handler(({ context, input }) => safely(() => deps.mailbox.configure(context.principal.id, input))),
		list: api(emailContract.list).use(principal).handler(({ context, input }) => safely(() => deps.mailbox.list(context.principal.id, input))),
		show: api(emailContract.show).use(principal).handler(({ context, input }) => safely(() => deps.mailbox.show(context.principal.id, input.id))),
		read: api(emailContract.read).use(principal).handler(({ context, input }) => safely(() => deps.mailbox.read(context.principal.id, input.id, input.isRead))),
		delete: api(emailContract.delete).use(principal).handler(({ context, input }) => safely(() => deps.mailbox.delete(context.principal.id, input.id))),
		raw: api(emailContract.raw).use(principal).handler(({ context, input }) => safely(() => deps.mailbox.raw(context.principal.id, input.id))),
		attachment: api(emailContract.attachment).use(principal).handler(({ context, input }) => safely(() => deps.mailbox.attachment(context.principal.id, input.id, input.attachmentId))),
		send: api(emailContract.send).use(principal).handler(({ context, input }) => safely(() => deps.mailbox.send(context.principal.id, input))),
		preview: api(emailContract.preview).use(principal).handler(({ context, input }) => safely(() => deps.mailbox.preview(context.principal.id, input))),
		sent: api(emailContract.sent).use(principal).handler(({ context, input }) => safely(() => deps.mailbox.sent(context.principal.id, input))),
		configureForwarding: api(emailContract.configureForwarding).use(principal).handler(({ context, input }) => safely(() => deps.mailbox.configureForwarding(context.principal.id, input))),
		confirmForwarding: api(emailContract.confirmForwarding).use(principal).handler(({ context, input }) => safely(() => deps.mailbox.confirmForwarding(context.principal.id, input))),
	});
}

type EmailRouter = ReturnType<typeof createEmailRouter<MiLocalUser>>;

@Injectable()
export class EmailApiProvider {
	private router: EmailRouter | undefined;
	constructor(private readonly moduleRef: ModuleRef) { }
	compose(): EmailRouter {
		if (this.router !== undefined) return this.router;
		this.router = createEmailRouter<MiLocalUser>({ mailbox: this.moduleRef.get(UserMailboxService, { strict: false }) });
		return this.router;
	}
}
