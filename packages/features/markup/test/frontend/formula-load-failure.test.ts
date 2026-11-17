/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { expect, test, vi } from 'vitest';

vi.mock('../../frontend/shared/MkFormulaCore.vue', () => { throw new Error('synthetic chunk failure'); });
import Formula from '../../frontend/shared/MkFormula.vue';

test.each([false, true])('failed lazy chunk preserves escaped text (block=%s)', async block => {
	const html = await renderToString(createSSRApp({ render: () => h(Formula, { formula: '<img src=x>', block }) }));
	expect(html).toBe(block ? '<pre>&lt;img src=x&gt;</pre>' : '<code>&lt;img src=x&gt;</code>');
});
