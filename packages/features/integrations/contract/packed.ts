/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { resultObject } from '../../api/contract/result-object.js';

export const packedSystemWebhookSchema = resultObject({
	"id": v.string(),
	"isActive": v.boolean(),
	"updatedAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"latestSentAt": v.pipe(v.nullable(v.string()), v.metadata({ "format": "date-time" })),
	"latestStatus": v.nullable(v.number()),
	"name": v.string(),
	"on": v.array(v.picklist(["abuseReport", "abuseReportResolved", "userCreated", "inactiveModeratorsWarning", "inactiveModeratorsInvitationOnlyChanged"])),
	"url": v.string(),
	"secret": v.string()
});
export const packedUserWebhookSchema = resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"userId": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"name": v.string(),
	"on": v.array(v.picklist(["mention", "unfollow", "follow", "followed", "note", "reply", "renote", "reaction"])),
	"url": v.string(),
	"secret": v.string(),
	"active": v.boolean(),
	"latestSentAt": v.pipe(v.nullable(v.string()), v.metadata({ "format": "date-time" })),
	"latestStatus": v.nullable(v.pipe(v.number(), v.integer()))
});
