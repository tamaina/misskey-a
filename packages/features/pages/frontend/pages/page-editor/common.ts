/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import FeatureLocaleMessages from '@features/pages/frontend/ts-messages.vue';
import type { MkSelectItem } from '@features/ui/frontend/components/MkSelect.vue';

export function getPageBlockList() {
	return [
		{ value: 'section', label: FeatureLocaleMessages.$locale._pages.blocks.section },
		{ value: 'text', label: FeatureLocaleMessages.$locale._pages.blocks.text },
		{ value: 'image', label: FeatureLocaleMessages.$locale._pages.blocks.image },
		{ value: 'note', label: FeatureLocaleMessages.$locale._pages.blocks.note },
	] as const satisfies MkSelectItem[];
}
