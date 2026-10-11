/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { permissions } from 'misskey-js';
import { InvalidRequestError, InvalidScopeError } from './errors.js';

export function eligibleOAuthPermissions(resource: string | undefined, administrator: boolean): string[] {
	return permissions.filter(permission => (resource !== undefined || permission !== 'access:mcp')
		&& (administrator || (!permission.startsWith('read:admin') && !permission.startsWith('write:admin'))));
}

/** Only a server-stored empty request enables selection; never trust a browser mode flag. */
export function selectedOAuthScopes(requested: readonly string[], selected: unknown, eligible: readonly string[]): string[] {
	if (requested.length > 0) {
		if (selected !== undefined) throw new InvalidRequestError('Scope selection is unavailable for a nonempty request');
		return [...requested];
	}
	if (typeof selected !== 'string' || selected.length > 4096) throw new InvalidScopeError('Select permissions explicitly');
	const scopes = [...new Set(selected.split(/\s+/).filter(Boolean))];
	if (scopes.length === 0 || scopes.some(scope => !eligible.includes(scope))) throw new InvalidScopeError('Invalid selected permissions');
	return scopes;
}
