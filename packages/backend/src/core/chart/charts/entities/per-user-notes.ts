/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Chart from '../../core.js';
import { perUserNotesChartDescriptor } from '../../../../../../features/statistics/shared/chart-descriptors.js';

export const name = 'perUserNotes';

export { perUserNotesChartDescriptor as schema } from '../../../../../../features/statistics/shared/chart-descriptors.js';

const schema = perUserNotesChartDescriptor;

export const entity = Chart.schemaToEntity(name, schema, true);
