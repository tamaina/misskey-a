/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
// Isolate application services; the feature SFCs, locale runtime and boot phase are real.
import { reactive, toRefs } from 'vue';
export const instance = {};
const params = new URL(window.location.href).searchParams;
const state = reactive({ animation: false, mfmSearchEngine: params.get('engine') ?? 'google', mfmSearchEngineCustomUrl: params.get('customUrl') ?? '' });
export const prefer = { s: state, r: toRefs(state) };
export function definePage(value) { window.document.title = value().title; }
export function pleaseLogin(value) { window.document.documentElement.dataset.loginPath = value.path; }
