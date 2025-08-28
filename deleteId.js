const fs = require("fs");
const path = require("path");

const inputFile = "imageList.json";
const outputFile = "imageList_no_id.json";

// スクリプトの実行ディレクトリ
const currentDir = process.cwd();

// 入力と出力ファイルの絶対パス
const inputPath = path.join(currentDir, inputFile);
const outputPath = path.join(currentDir, outputFile);

// JSONファイルの読み込み
fs.readFile(inputPath, "utf8", (err, data) => {
  if (err) {
    console.error("ファイルの読み込み中にエラーが発生しました:", err);
    return;
  }

  try {
    // JSON文字列をJavaScriptのオブジェクトにパース
    const imageList = JSON.parse(data);

    // 各オブジェクトから 'id' プロパティを削除
    const updatedList = imageList.map((item) => {
      const newItem = { ...item }; // オリジナルのオブジェクトを変更しないようにコピー
      delete newItem.id;
      return newItem;
    });

    // 更新されたオブジェクトをJSON文字列に変換
    const jsonString = JSON.stringify(updatedList, null, 2);

    // 新しいファイルとして保存
    fs.writeFile(outputPath, jsonString, "utf8", (err) => {
      if (err) {
        console.error("ファイルの書き込み中にエラーが発生しました:", err);
        return;
      }
      console.log(
        `idプロパティが削除されました。結果は ${outputFile} に保存されました。`
      );
    });
  } catch (parseErr) {
    console.error("JSONのパース中にエラーが発生しました:", parseErr);
  }
});
