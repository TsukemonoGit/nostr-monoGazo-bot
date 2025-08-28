import { readFile, writeFile } from "fs/promises";
import path from "path";

// 旧形式から新形式への変換クラス
class DataMigrator {
  constructor(scriptPath) {
    this.scriptPath = scriptPath;
    this.oldFilePath = path.join(scriptPath, "imageList.json");
    this.newFilePath = path.join(scriptPath, "imageList_new.json");
    this.backupFilePath = path.join(scriptPath, "imageList_backup.json");
  }

  // 旧形式データを新形式に変換
  convertToNewFormat(oldData) {
    return oldData.map((item, index) => {
      // ユニークIDを生成
      const timestamp = new Date(item.date).getTime() || Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const id = `img_${timestamp}_${randomId}`;

      // 新形式のデータ構造
      const newItem = {
        id: id,
        url: item.url,
        date: item.date,
        memo: item.memo || "",
      };

      // Nostrデータが存在する場合
      if (item.author || item.note) {
        newItem.nostr = {
          author: item.author || "",
          post_id: item.note || "",
        };
      }

      // 将来のATP/Blueskyデータ用のプレースホルダー
      // 必要に応じてここにatpセクションを追加

      return newItem;
    });
  }

  // 新形式データを旧形式に変換（互換性維持用）
  convertToOldFormat(newData) {
    return newData.map((item) => ({
      url: item.url,
      author: item.nostr?.author || item.atp?.author || "",
      date: item.date,
      note: item.nostr?.post_id || "",
      memo: item.memo || "",
    }));
  }

  // データ検証
  validateData(data) {
    const errors = [];

    data.forEach((item, index) => {
      if (!item.url) {
        errors.push(`Index ${index}: URLが空です`);
      }

      if (!item.date) {
        errors.push(`Index ${index}: 日付が空です`);
      }

      if (!item.id) {
        errors.push(`Index ${index}: IDが空です`);
      }

      // URL形式の簡単な検証
      if (
        item.url &&
        !item.url.match(/^https?:\/\/.+\.(webp|png|jpe?g|gif|svg)$/i)
      ) {
        console.warn(
          `Index ${index}: 警告 - 画像URL形式が疑わしいです: ${item.url}`
        );
      }
    });

    return errors;
  }

  // 重複チェック
  checkDuplicates(data) {
    const urlMap = new Map();
    const duplicates = [];

    data.forEach((item, index) => {
      if (urlMap.has(item.url)) {
        duplicates.push({
          index: index,
          originalIndex: urlMap.get(item.url),
          url: item.url,
        });
      } else {
        urlMap.set(item.url, index);
      }
    });

    return duplicates;
  }

  // メイン変換処理
  async migrateData() {
    try {
      console.log("📁 既存データを読み込み中...");

      // 既存データの読み込み
      const oldDataText = await readFile(this.oldFilePath, "utf8");
      const oldData = JSON.parse(oldDataText);

      console.log(`✅ ${oldData.length}件のデータを読み込みました`);

      // バックアップ作成
      console.log("💾 バックアップを作成中...");
      await writeFile(this.backupFilePath, oldDataText);
      console.log(`✅ バックアップ作成完了: ${this.backupFilePath}`);

      // 新形式に変換
      console.log("🔄 新形式に変換中...");
      const newData = this.convertToNewFormat(oldData);

      // データ検証
      console.log("🔍 データを検証中...");
      const errors = this.validateData(newData);
      if (errors.length > 0) {
        console.error("❌ データ検証エラー:");
        errors.forEach((error) => console.error(`  - ${error}`));
        throw new Error("データ検証に失敗しました");
      }

      // 重複チェック
      const duplicates = this.checkDuplicates(newData);
      if (duplicates.length > 0) {
        console.warn("⚠️  重複データが見つかりました:");
        duplicates.forEach((dup) => {
          console.warn(
            `  - Index ${dup.index} と ${dup.originalIndex}: ${dup.url}`
          );
        });
      }

      // 新形式ファイルを保存
      console.log("💾 新形式データを保存中...");
      await writeFile(this.newFilePath, JSON.stringify(newData, null, 2));
      console.log(`✅ 新形式データ保存完了: ${this.newFilePath}`);

      // 互換性維持のため、旧形式も更新（ソート済み）
      console.log("🔄 互換性のため旧形式も更新中...");
      const sortedOldFormat = this.convertToOldFormat(newData);
      sortedOldFormat.sort((a, b) => new Date(a.date) - new Date(b.date));

      await writeFile(
        this.oldFilePath,
        JSON.stringify(sortedOldFormat, null, 2)
      );
      console.log("✅ 旧形式ファイル更新完了");

      // 変換結果の統計表示
      this.displayStats(oldData, newData, duplicates);

      return {
        success: true,
        oldCount: oldData.length,
        newCount: newData.length,
        duplicates: duplicates.length,
        newFilePath: this.newFilePath,
        backupFilePath: this.backupFilePath,
      };
    } catch (error) {
      console.error("❌ 変換処理でエラーが発生しました:", error);
      throw error;
    }
  }

