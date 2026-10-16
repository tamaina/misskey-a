/*
	* SPDX-FileCopyrightText: syuilo and misskey-project
	* SPDX-License-Identifier: AGPL-3.0-only
	*/

import * as v from 'valibot';

export const finiteNumber = v.pipe(v.number(), v.finite());

export const systemWebhookSchema = v.strictObject({
	"id": v.string(),
	"isActive": v.boolean(),
	"updatedAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"latestSentAt": v.pipe(v.nullable(v.string()), v.metadata({ "format": "date-time" })),
	"latestStatus": v.nullable(finiteNumber),
	"name": v.string(),
	"on": v.array(v.picklist(["abuseReport", "abuseReportResolved", "userCreated", "inactiveModeratorsWarning", "inactiveModeratorsInvitationOnlyChanged"])),
	"url": v.string(),
	"secret": v.string()
});
export const userWebhookSchema = v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"userId": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"name": v.string(),
	"on": v.array(v.picklist(["mention", "unfollow", "follow", "followed", "note", "reply", "renote", "reaction"])),
	"url": v.string(),
	"secret": v.string(),
	"active": v.boolean(),
	"latestSentAt": v.pipe(v.nullable(v.string()), v.metadata({ "format": "date-time" })),
	"latestStatus": v.nullable(v.pipe(finiteNumber, v.integer()))
});

export function toSystemWebhook(webhook: v.InferOutput<typeof systemWebhookSchema>): v.InferOutput<typeof systemWebhookSchema> {
	return {
		id: webhook.id, isActive: webhook.isActive, updatedAt: webhook.updatedAt,
		latestSentAt: webhook.latestSentAt, latestStatus: webhook.latestStatus,
		name: webhook.name, on: [...webhook.on], url: webhook.url, secret: webhook.secret,
	};
}
