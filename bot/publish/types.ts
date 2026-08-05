/**
 * パブリッシャー共通定義
 */

import type { PlatformName, PostContent, PostResult, Publisher } from "../types";

export type { PostContent, PostResult, Publisher, PlatformName };

/** 各プラットフォーム固有の文字数上限 */
export const CHARACTER_LIMITS: Record<PlatformName, number> = {
  x: 280,
  threads: 500,
  instagram: 2200,
};
