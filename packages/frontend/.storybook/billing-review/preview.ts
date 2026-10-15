/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
// Share the synthetic account, MSW and native component/popup registration.
localStorage.setItem('lang', 'ja-JP');
const { default: preview } = await import('../preview.js');
export default { ...preview };
