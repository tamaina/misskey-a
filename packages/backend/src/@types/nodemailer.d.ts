/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Resolve the installed @types package from the backend without duplicating its declarations.
declare module 'nodemailer' {
	export * from 'nodemailer/index.js';
}
