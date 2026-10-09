/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { driveCreateContract } from '../backend/endpoints/drive/files/create.contract.js';
import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
export { driveCreateInput as driveFilesCreateInput, driveCreateWireInput as driveFilesCreateWireInput,
	driveCreateOutput as driveFilesCreateOutput } from '../backend/endpoints/drive/files/create.schema.js';

/** Compatibility exports share the colocated contract; they define no second schema or route. */
export const driveFileCreateContracts = { 'drive/files/create': driveCreateContract };
type Inputs = InferContractRouterInputs<typeof driveFileCreateContracts>;
type Outputs = InferContractRouterOutputs<typeof driveFileCreateContracts>;
export type NativeDriveFileCreateEndpoints = {
	[K in keyof typeof driveFileCreateContracts]: { req: Inputs[K]; res: Outputs[K] };
};
