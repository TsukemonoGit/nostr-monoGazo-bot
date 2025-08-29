package main

import (
	"bytes"
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"log/slog"
	"math"
	"math/rand"
	"net/http"
	_ "net/http/pprof"
	"net/url"
	"os"
	"os/exec"
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
const version = "0.0.2"
const revision = "HEAD"

type NostrItem struct {
	Author string `json:"author"`
	PostID string `json:"post_id"`
}

type AtpItem struct {
	Author string `json:"author"`
	ID     string `json:"id"`
}

type Item struct {
	ID    string     `json:"id"`
	URL   string     `json:"url"`
	Date  string     `json:"date"`
	Memo  string     `json:"memo"`
	Nostr *NostrItem `json:"nostr,omitempty"`
	Atp   *AtpItem   `json:"atp,omitempty"`
}

type JsonData []Item

var (
	imageList      JsonData
	mu             sync.Mutex
	gitAuthorName  string
	gitAuthorEmail string
	gitScriptPath  string
	accessToken    string
	ownerDID       string
	botDID         string
	// 乱数生成器（Go 1.20+ 対応）
	rng *rand.Rand
)

type Event struct {
	schema string
	did    string
	rkey   string
	text   string
	images []*bsky.EmbedImages_Image
}

func init() {
	if err := godotenv.Load(); err != nil {
		log.Println("Error loading .env file. Proceeding with system environment variables.")
	}
	time.Local = time.FixedZone("Local", 9*60*60)
	// rand.Seed は非推奨。ローカル RNG を使用
	rng = rand.New(rand.NewSource(time.Now().UnixNano()))
	// 環境変数
	gitAuthorName = os.Getenv("GIT_AUTHOR_NAME")
	gitAuthorEmail = os.Getenv("GIT_AUTHOR_EMAIL")
	gitScriptPath = os.Getenv("SCRIPTPATH")
	accessToken = os.Getenv("TOKEN")
	ownerDID = os.Getenv("OWNER_DID")
	botDID = os.Getenv("HAIKUBOT_HANDLE_DID")
	log.Printf("Environment variables loaded:")
	log.Printf("SCRIPTPATH: %s", gitScriptPath)
	log.Printf("OWNER_DID: %s", ownerDID)
	log.Printf("HAIKUBOT_HANDLE_DID: %s", botDID)
	if err := readImageList(); err != nil {
		log.Fatal("Failed to read imageList.json:", err)
	}
}

// imageList.json 読み込み
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

// imageList.json 書き込み
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
	Bgs      string
	Host     string
	Handle   string
	Password string
}

func (bot *Bot) makeXRPCC() (*xrpc.Client, error) {
	xrpcc := &xrpc.Client{
		Client: cliutil.NewHttpClient(),
		Host:   bot.Host,
		Auth:   &xrpc.AuthInfo{Handle: bot.Handle},
	}
	auth, err := comatproto.ServerCreateSession(context.TODO(), xrpcc, &comatproto.ServerCreateSession_Input{
		Identifier: xrpcc.Auth.Handle,
		Password:   bot.Password,
	})
	if err != nil {
		return nil, fmt.Errorf("cannot create session: %w", err)
	}
	xrpcc.Auth.Did = auth.Did
	xrpcc.Auth.AccessJwt = auth.AccessJwt
	xrpcc.Auth.RefreshJwt = auth.RefreshJwt
	return xrpcc, nil
}

