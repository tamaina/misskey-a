/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import rebases from './upstream-service-wiring-rebase.json' with { type: 'json' };

type Dependency = { port: string } | { service: string };
const sha256 = (source: string): string => createHash('sha256').update(source).digest('hex');

export function restoreUpstreamServiceSourceBaseline(file: string, source: string): string {
	const rebase = rebases.find(entry => entry.file === file);
	if (!rebase || sha256(source) === rebase.baselineSourceSha256) return source;
	if (sha256(source) !== rebase.sourceSha256) throw new Error(`Upstream constructor source differs: ${file}`);
	for (const edit of [...rebase.edits].reverse()) {
		if (source.slice(edit.start, edit.end) !== edit.current) throw new Error(`Upstream constructor source boundary differs: ${file}`);
		source = source.slice(0, edit.start) + edit.baseline + source.slice(edit.end);
	}
	if (sha256(source) !== rebase.baselineSourceSha256) throw new Error(`Upstream constructor source baseline differs: ${file}`);
	return source;
}

/** Validate the two pinned new ports before replaying the unmodified constructor fixture. */
export function restoreUpstreamConstructorBaseline(feature: string, service: string, dependencies: Dependency[], source?: string): Dependency[] {
	const rebase = rebases.find(entry => entry.feature === feature && entry.service === service);
	if (!rebase) return dependencies;
	const currentSource = source ?? readFileSync(new URL(`../../../../${rebase.file}`, import.meta.url), 'utf8');
	if (sha256(currentSource) !== rebase.sourceSha256) throw new Error(`Upstream constructor source differs: ${feature}/${service}`);
	restoreUpstreamServiceSourceBaseline(rebase.file, currentSource);
	if (JSON.stringify(dependencies) !== JSON.stringify(rebase.current)) throw new Error(`Upstream constructor boundary differs: ${feature}/${service}`);
	const baseline = dependencies.slice(0, -1);
	if (JSON.stringify(baseline) !== JSON.stringify(rebase.baseline)) throw new Error(`Upstream constructor baseline differs: ${feature}/${service}`);
	return baseline;
}
