/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Chart from '../../core.js';
import { perUserDriveChartDescriptor } from '../../../../../../features/statistics/shared/chart-descriptors.js';

export const name = 'perUserDrive';

export { perUserDriveChartDescriptor as schema } from '../../../../../../features/statistics/shared/chart-descriptors.js';

const schema = perUserDriveChartDescriptor;

export const entity = Chart.schemaToEntity(name, schema, true);
