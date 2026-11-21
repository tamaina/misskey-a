/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as Bull from 'bullmq';
import { Not } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { InstancesRepository, MiMeta } from '@features/persistence/backend/repositories/models.js';
import type { Logger } from '@features/runtime/backend/logging/logger.js';
import { ApRequestService } from '../services/ApRequestService.js';
import { FederatedInstanceService } from '../services/FederatedInstanceService.js';
import { FetchInstanceMetadataService } from '../services/FetchInstanceMetadataService.js';
import { MemorySingleCache } from '@features/runtime/backend/cache/cache.js';
import type { MiInstance } from '../models/Instance.js';
import { InstanceChart } from '@features/statistics/backend/charts/instance.js';
import { ApRequestChart } from '@features/statistics/backend/charts/ap-request.js';
import { FederationChart } from '@features/statistics/backend/charts/federation.js';
import { StatusError } from '@features/runtime/backend/http/status-error.js';
import { UtilityService } from '../services/UtilityService.js';
import { bindThis } from '@features/runtime/backend/decorators.js';
import { QueueLoggerService } from '@features/runtime/backend/queue/QueueLoggerService.js';
import type { DeliverJobData } from '@features/runtime/backend/queue/types.js';

@Injectable()
export class DeliverProcessorService {
	private logger: Logger;
	private suspendedHostsCache: MemorySingleCache<MiInstance[]>;
	private latest: string | null;

	constructor(
		@Inject(DI.meta)
		private meta: MiMeta,

		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,

		private utilityService: UtilityService,
		private federatedInstanceService: FederatedInstanceService,
		private fetchInstanceMetadataService: FetchInstanceMetadataService,
		private apRequestService: ApRequestService,
		private instanceChart: InstanceChart,
		private apRequestChart: ApRequestChart,
		private federationChart: FederationChart,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('deliver');
		this.suspendedHostsCache = new MemorySingleCache<MiInstance[]>(1000 * 60 * 60); // 1h
	}

	@bindThis
	public async process(job: Bull.Job<DeliverJobData>): Promise<string> {
		const { host } = new URL(job.data.to);

		if (!this.utilityService.isFederationAllowedUri(job.data.to)) {
			return 'skip (blocked)';
		}

		// isSuspendedなら中断
		let suspendedHosts = this.suspendedHostsCache.get();
		if (suspendedHosts == null) {
			suspendedHosts = await this.instancesRepository.find({
				where: {
					suspensionState: Not('none'),
				},
			});
			this.suspendedHostsCache.set(suspendedHosts);
		}
		if (suspendedHosts.map(x => x.host).includes(this.utilityService.toPuny(host))) {
			return 'skip (suspended)';
		}

		const i = await (this.meta.enableStatsForFederatedInstances
			? this.federatedInstanceService.fetchOrRegister(host)
			: this.federatedInstanceService.fetch(host));

		// suspend server by software
		if (i != null && this.utilityService.isDeliverSuspendedSoftware(i)) {
			return 'skip (software suspended)';
		}

		try {
			await this.apRequestService.signedPost(job.data.user, job.data.to, job.data.content, job.data.digest, { level: i?.httpMessageSignaturesImplementationLevel, forceMainKey: job.data.forceMainKey });

			this.apRequestChart.deliverSucc();
			this.federationChart.deliverd(host, true);

			// Update instance stats
			process.nextTick(() => {
				void (async () => {
					const instance = i ?? await this.federatedInstanceService.fetchOrRegister(host);

					if (instance.isNotResponding) {
						await this.federatedInstanceService.update(instance.id, {
							isNotResponding: false,
							notRespondingSince: null,
						});
					}

					// Signing capability discovery is independent of optional instance statistics.
					await this.fetchInstanceMetadataService.fetchInstanceMetadata(instance);

					if (this.meta.enableChartsForFederatedInstances) {
						this.instanceChart.requestSent(instance.host, true);
					}
				})().catch(err => this.logger.warn('Post-delivery instance refresh failed', err));
			});

			return 'Success';
		} catch (res) {
			this.apRequestChart.deliverFail();
			this.federationChart.deliverd(host, false);

			// Update instance stats
			this.federatedInstanceService.fetchOrRegister(host).then(i => {
				if (!i.isNotResponding) {
					this.federatedInstanceService.update(i.id, {
						isNotResponding: true,
						notRespondingSince: new Date(),
					});
				} else if (i.notRespondingSince) {
					// 1週間以上不通ならサスペンド
					if (i.suspensionState === 'none' && i.notRespondingSince.getTime() <= Date.now() - 1000 * 60 * 60 * 24 * 7) {
						this.federatedInstanceService.update(i.id, {
							suspensionState: 'autoSuspendedForNotResponding',
						});
					}
				} else {
					// isNotRespondingがtrueでnotRespondingSinceがnullの場合はnotRespondingSinceをセット
					// notRespondingSinceは新たな機能なので、それ以前のデータにはnotRespondingSinceがない場合がある
					this.federatedInstanceService.update(i.id, {
						notRespondingSince: new Date(),
					});
				}

				if (this.meta.enableChartsForFederatedInstances) {
					this.instanceChart.requestSent(i.host, false);
				}
			});

			if (res instanceof StatusError) {
				// 4xx
				if (!res.isRetryable) {
					// 相手が閉鎖していることを明示しているため、配送停止する
					if (job.data.isSharedInbox && res.statusCode === 410) {
						this.federatedInstanceService.fetchOrRegister(host).then(i => {
							this.federatedInstanceService.update(i.id, {
								suspensionState: 'goneSuspended',
							});
						});
						throw new Bull.UnrecoverableError(`${host} is gone`);
					}
					throw new Bull.UnrecoverableError(`${res.statusCode} ${res.statusMessage}`);
				}

				// 5xx etc.
				throw new Error(`${res.statusCode} ${res.statusMessage}`);
			} else {
				// DNS error, socket error, timeout ...
				throw res;
			}
		}
	}
}
