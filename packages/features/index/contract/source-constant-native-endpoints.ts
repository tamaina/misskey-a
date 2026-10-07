/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { SourceConstantEndpoints as OperationsSourceConstantEndpoints } from '../../operations/contract/source-constant-endpoint-definitions.js';
import type { SourceConstantEndpoints as InstanceSourceConstantEndpoints } from '../../instance/contract/source-constant-endpoint-definitions.js';
import type { SourceConstantEndpoints as UsersSourceConstantEndpoints } from '../../users/contract/source-constant-endpoint-definitions.js';
import type { SourceConstantEndpoints as IntegrationsSourceConstantEndpoints } from '../../integrations/contract/source-constant-endpoint-definitions.js';

export type SourceConstantNativeEndpoints = OperationsSourceConstantEndpoints
	& InstanceSourceConstantEndpoints
	& UsersSourceConstantEndpoints
	& IntegrationsSourceConstantEndpoints;
