import WebSocket from 'ws';
import { createRxNostr, createRxForwardReq, uniq, now, createRxBackwardReq, completeOnTimeout } from "rx-nostr";
import { delay, filter, pipe } from "rxjs";
import { nip19 } from 'nostr-tools';
import env from "dotenv";
env.config();

import { exec } from 'child_process'
import { readFile, writeFile } from 'fs/promises'
import { verifier, seckeySigner } from 'rx-nostr-crypto';



const nsec = process.env.NSEC_HEX;
const npub_hex = process.env.PUBHEX_HEX;
const accessToken = process.env.TOKEN;
const scriptPath = process.env.SCRIPTPATH;

const GIT_AUTHOR_NAME = process.env.GIT_AUTHOR_NAME;
const GIT_AUTHOR_EMAIL = process.env.GIT_AUTHOR_EMAIL;

const owners = JSON.parse(process.env.ORNERS_HEX.replace(/'/g, '"'));
const point_user = process.env.POINTUSER_PUB_HEX;
const monoGazoList = JSON.parse(await readFile(`${scriptPath}/imageList.json`));  //JSONで読み込む方


//addmonogazo
const bookmarkTag = "monogazo";
// /**
//  * @typedef {Object} PointDataJson
//  * @property {number} total - 合計ポイント数
//  * @property {string[][]} data - ポイントデータ
//  */

// /**
//  * @type {PointDataJson}
//  */
//let pointDataJson;

// /**
//  *  @type {string[][]}
//  */
// let pointData;
// let totalPoint;
// try {

//   pointDataJson = await readFile('./pointlog.json');
//   pointData = pointDataJson.data;
//   //totalPoints = pointDataJson.total;
//   //console.log(pointData, totalPoints);
// } catch (error) {
//   pointData = [["point", "memo", "date"]];
//   pointDataJson = { "total": 0, "data": { pointData } };
//   //
//   exec(`cd ${scriptPath + "/spreadsheet-auth-edit"}   && node update.js '${JSON.stringify(pointData)}'`, (err, stdout, stderr) => {
//     if (err) {
//       console.log(`stderr: ${stderr}`)
//       return
//     }
//     console.log(`stdout: ${stdout}`)
//   })
//   await writeFile("./pointlog.json", JSON.stringify(pointData, null, 2));
// }


const metadata = {
  name: "mono_gazo",
  picture: "",
  display_name: "もの画像",
  banner: "",
  website: "https://tsukemonogit.github.io/nostr-monoGazo-bot/",
  about: "ものが集めた画像\nmono画像\nあるんふぉふぉ\nこれ入れてとか\n入れないでとかあったら\nどうにかこうにかお伝え下さい",
  nip05: "mono_gazo@tsukemonoGit.github.io",
  lud16: "tsukemono@getalby.com",
  birth: [4, 8, 2023]
}


const rxNostr = createRxNostr({ verifier: verifier, websocketCtor: WebSocket, signer: seckeySigner(nsec) });
rxNostr.setDefaultRelays(["wss://yabu.me", "wss://r.kojira.io"]);//, "wss://relay-jp.nostr.wirednet.jp"

const rxReq = createRxForwardReq();

// Create observable
const observable = rxNostr.use(rxReq)
  .pipe(
    // Verify event hash and signature
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
    })//, { seckey: nsec, relays: writeRelays() }
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
    ["p", event.pubkey]//,
    // ["e", event.id]
  ];

  const root = event.tags?.find((item) => item[item.length - 1] === "root");
  const warning = event.tags?.find((item) => item[0] === "content-warning");
  // rootが見つかった場合、tagsにrootを追加して、eをreplyとして追加
  if (root) {
    tag.push(root);
    tag.push(["e", event.id, "", "reply"])
  } else {
    //rootがない場合eをrootとして追加
    tag.push(["e", event.id, "", "root"])
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
      created_at: Math.max(event.created_at + 1, Math.floor(Date.now() / 1000))//, { seckey: nsec, relays: writeRelays() }
    }).subscribe({
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




// Start subscription
const subscription = observable.subscribe(async (packet) => {

  if (packet.event.kind === 30003) {
    console.log(packet)
    getMonogazoEvent(packet.event)  // ここをsomeEventからpacket.eventに変更
      .then(receivedEvent => {
        // イベント取得後の処理
        console.log("イベント取得完了:", receivedEvent);

        // 画像URLを取得する
        const imageUrl = getUrl(receivedEvent.content);
        // 日時を整形2025/05/04みたいになるようにして
        const date = formatDate(receivedEvent.created_at);
        // エンコード
        const noteID = nip19.noteEncode(receivedEvent.id);
        const author = nip19.npubEncode(receivedEvent.pubkey);

        console.log(imageUrl, date, noteID, author); // author.atではなくauthorに修正


        addMonogazoList({
          url: imageUrl,
          author: author, date: date, note: noteID
        }, null)

      })
      .catch(error => {
        console.error("処理エラー:", error);
      });

  }
  // Your minimal application!
  if (packet.event.pubkey === npub_hex) { return; }
  // console.log(packet);
  const content = packet.event.content.trim();

  //誰へのリプでもない場合
  if (packet.event.tags.length === 0 || packet.event.tags.every(item => item[0] !== "p")) {

    // resmapNormal の中からマッチする正規表現の関数を実行
    for (const [regex, func] of resmapNormal) {
      if (regex.test(content)) {
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
      if (regex.test(content)) {
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
//もの画像に追加したいイベントが特定のブックマークフォルダに追加されたときに自動でもの画像に追加するための購読フィルターを追加
rxReq.emit([{ kinds: [1, 42], since: now }, { kinds: [30003], authors: ["84b0c46ab699ac35eb2ca286470b85e081db2087cdef63932236c397417782f5"], "#d": [bookmarkTag] }]);


const weightRatio = 2; // 最後のインデックスが最初のインデックスの2倍の確率で選ばれるようにする
const weightedRandomIndex = (length) => {


  // インデックスの重みを一定の比率で増加させる

  const weights = Array.from({ length }, (_, i) => Math.pow(weightRatio, i / (length - 1)));
  const totalWeight = weights.reduce((acc, weight) => acc + weight, 0);
  const randomWeight = Math.random() * totalWeight;
  const cumulativeWeights = weights.reduce((acc, weight) => {
    const lastValue = acc.length > 0 ? acc[acc.length - 1] : 0;
    acc.push(lastValue + weight);
    return acc;
  }, []);

  return cumulativeWeights.findIndex(cumulativeWeight => randomWeight < cumulativeWeight);

};

//event:Event|null
//アド成功したときにkind1にポスと
async function gitPush(event, newData) {
  // 日付を取得
  // const currentDate = new Date().toISOString().slice(0, 10);

  // git コマンドを同期的に実行
  console.log(`cd ${scriptPath}`);

  exec(`cd ${scriptPath} && git remote set-url origin https://${accessToken}@github.com/TsukemonoGit/nostr-monoGazo-bot.git &&  git pull origin main && git add . &&git -c user.name='${GIT_AUTHOR_NAME}' -c user.email='${GIT_AUTHOR_EMAIL}' commit -m "Update imageList.json" &&  git push -u origin main`, (err, stdout, stderr) => {
    if (err) {
      console.log(`stderr: ${stderr}`);
      if (event) {
        postRepEvent(event, "₍ ･ᴗx ₎", []);
      } else {
        postEvent(1, "₍ ･ᴗx ₎", [])


      } return;
    }
    console.log(`stdout: ${stdout}`);
    if (event) {
      postRepEvent(event, "₍ ･ᴗ･ ₎", []);
    }
    if (newData) {
      const tags = [
        ["r", newData.url],
        ["t", "もの画像"]
      ];
      postEvent(1, `追加done\n#もの画像\n${newData.url}\n作: nostr:${newData.author} (${newData.date})`, tags);
    }

  });
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

  const urlIndex = weightedRandomIndex(monoGazoList.length);//Math.floor(Math.random() * monoGazoList.length);
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
  const urlIndex = weightedRandomIndex(monoGazoList.length);//Math.floor(Math.random() * monoGazoList.length);
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
      const matches = event.content.trim().match(regex);
      // ポイントの値を取得
      const point = parseInt(matches[2]);

      // コメントの値を取得（コメントが指定されていない場合は空文字列）
      const comment = matches[3] ? matches[3] : "";

      // ログに追加するUNIX時間を年月日時分秒に変換
      const date = new Date(event.created_at * 1000); // 秒単位のUNIX時間をミリ秒単位に変換
      const formattedDate = date.toISOString().replace(/T/, ' ').replace(/\..+/, ''); // ISOフォーマットを年月日時分秒に変換

      // 全体のポイントとログを作成
      const pushData = [point, comment, formattedDate];

      // pointDataJson.data.push(pushData);
      // pointDataJson.total += point;

      //await writeFile("./pointlog.json", JSON.stringify(pointDataJson, null, 2));

      //スプレッドシートに書き込む
      exec(`cd ${scriptPath + "/spreadsheet-auth-edit"}  && node append.js '${JSON.stringify([pushData])}'`, (err, stdout, stderr) => {
        if (err) {
          console.log(`stderr: ${stderr}`)
          return
        }
        console.log(`stdout: ${stdout}`)
      })


      const tags = [["e", event.id], ["p", event.pubkey], ["k", event.kind.toString()]];
      //console.log(tags);
      postEvent(7, "+", tags);

    } catch (error) {
      console.log(error);
      const tags = [["e", event.id], ["p", event.pubkey], ["k", event.kind.toString()]];//, ["k", event.kind.toString()]
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
  const matches = event.content.trim().match(regex);
  if (matches === null) {
    throw new Error();
  }
  if (matches[2] !== undefined) {
    //指定された番号 微妙にフォーマットが違うので…
    console.log("もの画像", matches[2]);
    //q 付けると元の投稿で引用リスト見た時に大量の投稿が表示されそうなのでqタグはあえて付けないよ
    try {
      const urlIndex = parseInt(matches[2]);
      const tags = [
        //["q", nip19.decode(monoGazoList[urlIndex].note).data],
        ["r", monoGazoList[urlIndex].url],
        ["t", "もの画像"],

      ];

      postRepEvent(event, `#もの画像\n${monoGazoList[urlIndex].url}\n作: nostr:${monoGazoList[urlIndex].author} (${monoGazoList[urlIndex].date}) ${monoGazoList[urlIndex].memo ? " (" + monoGazoList[urlIndex].memo + ")" : ""} \nnostr:${monoGazoList[urlIndex].note}`, tags);
    } catch (error) {
      console.log("decode errorかな")
    }
  } else {
    //ランダム
    console.log("もの画像");
    const urlIndex = weightedRandomIndex(monoGazoList.length);//Math.floor(Math.random() * monoGazoList.length);
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
  const match = event.content.trim().match(regex);
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
    ["q", event.id],
    // [
    //   "e",
    //   event.id,
    //   "",
    //   "mention"
    // ],
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
    const match = event.content.trim().match(regex);
    if (match === null) {
      throw new Error();
    }
    if (match[3] !== undefined) {
      const newData = JSON.parse(match[3]);
      addMonogazoList(newData, event);

    }
  }
}

async function addMonogazoList(newData, event) {
  // すでに同じURLの画像が存在するかチェック
  const isDuplicate = monoGazoList.some(item => item.url === newData.url);
  if (isDuplicate) { return }

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
      await gitPush(event, newData);
    } catch (error) {
      console.log(error);
      if (event) {
        postRepEvent(event, "₍ ･ᴗx ₎", []);
      } else {
        postEvent(1, "₍ ･ᴗx ₎", [])
      }
    }
  } catch (error) {
    if (event) {
      postRepEvent(event, "₍ xᴗx ₎", []);
    } else {
      postEvent(1, "₍ xᴗx ₎", [])
    }
  }
}
const res_monoGazo_delete = async (event, regex) => {
  if (owners.includes(event.pubkey)) {
    const match = event.content.trim().match(regex);
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
export const res_vs_random = async (event, regex) => {
  const match = event.content.trim().match(regex);
  if (match === null || match[0].length > 300) {
    return;
  }
  if (match[1] !== undefined) {
    const vsMatches = match[1].split("vs").filter((value) => value.trim() !== ""); // vsで分割して配列に格納し、空の文字列をフィルタリング
    // vsで分割して配列に格納
    console.log(vsMatches)
    if (vsMatches.length <= 0) { return; }
    const randomIndex = Math.floor(Math.random() * vsMatches.length);
    const message = vsMatches[randomIndex];
    console.log(message)
    //絵文字があるかもしれない。
    const tags = event.tags.filter((item) => item[0] === "emoji");
    console.log(tags)
    postRepEvent(event, message, tags);
  }
}

export const res_randomNip = async (event, regex) => {
  console.log("ランダムNIP");
  const randomIndex = Math.floor(Math.random() * 100).toString().padStart(2, '0');// 00~99
  const content = `NIP-${randomIndex}\nhttps://github.com/nostr-protocol/nips/blob/master/${randomIndex}.md`
  postRepEvent(event, content, []);

}
//[RegExp, (event: NostrEvent, mode: Mode, regstr: RegExp) => [string, string[][]] | null][]

const resmapNormal = [

  [/^(もの|mono)画像$/i, res_monoGazo_random],
  [/(ない)ん?ふぉふぉ/, res_naifofo],
  [/(ある)ん?ふぉふぉ/, res_arufofo_profile_change],

  [/(もの|mono)画像\s?どこ[?？]?/i, res_monoGazo_doko],
  [/(もの|mono)(画像)?サイト\s?どこ[?？]?/i, res_monoSite_doko],
  [/^(ポイント|ぽいんと|point|p)\s+([+-]?\d+)\s+(.*)/i, res_monoPoint],
  [/^もの、(.{1,50}(?:vs.{1,50})+)して$/, res_vs_random],
  [/(もの|mono)画像\s?(\d+)$/i, res_monoGazo],
  [/^もの、ランダムNIP(して)?$/i, res_randomNip],
];
//: [RegExp, (event: NostrEvent, mode: Mode, regstr: RegExp) => Promise<[string, string[][]]> | [string, string[][]] | null][]
const resmapReply = [
  [/和暦/, res_wareki],
  [/(もの|mono)画像\s?(length|長さ|枚数|何枚)/i, res_monoGazo_len],
  [/(もの|mono)画像\s?(\d+)$/i, res_monoGazo],
  [/(あるん|ある)ふぉふぉ?(下さい|ください|頂戴|ちょうだい).?/, res_arufofo_kure],
  [/(あるん|ある)ふぉふぉ?(あげて).?/, res_arufofo_agete],
  [/(npub\w{59})\s?(さん|ちゃん|くん)?に(.*)(あるんふぉふぉ|あるふぉふぉ)(.*)(を送って|をおくって|送って|おくって|あげて)/, res_arufofo_douzo],

  [/(追加|add)(\s.*)({.*})/ism, res_monoGazo_add],//許可されたユーザーかチェックして
  [/(削除|delete)\s*(\d+)*/i, res_monoGazo_delete],//許可されたユーザーかチェックして

];


//-------------------------------

function getMonogazoEvent(event) {
  // タグの最後の要素をチェック
  if (event.tags.find((tag) => tag[0] === "d")?.[1] !== bookmarkTag) {
    return Promise.reject(new Error("対象外のタグです"));
  }

  const lastTag = event.tags.at(-1); // 最後の要素
  if (lastTag[0] !== "e" || lastTag.length < 2) {
    return Promise.reject(new Error("適切なeタグが見つかりません"));
  }

  const eventID = lastTag[1];

  // イベント取得処理をPromiseで返す
  return getEventById(eventID);
}


// rxNostrを使ったイベント取得をPromise化する関数
function getEventById(eventId) {
  return new Promise((resolve, reject) => {
    const req = createRxBackwardReq();

    let receivedEvent = null;

    rxNostr.use(req).pipe(completeOnTimeout(2000)).subscribe({
      next: (packet) => {
        console.log("Received:", packet);
        if (packet.event) {
          receivedEvent = packet.event;
        }
      },
      complete: () => {
        console.log("Completed!");
        if (receivedEvent) {
          resolve(receivedEvent);
        } else {
          reject(new Error("イベントが見つかりませんでした"));
        }
      },
      error: (err) => {
        console.error("Error:", err);
        if (receivedEvent) {
          resolve(receivedEvent);
        } else {
          reject(new Error("イベントが見つかりませんでした"));
        }
      }
    });

    req.emit({ ids: [eventId], limit: 1 });
    req.over();
  });
}

// 画像URLを取得する関数
function getUrl(content) {
  // URLを抽出する正規表現パターン（https://で始まり、.webp|.png|.jpg|.jpeg|.gifで終わるもの）
  const urlPattern = /(https?:\/\/[^\s]+\.(webp|png|jpe?g|gif))/i;
  const match = content.match(urlPattern);

  // 一致するものがあればそのURL、なければnullを返す
  return match ? match[0] : null;
}

// 日付をYYYY/MM/DD形式にフォーマットする関数
function formatDate(timestamp) {
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  // 月と日を2桁にパディング（01, 02, ...）
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}/${month}/${day}`;
}