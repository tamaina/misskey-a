/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Keep legacy imports and constructor-based DI resolving the same TOTP service.
export { TotpService as UserAuthService } from './TotpService.js';
