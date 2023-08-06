import 'websocket-polyfill'
import { createRxNostr, createRxForwardReq, verify, uniq, now } from "rx-nostr";
import env from "dotenv";
env.config();
import { urlList } from './imageList.js';



const nsec = process.env.NSEC;
const npub = process.env.PUBHEX;
const rxNostr = createRxNostr();
await rxNostr.switchRelays(["wss://yabu.me", "wss://r.kojira.io"]);

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
  console.log(packet);
  const content = packet.event.content.trim();

  if (content === "もの画像" || content === "mono画像") {
    monoGazo(packet);

  } else if (content.includes("あるんふぉふぉ") || content.includes("あるふぉふぉ")) {

    profileChange(packet);

    //-------------------------リプが来たとき
  } else if (packet.event.tags.some(item => item[0] === "p" && item.includes("f987fb90696fcb09358629aeebf5156ea05a405101c4f2d9020bf02f47ea4a49"))) {
    console.log("リプきたよ");
    // "comand"の部分を抽出
    const command = packet.event.content.split(" ")[0];
    switch (command) {
      case "和暦":
        wareki(packet);
        break;
     
      default:
        console.log("switchのdefaultのとこ");
        break;
    }

  }

});

// Send REQ message to listen kind1 events
rxReq.emit({ kinds: [1, 42], since: now });


//---------------------------------------------func
function monoGazo(packet) {
  const urlIndex = Math.floor(Math.random() * urlList.length);
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

  const res = rxNostr.send({
    kind: packet.event.kind,
    content: `#もの画像\n${urlList[urlIndex].url}\n作: nostr:${urlList[urlIndex].author} ${urlList[urlIndex].memo ? " (" + urlList[urlIndex].memo + ")" : ""}`,
    tags: tags,
    pubkey: npub,
    //created_at:created_at
  }, { seckey: nsec }).subscribe({
    next: ({ from }) => {
      console.log("OK", from);
    },
    complete: () => {
      console.log("Send complete");
    }
  });

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
    about: "もの画像\nmono画像\n入れ残しとか\n入れないでとかあったら\nどうにかこうにかお伝え下さい",
    nip05: "",
    lud16: "",
    lud06: ""
  }

  const res = rxNostr.send({
    kind: 0,
    content: JSON.stringify(metadata),
    tags: [],
    pubkey: npub,
  }, {
    seckey: nsec
  }).subscribe({
    next: ({ from }) => {
      console.log("OK", from);
    },
    complete: () => {
      console.log("Send complete");
    }
  });

  const res2 = rxNostr.send({
    kind: 1,
    content: `あいこんかえた\n${urlList[urlIndex].url}\n作: nostr:${urlList[urlIndex].author} ${urlList[urlIndex].memo ? " (" + urlList[urlIndex].memo + ")" : ""}`,
    tags: [["r", urlList[urlIndex].url]],
    pubkey: npub,
  }, {
    created_at: packet.event.created_at + 1,
    seckey: nsec
  }).subscribe({
    next: ({ from }) => {
      console.log("OK", from);
    },
    complete: () => {
      console.log("Send complete");
    }
  });

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
  const created_at = packet.event.created_at + 1;

  const now = new Date();
  const wareki = now.toLocaleString("ja-JP-u-ca-japanese", { dateStyle: "long" });


  const res = rxNostr.send({
    kind: packet.event.kind,
    content: `${wareki} らしい`,
    tags: tags,
    pubkey: npub,
    //created_at:created_at
  }, { seckey: nsec }).subscribe({
    next: ({ from }) => {
      console.log("OK", from);
    },
    complete: () => {
      console.log("Send complete");
    }
  });
}