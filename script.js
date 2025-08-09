// ▼▼▼ Firebase設定（ここは変更なし）▼▼▼
const firebaseConfig = {
  apiKey: "AIzaSyBAQWT0sxWX7eS81ES1R7xtMGTO50Lrs-k",
  authDomain: "pref-darts-app.firebaseapp.com",
  projectId: "pref-darts-app",
  storageBucket: "pref-darts-app.firebasestorage.app",
  messagingSenderId: "574402887977",
  appId: "1:574402887977:web:4786621301ee2c57cab738"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
// ▲▲▲▲▲▲

// 1. 都道府県のデータ配列（変更なし）
const prefectures = [
    { name: "北海道", code: "1" }, { name: "青森県", code: "2" },
    { name: "岩手県", code: "3" }, { name: "宮城県", code: "4" },
    { name: "秋田県", code: "5" }, { name: "山形県", code: "6" },
    { name: "福島県", code: "7" }, { name: "茨城県", code: "8" },
    { name: "栃木県", code: "9" }, { name: "群馬県", code: "10" },
    { name: "埼玉県", code: "11" }, { name: "千葉県", code: "12" },
    { name: "東京都", code: "13" }, { name: "神奈川県", code: "14" },
    { name: "新潟県", code: "15" }, { name: "富山県", code: "16" },
    { name: "石川県", code: "17" }, { name: "福井県", code: "18" },
    { name: "山梨県", code: "19" }, { name: "長野県", code: "20" },
    { name: "岐阜県", code: "21" }, { name: "静岡県", code: "22" },
    { name: "愛知県", code: "23" }, { name: "三重県", code: "24" },
    { name: "滋賀県", code: "25" }, { name: "京都府", code: "26" },
    { name: "大阪府", code: "27" }, { name: "兵庫県", code: "28" },
    { name: "奈良県", code: "29" }, { name: "和歌山県", code: "30" },
    { name: "鳥取県", code: "31" }, { name: "島根県", code: "32" },
    { name: "岡山県", code: "33" }, { name: "広島県", code: "34" },
    { name: "山口県", code: "35" }, { name: "徳島県", code: "36" },
    { name: "香川県", code: "37" }, { name: "愛媛県", code: "38" },
    { name: "高知県", code: "39" }, { name: "福岡県", code: "40" },
    { name: "佐賀県", code: "41" }, { name: "長崎県", code: "42" },
    { name: "熊本県", code: "43" }, { name: "大分県", code: "44" },
    { name: "宮崎県", code: "45" }, { name: "鹿児島県", code: "46" },
    { name: "沖縄県", code: "47" }
];

// 2. HTML要素の取得（変更なし）
const resultText = document.getElementById('result-text');
const throwButton = document.getElementById('throw-button');
const completeMessage = document.getElementById('complete-message'); // ← この行を追加
const resetButton = document.getElementById('reset-button'); 
const progressCounter = document.getElementById('progress-counter');

// 3. 現在までに選ばれた県のリストを保持する変数（変更なし）
let selectedPrefNames = [];

// ★ 4. ダーツを投げる処理を、新しい「だんだん遅くなる」アニメーションロジックに修正
throwButton.addEventListener('click', () => {
    // 候補リストを作成
    const candidates = prefectures.filter(p => !selectedPrefNames.includes(p.name));
    if (candidates.length === 0) {
        alert('全都道府県を制覇しました！🎉');
        return;
    }

    // アニメーション中はボタンを押せないようにする
    throwButton.disabled = true;

    // ★ 4-1. アニメーションのパラメータ（ここの数値を調整すると動きが変わります）
    let currentSpeed = 80;    // 初期の速度 (ミリ秒)。小さいほど速い。
    const speedIncrement = 25;  // 一回ごとに遅くなる量 (ミリ秒)。大きいほど早く遅くなる。
    const maxSpeed = 600;       // この速度になったら停止する。

    // ★ 4-2. アニメーションの1フレームを描画する関数
    function runRouletteFrame() {
        // 候補からランダムに一つ選んで、一時的にハイライト
        const tempPref = candidates[Math.floor(Math.random() * candidates.length)];
        updateMapColors(selectedPrefNames, tempPref.code);

        // ★ 4-3. 速度が上限に達していなければ、速度を遅くして次のフレームを予約
        if (currentSpeed < maxSpeed) {
            currentSpeed += speedIncrement;
            setTimeout(runRouletteFrame, currentSpeed);
        } else {
            // ★ 4-4. アニメーション終了。最終結果を確定する
            const finalPref = candidates[Math.floor(Math.random() * candidates.length)];
            db.collection('rooms').doc('sharedRoom').set({
                selected: firebase.firestore.FieldValue.arrayUnion(finalPref.name),
                lastUpdate: new Date()
            }, { merge: true });
        }
    }

    // ★ 4-5. 最初の一回を呼び出してアニメーションを開始
    runRouletteFrame();
});

// ★ リセットボタンがクリックされた時の処理を新しく追加
resetButton.addEventListener('click', () => {
    if (confirm('本当に最初から始めますか？全てのデータがリセットされます。')) {
        // Firestoreのデータを削除することで、ゲームをリセットする
        db.collection('rooms').doc('sharedRoom').delete();
    }
});

// 5. 地図の色を更新する関数（変更なし）
function updateMapColors(namesToHighlight, animatingCode = null) {
    prefectures.forEach(pref => {
        const prefGroup = document.querySelector(`[data-code="${pref.code}"]`);
        if (prefGroup) {
            const shapes = prefGroup.querySelectorAll('path, polygon');
            let color = '#ccc'; // デフォルトの色

            if (pref.code === animatingCode) {
                color = '#fbbc05'; // アニメーション用の色（黄色）
            }
            else if (namesToHighlight.includes(pref.name)) {
                color = '#d93025'; // 選択済みの色
            }

            shapes.forEach(shape => {
                shape.style.fill = color;
            });
        }
    });
}

// 6. Firestoreの変更をリアルタイムで受け取る処理を修正
db.collection('rooms').doc('sharedRoom').onSnapshot((doc) => {
    // ボタンの有効化
    throwButton.disabled = false;

    if (doc.exists && doc.data().selected) {
        selectedPrefNames = doc.data().selected;
        updateMapColors(selectedPrefNames);
        
        // ★ カウンターの数字を更新
        progressCounter.textContent = `${selectedPrefNames.length} / 47`;
        
        const latestResult = selectedPrefNames[selectedPrefNames.length - 1];
        resultText.textContent = `${latestResult}`;

        if (selectedPrefNames.length >= 47) {
            // メッセージとリセットボタンを表示
            completeMessage.textContent = "コンプリート！おめでとう！";
            completeMessage.classList.remove('hidden');
            resetButton.classList.remove('hidden');
            
            // 投げるボタンを無効化
            throwButton.disabled = true;
            throwButton.textContent = '🎉制覇🎉';
        }
    } else {
        // ★ データが存在しない（リセットされた）場合の処理
        selectedPrefNames = [];
        updateMapColors([]);
        resultText.textContent = "最初の県は？";
        progressCounter.textContent = '0 / 47'; // ★ カウンターをリセット

        // メッセージとリセットボタンを非表示に戻す
        completeMessage.classList.add('hidden');
        resetButton.classList.add('hidden');

        // 投げるボタンを元の状態に戻す
        throwButton.disabled = false;
        throwButton.textContent = 'ルーレットスタート！';
    }
});
