import type { AnyContractProcedure, InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import type { pilotContract } from '#pilot-contract';

type Leaves<Router> = Router extends AnyContractProcedure ? Router : {
	[K in keyof Router]: Leaves<Router[K]>;
}[keyof Router];

/** The name is declared once on its contract; no second endpoint type registry. */
type RequestContracts = {
	[P in Leaves<typeof pilotContract> as P['~orpc']['meta'] extends { requestName: infer Name extends string }
		? Name : never]: P;
};
type Inputs = InferContractRouterInputs<RequestContracts>;
type Outputs = InferContractRouterOutputs<RequestContracts>;
export type PilotEndpoints = {
	[K in keyof RequestContracts]: { req: Inputs[K]; res: Outputs[K] extends void ? null : Outputs[K] };
};