  // 統計情報表示
  displayStats(oldData, newData, duplicates) {
    console.log("\n📊 変換結果統計:");
    console.log(`  - 元データ件数: ${oldData.length}`);
    console.log(`  - 変換後件数: ${newData.length}`);
    console.log(`  - 重複件数: ${duplicates.length}`);

    // プラットフォーム別統計
    const nostrCount = newData.filter((item) => item.nostr).length;
    const atpCount = newData.filter((item) => item.atp).length;

    console.log(`  - Nostrデータ: ${nostrCount}`);
    console.log(`  - ATPデータ: ${atpCount}`);

    // 日付範囲
    const dates = newData
      .map((item) => new Date(item.date))
      .filter((date) => !isNaN(date));
    if (dates.length > 0) {
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));
      console.log(
        `  - 日付範囲: ${minDate.toISOString().split("T")[0]} ～ ${
          maxDate.toISOString().split("T")[0]
        }`
      );
    }

    console.log("\n✅ データ変換が完了しました！");
  }

  // ロールバック処理
  async rollback() {
    try {
      console.log("🔄 ロールバック実行中...");

      const backupData = await readFile(this.backupFilePath, "utf8");
      await writeFile(this.oldFilePath, backupData);

      console.log("✅ ロールバック完了");
      return true;
    } catch (error) {
      console.error("❌ ロールバックに失敗しました:", error);
      throw error;
    }
  }
}

// 使用例とコマンドライン実行
async function main() {
  const scriptPath = process.env.SCRIPTPATH || "./";
  const migrator = new DataMigrator(scriptPath);

  // コマンドライン引数の処理
  const args = process.argv.slice(2);

  try {
    if (args.includes("--rollback")) {
      await migrator.rollback();
    } else {
      const result = await migrator.migrateData();

      console.log("\n🎉 変換が正常に完了しました!");
      console.log("📁 生成されたファイル:");
      console.log(`  - 新形式: ${result.newFilePath}`);
      console.log(`  - バックアップ: ${result.backupFilePath}`);
      console.log("\n💡 ロールバックが必要な場合: node migrate.js --rollback");
    }
  } catch (error) {
    console.error("💥 処理に失敗しました:", error.message);
    process.exit(1);
  }
}

// 個別関数のエクスポート（他のファイルから使用する場合）
export { DataMigrator };

// 直接実行された場合のみメイン関数を実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// サンプルデータでのテスト用関数
export function testConversion() {
  const sampleOldData = [
    {
      url: "https://cdn.zitrus.haus/u/zitrus.haus/monovector.svg",
      author: "npub15ttxzgfcf2yr0xc0zcggdty5v58n388jgnryl5xjpykzex9mwcfsfpuj93",
      date: "2025/07/10",
      note: "note1fuqjzqj8zqra9m0e3t6j3lrsnvalrue0az3ttdpzxqvgkksqcp3qz5xk7s",
    },
    {
      url: "https://image.nostr.build/7369c2ada06af08c6da4b0bb9bf65b478bddf4427f7f1fc16433242da8409fc9.jpg",
      author: "npub19v8pkkjpv2jyst5deyfvaahd7nz94xhua2cfyyahhzncg8gf4rjq5eu8pu",
      date: "2025/07/13",
      note: "note1szq2z5wpkzvn7watx42vwkmnndrp98a323hvl0g7q4y3mg76qfjs0w8r7r",
    },
  ];

  const migrator = new DataMigrator("./");
  const newData = migrator.convertToNewFormat(sampleOldData);

  console.log("🧪 テスト変換結果:");
  console.log(JSON.stringify(newData, null, 2));

  return newData;
}
