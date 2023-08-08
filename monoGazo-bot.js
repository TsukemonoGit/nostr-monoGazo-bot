import 'websocket-polyfill'
import { createRxNostr, createRxForwardReq, verify, uniq, now } from "rx-nostr";
import env from "dotenv";
env.config();
import { urlList } from './imageList.js';



const nsec = process.env.NSEC;
const npub = process.env.PUBHEX;
const rxNostr = createRxNostr();
await rxNostr.switchRelays(["wss://yabu.me", "wss://r.kojira.io","wss://nostr.fediverse.jp"]);

const rxReq = createRxForwardReq();

// Create observable
const observable = rxNostr.use(rxReq)
  .pipe(
    // Verify event hash and signature
    verify(),
    // Uniq by event hash
    uniq(),

  );

//rxNostr.send({kind:1,content:"test",pubkey:npub},nsec);

// Start subscription
const subscription = observable.subscribe((packet) => {
  // Your minimal application!
  if (packet.event.pubkey === "f987fb90696fcb09358629aeebf5156ea05a405101c4f2d9020bf02f47ea4a49") { return; }
  console.log(packet);
  const content = packet.event.content.trim();

  if (content === "もの画像" || content === "mono画像") {
    const urlIndex = Math.floor(Math.random() * urlList.length);
    monoGazo(packet, urlIndex,false);

  } else if (content.includes("ないんふぉふぉ") || content.includes("ないふぉふぉ")) {

    naifofo(packet);

    //-------------------------リプが来たとき
  } else if (content.includes("あるんふぉふぉ") || content.includes("あるふぉふぉ")) {

    profileChange(packet);


  } else if (packet.event.tags.some(item => item[0] === "p" && item.includes("f987fb90696fcb09358629aeebf5156ea05a405101c4f2d9020bf02f47ea4a49"))) {
    console.log("リプきたよ");
    // "comand"の部分を抽出
    const commandList = packet.event.content.split(/[ 　]/);
    const filteredCommands = commandList.filter(command => !command.startsWith("nostr:"));

    switch (filteredCommands[0]) {
      case "和暦":
        wareki(packet);
        break;
      case "もの画像":
      case "mono画像":
        if (filteredCommands.length <= 1) {
          const urlIndex = Math.floor(Math.random() * urlList.length);
          monoGazo(packet, urlIndex);
        } else if (filteredCommands[1] === "length" ||filteredCommands[1] === "長さ") {
          monoLen(packet);
        } else {
          const numberValue = Number(filteredCommands[1]);
          if (!isNaN(numberValue)) {
            if (numberValue < urlList.length && numberValue >=0) {
              monoGazo(packet, numberValue,true);
            } else {
              const tags = [
                ["p", packet.event.pubkey],
                ["e", packet.event.id]
              ];
              postEvent(packet.event.kind, "そんなのないよ", tags);
             
            }
          }else{
            const tags = [
              ["p", packet.event.pubkey],
              ["e", packet.event.id]
            ];
            postEvent(packet.event.kind, "そんなのないよ", tags);
           
          }
        }
        break;

      default:
        console.log("defaultのとこ");
        const tags = [
          ["p", packet.event.pubkey],
          ["e", packet.event.id]
        ];
        postEvent(packet.event.kind, "₍ ･ᴗ･ ₎", tags,packet.event.created_at+1);
        break;
    }
  }

});

// Send REQ message to listen kind1 events
rxReq.emit({ kinds: [1, 42], since: now });



//---------------------------------------------func------------------------------------------------
function monoGazo(packet, urlIndex,syousai) {

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
  const created_at = packet.event.created_at + 1;
  postEvent(packet.event.kind, `#もの画像\n${urlList[urlIndex].url}\n作: nostr:${urlList[urlIndex].author} (${urlList[urlIndex].date}) ${urlList[urlIndex].memo ? " (" + urlList[urlIndex].memo + ")" : ""} ${syousai? `\n元: nostr:${urlList[urlIndex].note}`:`\n(index:${urlIndex})`}`, tags,packet.event.created_at+1);


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
    about: "もの画像\nmono画像\nあるんふぉふぉ\n入れ残しとか\n入れないでとかあったら\nどうにかこうにかお伝え下さい",
    nip05: "",
    lud16: "",
    lud06: ""
  }
  postEvent(0, JSON.stringify(metadata), []);

  postEvent(1, `あいこんかえた\n${urlList[urlIndex].url}\n作: nostr:${urlList[urlIndex].author} ${urlList[urlIndex].memo ? " (" + urlList[urlIndex].memo + ")" : ""} (${urlList[urlIndex].date})\n元: nostr:${urlList[urlIndex].note}`, [["r", urlList[urlIndex].url]],packet.event.created_at+1);

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
  postEvent(packet.event.kind, `あるんふぉふぉどうぞ\nhttps://cdn.nostr.build/i/84d43ed2d18e72aa9c012226628962c815d39c63374b446f7661850df75a7444.png\n作: nostr:npub1e4qg56wvd3ehegd8dm7rlgj8cm998myq0ah8e9t5zeqkg7t7s93q750p76\n#もの画像`, tags,packet.event.created_at + 1);

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

  postEvent(packet.event.kind, `${wareki} らしい`, tags,packet.event.created_at + 1);

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

  postEvent(packet.event.kind, `もの画像は今全部で${urlList.length-1}枚あるよ`, tags,packet.event.created_at + 1);
}


//-----------------------------
// interface EventData {
//   kind: Number,
//   tags: string[][],
//   created_at?: Number,
//   content: string
// }

const postEvent=(kind, content, tags, created_at)=> {//}:EventData){
  const res = rxNostr.send({
    kind: kind,
    content: content,
    tags: tags,
    pubkey: npub,
    created_at:created_at 
  }, { seckey: nsec }).subscribe({
    next: ({ from }) => {
      console.log("OK", from);
    },
    complete: () => {
      console.log("Send complete");
    }
  });
}