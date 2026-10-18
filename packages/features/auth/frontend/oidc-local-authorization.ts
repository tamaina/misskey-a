/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { ensureSudo } from '@features/auth/frontend/utility/ensure-sudo.js';

/** External identity proof cannot elevate local privileges. */
export function ensureOidcSudo(isCurrent: () => boolean, signal?: AbortSignal): Promise<boolean> {
	return ensureSudo(isCurrent, signal);
}
