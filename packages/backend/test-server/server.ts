import { portToPid } from 'pid-port';
import fkill from 'fkill';
import Fastify from 'fastify';
import { loadConfig } from '@/config.js';
import { server } from '@/boot/common.js';
import type { FastifyInstance } from 'fastify';

const config = loadConfig();
const originEnv = JSON.stringify(process.env);

process.env.NODE_ENV = 'test';

let app: Awaited<ReturnType<typeof server>>;
let controller: FastifyInstance | undefined;

/**
 * テスト用のサーバインスタンスを起動する
 */
export async function setup() {
	await killTestServer();

	console.log('starting application...');

	app = await server();

	await startControllerEndpoints();

	// ジョブキューは必要な時にテストコード側で起動する
	// ジョブキューが動くとテスト結果の確認に支障が出ることがあるので意図的に動かさないでいる

	console.log('application initialized.');
}

/**
 * テスト用のサーバインスタンスを停止する
 */
export async function teardown() {
	// 停止処理中に/env-resetを受け付けてアプリが再生成されないよう、先に閉じる
	await controller?.close();
	controller = undefined;

	await app.close();
	await killTestServer();
}

/**
 * 既に重複したポートで待ち受けしているサーバがある場合はkillする
 */
async function killTestServer() {
	//
	try {
		const pid = await portToPid(config.port);
		if (pid) {
			await fkill(pid, { force: true });
		}
	} catch {
		// NOP;
	}
}

/**
 * 別プロセスに切り離してしまったが故に出来なくなった環境変数の書き換え等を実現するためのエンドポイントを作る
 * @param port
 */
async function startControllerEndpoints(port = config.port + 1000) {
	const fastify = Fastify();
	controller = fastify;

	fastify.post<{ Body: { key?: string, value?: string } }>('/env', async (req, res) => {
		console.log(req.body);
		const key = req.body['key'];
		if (!key) {
			res.code(400).send({ success: false });
			return;
		}

		process.env[key] = req.body['value'];

		res.code(200).send({ success: true });
	});

	fastify.post<{ Body: { key?: string, value?: string } }>('/env-reset', async (req, res) => {
		process.env = JSON.parse(originEnv);

		await app.close();

		await killTestServer();

		console.log('starting application...');

		app = await server();

		res.code(200).send({ success: true });
	});

	await fastify.listen({ port: port, host: 'localhost' });
}
