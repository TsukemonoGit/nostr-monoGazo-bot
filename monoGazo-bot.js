import WebSocket from 'ws';
import { createRxNostr, createRxForwardReq, verify, uniq, now } from "rx-nostr";
import { delay, filter } from "rxjs";
import { nip19 } from 'nostr-tools';
import env from "dotenv";
env.config();

import { exec } from 'child_process'
import { readFile, writeFile } from 'fs/promises'


const monoGazoList = JSON.parse(await readFile('./imageList.json'));  //JSONで読み込む方

const nsec = process.env.NSEC_HEX;
const npub_hex = process.env.PUBHEX_HEX;
const accessToken = process.env.TOKEN;
const scriptPath = process.env.SCRIPTPATH;
const owners = JSON.parse(process.env.ORNERS_HEX.replace(/'/g, '"'));
const point_user = process.env.POINTUSER_PUB_HEX;

let pointData;

try {
  pointData = JSON.parse(await readFile('./pointlog.json'));
} catch (error) {
  pointData = {
    allpoint: 0,
    log: []
  }
}


const metadata = {
  name: "mono_gazo",
  picture: "",
  display_name: "もの画像",
  banner: "",
  website: "https://tsukemonogit.github.io/nostr-monoGazo-bot/",
  about: "ものが集めた画像\nmono画像\nあるんふぉふぉ\nこれ入れてとか\n入れないでとかあったら\nどうにかこうにかお伝え下さい",
  nip05: "mono_gazo@tsukemonoGit.github.io",
  lud16: "tsukemono@getalby.com",
}


const rxNostr = createRxNostr({ websocketCtor: WebSocket });
rxNostr.setDefaultRelays(["wss://yabu.me", "wss://r.kojira.io", "wss://relay-jp.nostr.wirednet.jp", "wss://relay-jp.nostr.moctane.com"]);

const rxReq = createRxForwardReq();

// Create observable
const observable = rxNostr.use(rxReq)
  .pipe(
    // Verify event hash and signature
    verify(),
    // Uniq by event hash
    uniq(),

  );

//リレーの接続監視、エラーだったら10分待って再接続する
rxNostr.createConnectionStateObservable().pipe(
  //when an error pachet is received
  filter((packet) => packet.state === "error"),
  //wait one minute
  delay(60 * 10000)
).subscribe((packet) => { rxNostr.reconnect(packet.from) });


//書き込む前に書き込めるリレーを確認してみる
const writeRelays = () => {
  const allRelayStatus = rxNostr.getAllRelayStatus(); // 連想配列を取得
  //console.log(allRelayStatus);
  //connected以外があるときだけ一次リレー設定しようかと思ったけどとりあえず
  // const hasDisconnectedRelay = Object.values(allRelayStatus).some(
  //   relay => relay.status !== "connected"
  // );
  const connectedRelaysArray = Object.entries(allRelayStatus)
    .filter(([key, value]) => value.connection === "connected")
    .reduce((arr, [key, value]) => {
      arr.push(key);
      return arr;
    }, []);
  if (connectedRelaysArray.length < 1) {
    console.log("書込み可能なリレーがないかも");
  }
  //console.log(connectedRelaysArray);
  return connectedRelaysArray;
}
const postEvent = async (kind, content, tags, created_at) => {//}:EventData){
  try {

    const res = rxNostr.send({
      kind: kind,
      content: content,
      tags: tags,
      pubkey: npub_hex,
      created_at: created_at
    }, { seckey: nsec, relays: writeRelays() })
      .subscribe({
        next: (packet) => {
          console.log(`relay: ${packet.from} -> ${packet.ok ? "succeeded" : "failed"}`);
        },
        error: (error) => {
          console.log("Error");
        }
      });
  } catch (error) {
    console.log(error);
  }

}

const postRepEvent = async (event, content, tags) => {//}:EventData){

  const tag = [
    ["p", event.pubkey],
    ["e", event.id]];

  const root = event.tags?.find((item) => item[item.length - 1] === "root");
  const warning = event.tags?.find((item) => item[0] === "content-warning");
  // rootが見つかった場合、tagsにrootを追加
  if (root) {
    tag.push(root);
  }
  if (warning) {
    tag.push(warning);
  }
  // 新しい変数combinedTagsにtagとtagsを結合した結果を格納
  const combinedTags = tag.concat(tags);

  try {
    const res = rxNostr.send({
      kind: event.kind,
      content: content,
      tags: combinedTags,
      pubkey: npub_hex,
      created_at: Math.max(event.created_at + 1, Math.floor(Date.now() / 1000))
    }, { seckey: nsec, relays: writeRelays() }).subscribe({
      next: (packet) => {
        console.log(`relay: ${packet.from} -> ${packet.ok ? "succeeded" : "failed"}`);
      },
      error: (error) => {
        console.log("Error");
      }
    });
  } catch (error) {
    console.log(error);
  }

}

//起動確認のポスト 起動直後にこれすると接続確立されてないからリレーなしになっちゃうからちょっと遅らせてみる
setTimeout(() => {
  postEvent(7, ":monosimple:", [["e", "77cc687ee2a47078c914a5967518f45f29dba092104bb2e1859d4640ea04069e"], ["emoji", "monosimple", "https://i.imgur.com/n0Cqc5T.png"]])
}
  , 5 * 1000);



// Start subscription
const subscription = observable.subscribe(async (packet) => {
  // Your minimal application!
  if (packet.event.pubkey === npub_hex) { return; }
  // console.log(packet);


  //誰へのリプでもない場合
  if (packet.event.tags.length === 0 || packet.event.tags.every(item => item[0] !== "p")) {

    // resmapNormal の中からマッチする正規表現の関数を実行
    for (const [regex, func] of resmapNormal) {
      if (regex.test(packet.event.content)) {
        try {
          func(packet.event, regex); // マッチした場合に関数を実行
        } catch (error) {
          console.log(error);
        }
        break; // 1つでもマッチしたらループを抜ける
      }
    }
  }
  //もの画像へのリプの場合
  else if (packet.event.tags.some(item => item[0] === "p" && item.includes(npub_hex))) {
    // resmapReply の中からマッチする正規表現の関数を実行
    for (const [regex, func] of resmapReply) {
      if (regex.test(packet.event.content)) {
        try {
          func(packet.event, regex); // マッチした場合に関数を実行
        } catch (error) {
          console.log(error);
        }
        break; // 1つでもマッチしたらループを抜ける
      }
    }
  }
});

// Send REQ message to listen kind1 events
rxReq.emit({ kinds: [1, 42], since: now });



async function gitPush(event) {
  // 日付を取得
  // const currentDate = new Date().toISOString().slice(0, 10);

  // git コマンドを同期的に実行
  console.log(`cd ${scriptPath}`);

  exec(`cd ${scriptPath}   && git remote set-url origin https://${accessToken}@github.com/TsukemonoGit/nostr-monoGazo-bot.git && sudo git pull origin main && git add . && git commit -m "Update imageList.json" && sudo git push -u origin main`, (err, stdout, stderr) => {
    if (err) {
      console.log(`stderr: ${stderr}`)
      //  postEvent(packet.event.kind, "₍ xᴗx ₎", tags);
      postRepEvent(event, "₍ ･ᴗx ₎", [])
      return
    }
    console.log(`stdout: ${stdout}`)
    // postEvent(packet.event.kind, "₍ ･ᴗ･ ₎", tags);
    postRepEvent(event, "₍ ･ᴗ･ ₎", [])
  })
}

//
const rep_monoGazo = (event, urlIndex) => {
  const tags = [
    ["r", monoGazoList[urlIndex].url],
    ["t", "もの画像"]
  ];
  postRepEvent(event, `#もの画像\n${monoGazoList[urlIndex].url}\n作: nostr:${monoGazoList[urlIndex].author} (${monoGazoList[urlIndex].date}) ${monoGazoList[urlIndex].memo ? " (" + monoGazoList[urlIndex].memo + ")" : ""}  \n(index:${urlIndex})`, tags);

}

//normal
const res_arufofo_profile_change = (event, regex) => {
  console.log("あいこん変更");

  const urlIndex = Math.floor(Math.random() * monoGazoList.length);
  metadata.picture = monoGazoList[urlIndex].url;

  postEvent(0, JSON.stringify(metadata), []);
  postEvent(1, `あいこんかえた\n${monoGazoList[urlIndex].url}\n作: nostr:${monoGazoList[urlIndex].author} ${monoGazoList[urlIndex].memo ? " (" + monoGazoList[urlIndex].memo + ")" : ""} (${monoGazoList[urlIndex].date})`, [["r", monoGazoList[urlIndex].url]], Math.max(event.created_at + 1, Math.floor(Date.now() / 1000)));
}
const res_naifofo = (event, regex) => {
  console.log("ないんふぉふぉ");

  const tags = [
    ["r", "https://cdn.nostr.build/i/84d43ed2d18e72aa9c012226628962c815d39c63374b446f7661850df75a7444.png"],
    ["t", "もの画像"]];

  postRepEvent(event, `あるんふぉふぉどうぞ\nhttps://cdn.nostr.build/i/84d43ed2d18e72aa9c012226628962c815d39c63374b446f7661850df75a7444.png\n作: nostr:npub1e4qg56wvd3ehegd8dm7rlgj8cm998myq0ah8e9t5zeqkg7t7s93q750p76\n#もの画像`, tags);

}

const res_monoGazo_random = (event, regex) => {
  console.log("もの画像");
  const urlIndex = Math.floor(Math.random() * monoGazoList.length);
  rep_monoGazo(event, urlIndex);
}
const res_monoGazo_doko = (event, regex) => {
  postRepEvent(event, `₍ ･ᴗ･ ₎ﾖﾝﾀﾞ?`, []);
}
const res_monoSite_doko = (event, regex) => {
  const tags = [
    ["r", "https://tsukemonogit.github.io/nostr-monoGazo-bot/"],];
  postRepEvent(event, `₍ ･ᴗ･ ₎っ https://tsukemonogit.github.io/nostr-monoGazo-bot/`, tags);

}
const res_monoPoint = async (event, regex) => {
  //権限チェック
  if (event.pubkey === point_user) {

    try {
      // 正規表現にマッチする部分を取得
      const matches = event.content.match(regex);
      // ポイントの値を取得
      const point = parseInt(matches[2]);

      // コメントの値を取得（コメントが指定されていない場合は空文字列）
      const comment = matches[3] ? matches[3] : "";

      // ログに追加するUNIX時間を年月日時分秒に変換
      const date = new Date(event.created_at * 1000); // 秒単位のUNIX時間をミリ秒単位に変換
      const formattedDate = date.toISOString().replace(/T/, ' ').replace(/\..+/, ''); // ISOフォーマットを年月日時分秒に変換

      // 全体のポイントとログを作成
      pointData.allpoint += point;
      pointData.log.push({ point: point, comment: comment, date: formattedDate })
      await writeFile("./pointlog.json", JSON.stringify(pointData, null, 2));

      const tags = [["e", event.id], ["p", event.pubkey], ["k", event.kind.toString()]];
      //console.log(tags);
      postEvent(7, pointData.allpoint.toString(), tags);

    } catch (error) {

      const tags = [["e", event.id], ["p", event.pubkey], ["k", event.kind.toString()]];
      postEvent(7, "x", tags);
      //console.log(tags);
    }
  }
}

//reply
const res_wareki = (event, regex) => {
  console.log("和暦知りたいらしい");
  const now = new Date();
  const wareki = now.toLocaleString("ja-JP-u-ca-japanese", { dateStyle: "long" });

  postRepEvent(event, `${wareki} らしい`, []);

}
const res_monoGazo = (event, regex) => {

  // 正規表現にマッチする部分を取得
  const matches = event.content.match(regex);
  if (matches === null) {
    throw new Error();
  }
  if (matches[2] !== undefined) {
    //指定された番号 微妙にフォーマットが違うので…
    console.log("もの画像", matches[2]);
    const urlIndex = parseInt(matches[2]);
    const tags = [
      ["r", monoGazoList[urlIndex].url],
      ["t", "もの画像"]
    ];

    postRepEvent(event, `#もの画像\n${monoGazoList[urlIndex].url}\n作: nostr:${monoGazoList[urlIndex].author} (${monoGazoList[urlIndex].date}) ${monoGazoList[urlIndex].memo ? " (" + monoGazoList[urlIndex].memo + ")" : ""} \nnostr:${monoGazoList[urlIndex].note}`, tags);
  } else {
    //ランダム
    console.log("もの画像");
    const urlIndex = Math.floor(Math.random() * monoGazoList.length);
    rep_monoGazo(event, urlIndex);

  }

}
const res_monoGazo_len = (event, regex) => {
  console.log("もの画像の数知りたいらしい");
  postRepEvent(event, `もの画像は今全部で${monoGazoList.length}枚あるよ`, []);
}
const res_arufofo_kure = (event, regex) => {

  console.log(event.id);
  const tags = [
    ["r", "https://cdn.nostr.build/i/84d43ed2d18e72aa9c012226628962c815d39c63374b446f7661850df75a7444.png"],
    ["t", "もの画像"]];
  postRepEvent(event, `あるんふぉふぉどうぞ\nhttps://cdn.nostr.build/i/84d43ed2d18e72aa9c012226628962c815d39c63374b446f7661850df75a7444.png\n作: nostr:npub1e4qg56wvd3ehegd8dm7rlgj8cm998myq0ah8e9t5zeqkg7t7s93q750p76\n#もの画像`, tags);

}
const res_arufofo_agete = (event, regex) => {

  //特定のKINDに空ポス
  console.log(event.id);
  const tags = [
    ["r", "https://cdn.nostr.build/i/84d43ed2d18e72aa9c012226628962c815d39c63374b446f7661850df75a7444.png"],
    ["t", "もの画像"]];

  const root = event.tags?.find((item) => item[item.length - 1] === "root");
  const warning = event.tags?.find((item) => item[0] === "content-warning");
  // rootが見つかった場合、tagsにrootを追加
  if (root) {
    tags.push(root);
  }
  if (warning) {
    tags.push(warning);
  }


  postEvent(event.kind, `あるんふぉふぉどうぞ\nhttps://cdn.nostr.build/i/84d43ed2d18e72aa9c012226628962c815d39c63374b446f7661850df75a7444.png\n作: nostr:npub1e4qg56wvd3ehegd8dm7rlgj8cm998myq0ah8e9t5zeqkg7t7s93q750p76\n#もの画像`, tags);


}
const res_arufofo_douzo = (event, regex) => {
  const match = event.content.match(regex);
  if (match === null) {
    throw new Error();
  }
  const npub_reply = match[1];
  console.log(match)
  const npub_reply_decode = nip19.decode(npub_reply);
  if (npub_reply_decode.type !== 'npub') {
    throw new TypeError(`${npub_reply} is not npub`);
  }
  const pubkey_reply_hex = npub_reply_decode.data;
  //元投稿を引用につけてどうぞ先にリプライを送る
  const tags = [
    ["p", pubkey_reply_hex],
    [
      "e",
      event.id,
      "",
      "mention"
    ],
    ["r", "https://cdn.nostr.build/i/84d43ed2d18e72aa9c012226628962c815d39c63374b446f7661850df75a7444.png"],
    ["t", "もの画像"]];
  const root = event.tags.find((item) => item[item.length - 1] === "root");
  const warning = event.tags?.find((item) => item[0] === "content-warning");
  // rootが見つかった場合、tagsにrootを追加
  if (root) {
    tags.push(root);
  }
  if (warning) {
    tags.push(warning);
  }
  postEvent(event.kind, `nostr:${npub_reply} あちらのお客様からです\nあるんふぉふぉどうぞ\nhttps://cdn.nostr.build/i/84d43ed2d18e72aa9c012226628962c815d39c63374b446f7661850df75a7444.png\n作: nostr:npub1e4qg56wvd3ehegd8dm7rlgj8cm998myq0ah8e9t5zeqkg7t7s93q750p76\n#もの画像\nnostr:${nip19.noteEncode(event.id)}`, tags, Math.max(event.created_at + 1, Math.floor(Date.now() / 1000)));

}

const res_monoGazo_add = async (event, regex) => {
  //権限チェック
  if (owners.includes(event.pubkey)) {
    const match = event.content.match(regex);
    if (match === null) {
      throw new Error();
    }
    if (match[3] !== undefined) {
      const newData = JSON.parse(match[3]);
      if (newData.author.startsWith("nostr:")) {
        newData.author = newData.author.substring(6);
      }
      if (newData.note.startsWith("nostr:")) {
        newData.note = newData.note.substring(6);
      }
      monoGazoList.push(newData);
      try {
        monoGazoList.sort((a, b) => new Date(a.date) - new Date(b.date));
        await writeFile("./imageList.json", JSON.stringify(monoGazoList, null, 2));
        try {
          await gitPush(event);
        } catch (error) {
          console.log(error);
          postRepEvent(event, "₍ ･ᴗx ₎", []);
        }
      } catch (error) {
        postRepEvent(event, "₍ xᴗx ₎", []);
      }
    }
  }
}
const res_monoGazo_delete = async (event, regex) => {
  if (owners.includes(event.pubkey)) {
    const match = event.content.match(regex);
    if (match === null) {
      throw new Error();
    }
    if (match[2] !== undefined) {
      const numericValue = parseInt(match[2]);

      if (!isNaN(numericValue) && numericValue < monoGazoList.length) {
        const deleteUrl = monoGazoList[numericValue];
        const message = JSON.stringify(deleteUrl, null, 2) + "\nを削除します";
        postRepEvent(event, message, []);
        monoGazoList.splice(numericValue, 1);
        try {
          monoGazoList.sort((a, b) => new Date(a.date) - new Date(b.date));
          await writeFile("./imageList.json", JSON.stringify(monoGazoList, null, 2));
          try {
            await gitPush(event);
          } catch (error) {
            console.log(error);
            postRepEvent(event, "₍ ･ᴗx ₎", []);
          }
        } catch (error) {
          postRepEvent(event, "₍ xᴗx ₎", []);
        }

      }
    }
  }
}
//[RegExp, (event: NostrEvent, mode: Mode, regstr: RegExp) => [string, string[][]] | null][]

const resmapNormal = [

  [/^(もの|mono)画像$/i, res_monoGazo_random],
  [/(ない)ん?ふぉふぉ/, res_naifofo],
  [/(ある)ん?ふぉふぉ/, res_arufofo_profile_change],

  [/(もの|mono)画像\s?どこ[?？]?/i, res_monoGazo_doko],
  [/(もの|mono)(画像)?サイト\s?どこ[?？]?/i, res_monoSite_doko],
  [/^(ポイント|ぽいんと|point|p)\s+([+-]?\d+)\s+(.*)/i, res_monoPoint],
];
//: [RegExp, (event: NostrEvent, mode: Mode, regstr: RegExp) => Promise<[string, string[][]]> | [string, string[][]] | null][]
const resmapReply = [
  [/和暦/, res_wareki],
  [/(もの|mono)画像\s?(length|長さ|枚数|何枚)/i, res_monoGazo_len],
  [/(もの|mono)画像\s?(\d+)*/i, res_monoGazo],
  [/(あるん|ある)ふぉふぉ?(下さい|ください|頂戴|ちょうだい).?/, res_arufofo_kure],
  [/(あるん|ある)ふぉふぉ?(あげて).?/, res_arufofo_agete],
  [/(npub\w{59})\s?(さん|ちゃん|くん)?に(.*)(あるんふぉふぉ|あるふぉふぉ)(.*)(を送って|をおくって|送って|おくって|あげて)/, res_arufofo_douzo],

  [/(追加|add)(\s.*)({.*})/ism, res_monoGazo_add],//許可されたユーザーかチェックして
  [/(削除|delete)\s*(\d+)*/i, res_monoGazo_delete],//許可されたユーザーかチェックして

];
