/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { RegistryJsonValue } from './endpoints/i/registry/registry.schema.js';
export interface PreferencesRegistryItem {
	key: string;
	value: RegistryJsonValue;
	updatedAt: Date;
}
export interface PreferencesRegistry {
	getItem(userId: string, domain: string | null, scope: string[], key: string): Promise<PreferencesRegistryItem | null>;
	getAllItemsOfScope(userId: string, domain: string | null, scope: string[]): Promise<PreferencesRegistryItem[]>;
	getAllKeysOfScope(userId: string, domain: string | null, scope: string[]): Promise<string[]>;
	getAllScopeAndDomains(userId: string): Promise<{
		domain: string | null;
		scopes: string[][];
	}[]>;
	remove(userId: string, domain: string | null, scope: string[], key: string): Promise<void>;
	set(userId: string, domain: string | null, scope: string[], key: string, value: RegistryJsonValue): Promise<void>;
}
export interface PreferencesDependencies {
	registry: PreferencesRegistry;
}
