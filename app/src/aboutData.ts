interface Commands {
  command: string[];
  rule: string;
  description: string;
}
export const commandList: Commands[] = [
  {
    command: ["もの画像"],
    rule: "完全一致",
    description: "もの画像リストの中から一枚リプライ",
  },
  {
    command: ["あるふぉふぉ", "あるんふぉふぉ"],
    rule: "が含まれる",
    description: "もの画像のアイコンが変わる\n嬉しいので",
  },
  {
    command: ["ないふぉふぉ", "ないんふぉふぉ"],
    rule: "が含まれる",
    description: "あるふぉふぉがもらえる",
  },
  {
    command: ["もの画像 [number]"],
    rule: "リプライ",
    description: "もの画像リストの[number]番の画像をリプライ（0始まり）",
  },
  {
    command: ["ある（ん）ふぉふぉください"],
    rule: "リプライ",
    description: "あるんふぉふぉがもらえる",
  },
  {
    command: ["[nostr:npub~] に\nある(ん)ふぉふぉ(を)送って"],
    rule: "リプライ",
    description: "[nostr:npub~]さんにあるふぉふぉをおくる",
  },
  {
    command: ["ある（ん）ふぉふぉあげて"],
    rule: "リプライ",
    description: "TLにあるんふぉふぉを放流する",
  },
  {
    command: ["もの画像 枚数"],
    rule: "リプライ",
    description: "現在のもの画像の総数をリプライ",
  },
  {
    command: ["和暦"],
    rule: "リプライ",
    description: "和暦で今日の日付を教えてくれる\n便利だね",
  },
  {
    command: ["もの画像どこ？"],
    rule: "",
    description: "もの画像Botがでてくる",
  },
  {
    command: ["ものサイトどこ？"],
    rule: "",
    description: "このサイトのURLをリプライ",
  },
  {
    command: ["もの、〇〇vs△△vs...して"],
    rule: "",
    description: "〇〇,△△,...からランダムでリプライ",
  },{
    command: ["もの、ランダムNIP"],
    rule: "",
    description: "https://github.com/nostr-protocol/nips のURLをランダムで返す。存在しないNIPのことある",
  },
];
