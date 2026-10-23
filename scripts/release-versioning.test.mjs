/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { load } from 'js-yaml';

const workflow = load(readFileSync(new URL('../.github/workflows/release-with-dispatch.yml', import.meta.url), 'utf8'));
const target = workflow.jobs['create-target'];
const prerelease = workflow.jobs['create-prerelease'];
const requireFrontend = createRequire(new URL('../packages/frontend/package.json', import.meta.url));
const { compareVersions } = requireFrontend('compare-versions');

async function increment(current, type = 'patch', tags = [], prs = []) {
	// Execute the caller's script after the same input interpolation as Actions.
	const script = target.with.version_increment_script
		.replace('${{ inputs.version_increment_type }}', type)
		.replace('${{ vars.STABLE_BRANCH }}', 'main');
	const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
	const github = {
		rest: { git: { listMatchingRefs: 'tags' }, pulls: { list: 'prs' } },
		paginate: async (method, options) => {
			assert.equal(options.owner, 'tamaina');
			assert.equal(options.repo, 'misskey-a');
			if (method === 'tags') {
				assert.equal(options.ref, 'tags/');
				return tags.map(tag => ({ ref: `refs/tags/${tag}` }));
			}
			assert.equal(options.state, 'open');
			assert.equal(options.base, 'main');
			return prs.map(title => ({ title }));
		},
	};
	return new AsyncFunction('process', 'github', 'context', script)(
		{ env: { CURRENT_VERSION: current } }, github, { repo: { owner: 'tamaina', repo: 'misskey-a' } },
	);
}

for (const type of ['major', 'minor', 'patch']) {
	for (const current of ['2026.10.0', '2026.1.99', '2026.12.1-beta.0', '2026.10.0-rc.9']) {
		test(`transition ${current} (${type})`, async () => assert.equal(await increment(current, type), '9000.0.0'));
	}
}

for (const [current, type, expected] of [
	['9000.0.0', 'patch', '9000.0.1'],
	['9000.2.3', 'patch', '9000.2.4'],
	['9000.2.3', 'minor', '9000.3.0'],
	['9000.2.3', 'major', '9001.0.0'],
	['9001.2.3-beta.0', 'patch', '9001.2.4'],
	['9001.2.3-rc.2', 'minor', '9001.3.0'],
	['9001.2.3-alpha.0', 'major', '9002.0.0'],
]) {
	test(`increment ${current} (${type})`, async () => assert.equal(await increment(current, type), expected));
}

for (const current of [undefined, '', 'v9000.0.0', '9000.0', '9000.00.0', '09000.0.0',
	'9000.0.-1', '9000.0.0\n', '9000.0.0-beta', '9000.0.0-beta.01', '9000.0.0-beta.0.extra',
	'9000.0.0+build', '9000.0.0-preview.0', '2025.10.0', '2027.1.0', '8999.0.0',
	'2026.0.0', '2026.13.0', '9007199254740992.0.0', '9000.0.0-beta.9007199254740992']) {
	test(`reject version ${JSON.stringify(current)}`, async () => assert.rejects(increment(current)));
}

for (const type of ['', 'PATCH', 'other', 'minor;']) {
	test(`reject increment ${JSON.stringify(type)}`, async () => assert.rejects(increment('2026.10.0', type)));
}

for (const [current, type] of [
	['9007199254740991.0.0', 'major'], ['9000.9007199254740991.0', 'minor'], ['9000.0.9007199254740991', 'patch'],
]) {
	test(`reject overflow ${type}`, async () => assert.rejects(increment(current, type)));
}

test('Release Manager caller retains external App and channel contract', async () => {
	assert.deepEqual(workflow.on.workflow_dispatch.inputs.version_increment_type.options, ['major', 'minor', 'patch']);
	assert.equal(workflow.on.workflow_dispatch.inputs.version_increment_type.default, 'patch');
	for (const job of [target, prerelease, workflow.jobs.merge]) {
		assert.match(job.uses, /^misskey-dev\/release-manager-actions\/\.github\/workflows\/.*@v2$/);
		assert.equal(job.with.use_external_app_to_release, true);
	}
	assert.equal(workflow.concurrency.group, 'release-manager');
	assert.equal(workflow.concurrency['cancel-in-progress'], false);
	assert.equal(target.with.draft_prerelease_channel, 'beta');
	assert.equal(prerelease.with.draft_prerelease_channel, 'beta');
	assert.equal(prerelease.with.ready_start_prerelease_channel, 'rc');
	assert.equal(prerelease.with.reset_number_on_channel_change, true);
	assert.match(target.if, /inputs.merge != true && inputs.start-rc != true/);
	assert.equal(`${await increment('2026.10.0')}-${target.with.draft_prerelease_channel}.0`, '9000.0.0-beta.0');
});

test('existing client compareVersions detects each release as an update', () => {
	const progression = ['2026.10.0', '9000.0.0-beta.0', '9000.0.0-beta.1',
		'9000.0.0-rc.0', '9000.0.0-rc.1', '9000.0.0', '9000.0.1-beta.0',
		'9000.0.1', '9000.1.0-beta.0', '9000.1.0', '9001.0.0-beta.0', '9001.0.0'];
	for (let i = 1; i < progression.length; i++) {
		assert.equal(compareVersions(progression[i], progression[i - 1]), 1);
		assert.equal(compareVersions(progression[i - 1], progression[i]), -1);
	}
	assert.equal(compareVersions('9000.0.0-beta.0', '2026.10.0-rc.99'), 1);
});

for (const tag of ['9000.0.0-beta.0', '9000.0.0-rc.2', '9000.0.0', '9001.0.0-beta.0', 'v9000.0.0']) {
	test(`reject repeated transition after ${tag}`, async () => {
		await assert.rejects(increment('2026.10.0', 'patch', [tag]), /existing independent release tag/);
	});
}

for (const [current, type, tag] of [
	['9000.0.0', 'patch', '9000.0.1-beta.0'],
	['9000.0.0', 'patch', '9000.2.0'],
	['9000.2.3', 'minor', '9001.0.0-beta.0'],
	['9000.2.3', 'major', '9001.0.0'],
]) {
	test(`reject stale target ${current} (${type}) after ${tag}`, async () => {
		await assert.rejects(increment(current, type, [tag]), /existing independent release tag/);
	});
}

test('allow a new target above old calendar and independent tags', async () => {
	assert.equal(await increment('2026.10.0', 'patch', ['2026.10.0', 'unrelated']), '9000.0.0');
	assert.equal(await increment('9000.2.3', 'patch', ['9000.2.3', '9000.2.3-rc.2']), '9000.2.4');
	assert.equal(await increment('9000.2.3', 'minor', ['9000.2.4-beta.0']), '9000.3.0');
});

test('block another open release PR before target creation', async () => {
	await assert.rejects(increment('2026.10.0', 'patch', [], ['Release: 2026.10.0']), /existing release PR/);
	await assert.rejects(increment('9000.0.0', 'patch', [], ['Release: 9000.0.1']), /existing release PR/);
	assert.equal(await increment('2026.10.0', 'patch', [], ['fix: another change']), '9000.0.0');
});
