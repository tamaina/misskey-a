/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
// Isolate application services; the feature SFCs, locale runtime and boot phase are real.
export const instance = {};
export const prefer = { s: { animation: false } };
export function definePage(value) { window.document.title = value().title; }
export function pleaseLogin(value) { window.document.documentElement.dataset.loginPath = value.path; }
