/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseIncomingMail, MAIL_PARSE_LIMITS, createMailHtmlDocument, MAIL_IFRAME_SANDBOX } from '../../../backend/built/features/email/backend.js';
const bytes = value => Buffer.from(value.replace(/\n/g, '\r\n'));

test('decodes UTF8 subject and text without exposing Bcc or using headers as ownership', async () => {
	const mail = await parseIncomingMail(bytes('From: Sender <s@example.com>\nTo: wrong@example.com\nBcc: hidden@example.com\nSubject: =?UTF-8?B?5pel5pys6Kqe?=\nContent-Type: text/plain; charset=utf-8\n\nこんにちは'));
	assert.equal(mail.subject, '日本語');
	assert.equal(mail.from, 's@example.com');
	assert.match(mail.text, /こんにちは/);
	assert.equal('bcc' in mail, false);
	assert.equal('to' in mail, false);
});

test('multipart preserves binary attachments and safe CID metadata', async () => {
	const mail = await parseIncomingMail(bytes('Content-Type: multipart/mixed; boundary=x\n\n--x\nContent-Type: text/plain; charset=iso-8859-1\nContent-Transfer-Encoding: quoted-printable\n\ncaf=E9\n--x\nContent-Type: application/octet-stream\nContent-Disposition: attachment; filename="../../evil.bin"\nContent-ID: <pic@example>\nContent-Transfer-Encoding: base64\n\nAP+A\n--x--'));
	assert.match(mail.text, /café/);
	assert.equal(mail.attachments[0].filename, '.._.._evil.bin');
	assert.equal(mail.attachments[0].contentId, 'pic@example');
	assert.deepEqual([...mail.attachments[0].content], [0, 255, 128]);
});

test('resource budgets fail explicitly including opaque nested RFC822 content', async () => {
	await assert.rejects(parseIncomingMail(bytes('Subject: long\n\ntext'), { ...MAIL_PARSE_LIMITS, maxBytes: 4 }), /MAIL_TOO_LARGE/);
	await assert.rejects(parseIncomingMail(bytes('Subject: long\n\ntext'), { ...MAIL_PARSE_LIMITS, maxHeadersSize: 2 }));
	const multipart = bytes('Content-Type: multipart/mixed; boundary=x\n\n--x\nContent-Type: text/plain\n\none\n--x\nContent-Type: text/plain\n\ntwo\n--x--');
	await assert.rejects(parseIncomingMail(multipart, { ...MAIL_PARSE_LIMITS, maxPartCount: 2 }));
	await assert.rejects(parseIncomingMail(multipart, { ...MAIL_PARSE_LIMITS, maxNestingDepth: 0 }));
	await assert.rejects(parseIncomingMail(bytes('Content-Type: message/rfc822\n\nFrom: a@example.com\n\nnested'), { ...MAIL_PARSE_LIMITS, maxRfc822NestingDepth: 0 }), /MAIL_RFC822_DEPTH_EXCEEDED/);
});

test('HTML renderer drops active content and every resource/navigation attribute', () => {
	const html = createMailHtmlDocument('<base href="https://evil"><meta http-equiv="refresh" content="0;url=https://evil"><script>alert(1)</script><style>@import "https://evil";</style><svg><a href="https://evil">bad</a></svg><form action="https://evil"><input></form><iframe src="https://evil"></iframe><img src="https://evil" srcset="https://evil 2x"><a href="https://evil" ping="https://evil">link</a><p style="background:url(https://evil)" onclick="alert(1)">safe</p>');
	assert.equal(MAIL_IFRAME_SANDBOX, '');
	assert.match(html, /Content-Security-Policy/);
	assert.match(html, /<p>safe<\/p>/);
	assert.doesNotMatch(html, /https:|<script|<style|<svg|<form|<iframe|<img|onclick|srcset|http-equiv="refresh"/);
});
