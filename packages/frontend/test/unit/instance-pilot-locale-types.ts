/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ParameterizedString } from 'i18n';
import type { locales } from './retired-drive-locale-baseline.js';

export type Locale = typeof locales[string] & {
	'aboutX': ParameterizedString<'x'>;
	'correspondingSourceIsAvailable': ParameterizedString<'anchor'>;
	'didYouLikeMisskey': string;
	'pleaseDonate': ParameterizedString<'host'>;
	'remindMeLater': string;
};
