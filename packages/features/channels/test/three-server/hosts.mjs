/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
// Per-process test DNS only; never modify the machine's hosts file or TLS verification.
import dns from 'node:dns';
import tls from 'node:tls';
import { syncBuiltinESMExports } from 'node:module';

const hosts = new Set(['a.test', 'b.test', 'c.test', 'localhost']);
const absent = () => Object.assign(new Error('Outside isolated federation fixture'), { code: 'ENOTFOUND' });

function lookup(hostname, options = {}) {
	if (!hosts.has(hostname)) throw absent();
	if (options === 6 || options.family === 6) throw Object.assign(new Error('No IPv6 fixture'), { code: 'ENODATA' });
	const entry = { address: '127.0.0.1', family: 4 };
	return options.all ? [entry] : entry;
}

dns.lookup = (hostname, options, callback) => {
	if (typeof options === 'function') { callback = options; options = {}; }
	queueMicrotask(() => {
		try {
			const result = lookup(hostname, options);
			if (Array.isArray(result)) callback(null, result);
			else callback(null, result.address, result.family);
		} catch (error) { callback(error); }
	});
};
dns.promises.lookup = async (hostname, options) => lookup(hostname, options);
dns.promises.Resolver.prototype.resolve4 = async (hostname, options) => {
	if (!hosts.has(hostname)) throw absent();
	return options?.ttl ? [{ address: '127.0.0.1', ttl: 60 }] : ['127.0.0.1'];
};
dns.promises.Resolver.prototype.resolve6 = async () => { throw Object.assign(new Error('No IPv6 fixture'), { code: 'ENODATA' }); };
// Keep canonical federation identities on standard HTTPS origins while routing
// their sockets to the owned ephemeral loopback proxy. SNI, Host and verification stay intact.
const connect = tls.connect;
tls.connect = function (options, ...args) {
	if (typeof options === 'object' && hosts.has(options.servername ?? options.host) && Number(options.port) === 443) {
		options = { ...options, port: Number(process.env.CHANNEL_FIXTURE_PORT) };
	}
	return connect.call(this, options, ...args);
};
syncBuiltinESMExports();
