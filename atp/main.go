package main

import (
	"bytes"

	"context"

	"encoding/json"

	"flag"

	"fmt"

	"log"

	"log/slog"

	"math/rand"

	"net/http"

	_ "net/http/pprof"

	"net/url"

	"os"

	"regexp"

	"runtime"

	"sort"

	"strconv"

	"strings"

	"sync"

	"time"

	comatproto "github.com/bluesky-social/indigo/api/atproto"

	"github.com/bluesky-social/indigo/api/bsky"

	"github.com/bluesky-social/indigo/events"

	"github.com/bluesky-social/indigo/events/schedulers/sequential"

	lexutil "github.com/bluesky-social/indigo/lex/util"

	"github.com/bluesky-social/indigo/repo"

	"github.com/bluesky-social/indigo/repomgr"

	"github.com/bluesky-social/indigo/util/cliutil"

	"github.com/bluesky-social/indigo/xrpc"

	"github.com/gorilla/websocket"

	"github.com/joho/godotenv"
)

const name = "bsky-monogazobot"

const version = "0.0.1"

const revision = "HEAD"

type NostrItem struct {
	Author string `json:"author"`

	PostID string `json:"post_id"`
}

type AtpItem struct {
	Author string `json:"author"`

	ID string `json:"id"`
}

type Item struct {
	ID string `json:"id"`

	URL string `json:"url"`

	Date string `json:"date"`

	Memo string `json:"memo"`

	Nostr *NostrItem `json:"nostr,omitempty"`

	Atp *AtpItem `json:"atp,omitempty"`
}

type JsonData []Item

var (

	// グローバルで管理する画像リスト

	imageList JsonData

	// 排他制御のためのMutex

	mu sync.Mutex

	// 環境変数から取得するGit関連の情報

	gitAuthorName string

	gitAuthorEmail string

	gitScriptPath string

	accessToken string

	ownerDID string

	botDID string
)

type Event struct {
	schema string

	did string

	rkey string

	text string

	images []*bsky.EmbedImages_Image
}

func init() {

	// .envファイルを読み込む

	if err := godotenv.Load(); err != nil {

		log.Println("Error loading .env file. Proceeding with system environment variables.")

	}

	time.Local = time.FixedZone("Local", 9*60*60)

	rand.Seed(time.Now().UnixNano())

	// 環境変数の読み込み

	gitAuthorName = os.Getenv("GIT_AUTHOR_NAME")

	gitAuthorEmail = os.Getenv("GIT_AUTHOR_EMAIL")

	gitScriptPath = os.Getenv("SCRIPTPATH")

	accessToken = os.Getenv("TOKEN")

	ownerDID = os.Getenv("OWNER_DID")

	botDID = os.Getenv("HAIKUBOT_HANDLE_DID")

	// 環境変数の確認

	log.Printf("Environment variables loaded:")

	log.Printf("SCRIPTPATH: %s", gitScriptPath)

	log.Printf("OWNER_DID: %s", ownerDID)

	log.Printf("HAIKUBOT_HANDLE_DID: %s", botDID)

	// imageList.jsonの読み込み

	if err := readImageList(); err != nil {

		log.Fatal("Failed to read imageList.json:", err)

	}
}

// imageList.jsonを読み込む

func readImageList() error {

	data, err := os.ReadFile(gitScriptPath + "/imageList.json")

	if err != nil {

		if os.IsNotExist(err) {

			imageList = JsonData{}

			return nil

		}

		return fmt.Errorf("failed to read imageList.json: %w", err)

	}

	return json.Unmarshal(data, &imageList)
}

// imageList.jsonに書き込む

func writeImageList() error {

	sort.Slice(imageList, func(i, j int) bool {

		return imageList[i].Date < imageList[j].Date

	})

	data, err := json.MarshalIndent(imageList, "", " ")

	if err != nil {

		return fmt.Errorf("failed to marshal imageList: %w", err)

	}

	return os.WriteFile(gitScriptPath+"/imageList.json", data, 0644)
}

type Bot struct {
	Bgs string

	Host string

	Handle string

	Password string
}

