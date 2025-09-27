/**
 * ゴミ分別ゲームのメインクラス
 * ドラッグ&ドロップまたは自動落下でゴミを分別するゲーム
 */
class GarbageSortingGame {
    constructor() {
        // ゲーム状態管理
        this.gameState = 'stopped'; // 'stopped' | 'playing' | 'paused' | 'ended'
        this.score = 0; // 現在のスコア
        this.timeLeft = 30; // 残り時間（秒）

        // タイマー管理
        this.gameTimer = null; // ゲーム時間のタイマー
        this.spawnTimer = null; // ゴミ生成のタイマー

        // ゲームオブジェクト管理
        this.fallingItems = []; // 落下中のゴミアイテムリスト
        this.draggedItem = null; // 現在ドラッグ中のアイテム
        this.draggedItemData = null; // ドラッグ中アイテムの元データ
        this.dragOffset = { x: 0, y: 0 }; // ドラッグ時のオフセット

        // ゴミの種類定義（渋谷区の分別ルールに基づく）
        this.garbageTypes = [
            { name: 'paper', emoji: '📄', type: 'combustible', points: 10, label: '紙くず' },
            { name: 'food', emoji: '🍎', type: 'combustible', points: 10, label: '生ごみ' },
            { name: 'pet-bottle', emoji: '🍼', type: 'resource', points: 15, label: 'ペットボトル' },
            { name: 'aluminum-can', emoji: '🥫', type: 'resource', points: 15, label: 'アルミ缶' },
            { name: 'plastic-bag', emoji: '🛍️', type: 'resource', points: 12, label: 'プラ袋' },
            { name: 'battery', emoji: '🔋', type: 'non-combustible', points: 20, label: '電池' },
            { name: 'glass', emoji: '🔍', type: 'non-combustible', points: 18, label: 'ガラス' },
            { name: 'furniture', emoji: '🪑', type: 'bulky', points: 25, label: '家具' }
        ];

        this.init();
    }

    /**
     * ゲームの初期化
     */
    init() {
        this.bindEvents();
        this.updateDisplay();
    }

