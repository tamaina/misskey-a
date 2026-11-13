/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { mcpScopes } from './discovery.js';

/** Short feature roles; unknown kinds intentionally have no description. */
const callToolDescriptions = new Map<string | null, string>([
	[null, 'Unscoped APIs'],
	['read:account', 'Read account'],
	['write:account', 'Edit account'],
	['read:blocks', 'Read blocked users'],
	['write:blocks', 'Block or unblock users'],
	['read:drive', 'Read drive'],
	['write:drive', 'Manage drive'],
	['read:favorites', 'Read favorite notes'],
	['write:favorites', 'Manage favorite notes'],
	['read:following', 'Read followed accounts'],
	['write:following', 'Follow or unfollow'],
	['read:messaging', 'Read messages'],
	['write:messaging', 'Send or delete messages'],
	['read:mutes', 'Read muted users'],
	['write:mutes', 'Mute or unmute users'],
	['write:notes', 'Post or delete notes'],
	['read:notifications', 'Read notifications'],
	['write:notifications', 'Manage notifications'],
	['read:reactions', 'Read reactions'],
	['write:reactions', 'Manage reactions'],
	['write:votes', 'Vote on polls'],
	['read:pages', 'Read Pages'],
	['write:pages', 'Manage Pages'],
	['write:page-likes', 'Manage Page likes'],
	['read:page-likes', 'Read Page likes'],
	['read:user-groups', 'Read user groups'],
	['write:user-groups', 'Manage user groups'],
	['read:channels', 'Read channels'],
	['write:channels', 'Manage channels'],
	['read:gallery', 'Read gallery posts'],
	['write:gallery', 'Manage gallery posts'],
	['read:gallery-likes', 'Read gallery likes'],
	['write:gallery-likes', 'Manage gallery likes'],
	['read:flash', 'Read Plays'],
	['write:flash', 'Manage Plays'],
	['read:flash-likes', 'Read Play likes'],
	['write:flash-likes', 'Manage Play likes'],
	['read:admin:abuse-user-reports', 'View abuse reports'],
	['write:admin:delete-account', 'Delete user account'],
	['write:admin:delete-all-files-of-a-user', 'Delete all user files'],
	['read:admin:index-stats', 'View database index statistics'],
	['read:admin:table-stats', 'View database table statistics'],
	['read:admin:user-ips', 'View user IP addresses'],
	['read:admin:meta', 'Read server settings'],
	['write:admin:reset-password', 'Reset user password'],
	['write:admin:resolve-abuse-user-report', 'Resolve abuse report'],
	['write:admin:send-email', 'Send email'],
	['read:admin:server-info', 'View server information'],
	['read:admin:show-moderation-log', 'View moderation log'],
	['read:admin:show-user', 'View private user information'],
	['write:admin:suspend-user', 'Suspend user'],
	['write:admin:unset-mfa', 'Reset user two-factor authentication'],
	['write:admin:unset-user-avatar', 'Remove user avatar'],
	['write:admin:unset-user-banner', 'Remove user banner'],
	['write:admin:unsuspend-user', 'Unsuspend user'],
	['write:admin:meta', 'Manage server settings'],
	['write:admin:user-note', 'Manage moderation notes'],
	['write:admin:roles', 'Manage roles'],
	['read:admin:roles', 'Read roles'],
	['write:admin:relays', 'Manage relays'],
	['read:admin:relays', 'Read relays'],
	['write:admin:invite-codes', 'Manage invite codes'],
	['read:admin:invite-codes', 'Read invite codes'],
	['write:admin:announcements', 'Manage announcements'],
	['read:admin:announcements', 'Read announcements'],
	['write:admin:avatar-decorations', 'Manage avatar decorations'],
	['read:admin:avatar-decorations', 'Read avatar decorations'],
	['write:admin:federation', 'Manage remote instances'],
	['write:admin:account', 'Manage user accounts'],
	['read:admin:account', 'Read user accounts'],
	['write:admin:emoji', 'Manage emoji'],
	['read:admin:emoji', 'Read emoji'],
	['write:admin:queue', 'Manage job queues'],
	['read:admin:queue', 'Read job queues'],
	['write:admin:promo', 'Manage promoted notes'],
	['write:admin:drive', 'Manage user drives'],
	['read:admin:drive', 'Read user drives'],
	['write:admin:ad', 'Manage ads'],
	['read:admin:ad', 'Read ads'],
	['write:invite-codes', 'Create invite codes'],
	['read:invite-codes', 'Read invite codes'],
	['write:clip-favorite', 'Manage favorite clips'],
	['read:clip-favorite', 'Read favorite clips'],
	['read:federation', 'Read remote instances'],
	['write:report-abuse', 'Report abuse'],
	['write:chat', 'Send or delete chat messages'],
	['read:chat', 'Read chat messages'],
]);

/** Stable MCP names: replace each colon or hyphen in the native kind with an underscore. */
export function callToolName(kind: string | null): string {
	return `call_api_${kind === null ? 'general' : kind.replace(/[:-]/g, '_')}`;
}

/** Fail closed if a future native kind would alias another tool. */
export function callToolKinds(kinds: readonly (string | null)[]): ReadonlyMap<string, string | null> {
	const tools = new Map<string, string | null>();
	for (const kind of kinds) {
		const name = callToolName(kind);
		if (!/^[a-zA-Z0-9_-]{1,128}$/.test(name) || (tools.has(name) && tools.get(name) !== kind)) throw new Error('Invalid or conflicting MCP call tool kind');
		tools.set(name, kind);
	}
	return tools;
}

export function callToolDefinition(kind: string | null, endpoints: readonly string[]) {
	const description = callToolDescriptions.get(kind);
	const readOnly = kind?.startsWith('read:') === true;
	return {
		name: callToolName(kind),
		...(description === undefined ? {} : { description }),
		inputSchema: { type: 'object', properties: { endpoint: { type: 'string', enum: [...endpoints] }, arguments: { type: 'object', additionalProperties: true } }, required: ['endpoint', 'arguments'], additionalProperties: false },
		securitySchemes: [{ type: 'oauth2', scopes: kind === null ? [...mcpScopes] : [...mcpScopes, kind] }],
		annotations: { readOnlyHint: readOnly, destructiveHint: !readOnly, idempotentHint: readOnly, openWorldHint: true },
	};
}
