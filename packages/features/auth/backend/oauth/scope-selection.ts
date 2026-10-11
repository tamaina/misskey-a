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

/** The provider derives optional additions from the stored canonical MCP resource, never a browser flag. */
export function selectedOAuthScopes(requested: readonly string[], selected: unknown, eligible: readonly string[], allowAdditions = false): string[] {
	if (requested.length > 0 && !allowAdditions) {
		if (selected !== undefined) throw new InvalidRequestError('Scope selection is unavailable for a nonempty request');
		return [...requested];
	}
	if (requested.length > 0 && selected === undefined) selected = '';
	if (typeof selected !== 'string' || selected.length > 4096) throw new InvalidScopeError('Select permissions explicitly');
	const scopes = [...new Set(selected.split(/\s+/).filter(Boolean))];
	if ((requested.length === 0 && scopes.length === 0)
		|| scopes.some(scope => !eligible.includes(scope) || (requested.length > 0 && (requested.includes(scope) || scope === 'access:mcp')))
		|| (allowAdditions && requested.some(scope => !eligible.includes(scope)))) throw new InvalidScopeError('Invalid selected permissions');
	return [...new Set([...requested, ...scopes])];
}
