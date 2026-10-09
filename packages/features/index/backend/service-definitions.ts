/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

declare const portType: unique symbol;
const definitionType: unique symbol = Symbol('service definition');
export type PortToken<Value> = symbol & { readonly [portType]: Value };
export interface Port<Name extends string = string, Value = unknown> {
	readonly kind: 'port';
	readonly name: Name;
	readonly token: PortToken<Value>;
}
type Constructor = new (...args: never[]) => object;
export interface ServiceDefinition<C extends Constructor = Constructor, D extends readonly Dependency[] = readonly Dependency[]> {
	readonly [definitionType]: true;
	readonly kind: 'service';
	readonly ctor: C;
	readonly dependencies: D;
}
type Dependency = Port | ServiceDefinition;
const registeredDefinitions = new WeakSet<ServiceDefinition>();
type Value<R> = R extends Port<string, infer V> ? V : R extends ServiceDefinition<infer C> ? InstanceType<C> : never;
type Values<D extends readonly Dependency[]> = { -readonly [I in keyof D]: Value<D[I]> };
export function service<C extends Constructor, const D extends readonly Dependency[]>(
	ctor: C, dependencies: D, ..._proof: Values<D> extends ConstructorParameters<NoInfer<C>> ? [] : [never]
): ServiceDefinition<C, D> {
	const definition = Object.freeze({ [definitionType]: true as const, kind: 'service' as const, ctor, dependencies: Object.freeze([...dependencies]) as unknown as D });
	registeredDefinitions.add(definition);
	return definition;
}
export type Definitions = Record<string, ServiceDefinition>;
type InvalidDefinition<S> = S extends ServiceDefinition<infer C, infer D> ? Values<D> extends ConstructorParameters<C> ? never : S : S;
type Requirements<S> = S extends ServiceDefinition<infer C, infer D> ? {
	[I in keyof D]: D[I] extends Port<infer Name> ? Record<Name, ConstructorParameters<C>[I & keyof ConstructorParameters<C>]> : never
}[number] : never;
type Intersection<U> = (U extends unknown ? (value: U) => void : never) extends (value: infer I) => void ? I : never;
type NarrowInputs<D extends Definitions> = [Requirements<D[keyof D]>] extends [never] ? Record<never, never> : {
	[K in keyof Intersection<Requirements<D[keyof D]>>]: Intersection<Requirements<D[keyof D]>>[K]
};
type ServiceOutputs<D extends Definitions> = { [K in keyof D]: InstanceType<D[K]['ctor']> };
type Create<D extends Definitions> = keyof NarrowInputs<D> extends never ? () => ServiceOutputs<D> : (input: NarrowInputs<D>) => ServiceOutputs<D>;
export interface Feature<D extends Definitions> {
	readonly definitions: D;
	readonly ports: readonly Port[];
	readonly create: Create<D>;
}
export type Inputs<F extends { definitions: Definitions }> = NarrowInputs<F['definitions']>;
export type Outputs<F extends { definitions: Definitions }> = ServiceOutputs<F['definitions']>;

/** Explicit local edges only; validation runs before any constructor. */
export function defineServices<const D extends Definitions>(
	definitions: D, ..._proof: [InvalidDefinition<NoInfer<D[keyof D]>>] extends [never] ? [] : [never]
): Feature<D> {
	const snapshot = Object.freeze({ ...definitions });
	const constructors = new Set<Constructor>();
	for (const definition of Object.values(snapshot)) {
		if (!registeredDefinitions.has(definition)) throw new Error('Unregistered feature service definition');
		if (constructors.has(definition.ctor)) throw new Error('Duplicate feature service constructor');
		constructors.add(definition.ctor);
	}
	const members = new Set(Object.values(snapshot));
	const ports = new Map<string, Port>();
	const visited = new Set<ServiceDefinition>();
	const visiting = new Set<ServiceDefinition>();

	function visit(definition: ServiceDefinition): void {
		if (!members.has(definition)) throw new Error('Service dependency is outside this feature');
		if (visiting.has(definition)) throw new Error('Cyclic feature service dependency');
		if (visited.has(definition)) return;
		visiting.add(definition);
		for (const dependency of definition.dependencies) {
			if (dependency.kind === 'service') visit(dependency);
			else {
				const existing = ports.get(dependency.name);
				if (existing && existing.token !== dependency.token) throw new Error(`Conflicting port: ${dependency.name}`);
				ports.set(dependency.name, dependency);
			}
		}
		visiting.delete(definition);
		visited.add(definition);
	}

	for (const definition of members) visit(definition);
	const create = ((input: Record<string, unknown> = {}) => {
		for (const port of ports.values()) if (input[port.name] === undefined) throw new Error(`Missing port: ${port.name}`);
		const instances = new Map<ServiceDefinition, object>();

		function construct(definition: ServiceDefinition): object {
			const existing = instances.get(definition);
			if (existing) return existing;
			const args = definition.dependencies.map(dependency => dependency.kind === 'service' ? construct(dependency) : input[dependency.name]);
			const instance = new definition.ctor(...args as never[]);
			instances.set(definition, instance);
			return instance;
		}

		return Object.fromEntries(Object.entries(snapshot).map(([key, definition]) => [key, construct(definition)]));
	}) as Create<D>;
	return { definitions: snapshot, ports: Object.freeze([...ports.values()]), create };
}
