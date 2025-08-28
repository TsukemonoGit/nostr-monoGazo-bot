export type NostrItem = {
  author: string;
  post_id: string; // "note1670..." のような形式
};

export type AtpItem = {
  author: string;
  id: string; // "3juyx2..." のような形式
};

export type Item = {
  id: string;
  url: string;
  date: string;
  memo: string;
  nostr?: NostrItem;
  atp?: AtpItem;
};

export type JsonData = Item[];
