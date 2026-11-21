/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { existsSync, mkdtempSync, mkdirSync, readdirSync, writeFileSync, readFileSync, cpSync, symlinkSync, openSync, closeSync, rmSync } from 'node:fs';
import https from 'node:https';
import http from 'node:http';
import net from 'node:net';
import { tmpdir, userInfo } from 'node:os';
import { resolve, join, basename } from 'node:path';

const root = resolve(import.meta.dirname, '../../../..');
assert.ok(existsSync(join(root, 'packages/backend/built/entry.js')), 'Build the backend before this fixture');
const directory = mkdtempSync(join(tmpdir(), 'misskey-channel-'));
const data = join(directory, 'data');
const socket = join(directory, 'pg');
mkdirSync(socket, { mode: 0o700 });
writeFileSync(join(directory, '.channel-three-server-fixture'), 'synthetic-only');
const versions = existsSync('/usr/lib/postgresql') ? readdirSync('/usr/lib/postgresql').sort((a, b) => Number(b) - Number(a)) : [];
const pg = process.env.MISSKEY_PG_BINDIR ?? versions.map(version => `/usr/lib/postgresql/${version}/bin`).find(path => existsSync(join(path, 'initdb')));
assert.ok(pg, 'PostgreSQL binaries required');
const preload = join(import.meta.dirname, 'three-server/hosts.mjs');
const children = [];
const hosts = ['a', 'b', 'c'];
const sockets = Object.fromEntries(hosts.map(host => [`${host}.test`, join(directory, `${host}.sock`)]));
const traffic = [];
let postgresStarted = false;
const redisName = `channel-fixture-${basename(directory)}`;
let redisStarted = false;
let proxy;
let scenario;
let interrupted;
const interrupt = signal => {
	interrupted = new Error(`Fixture interrupted by ${signal}`);
	scenario?.kill('SIGTERM');
};
const onTerm = () => interrupt('SIGTERM');
const onInt = () => interrupt('SIGINT');
process.on('SIGTERM', onTerm);
process.on('SIGINT', onInt);

function run(command, args, cwd = root, env = process.env, log) {
	const fd = log ? openSync(join(directory, log), 'w') : null;
	try {
		const result = spawnSync(command, args, { cwd, env, stdio: fd === null ? 'inherit' : ['ignore', fd, fd], timeout: 120_000 });
		if (result.error || result.status !== 0) throw new Error(`Fixture command failed: ${command}; log: ${log ?? 'console'}`);
	} finally { if (fd !== null) closeSync(fd); }
}

function start(command, args, cwd, env, log) {
	const fd = openSync(join(directory, log), 'w');
	const child = spawn(command, args, { cwd, env, stdio: ['ignore', fd, fd] });
	child.on('error', error => { child.fixtureSpawnError = error; });
	closeSync(fd);
	children.push(child);
	return child;
}

async function until(check, label, timeout = 90_000) {
	const deadline = Date.now() + timeout;
	while (Date.now() < deadline) {
		if (interrupted) throw interrupted;
		for (const child of children) if (child.fixtureSpawnError) throw child.fixtureSpawnError;
		if (await check()) return;
		await new Promise(done => setTimeout(done, 250));
	}
	throw new Error(`Timeout: ${label}; fixture logs: ${directory}`);
}

