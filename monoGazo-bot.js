import WebSocket from 'ws';
import { createRxNostr, createRxForwardReq, verify, uniq, now } from "rx-nostr";
import { delay, filter } from "rxjs";
import { nip19 } from 'nostr-tools';
import env from "dotenv";
env.config();

import { exec } from 'child_process'
import { readFile, writeFile } from 'fs/promises'
import { isGeneratorFunction } from 'util/types';

const urlList = JSON.parse(await readFile('./imageList.json'));  //JSONで読み込む方

const nsec = process.env.NSEC;
const npub = process.env.PUBHEX;
const accessToken = process.env.TOKEN;
const scriptPath = process.env.SCRIPTPATH;
const owners = JSON.parse(process.env.ORNERS.replace(/'/g, '"'));
const point_user = process.env.POINTUSER_PUB_HEX;

const point_regex = /(ポイント|ぽいんと|point)\s*([+-]\d+)\s*(.*)?/;
let pointData;

try {
  pointData = JSON.parse(await readFile('./pointlog.json'));
} catch (error) {
  pointData = {
    allpoint: 0,
    log: []
  }
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
      pubkey: npub,
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
      pubkey: npub,
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
//起動直後にこれすると接続確立されてないからリレーなしになっちゃうからちょっと遅らせてみる
setTimeout(() => {
  postEvent(7, ":monosimple:", [["e", "77cc687ee2a47078c914a5967518f45f29dba092104bb2e1859d4640ea04069e"], ["emoji", "monosimple", "https://i.imgur.com/n0Cqc5T.png"]])
}
  , 5 * 1000);



// Start subscription
const subscription = observable.subscribe(async (packet) => {
  // Your minimal application!
  if (packet.event.pubkey === "f987fb90696fcb09358629aeebf5156ea05a405101c4f2d9020bf02f47ea4a49") { return; }
  // console.log(packet);
  const content = packet.event.content.trim();
  //console.log(packet);
  if (packet.event.tags.some(item => item[0] === "p" && item.includes("f987fb90696fcb09358629aeebf5156ea05a405101c4f2d9020bf02f47ea4a49"))) {
    // console.log("リプきたよ");

    // "comand"の部分を抽出
    const commandList = packet.event.content.split(/[ 　\n]/);
    const filteredCommands = commandList.filter(command => command !== "nostr:npub1lxrlhyrfdl9sjdvx9xhwhag4d6s95sz3q8z09kgzp0cz73l2ffys9p726u");
    console.log(filteredCommands[0]);
    switch (true) {
      //------------------------------------------------
      case filteredCommands[0] === "和暦":
        //  wareki(packet);
        console.log("和暦知りたいらしい");
        const now = new Date();
        const wareki = now.toLocaleString("ja-JP-u-ca-japanese", { dateStyle: "long" });

        postRepEvent(packet.event, `${wareki} らしい`, []);

        break;
      //------------------------------------------------
      case filteredCommands[0] === "もの画像" || filteredCommands[0] === "mono画像":
        if (filteredCommands.length <= 1) {
          //リプで index指定なし のもの画像
          //#もの画像 URL 作者 作成日 index
          const urlIndex = Math.floor(Math.random() * urlList.length);
          const tags = [
            ["r", urlList[urlIndex].url],
            ["t", "もの画像"]
          ];

          postRepEvent(packet.event, `#もの画像\n${urlList[urlIndex].url}\n作: nostr:${urlList[urlIndex].author} (${urlList[urlIndex].date}) ${urlList[urlIndex].memo ? " (" + urlList[urlIndex].memo + ")" : ""} \n(index:${urlIndex})`, tags);
        } else if (filteredCommands[1] === "length" || filteredCommands[1] === "長さ" || filteredCommands[1] === "枚数") {

          console.log("もの画像の数知りたいらしい");
          postRepEvent(packet.event, `もの画像は今全部で${urlList.length}枚あるよ`, []);

        } else {
          //リプで index指定 のもの画像
          //#もの画像 URL note

          const numberValue = Number(filteredCommands[1]);
          if (!isNaN(numberValue)) {
            if (numberValue < urlList.length && numberValue >= 0) {
              //monoGazo(packet, numberValue, true);
              const tags = [
                ["r", urlList[numberValue].url],
                ["t", "もの画像"]
              ];

              postRepEvent(packet.event, `#もの画像\n${urlList[numberValue].url}\n作: nostr:${urlList[numberValue].author} (${urlList[numberValue].date}) ${urlList[numberValue].memo ? " (" + urlList[numberValue].memo + ")" : ""} \nnostr:${urlList[numberValue].note}`, tags);
            } else {
              postRepEvent(packet.event, "そんなのないよ", []);
            }
          } else {
            postRepEvent(packet.event, "そんなのないよ", []);
          }
        }
        break;
      //------------------------------------------------
      case filteredCommands[0] === "再起動":
        if (filteredCommands.length <= 1) {
          postRepEvent(packet.event, "relay か もの画像 かどっち", []);
        } else if (filteredCommands[1] === "relay") {
          // relay再起動のコード
        } else if (filteredCommands[1] === "もの画像" || filteredCommands[1] === "mono画像") {
          // relay再起動のコード
        }
        break;
      //------------------------------------------------
      //あるふぉふぉをもらう
      case /(あるん|ある)ふぉふぉ?(下さい|ください|頂戴|ちょうだい).?/.test(filteredCommands[0]):
        try {


          console.log(packet.event.id);
          const tags = [
            ["r", "https://cdn.nostr.build/i/84d43ed2d18e72aa9c012226628962c815d39c63374b446f7661850df75a7444.png"],
            ["t", "もの画像"]];
          postRepEvent(packet.event, `あるんふぉふぉどうぞ\nhttps://cdn.nostr.build/i/84d43ed2d18e72aa9c012226628962c815d39c63374b446f7661850df75a7444.png\n作: nostr:npub1e4qg56wvd3ehegd8dm7rlgj8cm998myq0ah8e9t5zeqkg7t7s93q750p76\n#もの画像`, tags);
        } catch (error) {
          postEvent(1, "失敗したかも", []);
          console.log(error);
        }

        break;
      //------------------------------------------------
      //あるふぉふぉをTLにあげる
      case /(あるん|ある)ふぉふぉ?(あげて).?/.test(filteredCommands[0]):

        try {

          console.log(packet.event.id);
          const tags = [
            ["r", "https://cdn.nostr.build/i/84d43ed2d18e72aa9c012226628962c815d39c63374b446f7661850df75a7444.png"],
            ["t", "もの画像"]];

          const root = packet.event.tags?.find((item) => item[item.length - 1] === "root");
          const warning = packet.event.tags?.find((item) => item[0] === "content-warning");
          // rootが見つかった場合、tagsにrootを追加
          if (root) {
            tags.push(root);
          }
          if (warning) {
            tags.push(warning);
          }


          postEvent(packet.event.kind, `あるんふぉふぉどうぞ\nhttps://cdn.nostr.build/i/84d43ed2d18e72aa9c012226628962c815d39c63374b446f7661850df75a7444.png\n作: nostr:npub1e4qg56wvd3ehegd8dm7rlgj8cm998myq0ah8e9t5zeqkg7t7s93q750p76\n#もの画像`, tags);
        } catch (error) {
          postEvent(1, "失敗したかも", []);
          console.log(error);
        }

        break;

      //------------------------------------------------
      case filteredCommands[0].startsWith('nostr:'):
        const content = filteredCommands.slice(1).join('');
        if (content.match(/に(.*)[あるんふぉふぉ|あるふぉふぉ](.*)[を送って|をおくって|送って|おくって](.*)$/s)) {
          try {
            const pubkey = nip19.decode(filteredCommands[0].slice(6)).data;
            console.log(pubkey);
            console.log(packet.event.id);
            atirakara(pubkey, packet);
          } catch (error) {
            postEvent(1, "失敗したかも", []);
            console.log(error);
          }
        } else {
          console.log("あるふぉふぉ一致しなかったとこ");
        }
        break;
      //------------------------------------------------
      // ものがぞうついかこまんど
      case filteredCommands[0] === "追加":
        if (owners.includes(packet.event.pubkey)) {
          const startIndex = packet.event.content.indexOf('{');
          const jsonString = packet.event.content.substring(startIndex);
          const newData = JSON.parse(jsonString);
          if (newData.author.startsWith("nostr:")) {
            newData.author = newData.author.substring(6);
          }
          if (newData.note.startsWith("nostr:")) {
            newData.note = newData.note.substring(6);
          }
          urlList.push(newData);
          try {
            urlList.sort((a, b) => new Date(a.date) - new Date(b.date));
            await writeFile("./imageList.json", JSON.stringify(urlList, null, 2));
            try {
              await gitPush(packet);
            } catch (error) {
              console.log(error);
              postRepEvent(packet.event, "₍ ･ᴗx ₎", []);
            }
          } catch (error) {
            postRepEvent(packet.event, "₍ xᴗx ₎", []);
          }
        } else {
          postRepEvent(packet.event, "₍ xᴗx ₎", []);
        }
        break;
      //------------------------------------------------
      // ものがぞう削除こまんど
      case filteredCommands[0] === "削除":
        if (owners.includes(packet.event.pubkey)) {
          const numericValue = parseInt(filteredCommands[1], 10);
          if (!isNaN(numericValue) && numericValue < urlList.length) {
            const deleteUrl = urlList[numericValue];
            const message = JSON.stringify(deleteUrl, null, 2) + "\nを削除します";
            postRepEvent(packet.event, message, []);
            urlList.splice(numericValue, 1);
            try {
              urlList.sort((a, b) => new Date(a.date) - new Date(b.date));
              await writeFile("./imageList.json", JSON.stringify(urlList, null, 2));
              try {
                await gitPush(packet);
              } catch (error) {
                console.log(error);
                postRepEvent(packet.event, "₍ ･ᴗx ₎", []);
              }
            } catch (error) {
              postRepEvent(packet.event, "₍ xᴗx ₎", []);
            }
          } else {
            postRepEvent(packet.event, "₍ xᴗx ₎", []);
          }
        } else {
          postRepEvent(packet.event, "₍ xᴗx ₎", []);
        }
        break;
      default:
        console.log("defaultのとこ");//リプの何にでも反応してたらボットに反応して無限連鎖の可能性あるからなしにしてみる
        //postRepEvent(packet.event, "₍ ･ᴗ･ ₎", []);
        break;
    }
  }
  //------------------------------------------------------------------リプライ以外
  else if (content === "もの画像" || content === "mono画像") {
    console.log("もの画像");
    const urlIndex = Math.floor(Math.random() * urlList.length);
    const tags = [
      ["r", urlList[urlIndex].url],
      ["t", "もの画像"]
    ];
    postRepEvent(packet.event, `#もの画像\n${urlList[urlIndex].url}\n作: nostr:${urlList[urlIndex].author} (${urlList[urlIndex].date}) ${urlList[urlIndex].memo ? " (" + urlList[urlIndex].memo + ")" : ""}  \n(index:${urlIndex})`, tags);
  } else if (content.includes("ないんふぉふぉ") || content.includes("ないふぉふぉ")) {
    console.log("ないんふぉふぉ");
    //naifofo(packet);
    const tags = [
      ["r", "https://cdn.nostr.build/i/84d43ed2d18e72aa9c012226628962c815d39c63374b446f7661850df75a7444.png"],
      ["t", "もの画像"]];
    postRepEvent(packet.event, `あるんふぉふぉどうぞ\nhttps://cdn.nostr.build/i/84d43ed2d18e72aa9c012226628962c815d39c63374b446f7661850df75a7444.png\n作: nostr:npub1e4qg56wvd3ehegd8dm7rlgj8cm998myq0ah8e9t5zeqkg7t7s93q750p76\n#もの画像`, tags);


  } else if (content.includes("あるんふぉふぉ") || content.includes("あるふぉふぉ")) {
    console.log("あるんふぉふぉ");
    profileChange(packet);
  } else if (/(もの画像|mono画像)どこ[?？]?/.test(content)) {
    postRepEvent(packet.event, `₍ ･ᴗ･ ₎ﾖﾝﾀﾞ?`, []);

  } else if (/(もの|mono)(画像)?サイトどこ[?？]?/.test(content)) {
    const tags = [
      ["r", "https://tsukemonogit.github.io/nostr-monoGazo-bot/"],];
    postRepEvent(packet.event, `₍ ･ᴗ･ ₎っ https://tsukemonogit.github.io/nostr-monoGazo-bot/`, tags);

    //ぽいんとしすてむ
  } else if (packet.event.pubkey === point_user && (point_regex.test(content))) {
    console.log("Test");
    try {
      // 正規表現にマッチする部分を取得
      const matches = content.match(point_regex);
      // ポイントの値を取得
      const point = parseInt(matches[2]);

      // コメントの値を取得（コメントが指定されていない場合は空文字列）
      const comment = matches[3] ? matches[3] : "";

      // ログに追加するUNIX時間を年月日時分秒に変換
      const date = new Date(packet.event.created_at * 1000); // 秒単位のUNIX時間をミリ秒単位に変換
      const formattedDate = date.toISOString().replace(/T/, ' ').replace(/\..+/, ''); // ISOフォーマットを年月日時分秒に変換

      // 全体のポイントとログを作成
      pointData.allpoint += point;
      pointData.log.push({ point: point, comment: comment, date: formattedDate })
      await writeFile("./pointlog.json", JSON.stringify(pointData, null, 2));

      const tags = [["e", packet.event.id], ["p", packet.event.pubkey], ["k", packet.event.kind.toString()]];
      //console.log(tags);
      postEvent(7, "+", tags);

    } catch (error) {

      const tags = [["e", packet.event.id], ["p", packet.event.pubkey], ["k", packet.event.kind.toString()]];
      postEvent(7, "-", tags);
      //console.log(tags);
    }
  }
});

// Send REQ message to listen kind1 events
rxReq.emit({ kinds: [1, 42], since: now });





function profileChange(packet) {
  const urlIndex = Math.floor(Math.random() * urlList.length);
  console.log("あるふぉふぉちぇんじ:" + urlIndex);


  const metadata = {
    name: "mono_gazo",
    picture: urlList[urlIndex].url,
    display_name: "もの画像",
    banner: "",
    website: "https://tsukemonogit.github.io/nostr-monoGazo-bot/",
    about: "ものが集めた画像\nmono画像\nあるんふぉふぉ\nこれ入れてとか\n入れないでとかあったら\nどうにかこうにかお伝え下さい",
    nip05: "mono_gazo@tsukemonoGit.github.io",
    lud16: "tsukemono@getalby.com",
  }
  postEvent(0, JSON.stringify(metadata), []);

  postEvent(1, `あいこんかえた\n${urlList[urlIndex].url}\n作: nostr:${urlList[urlIndex].author} ${urlList[urlIndex].memo ? " (" + urlList[urlIndex].memo + ")" : ""} (${urlList[urlIndex].date})`, [["r", urlList[urlIndex].url]], Math.max(packet.event.created_at + 1, Math.floor(Date.now() / 1000)));

}


function atirakara(pubkey, packet) {

  console.log("あちらのお客様からやでする");
  const tags = [
    ["p", pubkey],
    [
      "e",
      packet.event.id,
      "",
      "mention"
    ],
    ["r", "https://cdn.nostr.build/i/84d43ed2d18e72aa9c012226628962c815d39c63374b446f7661850df75a7444.png"],
    ["t", "もの画像"]];

  const root = packet.event.tags.find((item) => item[item.length - 1] === "root");
  console.log(root);
  // rootが見つかった場合、tagsにrootを追加
  if (root) {

    tags.push(root);
  } console.log(tags);
  // console.log(packet.event.created_at + 1);
  //const created_at = packet.event.created_at + 1;
  //元note: note1hd5rumpdyhc6dm5p3q8ryu5l622jcvd90wk6zpc80834s623rexsgv6mdn
  postEvent(packet.event.kind, `nostr:${nip19.npubEncode(pubkey)} あちらのお客様からです\nあるんふぉふぉどうぞ\nhttps://cdn.nostr.build/i/84d43ed2d18e72aa9c012226628962c815d39c63374b446f7661850df75a7444.png\n作: nostr:npub1e4qg56wvd3ehegd8dm7rlgj8cm998myq0ah8e9t5zeqkg7t7s93q750p76\n#もの画像\nnostr:${nip19.noteEncode(packet.event.id)}`, tags, Math.max(packet.event.created_at + 1, Math.floor(Date.now() / 1000)));

}


async function gitPush(packet) {

  // 日付を取得
  // const currentDate = new Date().toISOString().slice(0, 10);

  // git コマンドを同期的に実行
  console.log(`cd ${scriptPath}`);

  exec(`cd ${scriptPath}   && git remote set-url origin https://${accessToken}@github.com/TsukemonoGit/nostr-monoGazo-bot.git && sudo git pull origin main && git add . && git commit -m "Update imageList.json" && sudo git push -u origin main`, (err, stdout, stderr) => {
    if (err) {
      console.log(`stderr: ${stderr}`)
      //  postEvent(packet.event.kind, "₍ xᴗx ₎", tags);
      postRepEvent(packet.event, "₍ ･ᴗx ₎", [])
      return
    }
    console.log(`stdout: ${stdout}`)
    // postEvent(packet.event.kind, "₍ ･ᴗ･ ₎", tags);
    postRepEvent(packet.event, "₍ ･ᴗ･ ₎", [])
  })


}