func (bot *Bot) makeXRPCC() (*xrpc.Client, error) {

	xrpcc := &xrpc.Client{

		Client: cliutil.NewHttpClient(),

		Host: bot.Host,

		Auth: &xrpc.AuthInfo{Handle: bot.Handle},
	}

	auth, err := comatproto.ServerCreateSession(context.TODO(), xrpcc, &comatproto.ServerCreateSession_Input{

		Identifier: xrpcc.Auth.Handle,

		Password: bot.Password,
	})

	if err != nil {

		return nil, fmt.Errorf("cannot create session: %w", err)

	}

	xrpcc.Auth.Did = auth.Did

	xrpcc.Auth.AccessJwt = auth.AccessJwt

	xrpcc.Auth.RefreshJwt = auth.RefreshJwt

	return xrpcc, nil
}

func (bot *Bot) post(collection string, did string, rkey string, text string, images []*bsky.EmbedImages_Image) error {

	if strings.TrimSpace(text) == "" && len(images) == 0 {

		return nil

	}

	xrpcc, err := bot.makeXRPCC()

	if err != nil {

		return fmt.Errorf("cannot create client: %w", err)

	}

	var replyRef *bsky.FeedPost_ReplyRef

	if collection != "" && did != "" && rkey != "" {

		getResp, err := comatproto.RepoGetRecord(context.TODO(), xrpcc, "", collection, did, rkey)

		if err != nil {

			return fmt.Errorf("cannot get record: %w", err)

		}

		replyRef = &bsky.FeedPost_ReplyRef{

			Root: &comatproto.RepoStrongRef{Cid: *getResp.Cid, Uri: getResp.Uri},

			Parent: &comatproto.RepoStrongRef{Cid: *getResp.Cid, Uri: getResp.Uri},
		}

	}

	post := &bsky.FeedPost{

		LexiconTypeID: "app.bsky.feed.post",

		Text: text,

		CreatedAt: time.Now().Local().Format(time.RFC3339),

		Reply: replyRef,

		Langs: []string{"ja"},
	}

	if len(images) > 0 {

		post.Embed = &bsky.FeedPost_Embed{

			EmbedImages: &bsky.EmbedImages{

				Images: images,
			},
		}

	} else if replyRef != nil {

		post.Embed = &bsky.FeedPost_Embed{

			EmbedRecord: &bsky.EmbedRecord{

				LexiconTypeID: "app.bsky.embed.record",

				Record: replyRef.Parent,
			},
		}

	}

	var lastErr error

	for retry := 0; retry < 3; retry++ {

		resp, err := comatproto.RepoCreateRecord(context.TODO(), xrpcc, &comatproto.RepoCreateRecord_Input{

			Collection: "app.bsky.feed.post",

			Repo: xrpcc.Auth.Did,

			Record: &lexutil.LexiconTypeDecoder{

				Val: post,
			},
		})

		if err == nil {

			fmt.Println(resp.Uri)

			return nil

		}

		log.Printf("failed to create post: %v", err)

		lastErr = err

		time.Sleep(time.Second)

	}

	return fmt.Errorf("failed to create post: %w", lastErr)
}

func (bot *Bot) wssUrl() string {

	u, err := url.Parse(bot.Bgs)

	if err != nil {

		log.Fatal("invalid host", bot.Host)

	}

	return "wss://" + u.Host + "/xrpc/com.atproto.sync.subscribeRepos"
}

// 権限を持つユーザーかチェックする

func (bot *Bot) isOwner(did string) bool {

	// 環境変数からオーナーのDIDを読み込む

	if ownerDID == "" {

		log.Fatal("OWNER_DID is not set.")

	}

	return did == ownerDID
}

// 自身の投稿かチェックする

func (bot *Bot) isSelfPost(did string) bool {

	if botDID == "" {

		log.Fatal("HAIKUBOT_HANDLE_DID is not set.")

	}

	return did == botDID
}

// 画像のMIMEタイプを推測する関数

