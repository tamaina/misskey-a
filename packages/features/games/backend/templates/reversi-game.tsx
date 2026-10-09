/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Packed } from '@features/index/backend/packed.schema.js';
import type { CommonProps } from '@features/web/backend/templates/_.js';
import { Layout } from '@features/web/backend/templates/base.js';

export function ReversiGamePage(props: CommonProps<{
	reversiGame: Packed<'ReversiGameDetailed'>;
}>) {
	const title = `${props.reversiGame.user1.username} vs ${props.reversiGame.user2.username}`;
	const description = `⚫⚪Misskey Reversi⚪⚫`;

	function ogBlock() {
		return (
			<>
				<meta property="og:type" content="article" />
				<meta property="og:title" content={title} />
				<meta property="og:description" content={description} />
				<meta property="og:url" content={`${props.config.url}/reversi/g/${props.reversiGame.id}`} />
				<meta property="twitter:card" content="summary" />
			</>
		);
	}

	return (
		<Layout
			{...props}
			title={`${title} | ${props.instanceName}`}
			desc={description}
			ogSlot={ogBlock()}
		>
		</Layout>
	);
}
