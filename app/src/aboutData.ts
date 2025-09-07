interface Commands {
  command: string[];
  rule: string; // Nostrでの条件
  atpRule?: string; // ATPでの条件（未指定の場合はNostrと同じか未実装）
  description: string;
}

export const commandList: Commands[] = [
  {
    command: ["もの画像"],
    rule: "完全一致",
    atpRule: "完全一致",
    description: "もの画像リストの中から一枚リプライ",
  },
  {
    command: ["あるふぉふぉ", "あるんふぉふぉ"],
    rule: "が含まれる",
    atpRule: "未実装",
    description: "もの画像のアイコンが変わる",
  },
  {
    command: ["ないふぉふぉ", "ないんふぉふぉ"],
    rule: "が含まれる",
    atpRule: "が含まれる",
    description: "あるふぉふぉがもらえる",
  },
  {
    command: ["もの画像 [number]"],
    rule: "リプライ",
    atpRule: "リプライ",
    description: "もの画像リストの[number]番の画像をリプライ（0始まり）",
  },
  {
    command: ["ある（ん）ふぉふぉください"],
    rule: "リプライ",
    atpRule: "リプライ",
    description: "あるんふぉふぉがもらえる",
  },
  {
    command: ["[nostr:npub~] に\nある(ん)ふぉふぉ(を)送って"],
    rule: "リプライ",
    atpRule: "未実装", //"[@handle] に\nある(ん)ふぉふぉ(を)送って", // ATP版に修正
    description:
      "[nostr:npub~]さん (Nostr) / [@handle]さん (ATP) にあるふぉふぉをおくる",
  },
  {
    command: ["ある（ん）ふぉふぉあげて"],
    rule: "リプライ",
    atpRule: "リプライ",
    description: "TLにあるんふぉふぉを放流する",
  },
  {
    command: ["もの画像 枚数"],
    rule: "リプライ",
    atpRule: "リプライ",
    description: "現在のもの画像の総数をリプライ",
  },
  {
    command: ["和暦"],
    rule: "リプライ",
    atpRule: "リプライ",
    description: "和暦で今日の日付を教えてくれる\n便利だね",
  },
  {
    command: ["もの画像どこ？"],
    rule: "",
    atpRule: "",
    description: "もの画像Botがでてくる",
  },
  {
    command: ["ものサイトどこ？"],
    rule: "",
    atpRule: "",
    description: "このサイトのURLをリプライ",
  },
  {
    command: ["もの、〇〇vs△△vs...して"],
    rule: "",
    atpRule: "",
    description: "〇〇,△△,...からランダムでリプライ",
  },
  {
    command: ["もの、ランダムNIP"],
    rule: "",
    atpRule: "未実装", // NIPはNostrプロトコル固有
    description:
      "https://github.com/nostr-protocol/nips のURLをランダムで返す。存在しないNIPのことある (Nostrのみ)",
  },
];