func (bot *Bot) post(collection string, did string, rkey string, text string, images []*bsky.EmbedImages_Image, facets []*bsky.RichtextFacet) error {
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
			Root:   &comatproto.RepoStrongRef{Cid: *getResp.Cid, Uri: getResp.Uri},
			Parent: &comatproto.RepoStrongRef{Cid: *getResp.Cid, Uri: getResp.Uri},
		}
	}
	post := &bsky.FeedPost{
		LexiconTypeID: "app.bsky.feed.post",
		Text:          text,
		CreatedAt:     time.Now().Local().Format(time.RFC3339),
		Reply:         replyRef,
		Langs:         []string{"ja"},
		Facets:        facets,
	}
	if len(images) > 0 {
		post.Embed = &bsky.FeedPost_Embed{
			EmbedImages: &bsky.EmbedImages{Images: images},
		}
	} else if replyRef != nil {
		post.Embed = &bsky.FeedPost_Embed{
			EmbedRecord: &bsky.EmbedRecord{
				LexiconTypeID: "app.bsky.embed.record",
				Record:        replyRef.Parent,
			},
		}
	}
	var lastErr error
	for retry := 0; retry < 3; retry++ {
		resp, err := comatproto.RepoCreateRecord(context.TODO(), xrpcc, &comatproto.RepoCreateRecord_Input{
			Collection: "app.bsky.feed.post",
			Repo:       xrpcc.Auth.Did,
			Record:     &lexutil.LexiconTypeDecoder{Val: post},
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

func (bot *Bot) isOwner(did string) bool {
	if ownerDID == "" {
		log.Fatal("OWNER_DID is not set.")
	}
	return did == ownerDID
}

func (bot *Bot) isSelfPost(did string) bool {
	if botDID == "" {
		log.Fatal("HAIKUBOT_HANDLE_DID is not set.")
	}
	return did == botDID
}

func getMimeType(u string) string {
	parts := strings.Split(u, ".")
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
	case "svg":
		return "image/svg+xml"
	default:
		return "application/octet-stream"
	}
}

// 加重ランダム（末尾ほど高確率）
func weightedRandomIndex(length int, ratio float64) int {
	if length <= 0 {
		return 0
	}
	if length == 1 {
		return 0
	}
	weights := make([]float64, length)
	for i := 0; i < length; i++ {
		weights[i] = math.Pow(ratio, float64(i)/float64(length-1))
	}
	total := 0.0
	for _, w := range weights {
		total += w
	}
	target := rng.Float64() * total
	cum := 0.0
	for i, w := range weights {
		cum += w
		if target < cum {
			return i
		}
	}
	return length - 1
}

// 和暦（簡易。令和のみ対応）
func warekiNow() string {
	now := time.Now()
	reiwaStart := time.Date(2019, 5, 1, 0, 0, 0, 0, time.Local)
	if now.Before(reiwaStart) {
		return now.Format("2006年01月02日")
	}
	year := now.Year() - 2018
	return fmt.Sprintf("令和%d年%02d月%02d日", year, int(now.Month()), now.Day())
}

// Facet: ハッシュタグ「もの画像」
func facetTagMonoGazo() *bsky.RichtextFacet {
	return &bsky.RichtextFacet{
		Features: []*bsky.RichtextFacet_Features_Elem{
			{RichtextFacet_Tag: &bsky.RichtextFacet_Tag{Tag: "もの画像"}},
		},
		Index: &bsky.RichtextFacet_ByteSlice{ByteStart: 0, ByteEnd: int64(len("#もの画像"))},
	}
}

// Facet: リンク
func facetLink(text string, linkStart int, linkURL string) *bsky.RichtextFacet {
	return &bsky.RichtextFacet{
		Features: []*bsky.RichtextFacet_Features_Elem{
			{RichtextFacet_Link: &bsky.RichtextFacet_Link{Uri: linkURL}},
		},
		Index: &bsky.RichtextFacet_ByteSlice{
			ByteStart: int64(linkStart),
			ByteEnd:   int64(linkStart + len(strings.TrimSpace(text))),
		},
	}
}

// JSON 追加データ（Bsky用）
type addPayload struct {
	URL  string `json:"url"`
	Date string `json:"date"`
	Memo string `json:"memo"`
	Atp  struct {
		Author string `json:"author"`
		ID     string `json:"id"`
	} `json:"atp"`
}

// Git push（任意。環境に依存）
func gitPush() error {
	if gitScriptPath == "" || accessToken == "" {
		return nil
	}
	cmd := exec.Command("bash", "-lc", fmt.Sprintf("cd %s && git remote set-url origin https://%s@github.com/TsukemonoGit/nostr-monoGazo-bot.git && git pull origin main && git add . && git -c user.name='%s' -c user.email='%s' commit -m \"Update imageList.json\" && git push -u origin main", gitScriptPath, accessToken, gitAuthorName, gitAuthorEmail))
	out, err := cmd.CombinedOutput()
	log.Printf("gitPush: %s", string(out))
	return err
}

// ---------------- コマンド解析 ----------------
func (bot *Bot) analyze(ev Event) error {
	content := strings.TrimSpace(ev.text)
	did := ev.did
	rkey := ev.rkey
	schema := ev.schema
	if bot.isSelfPost(did) {
		return nil
	}

	// 正規表現（Nostr版の網羅に合わせる）
	reMonoGazoRandom := regexp.MustCompile("^(もの|mono)画像$")
	reNaifofo := regexp.MustCompile("(ない)ん?ふぉふぉ")
	reMonoGazoDoko := regexp.MustCompile("(もの|mono)画像\\s?どこ[?？]?$")
	reMonoSiteDoko := regexp.MustCompile("(もの|mono)(画像)?サイト\\s?どこ[?？]?$")
	reVs := regexp.MustCompile("^もの、(.{1,50}(?:vs.{1,50})+)して$")
	reMonoGazoNumber := regexp.MustCompile("(もの|mono)画像\\s?(\\d+)$")
	reWareki := regexp.MustCompile("和暦")
	reMonoGazoLen := regexp.MustCompile("(もの|mono)画像\\s?(length|長さ|枚数|何枚)")
	reArufofoKure := regexp.MustCompile("(あるん|ある)ふぉふぉ?(下さい|ください|頂戴|ちょうだい).?")
	reArufofoAgete := regexp.MustCompile("(あるん|ある)ふぉふぉ?(あげて).?")
	/* reArufofoDouzo := regexp.MustCompile("(npub\\w{59})\\s?(さん|ちゃん|くん)?に(.*)(あるんふぉふぉ|あるふぉふぉ)(.*)(を送って|をおくって|送って|おくって|あげて)") */
	reMonoGazoAddCmd := regexp.MustCompile("(追加|add)(\\s.*)({.*})")
	reMonoGazoDeleteCmd := regexp.MustCompile("(削除|delete)\\s*(\\d+)*")

	// 1) 追加コマンド（Bsky用 JSON）
	// 例: 「追加 {...json...}」
	if reMonoGazoAddCmd.MatchString(content) && bot.isOwner(did) {
		matches := reMonoGazoAddCmd.FindStringSubmatch(content)
		if len(matches) >= 3 {
			var p addPayload
			jsonPart := matches[3]
			if err := json.Unmarshal([]byte(jsonPart), &p); err != nil {
				return bot.post(schema, did, rkey, "JSONの解析に失敗", nil, nil)
			}
			if strings.TrimSpace(p.URL) == "" {
				return bot.post(schema, did, rkey, "urlが空", nil, nil)
			}
			mu.Lock()
			dup := false
			for _, it := range imageList {
				if it.URL == p.URL {
					dup = true
					break
				}
			}
			if !dup {
				newItem := Item{
					ID:   fmt.Sprintf("atp-%s/%s", did, rkey),
					URL:  p.URL,
					Date: p.Date,
					Memo: p.Memo,
					Atp:  &AtpItem{Author: p.Atp.Author, ID: p.Atp.ID},
				}
				imageList = append(imageList, newItem)
				sort.Slice(imageList, func(i, j int) bool {
					return imageList[i].Date < imageList[j].Date
				})
			}
			mu.Unlock()
			if err := writeImageList(); err != nil {
				return bot.post(schema, did, rkey, "保存に失敗", nil, nil)
			}
			_ = gitPush()
			return bot.post(schema, did, rkey, "追加完了", nil, nil)
		}
	}

	// 2) 添付画像で追加（元の挙動を維持）
	reMonoGazoAdd := regexp.MustCompile("^もの画像追加$")
	if reMonoGazoAdd.MatchString(content) {
		if !bot.isOwner(ev.did) {
			return bot.post(schema, did, rkey, "権限がありません", nil, nil)
		}
		if len(ev.images) == 0 {
			return bot.post(schema, did, rkey, "画像がありません", nil, nil)
		}
		mu.Lock()
		addedCount := 0
		for _, img := range ev.images {
			if img.Image == nil || img.Image.Ref.String() == "" {
				continue
			}
			imageURL := img.Image.Ref.String()
			found := false
			for _, item := range imageList {
				if item.URL == imageURL {
					found = true
					break
				}
			}
			if !found {
				newItem := Item{
					ID:   fmt.Sprintf("atp-%s/%s", ev.did, ev.rkey),
					URL:  imageURL,
					Date: time.Now().Local().Format("2006/1/2"),
					Memo: "",
					Atp:  &AtpItem{Author: ev.did, ID: ev.rkey},
				}
				imageList = append(imageList, newItem)
				addedCount++
			}
		}
		mu.Unlock()
		if addedCount > 0 {
			if err := writeImageList(); err != nil {
				return bot.post(schema, did, rkey, "保存に失敗", nil, nil)
			}
			_ = gitPush()
			return bot.post(schema, did, rkey, fmt.Sprintf("%d枚追加。総数%d", addedCount, len(imageList)), nil, nil)
		}
		return bot.post(schema, did, rkey, "新規なし", nil, nil)
	}

	// 3) 削除
	if reMonoGazoDeleteCmd.MatchString(content) && bot.isOwner(did) {
		matches := reMonoGazoDeleteCmd.FindStringSubmatch(content)
		if len(matches) >= 3 && matches[2] != "" {
			idx, err := strconv.Atoi(matches[2])
			if err != nil {
				return bot.post(schema, did, rkey, "番号不正", nil, nil)
			}
			mu.Lock()
			if idx >= 0 && idx < len(imageList) {
				del := imageList[idx]
				_ = deleteImage(idx)
				mu.Unlock()
				_ = gitPush()
				return bot.post(schema, did, rkey, fmt.Sprintf("削除:\nURL: %s", del.URL), nil, nil)
			}
			mu.Unlock()
			return bot.post(schema, did, rkey, "番号範囲外", nil, nil)
		}
	}

	// 4) 件数
	if reMonoGazoLen.MatchString(content) || regexp.MustCompile("^もの画像.*数.*$").MatchString(content) {
		mu.Lock()
		n := len(imageList)
		mu.Unlock()
		return bot.post(schema, did, rkey, fmt.Sprintf("もの画像は今全部で%d枚ある", n), nil, nil)
	}

	// 5) 番号指定
	if reMonoGazoNumber.MatchString(content) {
		matches := reMonoGazoNumber.FindStringSubmatch(content)
		if len(matches) >= 3 {
			num, _ := strconv.Atoi(matches[2])
			mu.Lock()
			if num >= 0 && num < len(imageList) {
				item := imageList[num]
				mu.Unlock()
				return bot.replyWithImageItem(schema, did, rkey, item, num)
			}
			mu.Unlock()
			return bot.post(schema, did, rkey, "番号範囲外", nil, nil)
		}
	}

	// 6) ランダム
	if reMonoGazoRandom.MatchString(content) {
		mu.Lock()
		if len(imageList) == 0 {
			mu.Unlock()
			return bot.post(schema, did, rkey, "画像なし", nil, nil)
		}
		idx := weightedRandomIndex(len(imageList), 2.0)
		item := imageList[idx]
		mu.Unlock()
		return bot.replyWithImageItem(schema, did, rkey, item, idx)
	}

	// 7) 和暦
	if reWareki.MatchString(content) {
		return bot.post(schema, did, rkey, warekiNow()+" らしい", nil, nil)
	}

	// 8) どこ
	if reMonoGazoDoko.MatchString(content) {
		return bot.post(schema, did, rkey, "₍ ･ᴗ･ ₎ﾖﾝﾀﾞ?", nil, nil)
	}
	if reMonoSiteDoko.MatchString(content) {
		// 単純リンク
		txt := "₍ ･ᴗ･ ₎っ https://tsukemonogit.github.io/nostr-monoGazo-bot/"
		return bot.post(schema, did, rkey, txt, nil, nil)
	}

	// 9) ないんふぉふぉ
	if reNaifofo.MatchString(content) {
		u := "https://cdn.nostr.build/i/84d43ed2d18e72aa9c012226628962c815d39c63374b446f7661850df75a7444.png"
		// `replyWithImageItem`を使用して、URLの画像を投稿に添付
		tempItem := Item{
			URL:  u,
			Date: time.Now().Local().Format("2006/1/2"),
			Memo: "あるんふぉふぉ",
		}
		return bot.replyWithImageItem(schema, did, rkey, tempItem, -1)
	}

	// 11) vs ランダム選択
	if reVs.MatchString(content) {
		m := reVs.FindStringSubmatch(content)
		if len(m) >= 2 {
			parts := strings.Split(m[1], "vs")
			cands := make([]string, 0, len(parts))
			for _, p := range parts {
				t := strings.TrimSpace(p)
				if t != "" {
					cands = append(cands, t)
				}
			}
			if len(cands) > 0 {
				choice := cands[rng.Intn(len(cands))]
				return bot.post(schema, did, rkey, choice, nil, nil)
			}
		}
	}

	// 13) あるんふぉふぉ ください／あげて／どうぞ 等（固定画像を返信）
	if reArufofoKure.MatchString(content) || reArufofoAgete.MatchString(content) /* || reArufofoDouzo.MatchString(content) */ {
		u := "https://cdn.nostr.build/i/84d43ed2d18e72aa9c012226628962c815d39c63374b446f7661850df75a7444.png"
		return bot.post(schema, did, rkey, "あるんふぉふぉどうぞ\n"+u+"\n#もの画像", nil, nil)
	}

	// 旧コマンド互換
	reMonoGazo := regexp.MustCompile("^もの画像$")
	reMonoGazoCount := regexp.MustCompile("^もの画像.*数.*$")
	reMonoGazoDelete := regexp.MustCompile("^もの画像.*削除\\s+(\\d+).*$")
	if reMonoGazo.MatchString(content) {
		mu.Lock()
		if len(imageList) == 0 {
			mu.Unlock()
			return bot.post(schema, did, rkey, "画像なし", nil, nil)
		}
		idx := rng.Intn(len(imageList))
		item := imageList[idx]
		mu.Unlock()
		return bot.replyWithImageItem(schema, did, rkey, item, idx)
	}
	if reMonoGazoCount.MatchString(content) {
		mu.Lock()
		c := len(imageList)
		mu.Unlock()
		return bot.post(schema, did, rkey, fmt.Sprintf("もの画像は今全部で%d枚ある", c), nil, nil)
	}
	if reMonoGazoDelete.MatchString(content) && bot.isOwner(did) {
		m := reMonoGazoDelete.FindStringSubmatch(content)
		if len(m) > 1 {
			index, err := strconv.Atoi(m[1])
			if err != nil {
				return bot.post(schema, did, rkey, "番号不正", nil, nil)
			}
			mu.Lock()
			if index >= 0 && index < len(imageList) {
				itemToDelete := imageList[index]
				err := deleteImage(index)
				mu.Unlock()
				if err != nil {
					return bot.post(schema, did, rkey, "削除失敗", nil, nil)
				}
				_ = gitPush()
				return bot.post(schema, did, rkey, fmt.Sprintf("削除:\nURL: %s", itemToDelete.URL), nil, nil)
			}
			mu.Unlock()
			return bot.post(schema, did, rkey, "番号範囲外", nil, nil)
		}
	}

	return nil
}

func (bot *Bot) replyWithImageItem(schema, did, rkey string, imageItem Item, index int) error {
	// 画像をダウンロードしてBlueskyへBlobアップロード
	xrpcc, err := bot.makeXRPCC()
	if err != nil {
		log.Printf("Failed to create XRPCC: %v", err)
		return bot.post(schema, did, rkey, "画像取得失敗", nil, nil)
	}
	resp, err := http.Get(imageItem.URL)
	if err != nil {
		log.Printf("Failed to download image from %s: %v", imageItem.URL, err)
		return bot.post(schema, did, rkey, "画像取得失敗", nil, nil)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		log.Printf("Failed to download image: status code %d", resp.StatusCode)
		return bot.post(schema, did, rkey, "画像取得失敗", nil, nil)
	}
	imgBytes := new(bytes.Buffer)
	_, err = imgBytes.ReadFrom(resp.Body)
	if err != nil {
		log.Printf("Failed to read image data: %v", err)
		return bot.post(schema, did, rkey, "画像取得失敗", nil, nil)
	}
	uploadResp, err := comatproto.RepoUploadBlob(context.TODO(), xrpcc, imgBytes)
	if err != nil {
		log.Printf("Failed to upload blob: %v", err)
		return bot.post(schema, did, rkey, "アップロード失敗", nil, nil)
	}
	images := []*bsky.EmbedImages_Image{
		{
			Image: &lexutil.LexBlob{
				Ref:      uploadResp.Blob.Ref,
				MimeType: getMimeType(imageItem.URL),
				Size:     uploadResp.Blob.Size,
			},
			Alt: "",
		},
	}
	// テキストとリンク
	postText := "#もの画像"
	var linkURL string
	var linkText string
	if imageItem.Atp != nil {
		linkURL = fmt.Sprintf("https://bsky.app/profile/%s/post/%s", imageItem.Atp.Author, imageItem.Atp.ID)
		linkText = fmt.Sprintf("at://%s/app.bsky.feed.post/%s", imageItem.Atp.Author, imageItem.Atp.ID)
		postText = fmt.Sprintf("%s\n%s", postText, linkText)
	} else if imageItem.Nostr != nil {
		linkURL = fmt.Sprintf("https://lumilumi.app/%s", imageItem.Nostr.PostID)
		linkText = linkURL
		postText = fmt.Sprintf("%s\n%s", postText, linkText)
	} else {
		// リンクなし
	}

	// 追記: 作成者/日付/メモ/インデックス
	extra := ""
	if imageItem.Atp != nil {
		extra = fmt.Sprintf("(%s)%s \n(index:%d)", imageItem.Date, func() string {
			if strings.TrimSpace(imageItem.Memo) != "" {
				return " (" + imageItem.Memo + ")"
			}
			return ""
		}(), index)
	} else if imageItem.Nostr != nil {
		extra = fmt.Sprintf("(%s)%s \n(index:%d)", imageItem.Date, func() string {
			if strings.TrimSpace(imageItem.Memo) != "" {
				return " (" + imageItem.Memo + ")"
			}
			return ""
		}(), index)
	}
	postText = postText + extra

	// facets
	var facets []*bsky.RichtextFacet
	if linkURL != "" {
		tagFacet := facetTagMonoGazo()
		linkStart := len("#もの画像\n")
		linkFacet := facetLink(linkText, linkStart, linkURL)
		facets = []*bsky.RichtextFacet{tagFacet, linkFacet}
	} else {
		facets = []*bsky.RichtextFacet{facetTagMonoGazo()}
	}

	return bot.post(schema, did, rkey, postText, images, facets)
}

// ----------------------------------------------
func run() error {
	var bot Bot
	bot.Bgs = os.Getenv("HAIKUBOT_BGS")
	bot.Host = os.Getenv("HAIKUBOT_HOST")
	bot.Handle = os.Getenv("HAIKUBOT_HANDLE")
	bot.Password = os.Getenv("HAIKUBOT_PASSWORD")
	log.Printf("Bot config: BGS=%s, Host=%s, Handle=%s, Password set=%t", bot.Bgs, bot.Host, bot.Handle, bot.Password != "")
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
					var images []*bsky.EmbedImages_Image
					if post.Embed != nil && post.Embed.EmbedImages != nil {
						images = post.Embed.EmbedImages.Images
					}
					q <- Event{
						schema: parts[0],
						did:    evt.Repo,
						rkey:   parts[1],
						text:   post.Text,
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

	err2 := events.HandleRepoStream(ctx, con, sequential.NewScheduler("stream", rsc.EventHandler), slog.Default())
	if err2 != nil {
		log.Println(err2)
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
