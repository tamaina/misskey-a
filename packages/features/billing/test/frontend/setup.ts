/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { vi } from 'vitest';

// Mount the actual MkInput/MkButton/MkSelect. Isolate only unrelated navigation,
// autocomplete and global popup infrastructure; billing does not use these features.
vi.mock('@features/navigation/frontend/components/global/MkA.vue', () => ({ default: {} }));
vi.mock('@features/discovery/frontend/utility/autocomplete.js', () => ({ Autocomplete: class { } }));
vi.mock('@features/ui/frontend/os.js', () => ({ popupMenu: vi.fn(), selectUser: vi.fn() }));
vi.stubGlobal('ResizeObserver', class { observe() { } disconnect() { } });
vi.mock('@features/ui/frontend/utility/haptic.js', () => ({ haptic: vi.fn() }));