func getMimeType(url string) string {

	parts := strings.Split(url, ".")

	ext := strings.ToLower(parts[len(parts)-1])

	switch ext {

	case "jpeg", "jpg":

		return "image/jpeg"

	case "png":

		return "image/png"

	case "gif":

		return "image/gif"

	case "webp":

		return "image/webp"

	default:

		return "application/octet-stream"

	}
}

func (bot *Bot) analyze(ev Event) error {

	content := strings.TrimSpace(ev.text)

	did := ev.did

	rkey := ev.rkey

	schema := ev.schema

	// 自身の投稿には返信しない

	if bot.isSelfPost(did) {

		log.Printf("Self post detected, skipping")

		return nil

	}

	// コマンドの正規表現を定義

	reMonoGazo := regexp.MustCompile(`^もの画像$`)

	reMonoGazoCount := regexp.MustCompile(`^もの画像.*数.*$`)

	reMonoGazoDelete := regexp.MustCompile(`^もの画像.*削除\s+(\d+).*$`)

	reMonoGazoAdd := regexp.MustCompile(`^もの画像追加$`)

	if reMonoGazoAdd.MatchString(content) {

		if !bot.isOwner(ev.did) {

			return bot.post(schema, did, rkey, "ごめんなさい、この操作は許可されたユーザーしか行えません。", nil)

		}

		if len(ev.images) == 0 {

			return bot.post(schema, did, rkey, "画像が添付されていません。", nil)

		}

		mu.Lock()

		defer mu.Unlock()

		addedCount := 0

		for _, img := range ev.images {

			if img.Image == nil || img.Image.Ref.String() == "" {

				log.Println("Skipping image with missing or empty URL reference")

				continue

			}

			imageURL := img.Image.Ref.String()

			// 重複チェック

			found := false

			for _, item := range imageList {

				if item.URL == imageURL {

					found = true

					break

				}

			}

			if !found {

				newItem := Item{

					ID: fmt.Sprintf("atp-%s/%s", ev.did, ev.rkey),

					URL: imageURL,

					Date: time.Now().Local().Format("2006/1/2"),

					Memo: "",

					Atp: &AtpItem{Author: ev.did, ID: ev.rkey},
				}

				imageList = append(imageList, newItem)

				addedCount++

			}

		}

		if addedCount > 0 {

			if err := writeImageList(); err != nil {

				log.Printf("Failed to write imageList: %v", err)

				return bot.post(schema, did, rkey, "画像の追加に失敗しました...₍ ･ᴗx ₎", nil)

			}

			return bot.post(schema, did, rkey, fmt.Sprintf("%d枚の画像をもの画像に追加しました。もの画像は今全部で%d枚あるよ", addedCount, len(imageList)), nil)

		} else {

			return bot.post(schema, did, rkey, "追加する新しい画像は見つかりませんでした。", nil)

		}

	}

	if reMonoGazoCount.MatchString(content) {

		mu.Lock()

		count := len(imageList)

		mu.Unlock()

		response := fmt.Sprintf("もの画像は今全部で%d枚あるよ", count)

		return bot.post(schema, did, rkey, response, nil)

	}

	if reMonoGazoDelete.MatchString(content) {

		if bot.isOwner(ev.did) {

			matches := reMonoGazoDelete.FindStringSubmatch(content)

			if len(matches) > 1 {

				indexStr := matches[1]

				index, err := strconv.Atoi(indexStr)

				if err != nil {

					return bot.post(schema, did, rkey, "ごめんなさい、番号が分からないんふぉふぉ", nil)

				}

				mu.Lock()

				if index >= 0 && index < len(imageList) {

					itemToDelete := imageList[index]

					err := deleteImage(index)

					mu.Unlock()

					if err != nil {

						return bot.post(schema, did, rkey, "削除に失敗しました...₍ ･ᴗx ₎", nil)

					}

					return bot.post(schema, did, rkey, fmt.Sprintf("インデックス%dの画像を削除しました。\nURL: %s", index, itemToDelete.URL), nil)

				}

				mu.Unlock()

				return bot.post(schema, did, rkey, "ごめんなさい、その番号の画像はないんふぉふぉ", nil)

			}

		}

		return nil

	}

	if reMonoGazo.MatchString(content) {

		// デバッグ情報を出力

		log.Printf("Event: schema=%s, did=%s, rkey=%s, text=%s, images count=%d", schema, did, rkey, content, len(ev.images))

		log.Printf("botDID=%s, ownerDID=%s", botDID, ownerDID)

		mu.Lock()

		if len(imageList) > 0 {

			randomIndex := rand.Intn(len(imageList))

			imageItem := imageList[randomIndex]

			mu.Unlock()

			// 画像URLからBlobをアップロードする

			xrpcc, err := bot.makeXRPCC()

			if err != nil {

				log.Printf("Failed to create XRPCC: %v", err)

				return bot.post(schema, did, rkey, "画像の取得に失敗しました...₍ ･ᴗx ₎", nil)

			}

			// Nostrの画像URLをダウンロード

			resp, err := http.Get(imageItem.URL)

			if err != nil {

				log.Printf("Failed to download image from %s: %v", imageItem.URL, err)

				return bot.post(schema, did, rkey, "画像の取得に失敗しました...₍ ･ᴗx ₎", nil)

			}

			defer resp.Body.Close()

			if resp.StatusCode != http.StatusOK {

				log.Printf("Failed to download image: status code %d", resp.StatusCode)

				return bot.post(schema, did, rkey, "画像の取得に失敗しました...₍ ･ᴗx ₎", nil)

			}

			imgBytes := new(bytes.Buffer)

			_, err = imgBytes.ReadFrom(resp.Body)

			if err != nil {

				log.Printf("Failed to read image data: %v", err)

				return bot.post(schema, did, rkey, "画像の取得に失敗しました...₍ ･ᴗx ₎", nil)

			}

			// 画像をBlueskyにアップロード

			uploadResp, err := comatproto.RepoUploadBlob(context.TODO(), xrpcc, imgBytes)

			if err != nil {

				log.Printf("Failed to upload blob: %v", err)

				return bot.post(schema, did, rkey, "画像のアップロードに失敗しました...₍ ･ᴗx ₎", nil)

			}

			// 画像埋め込み情報を作成

			images := []*bsky.EmbedImages_Image{

				{

					Image: &lexutil.LexBlob{

						Ref: uploadResp.Blob.Ref,

						MimeType: getMimeType(imageItem.URL),

						Size: uploadResp.Blob.Size,
					},

					Alt: "", // 代替テキストは空

				},
			}

			// 投稿テキストと引用情報を設定

			postText := "#もの画像"

			if imageItem.Atp != nil {

				postText = fmt.Sprintf("%s\nat://%s/app.bsky.feed.post/%s ", postText, imageItem.Atp.Author, imageItem.Atp.ID)

			} else if imageItem.Nostr != nil {

				postText = fmt.Sprintf("%s\nhttps://lumilumi.app/%s", postText, imageItem.Nostr.PostID)

			}

			// 新しい投稿の作成

			err = bot.post(schema, did, rkey, postText, images)

			if err != nil {

				return fmt.Errorf("failed to create post with image: %w", err)

			}

			return nil

		}

		mu.Unlock()

		response := "ごめんなさい、もの画像がないんふぉふぉ..."

		return bot.post(schema, did, rkey, response, nil)

	}

	return nil
}