    /**
     * イベントリスナーの設定
     * ボタンクリック、マウス操作、タッチ操作を登録
     */
    bindEvents() {
        // ゲーム制御ボタン
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('play-again-btn').addEventListener('click', () => this.restartGame());

        // マウス操作（PC用）
        document.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));

        // タッチ操作（モバイル用）
        document.addEventListener('touchstart', this.handleTouchStart.bind(this));
        document.addEventListener('touchmove', this.handleTouchMove.bind(this));
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    /**
     * ゲーム開始処理
     * 初期値をリセットし、タイマーを開始
     */
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.timeLeft = 30;
        this.fallingItems = [];

        // UI表示の切り替え
        document.getElementById('start-btn').style.display = 'none';
        document.getElementById('game-over').style.display = 'none';

        this.clearFallingZone();
        this.updateDisplay();
        this.startTimers();

        // ゲーム開始と同時に最初のゴミを生成
        this.spawnGarbage();
    }

    restartGame() {
        this.stopTimers();
        this.clearFallingZone();
        document.getElementById('start-btn').style.display = 'inline-block';
        document.getElementById('game-over').style.display = 'none';
        this.gameState = 'stopped';
        this.score = 0;
        this.timeLeft = 30;
        this.updateDisplay();
    }

    endGame() {
        this.gameState = 'ended';
        this.stopTimers();
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over').style.display = 'block';
        document.getElementById('start-btn').style.display = 'inline-block';
    }

    /**
     * タイマー開始
     * ゲーム時間のカウントダウンとゴミの生成を開始
     */
    startTimers() {
        // 1秒ごとに時間を減らし、0になったらゲーム終了
        this.gameTimer = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);

        // 4秒ごとに新しいゴミを生成（量を半分に）
        this.spawnTimer = setInterval(() => {
            this.spawnGarbage();
        }, 4000);
    }

    stopTimers() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
        if (this.spawnTimer) {
            clearInterval(this.spawnTimer);
            this.spawnTimer = null;
        }
    }

    updateDisplay() {
        document.getElementById('score-value').textContent = this.score;
        document.getElementById('timer-value').textContent = this.timeLeft;
    }

    /**
     * ゴミアイテムの生成
     * ランダムな種類のゴミを画面上部の中央から落下開始
     */
    spawnGarbage() {
        if (this.gameState !== 'playing') return;

        // ランダムにゴミの種類を選択
        const garbageType = this.garbageTypes[Math.floor(Math.random() * this.garbageTypes.length)];
        const garbageElement = document.createElement('div');

        // DOM要素の設定
        garbageElement.className = `absolute w-24 h-24 rounded-lg cursor-grab transition-transform duration-100 z-10 flex flex-col items-center justify-center text-xl border-2 border-gray-800 font-bold text-center p-1 select-none garbage-item ${garbageType.name}`;
        garbageElement.innerHTML = `<div class="text-4xl mb-0.5">${garbageType.emoji}</div><div class="text-sm font-bold leading-none">${garbageType.label}</div>`;
        garbageElement.dataset.type = garbageType.type;
        garbageElement.dataset.points = garbageType.points;

        // 画面中央に配置（アイテム幅90pxを考慮）
        const fallingZone = document.getElementById('falling-zone');
        const centerX = (fallingZone.offsetWidth - 90) / 2;

        garbageElement.style.left = centerX + 'px';
        garbageElement.style.top = '0px';

        // 落下アイテムリストに追加
        fallingZone.appendChild(garbageElement);
        this.fallingItems.push({
            element: garbageElement,
            x: centerX,
            y: 0,
            speed: 0.3 + Math.random() * 0.3  // ランダムな落下速度（さらに2倍高速化）
        });

        this.animateFalling();
    }

    /**
     * ゴミの落下アニメーション
     * 60FPSで落下を更新し、下に到達したら自動分別判定
     */
    animateFalling() {
        const animate = () => {
            if (this.gameState !== 'playing') return;

            this.fallingItems.forEach((item, index) => {
                // 落下位置を更新
                item.y += item.speed;
                item.element.style.top = item.y + 'px';

                // 落下エリアの下端に到達したかチェック
                const fallingZone = document.getElementById('falling-zone');
                if (item.y > fallingZone.offsetHeight) {
                    // 落下時にゴミ箱判定を行う（アイテム中央のX座標で判定）
                    const targetBin = this.getBinAtPosition(item.x + 45);

                    if (targetBin) {
                        // ゴミ箱に落ちた場合の自動分別判定
                        this.handleAutoDrop(item.element, targetBin);
                    } else {
                        // ゴミ箱外に落ちた場合は減点
                        this.score = Math.max(0, this.score - 5);
                        this.updateDisplay();
                        this.showScorePopup(item.element, -5, true);
                    }

                    // アイテムを削除
                    item.element.remove();
                    this.fallingItems.splice(index, 1);
                }
            });

            // 落下中のアイテムがある間は継続
            if (this.fallingItems.length > 0) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    clearFallingZone() {
        const fallingZone = document.getElementById('falling-zone');
        fallingZone.innerHTML = '';
        this.fallingItems = [];
    }

    handleMouseDown(e) {
        const garbageItem = e.target.closest('.garbage-item');
        if (garbageItem) {
            this.startDrag(garbageItem, e.clientX, e.clientY);
            e.preventDefault();
        }
    }

    handleMouseMove(e) {
        if (this.draggedItem) {
            this.updateDragPosition(e.clientX, e.clientY);
            e.preventDefault();
        }
    }

    handleMouseUp(e) {
        if (this.draggedItem) {
            this.endDrag(e.clientX, e.clientY);
            e.preventDefault();
        }
    }

    handleTouchStart(e) {
        const garbageItem = e.target.closest('.garbage-item');
        if (garbageItem) {
            const touch = e.touches[0];
            this.startDrag(garbageItem, touch.clientX, touch.clientY);
            e.preventDefault();
        }
    }

    handleTouchMove(e) {
        if (this.draggedItem) {
            const touch = e.touches[0];
            this.updateDragPosition(touch.clientX, touch.clientY);
            e.preventDefault();
        }
    }

    handleTouchEnd(e) {
        if (this.draggedItem) {
            const touch = e.changedTouches[0];
            this.endDrag(touch.clientX, touch.clientY);
            e.preventDefault();
        }
    }

    /**
     * ドラッグ開始処理
     * @param {Element} element - ドラッグするゴミアイテム
     * @param {number} clientX - マウス/タッチのX座標
     * @param {number} clientY - マウス/タッチのY座標
     */
    startDrag(element, clientX, clientY) {
        this.draggedItem = element;
        element.classList.add('dragging');

        // マウス位置とアイテム位置のオフセットを計算
        const rect = element.getBoundingClientRect();
        this.dragOffset = {
            x: clientX - rect.left,
            y: clientY - rect.top
        };

        // ドラッグ時のスタイル設定
        element.style.position = 'fixed';
        element.style.zIndex = '1000';

        // ドラッグ中は落下アニメーションから除外
        const itemIndex = this.fallingItems.findIndex(item => item.element === element);
        if (itemIndex !== -1) {
            this.draggedItemData = this.fallingItems[itemIndex];
            this.fallingItems.splice(itemIndex, 1);
        }
    }

    updateDragPosition(clientX, clientY) {
        if (!this.draggedItem) return;

        this.draggedItem.style.left = (clientX - this.dragOffset.x) + 'px';
        this.draggedItem.style.top = (clientY - this.dragOffset.y) + 'px';

        this.highlightTargetBin(clientX, clientY);
    }

    endDrag(clientX, clientY) {
        if (!this.draggedItem) return;

        const targetBin = this.getTargetBin(clientX, clientY);

        if (targetBin) {
            this.handleDrop(this.draggedItem, targetBin);
        } else {
            // ドラッグが失敗した場合、現在位置から落下を再開
            this.returnToFalling(clientX, clientY);
        }

        this.clearHighlights();
        if (this.draggedItem) {
            this.draggedItem.classList.remove('dragging');
        }
        this.draggedItem = null;
        this.draggedItemData = null;
    }

    highlightTargetBin(clientX, clientY) {
        this.clearHighlights();
        const targetBin = this.getTargetBin(clientX, clientY);
        if (targetBin) {
            targetBin.classList.add('highlight');
        }
    }

    clearHighlights() {
        document.querySelectorAll('.bin').forEach(bin => {
            bin.classList.remove('highlight');
        });
    }

    /**
     * 指定座標にあるゴミ箱を取得（ドラッグ&ドロップ用）
     * @param {number} clientX - クライアントX座標
     * @param {number} clientY - クライアントY座標
     * @returns {Element|null} 該当するゴミ箱要素、なければnull
     */
    getTargetBin(clientX, clientY) {
        const bins = document.querySelectorAll('.bin');
        for (const bin of bins) {
            const rect = bin.getBoundingClientRect();
            // マウス/タッチ位置がゴミ箱の範囲内かチェック
            if (clientX >= rect.left && clientX <= rect.right &&
                clientY >= rect.top && clientY <= rect.bottom) {
                return bin;
            }
        }
        return null;
    }

    /**
     * ドラッグ&ドロップによる分別判定
     * @param {Element} garbageElement - 分別するゴミアイテム
     * @param {Element} targetBin - 投入先のゴミ箱
     */
    handleDrop(garbageElement, targetBin) {
        const garbageType = garbageElement.dataset.type;
        const binType = targetBin.dataset.type;
        const points = parseInt(garbageElement.dataset.points);

        // 正しい分別かどうかを判定
        if (garbageType === binType) {
            // 正解：設定されたポイントを加算
            this.score += points;
            this.showScorePopup(garbageElement, points, false);
        } else {
            // 不正解：5点減点
            this.score = Math.max(0, this.score - 5);
            this.showScorePopup(garbageElement, -5, true);
        }

        this.updateDisplay();
        this.removeGarbageItem(garbageElement);
    }

    /**
     * スコアポップアップの表示
     * @param {Element} element - 基準となるアイテム要素
     * @param {number} points - 表示するポイント
     * @param {boolean} isWrong - 減点かどうか
     */
    showScorePopup(element, points, isWrong) {
        const popup = document.createElement('div');
        popup.className = `absolute font-bold text-2xl z-50 pointer-events-none score-popup ${isWrong ? 'wrong-score text-red-400' : 'text-green-500'}`;
        popup.textContent = points > 0 ? `+${points}` : `${points}`;

        // アイテムの位置にポップアップを表示
        const rect = element.getBoundingClientRect();
        popup.style.left = rect.left + 'px';
        popup.style.top = rect.top + 'px';
        popup.style.position = 'fixed';

        document.body.appendChild(popup);

        // 1秒後に自動削除
        setTimeout(() => {
            popup.remove();
        }, 1000);
    }

    returnToOriginalPosition() {
        if (!this.draggedItem) return;

        const item = this.fallingItems.find(item => item.element === this.draggedItem);
        if (item) {
            this.draggedItem.style.position = 'absolute';
            this.draggedItem.style.left = item.x + 'px';
            this.draggedItem.style.top = item.y + 'px';
            this.draggedItem.style.zIndex = '10';
        }
    }

    /**
     * ドラッグ失敗時に現在位置から落下を再開
     * @param {number} clientX - ドラッグ終了時のX座標
     * @param {number} clientY - ドラッグ終了時のY座標
     */
    returnToFalling(clientX, clientY) {
        if (!this.draggedItem || !this.draggedItemData) return;

        // 現在のドラッグ位置を落下エリア内の相対座標に変換
        const fallingZone = document.getElementById('falling-zone');
        const fallingZoneRect = fallingZone.getBoundingClientRect();
        const relativeX = clientX - fallingZoneRect.left - this.dragOffset.x;
        const relativeY = clientY - fallingZoneRect.top - this.dragOffset.y;

        // 落下データを復元し、エリア内に制限
        const newItem = {
            element: this.draggedItem,
            x: Math.max(0, Math.min(relativeX, fallingZone.offsetWidth - 90)),
            y: Math.max(0, relativeY),
            speed: this.draggedItemData.speed
        };

        // ドラッグスタイルを落下スタイルに戻す
        this.draggedItem.style.position = 'absolute';
        this.draggedItem.style.left = newItem.x + 'px';
        this.draggedItem.style.top = newItem.y + 'px';
        this.draggedItem.style.zIndex = '10';

        // 落下アイテムリストに再登録して落下を継続
        this.fallingItems.push(newItem);
        this.animateFalling();
    }

    /**
     * 指定X座標にあるゴミ箱を取得
     * @param {number} x - 判定するX座標
     * @returns {Element|null} 該当するゴミ箱要素、なければnull
     */
    getBinAtPosition(x) {
        const bins = document.querySelectorAll('.bin');
        const gameArea = document.getElementById('game-area');
        const gameAreaRect = gameArea.getBoundingClientRect();

        for (const bin of bins) {
            const binRect = bin.getBoundingClientRect();
            // ゲームエリア内での相対位置に変換
            const relativeLeft = binRect.left - gameAreaRect.left;
            const relativeRight = binRect.right - gameAreaRect.left;

            if (x >= relativeLeft && x <= relativeRight) {
                return bin;
            }
        }
        return null;
    }

    /**
     * 自動落下による分別判定
     * @param {Element} garbageElement - 落下したゴミアイテム
     * @param {Element} targetBin - 落下先のゴミ箱
     */
    handleAutoDrop(garbageElement, targetBin) {
        const garbageType = garbageElement.dataset.type;
        const binType = targetBin.dataset.type;
        const points = parseInt(garbageElement.dataset.points);

        // ドラッグ&ドロップと同じ分別判定ロジック
        if (garbageType === binType) {
            this.score += points;
            this.showScorePopup(garbageElement, points, false);
        } else {
            this.score = Math.max(0, this.score - 5);
            this.showScorePopup(garbageElement, -5, true);
        }

        this.updateDisplay();
    }

    removeGarbageItem(element) {
        const index = this.fallingItems.findIndex(item => item.element === element);
        if (index !== -1) {
            this.fallingItems.splice(index, 1);
        }
        element.remove();
    }
}

// DOM読み込み完了後にゲームを初期化
document.addEventListener('DOMContentLoaded', () => {
    new GarbageSortingGame();
});