/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type PaymentDurationUnit = 'days' | 'months' | 'years';

export type PaymentQuotePlanPrice = {
	amountBaseUnits: string;
	durationDays: number;
	durationUnit: PaymentDurationUnit;
};

export type PaymentQuoteCurrentPlan = {
	id: string;
	assignmentId?: string;
	name: string;
	sortOrder: number;
	startsAt?: number;
	expiresAt: number;
	price: PaymentQuotePlanPrice;
};

export type PaymentQuoteInput = {
	quoteCreatedAt: number;
	quoteTtlMs: number;
	targetPlanId: string;
	targetPlanSortOrder: number;
	targetPlanPrice: PaymentQuotePlanPrice;
	currentPlan: PaymentQuoteCurrentPlan | null;
	currentPlans?: PaymentQuoteCurrentPlan[];
};

export type PaymentQuote = {
	quoteCreatedAt: number;
	quoteExpiresAt: number;
	baseAmountBaseUnits: string;
	discountBaseUnits: string;
	payableAmountBaseUnits: string;
	discountAssignmentIds: string[];
	effectiveStartsAt: number;
	effectiveExpiresAt: number;
	currentPlan: {
		id: string;
		name: string;
		sortOrder: number;
		expiresAt: number;
		priceAmountBaseUnits: string;
		priceDurationDays: number;
		priceDurationUnit: PaymentDurationUnit;
	} | null;
};

export const DAY_MS = 86_400_000;

export function addPaymentDuration(baseMs: number, value: number, unit: PaymentDurationUnit): number {
	if (unit === 'days') return baseMs + value * DAY_MS;

	const base = new Date(baseMs);
	const year = base.getUTCFullYear();
	const month = base.getUTCMonth();
	const day = base.getUTCDate();
	const targetMonthIndex = unit === 'months' ? month + value : month + value * 12;
	const targetYear = year + Math.floor(targetMonthIndex / 12);
	const targetMonth = ((targetMonthIndex % 12) + 12) % 12;
	const targetDay = Math.min(day, getUtcDaysInMonth(targetYear, targetMonth));
	return Date.UTC(
		targetYear,
		targetMonth,
		targetDay,
		base.getUTCHours(),
		base.getUTCMinutes(),
		base.getUTCSeconds(),
		base.getUTCMilliseconds(),
	);
}

export function calculatePaymentQuote(input: PaymentQuoteInput): PaymentQuote {
	const baseAmount = BigInt(input.targetPlanPrice.amountBaseUnits);
	const currentPlans = input.currentPlans ?? (input.currentPlan != null ? [input.currentPlan] : []);
	const primaryCurrentPlan = input.currentPlan ?? currentPlans.at(0) ?? null;
	const samePlan = primaryCurrentPlan?.id === input.targetPlanId;
	const downgrade = primaryCurrentPlan != null && !samePlan && input.targetPlanSortOrder < primaryCurrentPlan.sortOrder;
	const currentPlanStartsAt = primaryCurrentPlan?.startsAt ?? input.quoteCreatedAt;
	const effectiveBaseAt = primaryCurrentPlan == null
		? Math.max(input.quoteCreatedAt, currentPlanStartsAt)
		: samePlan || downgrade
			? primaryCurrentPlan.expiresAt
			: Math.max(input.quoteCreatedAt, currentPlanStartsAt);
	const effectiveExpiresAt = addPaymentDuration(effectiveBaseAt, input.targetPlanPrice.durationDays, input.targetPlanPrice.durationUnit);

	if (primaryCurrentPlan == null || samePlan || downgrade) {
		return {
			quoteCreatedAt: input.quoteCreatedAt,
			quoteExpiresAt: input.quoteCreatedAt + input.quoteTtlMs,
			baseAmountBaseUnits: input.targetPlanPrice.amountBaseUnits,
			discountBaseUnits: '0',
			payableAmountBaseUnits: input.targetPlanPrice.amountBaseUnits,
			discountAssignmentIds: [],
			effectiveStartsAt: effectiveBaseAt,
			effectiveExpiresAt,
			currentPlan: primaryCurrentPlan != null && !samePlan ? toPaymentQuoteCurrentPlan(primaryCurrentPlan) : null,
		};
	}

	const rawDiscount = currentPlans
		.filter(currentPlan => currentPlan.id !== input.targetPlanId && currentPlan.sortOrder < input.targetPlanSortOrder)
		.reduce((sum, currentPlan) => {
			const discountBaseAt = Math.max(input.quoteCreatedAt, currentPlan.startsAt ?? input.quoteCreatedAt, effectiveBaseAt);
			const discountEndAt = Math.min(currentPlan.expiresAt, effectiveExpiresAt);
			const remainingMs = Math.max(0, discountEndAt - discountBaseAt);
			const currentDurationMs = Math.max(1, addPaymentDuration(discountBaseAt, currentPlan.price.durationDays, currentPlan.price.durationUnit) - discountBaseAt);
			return sum + BigInt(currentPlan.price.amountBaseUnits) * BigInt(remainingMs) / BigInt(currentDurationMs);
		}, 0n);
	const discount = rawDiscount > baseAmount ? baseAmount : rawDiscount;
	const discountAssignmentIds = discount > 0n
		? currentPlans
			.filter(currentPlan => currentPlan.assignmentId != null && currentPlan.id !== input.targetPlanId && currentPlan.sortOrder < input.targetPlanSortOrder)
			.map(currentPlan => currentPlan.assignmentId as string)
		: [];

	return {
		quoteCreatedAt: input.quoteCreatedAt,
		quoteExpiresAt: input.quoteCreatedAt + input.quoteTtlMs,
		baseAmountBaseUnits: input.targetPlanPrice.amountBaseUnits,
		discountBaseUnits: discount.toString(),
		payableAmountBaseUnits: (baseAmount - discount).toString(),
		discountAssignmentIds,
		effectiveStartsAt: effectiveBaseAt,
		effectiveExpiresAt,
		currentPlan: toPaymentQuoteCurrentPlan(primaryCurrentPlan),
	};
}

function toPaymentQuoteCurrentPlan(currentPlan: PaymentQuoteCurrentPlan): PaymentQuote['currentPlan'] {
	return {
		id: currentPlan.id,
		name: currentPlan.name,
		sortOrder: currentPlan.sortOrder,
		expiresAt: currentPlan.expiresAt,
		priceAmountBaseUnits: currentPlan.price.amountBaseUnits,
		priceDurationDays: currentPlan.price.durationDays,
		priceDurationUnit: currentPlan.price.durationUnit,
	};
}

function getUtcDaysInMonth(year: number, month: number): number {
	return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}
