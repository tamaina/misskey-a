/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Preserve the existing template call signature during relocation.
export function FlushPage(props?: {}) {
	return (
		<>
			{'<!DOCTYPE html>'}
			<html>
				<head>
					<meta charset="UTF-8" />
					<meta name="application-name" content="Misskey" />
					<title>Clear preferences and cache</title>
				</head>
				<body>
					<div id="msg"></div>
					<script src="/static-assets/misc/flush.js"></script>
				</body>
			</html>
		</>
	);
}
