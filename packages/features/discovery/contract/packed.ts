/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';

export const packedHashtagSchema = v.strictObject({
	"tag": v.pipe(v.string(), v.metadata({ "example": "misskey" })),
	"mentionedUsersCount": v.number(),
	"mentionedLocalUsersCount": v.number(),
	"mentionedRemoteUsersCount": v.number(),
	"attachedUsersCount": v.number(),
	"attachedLocalUsersCount": v.number(),
	"attachedRemoteUsersCount": v.number()
});
