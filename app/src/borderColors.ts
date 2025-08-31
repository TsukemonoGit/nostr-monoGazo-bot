import { css } from "../styled-system/css";
// サービス種別ごとのボーダー色定義
const borderColors = {
  nostr: "#ffb2d2ff",
  atp: "#98cdffff",
  default: "token(colors.gray.300)",
} as const;

// 基本アイテムスタイル定義
const baseItemStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "14px 12px",
  borderRadius: "5px",
  backgroundColor: "#fafafa",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
} as const;

// 事前定義されたスタイルクラス
export const itemStyles = {
  nostr: css({
    ...baseItemStyle,
    border: `2px solid ${borderColors.nostr}`,
  }),
  atp: css({
    ...baseItemStyle,
    border: `2px solid ${borderColors.atp}`,
  }),
  default: css({
    ...baseItemStyle,
    border: `2px solid ${borderColors.default}`,
  }),
} as const;

// アイテムタイプ判定
type ItemType = "nostr" | "atp" | "default";

const getItemType = (item: any): ItemType => {
  if (item.nostr) return "nostr";
  if (item.atp) return "atp";
  return "default";
};

// スタイル選択関数（推奨）
export const getItemStyleClass = (item: any): string => {
  const itemType = getItemType(item);
  return itemStyles[itemType];
};

// 動的スタイル生成関数（非推奨 - パフォーマンス上の理由）
export const getItemStyle = (item: any): string => {
  const itemType = getItemType(item);
  return css({
    ...baseItemStyle,
    border: `2px solid ${borderColors[itemType]}`,
  });
};
