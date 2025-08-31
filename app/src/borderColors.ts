import { css } from "../styled-system/css";
import { cva } from "../styled-system/css/cva";
// アイテムタイプ判定
type ItemType = "nostr" | "atp" | "default";
// サービス種別ごとのボーダー色定義
const borderColors = {
  nostr: "#ffb2d2ff",
  atp: "#98cdffff",
  default: "token(colors.gray.300)",
} as const;

// アイテムのスタイル定義（CVAでバリアント化）
export const itemStyle = cva({
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "14px 12px",
    borderRadius: "5px",
    backgroundColor: "#fafafa",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    position: "relative", // 疑似要素の位置指定のために必要
    borderWidth: "2px",
    borderStyle: "solid",
  },
  variants: {
    type: {
      nostr: {
        borderColor: borderColors.nostr,
        _before: {
          content: '"N"', // 'nostr'用のマーク
          position: "absolute",
          top: "4px",
          left: "4px",
          fontSize: "12px",
          lineHeight: 1,
          fontWeight: "bold",
          color: borderColors.nostr,
          backgroundColor: "#fff",
          borderRadius: "2px",
          padding: "0 2px",
          zIndex: 10,
        },
      },
      atp: {
        borderColor: borderColors.atp,
        _before: {
          content: '"A"', // 'atp'用のマーク
          position: "absolute",
          top: "4px",
          left: "4px",
          fontSize: "12px",
          fontWeight: "bold",
          color: borderColors.atp,
          backgroundColor: "#fff",
          borderRadius: "2px",
          padding: "0 2px",
          zIndex: 10,
        },
      },
      default: {
        borderColor: borderColors.default,
      },
    },
  },
});

const getItemType = (item: any): ItemType => {
  if (item.nostr) return "nostr";
  if (item.atp) return "atp";
  return "default";
};

// スタイルクラスを生成する関数
export const getItemStyleClass = (item: any): string => {
  const itemType = getItemType(item);
  return itemStyle({ type: itemType });
};