func run() error {

	var bot Bot

	bot.Bgs = os.Getenv("HAIKUBOT_BGS")

	bot.Host = os.Getenv("HAIKUBOT_HOST")

	bot.Handle = os.Getenv("HAIKUBOT_HANDLE")

	bot.Password = os.Getenv("HAIKUBOT_PASSWORD")

	// 環境変数の確認

	log.Printf("Bot config: BGS=%s, Host=%s, Handle=%s, Password set=%t",

		bot.Bgs, bot.Host, bot.Handle, bot.Password != "")

	if bot.Password == "" {

		log.Fatal("HAIKUBOT_PASSWORD is required")

	}

	if bot.Host == "" {

		log.Fatal("HAIKUBOT_HOST is required")

	}

	if bot.Handle == "" {

		log.Fatal("HAIKUBOT_HANDLE is required")

	}

	con, _, err := websocket.DefaultDialer.Dial(bot.wssUrl(), http.Header{})

	if err != nil {

		return fmt.Errorf("dial failure: %w", err)

	}

	defer con.Close()

	q := make(chan Event, 100)

	hbtimer := time.NewTicker(5 * time.Minute)

	defer hbtimer.Stop()

	var wg sync.WaitGroup

	wg.Add(1)

	go func() {

		defer wg.Done()

		retry := 0

	events_loop:

		for {

			select {

			case ev, ok := <-q:

				if !ok {

					break events_loop

				}

				if err := bot.analyze(ev); err != nil {

					log.Println(err)

				}

				retry = 0

			case <-hbtimer.C:

				if url := os.Getenv("HEARTBEAT_URL"); url != "" {

					go heartbeatPush(url)

				}

			case <-time.After(10 * time.Second):

				retry++

				log.Println("Health check", retry)

				if retry > 60 {

					log.Println("timeout")

					con.Close()

					break events_loop

				}

				runtime.GC()

			}

		}

	}()

	ctx := context.Background()

	rsc := &events.RepoStreamCallbacks{

		RepoCommit: func(evt *comatproto.SyncSubscribeRepos_Commit) error {

			if evt.TooBig {

				log.Printf("skipping too big events for now: %d", evt.Seq)

				return nil

			}

			r, err := repo.ReadRepoFromCar(ctx, bytes.NewReader(evt.Blocks))

			if err != nil {

				return fmt.Errorf("reading repo from car (seq: %d, len: %d): %w", evt.Seq, len(evt.Blocks), err)

			}

			for _, op := range evt.Ops {

				ek := repomgr.EventKind(op.Action)

				switch ek {

				case repomgr.EvtKindCreateRecord, repomgr.EvtKindUpdateRecord:

					rc, rec, err := r.GetRecord(ctx, op.Path)

					if err != nil {

						e := fmt.Errorf("getting record %s (%s) within seq %d for %s: %w", op.Path, *op.Cid, evt.Seq, evt.Repo, err)

						log.Print(e)

						continue

					}

					if lexutil.LexLink(rc) != *op.Cid {

						return fmt.Errorf("mismatch in record and op cid: %s != %s", rc, *op.Cid)

					}

					if ek != "create" {

						return nil

					}

					post, ok := rec.(*bsky.FeedPost)

					if !ok {

						return nil

					}

					parts := strings.Split(op.Path, "/")

					if len(parts) < 2 {

						return nil

					}

					// app.bsky.embed.imagesを処理するロジック

					var images []*bsky.EmbedImages_Image

					if post.Embed != nil && post.Embed.EmbedImages != nil {

						images = post.Embed.EmbedImages.Images

					}

					q <- Event{

						schema: parts[0],

						did: evt.Repo,

						rkey: parts[1],

						text: post.Text,

						images: images,
					}

				}

			}

			return nil

		},

		RepoInfo: func(info *comatproto.SyncSubscribeRepos_Info) error {

			return nil

		},

		Error: func(errf *events.ErrorFrame) error {

			return fmt.Errorf("error frame: %s: %s", errf.Error, errf.Message)

		},
	}

	err = events.HandleRepoStream(ctx, con, sequential.NewScheduler("stream", rsc.EventHandler), slog.Default())

	if err != nil {

		log.Println(err)

	}

	close(q)

	wg.Wait()

	return nil
}

func main() {

	var ver bool

	flag.BoolVar(&ver, "v", false, "show version")

	flag.Parse()

	if ver {

		fmt.Println(version)

		os.Exit(0)

	}

	go http.ListenAndServe("0.0.0.0:6060", nil)

	for {

		log.Println("start")

		if err := run(); err != nil {

			log.Println(err)

		}

	}
}

func heartbeatPush(url string) {

	resp, err := http.Get(url)

	if err != nil {

		log.Println(err.Error())

		return

	}

	defer resp.Body.Close()
}

func deleteImage(index int) error {

	if index < 0 || index >= len(imageList) {

		return fmt.Errorf("index out of bounds")

	}

	imageList = append(imageList[:index], imageList[index+1:]...)

	return writeImageList()
}
