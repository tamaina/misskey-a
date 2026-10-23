/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable, type OnApplicationShutdown } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { MiMeta, UserIpsRepository } from '@features/persistence/backend/repositories/models.js';

/** Authentication-side IP history, independent of endpoint execution. */
@Injectable()
export class ApiIpLoggingService implements OnApplicationShutdown {
 private readonly histories = new Map<string, Set<string>>();
 private readonly clearIntervalId = setInterval(() => this.histories.clear(), 1000 * 60 * 60);
 constructor(@Inject(DI.meta) private readonly meta: MiMeta,
  @Inject(DI.userIpsRepository) private readonly userIps: UserIpsRepository) {}
 log(ip: string, userId: string) {
  if (!this.meta.enableIpLogging) return;
  const history = this.histories.get(userId);
  if (history?.has(ip)) return;
  if (history) history.add(ip); else this.histories.set(userId, new Set([ip]));
  try {
   this.userIps.createQueryBuilder().insert().values({ createdAt: new Date(), userId, ip }).orIgnore(true).execute();
  } catch {}
 }
 onApplicationShutdown() { clearInterval(this.clearIntervalId); }
}
