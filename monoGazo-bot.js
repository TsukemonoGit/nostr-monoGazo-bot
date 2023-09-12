import 'websocket-polyfill'
import { createRxNostr, createRxForwardReq, verify, uniq, now } from "rx-nostr";
import { nip19 } from 'nostr-tools';
import env from "dotenv";
env.config();
//import { urlList } from './imageList.js';   //JSを読み込む方
import { exec } from 'child_process'
//const { exec } = require('child_process')
import { readFile, writeFile } from 'fs/promises'

const urlList = JSON.parse(await readFile('./imageList.json'));  //JSONで読み込む方

const nsec = process.env.NSEC;
const npub = process.env.PUBHEX;
const owners = JSON.parse(process.env.ORNERS.replace(/'/g, '"'));
const rxNostr = createRxNostr();
await rxNostr.switchRelays(["wss://yabu.me", "wss://r.kojira.io", "wss://nostr.fediverse.jp"]);

const rxReq = createRxForwardReq();

// Create observable
const observable = rxNostr.use(rxReq)
  .pipe(
    // Verify event hash and signature
    verify(),
    // Uniq by event hash
    uniq(),

  );


const postEvent = (kind, content, tags, created_at) => {//}:EventData){
  const res = rxNostr.send({
    kind: kind,
    content: content,
    tags: tags,
    pubkey: npub,
    created_at: created_at
  }, { seckey: nsec }).subscribe({
    next: ({ from }) => {
      console.log("OK", from);
    },
    complete: () => {
      console.log("Send complete");
    }
  });
}
const postRepEvent = (event, content, tags) => {//}:EventData){
  const tag = [
    ["p", event.pubkey],
    ["e", event.id]];

  const root = event.tags.find((item) => item[item.length - 1] === "root");

  // rootが見つかった場合、tagsにrootを追加
  if (root) {
    tag.push(root);
  }
  if (tags.length > 0) {
    tag.push(tags);
  }
  const res = rxNostr.send({
    kind: event.kind,
    content: content,
    tags: tag,
    pubkey: npub,
    created_at: Math.max(event.created_at + 1, now())
  }, { seckey: nsec }).subscribe({
    next: ({ from }) => {
      console.log("OK", from);
    },
    complete: () => {
      console.log("Send complete");
    }
  });
}

postEvent(1, "₍ ･ᴗ･ ₎", []);
//rxNostr.send({kind:1,content:"test",pubkey:npub},nsec);

// Start subscription
const subscription = observable.subscribe(async (packet) => {
  // Your minimal application!
  if (packet.event.pubkey === "f987fb90696fcb09358629aeebf5156ea05a405101c4f2d9020bf02f47ea4a49") { return; }
  console.log(packet);
  const content = packet.event.content.trim();

  if (content === "もの画像" || content === "mono画像") {
    const urlIndex = Math.floor(Math.random() * urlList.length);
    monoGazo(packet, urlIndex, false);

  } else if (content.includes("ないんふぉふぉ") || content.includes("ないふぉふぉ")) {

    naifofo(packet);




    //-------------------------リプが来たとき
  } else if (packet.event.tags.some(item => item[0] === "p" && item.includes("f987fb90696fcb09358629aeebf5156ea05a405101c4f2d9020bf02f47ea4a49"))) {
    console.log("リプきたよ");

    // "comand"の部分を抽出
    const commandList = packet.event.content.split(/[ 　\n]/);
    //const filteredCommands = commandList.filter(command => !command.startsWith("nostr:"));
    const filteredCommands = commandList.filter(command => command !== "nostr:npub1lxrlhyrfdl9sjdvx9xhwhag4d6s95sz3q8z09kgzp0cz73l2ffys9p726u");
    console.log(filteredCommands[0]);
    switch (true) {
      case filteredCommands[0] === "和暦":
        wareki(packet);
        break;
      case filteredCommands[0] === "もの画像":
      case filteredCommands[0] === "mono画像":
        if (filteredCommands.length <= 1) {
          const urlIndex = Math.floor(Math.random() * urlList.length);
          monoGazo(packet, urlIndex);
        } else if (filteredCommands[1] === "length" || filteredCommands[1] === "長さ" || filteredCommands[1] === "枚数") {
          monoLen(packet);
        } else {
          const numberValue = Number(filteredCommands[1]);
          if (!isNaN(numberValue)) {
            if (numberValue < urlList.length && numberValue >= 0) {
              monoGazo(packet, numberValue, true);
            } else {
              postRepEvent(packet.event, "そんなのないよ", [])
              // const tags = [
              //   ["p", packet.event.pubkey],
              //   ["e", packet.event.id]
              // ];
              // postEvent(packet.event.kind, "そんなのないよ", tags);

            }
          } else {
            postRepEvent(packet.event, "そんなのないよ", [])
            // const tags = [
            //   ["p", packet.event.pubkey],
            //   ["e", packet.event.id]
            // ];
            // postEvent(packet.event.kind, "そんなのないよ", tags);

          }
        }
        break;

      case filteredCommands[0] === "再起動":
        if (filteredCommands.length <= 1) {

          // const tags = [
          //   ["p", packet.event.pubkey],
          //   ["e", packet.event.id]
          // ];
          // postEvent(packet.event.kind, "relay か もの画像 かどっち", tags);
          postRepEvent(packet.event, "relay か もの画像 かどっち", [])
        } else if (filteredCommands[1] === "relay") {
          //relay再起動
          if (owners.includes(packet.event.pubkey)) {
            // const tags = [
            //   ["p", packet.event.pubkey],
            //   ["e", packet.event.id]
            // ];

            exec('sudo supervisorctl restart broadcast-relay', (err, stdout, stderr) => {
              if (err) {
                console.log(`stderr: ${stderr}`)
                // postEvent(packet.event.kind, "₍ xᴗx ₎", tags);
                postRepEvent(packet.event, "₍ xᴗx ₎", [])
                return
              }
              console.log(`stdout: ${stdout}`)
              //postEvent(packet.event.kind, "₍ ･ᴗ･ ₎", tags);
              postRepEvent(packet.event, "₍ ･ᴗ･ ₎", [])

            }
            )

          }
        } else if (filteredCommands[1] === "もの画像" || filteredCommands[1] === "mono画像") {
          //relay再起動
          if (owners.includes(packet.event.pubkey)) {
            // const tags = [
            //   ["p", packet.event.pubkey],
            //   ["e", packet.event.id]
            // ];

            exec('sudo supervisorctl restart monoGazo', (err, stdout, stderr) => {
              if (err) {
                console.log(`stderr: ${stderr}`)
                //  postEvent(packet.event.kind, "₍ xᴗx ₎", tags);
                postRepEvent(packet.event, "₍ xᴗx ₎", [])
                return
              }
              console.log(`stdout: ${stdout}`)
              // postEvent(packet.event.kind, "₍ ･ᴗ･ ₎", tags);
              postRepEvent(packet.event, "₍ ･ᴗ･ ₎", [])

            }
            )

          }
        }
        break;
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

      //ものがぞうついかこまんど
      case filteredCommands[0] === "追加":

        if (owners.includes(packet.event.pubkey)) {
          const startIndex = packet.event.content.indexOf('{');  // "{" の位置を検索
          const jsonString = packet.event.content.substring(startIndex);  // "{" 以降の部分を抽出
          const newData = JSON.parse(jsonString);  // JSON文字列をオブジェクトに変換
          if (newData.author.startsWith("nostr:")) {
            newData.author = newData.author.substring(6)
          }
          if (newData.note.startsWith("nostr:")) {
            newData.note = newData.note.substring(6)
          }
          urlList.push(newData);

          try {
            await writeFile("./imageList.json", JSON.stringify(urlList, null, 2));
            // const tags = [
            //   ["p", packet.event.pubkey],
            //   ["e", packet.event.id]
            // ];
            // postEvent(packet.event.kind, "₍ ･ᴗ･ ₎", tags);
            // postRepEvent(packet.event,"₍ ･ᴗ･ ₎",[]);
            //コミットとプッシュ
            exec('sh gitPush.sh', (err, stdout, stderr) => {
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

          } catch (error) {
            // const tags = [
            //   ["p", packet.event.pubkey],
            //   ["e", packet.event.id]
            // ];
            // postEvent(packet.event.kind, "₍ xᴗx ₎", tags);
            postRepEvent(packet.event, "₍ xᴗx ₎", [])
          }
        } else {
          // const tags = [
          //   ["p", packet.event.pubkey],
          //   ["e", packet.event.id]
          // ];
          // postEvent(packet.event.kind, "₍ xᴗx ₎", tags);
          postRepEvent(packet.event, "₍ xᴗx ₎", [])
        }
        break;
      //ものがぞう削除こまんど
      case filteredCommands[0] === "削除":

        if (owners.includes(packet.event.pubkey)) {
          // 文字列の場合、数値に変換してから判定
          const numericValue = parseInt(filteredCommands[1], 10); // 10進数として解釈
          if (!isNaN(numericValue) && numericValue < urlList.length) {
            // 数値に変換できた場合の処理
            //削除する要素
            const deleteUrl = urlList[numericValue];
            const message = JSON.stringify(deleteUrl, null, 2) + "\nを削除します";

            postRepEvent(packet.event, message, [])
            // postEvent(packet.event.kind, message, tags);
            //削除して保存
            urlList.splice(numericValue, 1);
            try {
              await writeFile("./imageList.json", JSON.stringify(urlList, null, 2));

              //コミットとプッシュ
              exec('sh gitPush.sh', (err, stdout, stderr) => {
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
            } catch (error) {
              postRepEvent(packet.event, "₍ xᴗx ₎", [])
            }
          } else {
            // 数値に変換できなかった場合の処理
            postRepEvent(packet.event, "₍ xᴗx ₎", [])
          }



        } else {
          postRepEvent(packet.event, "₍ xᴗx ₎", [])
        }
        break;
      default:
        console.log("defaultのとこ");
        postRepEvent(packet.event, "₍ ･ᴗ･ ₎", []);

        break;
    }


  } else if (content.includes("あるんふぉふぉ") || content.includes("あるふぉふぉ")) {

    profileChange(packet);
  }

});

// Send REQ message to listen kind1 events
rxReq.emit({ kinds: [1, 42], since: now });



//---------------------------------------------func------------------------------------------------
function monoGazo(packet, urlIndex, syousai) {

  console.log("ものがぞうりくえすときました:" + urlIndex);
  const tags = [
    ["p", packet.event.pubkey],
    ["e", packet.event.id],
    ["r", urlList[urlIndex].url],
    ["t", "もの画像"]];

  const root = packet.event.tags.find((item) => item[item.length - 1] === "root");

  // rootが見つかった場合、tagsにrootを追加
  if (root) {
    tags.push(root);
  }
  // console.log(packet.event.created_at + 1);
  //const created_at = packet.event.created_at + 1;
  postEvent(packet.event.kind, `#もの画像\n${urlList[urlIndex].url}\n作: nostr:${urlList[urlIndex].author} (${urlList[urlIndex].date}) ${urlList[urlIndex].memo ? " (" + urlList[urlIndex].memo + ")" : ""} ${syousai ? `\n元: nostr:${urlList[urlIndex].note}` : `\n(index:${urlIndex})`}`, tags, Math.max(packet.event.created_at + 1, now()));


}


function profileChange(packet) {
  const urlIndex = Math.floor(Math.random() * urlList.length);
  console.log("あるふぉふぉちぇんじ:" + urlIndex);


  const metadata = {
    name: "mono_gazo",
    picture: urlList[urlIndex].url,
    username: "mono_gazo",
    display_name: "もの画像",
    displayName: "もの画像",
    banner: "",
    website: "",
    about: "ものが集めた画像\nmono画像\nあるんふぉふぉ\nこれ入れてとか\n入れないでとかあったら\nどうにかこうにかお伝え下さい",
    nip05: "mono_gazo@tsukemonoGit.github.io",
    lud16: "",
    lud06: ""
  }
  postEvent(0, JSON.stringify(metadata), []);

  postEvent(1, `あいこんかえた\n${urlList[urlIndex].url}\n作: nostr:${urlList[urlIndex].author} ${urlList[urlIndex].memo ? " (" + urlList[urlIndex].memo + ")" : ""} (${urlList[urlIndex].date})\n元: nostr:${urlList[urlIndex].note}`, [["r", urlList[urlIndex].url]], Math.max(packet.event.created_at + 1, now()));

}

function naifofo(packet) {

  console.log("ないらしい:");
  const tags = [
    ["p", packet.event.pubkey],
    ["e", packet.event.id],
    ["r", "https://cdn.nostr.build/i/84d43ed2d18e72aa9c012226628962c815d39c63374b446f7661850df75a7444.png"],
    ["t", "もの画像"]];

  const root = packet.event.tags.find((item) => item[item.length - 1] === "root");

  // rootが見つかった場合、tagsにrootを追加
  if (root) {
    tags.push(root);
  }
  // console.log(packet.event.created_at + 1);
  //const created_at = packet.event.created_at + 1;
  //元note: note1hd5rumpdyhc6dm5p3q8ryu5l622jcvd90wk6zpc80834s623rexsgv6mdn
  postEvent(packet.event.kind, `あるんふぉふぉどうぞ\nhttps://cdn.nostr.build/i/84d43ed2d18e72aa9c012226628962c815d39c63374b446f7661850df75a7444.png\n作: nostr:npub1e4qg56wvd3ehegd8dm7rlgj8cm998myq0ah8e9t5zeqkg7t7s93q750p76\n#もの画像`, tags, Math.max(packet.event.created_at + 1, now()));

}

function wareki(packet) {
  console.log("和暦知りたいらしい");
  const tags = [
    ["p", packet.event.pubkey],
    ["e", packet.event.id]];

  const root = packet.event.tags.find((item) => item[item.length - 1] === "root");

  // rootが見つかった場合、tagsにrootを追加
  if (root) {
    tags.push(root);
  }
  // console.log(packet.event.created_at + 1);
  //const created_at = packet.event.created_at + 1;

  const now = new Date();
  const wareki = now.toLocaleString("ja-JP-u-ca-japanese", { dateStyle: "long" });

  postEvent(packet.event.kind, `${wareki} らしい`, tags, Math.max(packet.event.created_at + 1, now()));

}

function monoLen(packet) {
  console.log("もの画像の数知りたいらしい");
  const tags = [
    ["p", packet.event.pubkey],
    ["e", packet.event.id]];

  const root = packet.event.tags.find((item) => item[item.length - 1] === "root");

  // rootが見つかった場合、tagsにrootを追加
  if (root) {
    tags.push(root);
  }
  // console.log(packet.event.created_at + 1);
  //const created_at = packet.event.created_at + 1;

  postEvent(packet.event.kind, `もの画像は今全部で${urlList.length}枚あるよ`, tags, Math.max(packet.event.created_at + 1, now()));
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

  // rootが見つかった場合、tagsにrootを追加
  if (root && packet.event.kind === "42") {
    tags.push(root);
  }
  // console.log(packet.event.created_at + 1);
  //const created_at = packet.event.created_at + 1;
  //元note: note1hd5rumpdyhc6dm5p3q8ryu5l622jcvd90wk6zpc80834s623rexsgv6mdn
  postEvent(packet.event.kind, `nostr:${nip19.npubEncode(pubkey)} あちらのお客様からです\nあるんふぉふぉどうぞ\nhttps://cdn.nostr.build/i/84d43ed2d18e72aa9c012226628962c815d39c63374b446f7661850df75a7444.png\n作: nostr:npub1e4qg56wvd3ehegd8dm7rlgj8cm998myq0ah8e9t5zeqkg7t7s93q750p76\n#もの画像\nnostr:${nip19.noteEncode(packet.event.id)}`, tags, Math.max(packet.event.created_at + 1, now()));

}