try {
	run(join(pg, 'initdb'), ['-D', data, '--encoding=UTF8', '--locale=C', '--auth-local=trust', '--auth-host=reject', '--wal-segsize=1', '--no-sync'], root, process.env, 'initdb.log');
	const pgConfig = join(directory, 'postgres.conf');
	writeFileSync(pgConfig, `data_directory = '${data}'\nlisten_addresses = ''\nport = 55439\nunix_socket_directories = '${socket}'\nunix_socket_permissions = 0700\nshared_buffers = '32MB'\nmax_connections = 40\nwork_mem = '2MB'\nmaintenance_work_mem = '16MB'\nmax_parallel_workers = 0\nmax_worker_processes = 1\nautovacuum = off\nfsync = off\nfull_page_writes = off\nmax_wal_size = '64MB'\nmin_wal_size = '2MB'\n`);
	run(join(pg, 'pg_ctl'), ['-D', data, '-l', join(directory, 'postgres.log'), '-o', `-c config_file=${pgConfig}`, '-w', '-t', '10', 'start']);
	postgresStarted = true;
	const redisDir = join(directory, 'redis');
	mkdirSync(redisDir, { mode: 0o700 });
	const redisSocket = join(redisDir, 'redis.sock');
	run('docker', ['run', '-d', '--pull=never', '--name', redisName, '--network', 'none', '--memory', '64m', '--cpus', '0.5', '--user', `${userInfo().uid}:${userInfo().gid}`, '--mount', `type=bind,src=${redisDir},dst=/data`, 'redis:8', 'redis-server', '--port', '0', '--unixsocket', '/data/redis.sock', '--unixsocketperm', '600', '--save', '', '--appendonly', 'no'], directory, process.env, 'redis-container.log');
	redisStarted = true;
	await until(() => existsSync(redisSocket), 'Redis socket');
	const key = join(directory, 'fixture.key');
	const cert = join(directory, 'fixture.crt');
	run('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', cert, '-days', '1', '-subj', '/CN=isolated-channel-fixture', '-addext', 'subjectAltName=DNS:a.test,DNS:b.test,DNS:c.test', '-addext', 'basicConstraints=critical,CA:TRUE'], directory, process.env, 'certificate.log');
	proxy = https.createServer({ key: readFileSync(key), cert: readFileSync(cert) }, (request, response) => {
		const host = request.headers.host?.split(':')[0];
		if (!sockets[host]) { response.writeHead(403).end(); return; }
		traffic.push({ host, method: request.method, path: request.url, signed: Boolean(request.headers.signature || request.headers['signature-input']) });
		const upstream = http.request({ socketPath: sockets[host], path: request.url, method: request.method, headers: { ...request.headers, 'x-forwarded-for': '127.0.0.1', 'x-forwarded-proto': 'https' } }, incoming => {
			response.writeHead(incoming.statusCode, incoming.headers); incoming.pipe(response);
		});
		upstream.on('error', () => { if (!response.headersSent) response.writeHead(502); response.end(); });
		request.pipe(upstream);
	});
	proxy.on('upgrade', (request, client, head) => {
		const target = sockets[request.headers.host?.split(':')[0]];
		if (!target) { client.destroy(); return; }
		const upstream = net.createConnection(target, () => {
			upstream.write(`${request.method} ${request.url} HTTP/${request.httpVersion}\r\n${request.rawHeaders.reduce((text, value, index) => text + (index % 2 === 0 ? `${value}: ` : `${value}\r\n`), '')}\r\n`);
			if (head.length) upstream.write(head);
			client.pipe(upstream); upstream.pipe(client);
		});
		upstream.on('error', () => client.destroy()); client.on('error', () => upstream.destroy());
		client.on('close', () => upstream.destroy());
	});
	await new Promise(done => proxy.listen(0, '127.0.0.1', done));
	const port = proxy.address().port;
	const env = { ...process.env, NODE_ENV: 'production', NODE_EXTRA_CA_CERTS: cert, NODE_OPTIONS: `--max-old-space-size=768 --import=${preload}`, CHANNEL_FIXTURE_PORT: String(port), MK_DISABLE_CLUSTERING: '1', MK_NO_DAEMONS: '1', UV_THREADPOOL_SIZE: '2' };
	for (const [index, host] of hosts.entries()) {
		const home = join(directory, host);
		const backend = join(home, 'packages/backend');
		mkdirSync(backend, { recursive: true }); mkdirSync(join(home, 'built'));
		cpSync(join(root, 'package.json'), join(home, 'package.json'));
		cpSync(join(root, 'packages/backend/package.json'), join(backend, 'package.json'));
		cpSync(join(root, 'packages/backend/ormconfig.js'), join(backend, 'ormconfig.js'));
		cpSync(join(root, 'packages/backend/built'), join(backend, 'built'), { recursive: true });
		symlinkSync(join(root, 'node_modules'), join(home, 'node_modules'));
		symlinkSync(join(root, 'packages/backend/node_modules'), join(backend, 'node_modules'));
		symlinkSync(join(root, 'packages/backend/migration'), join(backend, 'migration'));
		symlinkSync(join(root, 'assets'), join(home, 'assets'));
		const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
		writeFileSync(join(home, 'built/meta.json'), JSON.stringify({ version }));
		const config = { url: `https://${host}.test`, socket: sockets[`${host}.test`], chmodSocket: '600', db: { host: socket, port: 55439, db: `channel_${host}`, user: userInfo().username, pass: '', extra: { max: 5 } }, redis: { path: redisSocket, host: '127.0.0.1', port: 0, db: index, pass: '' }, id: 'aidx', allowedPrivateNetworks: ['127.0.0.1/32'], clusterLimit: 1, threadPoolSize: 1, trustProxy: true };
		writeFileSync(join(home, 'built/._config_.json'), JSON.stringify(config));
		run(join(pg, 'createdb'), ['-h', socket, '-p', '55439', '-U', userInfo().username, `channel_${host}`]);
		run(process.execPath, [join(root, 'packages/backend/node_modules/typeorm/cli.js'), 'migration:run', '-d', join(backend, 'ormconfig.js')], backend, env, `${host}-migration.log`);
		const child = start(process.execPath, ['built/entry.js'], backend, env, `${host}-server.log`);
		await until(() => { if (child.exitCode !== null) throw new Error(`Server ${host} exited; ${directory}/${host}-server.log`); return existsSync(sockets[`${host}.test`]); }, `server ${host}`);
		console.log(`Started isolated ${host}.test on Unix socket`);
	}
	if (interrupted) throw interrupted;
	scenario = start(process.execPath, [join(import.meta.dirname, 'three-server/scenarios.mjs')], root, { ...env, CHANNEL_FIXTURE_PORT: String(port), CHANNEL_FIXTURE_DIRECTORY: directory, CHANNEL_FIXTURE_ROOT: root }, 'scenarios.log');
	const timer = setTimeout(() => scenario.kill('SIGTERM'), 180_000);
	let code;
	try { [code] = await once(scenario, 'exit'); } finally { clearTimeout(timer); }
	console.log(readFileSync(join(directory, 'scenarios.log'), 'utf8'));
	assert.equal(code, 0, `Three-server scenarios failed; logs: ${directory}`);
} finally {
	for (const child of children.reverse()) {
		if (!child.pid || child.exitCode !== null || child.signalCode !== null) continue;
		const exited = once(child, 'exit'); child.kill('SIGTERM');
		const timer = setTimeout(() => child.kill('SIGKILL'), 10_000);
		await exited; clearTimeout(timer);
	}
	proxy?.closeAllConnections();
	if (proxy?.listening) await new Promise(done => proxy.close(done));
	if (postgresStarted) run(join(pg, 'pg_ctl'), ['-D', data, '-m', 'fast', '-w', '-t', '10', 'stop']);
	if (redisStarted) {
		const log = spawnSync('docker', ['logs', redisName], { encoding: 'utf8' });
		writeFileSync(join(directory, 'redis.log'), (log.stdout ?? '') + (log.stderr ?? ''));
		run('docker', ['rm', '-f', redisName]);
	}
	writeFileSync(join(directory, 'traffic.json'), JSON.stringify(traffic, null, 2));
	if (!process.env.CHANNEL_FIXTURE_KEEP_DATA) {
		for (const childDirectory of ['data', ...hosts]) rmSync(join(directory, childDirectory), { recursive: true, force: true });
	}
	process.off('SIGTERM', onTerm);
	process.off('SIGINT', onInt);
	console.log(`Task-owned three-server logs retained at ${directory}; own services stopped.`);
}
