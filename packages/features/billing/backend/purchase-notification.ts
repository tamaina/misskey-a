/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import { MiBillingServiceOrder } from './models/BillingServiceOrder.js';
import type { DataSource } from 'typeorm';

function units(amount: string, decimals: number): string {
	if (decimals === 0) return amount;
	const padded = amount.padStart(decimals + 1, '0'), fraction = padded.slice(-decimals).replace(/0+$/, '');
	return padded.slice(0, -decimals) + (fraction ? `.${fraction}` : '');
}

/** Original CFW completion email with immutable native order metadata. */
export function purchaseReceiptLines(order: MiBillingServiceOrder, publicUrl: string): string[] {
	const snapshot = order.receiptSnapshot;
	return ['プラン購入が完了しました。', '', 'レシート', `購入日時: ${new Date(order.paidAt!).toISOString()}`, `注文ID: ${order.id}`, `プラン: ${order.offer.name}`,
									`利用期間: ${new Date(order.startsAt!).toISOString()} - ${new Date(order.endsAt!).toISOString()}`,
									`支払額: ${units(order.cashAmountBaseUnits ?? order.offer.amountBaseUnits, order.offer.decimals)} ${order.offer.tokenSymbol}`,
									...(snapshot ? [`税: ${snapshot.tax.name} (${snapshot.tax.rate})`, `税込: ${units(snapshot.tax.includedBaseUnits, order.offer.decimals)} ${snapshot.tax.currencyCode}`, `税抜: ${units(snapshot.tax.excludedBaseUnits, order.offer.decimals)} ${snapshot.tax.currencyCode}`, `税額: ${units(snapshot.tax.taxBaseUnits, order.offer.decimals)} ${snapshot.tax.currencyCode}`] : ['保存済みの税・販売者情報はありません。']),
									`チェーン: ${order.chainId}`, `トークン: ${order.offer.tokenSymbol} / ${order.offer.contractAddress}`, `Tx Hash: ${order.txHash ?? '-'}`, '', '販売者情報',
									...(snapshot ? [`名称: ${snapshot.seller.name}`, `住所: ${snapshot.seller.address || '-'}`, `登録番号: ${snapshot.seller.invoiceRegistrationNumber || '-'}`] : []),
									'', '支払い履歴から領収書を確認できます。', `${publicUrl.replace(/\/$/, '')}/settings/subscriptions`];
}
/** Reserve before delivery, as in CFW. This is at-most-once attempt, not a sent-mail guarantee. */
export function createPurchaseNotifier(db: DataSource, publicUrl: string, send: (to: string, subject: string, lines: readonly string[]) => Promise<void>, now = Date.now) {
	return async (orderId: string) => {
		const order = await db.manager.findOneBy(MiBillingServiceOrder, { id: orderId, status: 'paid' });
		if (!order?.userId || order.paidAt == null || order.startsAt == null || order.endsAt == null) return;
		const reserved = await db.query('INSERT INTO billing_notification ("eventKey", "userId", "createdAt") VALUES ($1,$2,$3) ON CONFLICT ("eventKey") DO NOTHING RETURNING "eventKey"', [`purchase:${order.id}`, order.userId, new Date(now())]);
		if (!reserved.length) return;
		const profile = await db.manager.findOne(MiUserProfile, { where: { userId: order.userId }, select: { email: true, emailVerified: true } });
		if (!profile?.emailVerified || !profile.email) return;
		await send(profile.email, '購入レシート', purchaseReceiptLines(order, publicUrl));
	};
}
