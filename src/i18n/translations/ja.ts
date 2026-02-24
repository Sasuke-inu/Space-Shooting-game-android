import { Translations } from '../types';

export const ja: Translations = {
  menu: {
    play: 'プレイ',
    settings: '設定',
    highScores: 'ハイスコア',
    ships: '機体',
    quit: '終了',
  },
  game: {
    score: 'スコア',
    wave: 'ウェーブ',
    lives: 'ライフ',
    hull: 'シールド',
    combo: 'コンボ',
    paused: '一時停止',
    gameOver: 'ゲームオーバー',
    restart: 'リスタート',
    mainMenu: 'メインメニュー',
  },
  settings: {
    title: '設定',
    language: '言語',
    theme: 'テーマ',
    sound: '効果音',
    music: '音楽',
    vibration: '振動',
    controls: '操作',
    sensitivity: 'ジョイスティック感度',
    joystickSize: 'ジョイスティックサイズ',
    autoFire: 'オートファイア',
    invertY: 'Y軸反転',
    general: '一般',
    account: 'アカウント',
    resetProgress: '進行状況をリセット',
    resetSettings: '設定をリセット',
    resetProgressConfirm: 'すべての進行状況をリセットしますか？この操作は元に戻せません。',
    resetSettingsConfirm: 'すべての設定をデフォルトにリセットしますか？',
    small: '小',
    medium: '中',
    large: '大',
  },
  ships: {
    selectShip: '機体を選択',
    compareShips: '機体を比較',
    locked: 'ロック中',
    selected: '選択中',
    insufficientCredits: 'クレジット不足',
    specialAbility: '特殊能力',
    cooldown: 'クールダウン',
    fighter: {
      name: 'ファイター',
      description: 'スピードと火力のバランスが良い機体',
    },
    scout: {
      name: 'スカウト',
      description: '高速で機敏、回避に最適',
    },
    tank: {
      name: 'タンク',
      description: '重装甲と強力な武器を持つが、速度が遅い',
    },
    interceptor: {
      name: 'インターセプター',
      description: '超高速で連射能力を持つ',
    },
    support: {
      name: 'サポート',
      description: '戦闘中にシールドを修理する回復機体',
    },
    stealth: {
      name: 'ステルス',
      description: '敵をすり抜けるクローキング機体',
    },
    heavy: {
      name: 'ヘビー',
      description: 'チャージ攻撃による圧倒的な火力',
    },
  },
  achievements: {
    firstKill: {
      name: 'ファーストブラッド',
      description: '最初の敵を倒す',
    },
    sharpshooter: {
      name: 'シャープシューター',
      description: 'ゲームで90%の精度を達成',
    },
    survivor: {
      name: 'サバイバー',
      description: '死なずにゲームをクリア',
    },
    waveRider: {
      name: 'ウェーブライダー',
      description: 'ウェーブ10に到達',
    },
    destroyer: {
      name: 'デストロイヤー',
      description: '1ゲームで100体の敵を倒す',
    },
    untouchable: {
      name: 'アンタッチャブル',
      description: '60秒間ダメージを受けない',
    },
    speedDemon: {
      name: 'スピードデーモン',
      description: '2分以内にウェーブ5に到達',
    },
    comboMaster: {
      name: 'コンボマスター',
      description: '20倍コンボを達成',
    },
    closeCall: {
      name: 'ギリギリセーフ',
      description: 'シールド1%で生き残る',
    },
    bulletHell: {
      name: '弾幕地獄',
      description: '1ゲームで1000発の弾を発射',
    },
    asteroid: {
      name: 'アステロイドハンター',
      description: '50個の小惑星を破壊',
    },
    veteran: {
      name: 'ベテラン',
      description: '50ゲームプレイ',
    },
  },
  stats: {
    gamesPlayed: 'プレイ回数',
    totalScore: '総スコア',
    highScore: 'ハイスコア',
    totalKills: '総撃破数',
    accuracy: '精度',
    longestStreak: '最長連続撃破',
    highestWave: '最高ウェーブ',
    totalPlayTime: '総プレイ時間',
    averageScore: '平均スコア',
    totalDeaths: '総死亡回数',
    speed: 'スピード',
    fireRate: '連射速度',
    damage: 'ダメージ',
    hull: 'シールド',
  },
  enemyTypes: {
    scout: 'スカウト',
    tank: 'タンク',
    sniper: 'スナイパー',
    bomber: 'ボマー',
    healer: 'ヒーラー',
    juggernaut: 'ジャガーノート',
  },
  bossTypes: {
    destroyer: 'デストロイヤー',
    carrier: 'キャリア',
    dreadnought: 'ドレッドノート',
    mothership: '母艦',
  },
  statistics: {
    title: '統計',
    tabs: {
      overview: '概要',
      perShip: '機体別統計',
      achievements: 'アチーブメント',
    },
    charts: {
      scoreProgression: 'スコア推移',
      killsByType: 'タイプ別撃破数',
      waveProgression: 'ウェーブ推移',
      playTimeByShip: '機体別プレイ時間',
    },
    labels: {
      bestCombo: 'ベストコンボ',
      bossKills: 'ボス撃破数',
      powerUpsCollected: 'パワーアップ収集数',
      favoriteShip: 'お気に入り機体',
      noDataYet: 'データなし',
      playToUnlock: 'プレイして解除',
    },
  },
  general: {
    confirm: '確認',
    cancel: 'キャンセル',
    save: '保存',
    back: '戻る',
    on: 'オン',
    off: 'オフ',
    credits: 'クレジット',
  },
  skins: {
    fighter: {
      default: {
        name: 'スタンダード',
        description: 'クラシックなファイターカラー',
      },
      stealth: {
        name: 'ステルス',
        description: 'ダークオプスペイント',
      },
      neon: {
        name: 'ネオン',
        description: '明るいサイバーパンクスタイル',
      },
      gold: {
        name: 'ゴールド',
        description: 'プレミアムゴールド仕上げ',
      },
      veteran: {
        name: 'ベテラン',
        description: 'エリートパイロットカラー',
      },
    },
    scout: {
      default: {
        name: 'スタンダード',
        description: 'スタンダードスカウトカラー',
      },
      stealth: {
        name: 'ステルス',
        description: 'シャドウランナー仕様',
      },
      neon: {
        name: 'ネオン',
        description: '高速レーサースタイル',
      },
      gold: {
        name: 'ゴールド',
        description: 'チャンピオンランナー仕上げ',
      },
      veteran: {
        name: 'ベテラン',
        description: 'スピードデーモンカラー',
      },
    },
    tank: {
      default: {
        name: 'スタンダード',
        description: 'スタンダードタンクカラー',
      },
      stealth: {
        name: 'ステルス',
        description: '重装甲ブラック',
      },
      neon: {
        name: 'ネオン',
        description: 'エンフォーサーグロー仕様',
      },
      gold: {
        name: 'ゴールド',
        description: 'フォートレスゴールドメッキ',
      },
      veteran: {
        name: 'ベテラン',
        description: '歴戦のカラー',
      },
    },
    interceptor: {
      default: {
        name: 'スタンダード',
        description: 'スタンダードインターセプターカラー',
      },
      stealth: {
        name: 'ステルス',
        description: 'サイレントハンター仕様',
      },
      neon: {
        name: 'ネオン',
        description: 'ライトニングストライクスタイル',
      },
      gold: {
        name: 'ゴールド',
        description: 'エースパイロット仕上げ',
      },
      veteran: {
        name: 'ベテラン',
        description: 'EMPスペシャリストカラー',
      },
    },
    support: {
      default: {
        name: 'スタンダード',
        description: 'スタンダードサポートカラー',
      },
      stealth: {
        name: 'ステルス',
        description: 'コバートメディック仕様',
      },
      neon: {
        name: 'ネオン',
        description: 'バイオルミネセントヒーラースタイル',
      },
      gold: {
        name: 'ゴールド',
        description: 'セイクリッドガーディアン仕上げ',
      },
      veteran: {
        name: 'ベテラン',
        description: 'フィールドサージョンカラー',
      },
    },
    stealth: {
      default: {
        name: 'スタンダード',
        description: 'スタンダードステルスカラー',
      },
      stealth: {
        name: 'ステルス',
        description: 'ゴーストオペレイティブ仕様',
      },
      neon: {
        name: 'ネオン',
        description: 'フェイズシフトスタイル',
      },
      gold: {
        name: 'ゴールド',
        description: 'ファントムエリート仕上げ',
      },
      veteran: {
        name: 'ベテラン',
        description: 'シャドウアサシンカラー',
      },
    },
    heavy: {
      default: {
        name: 'スタンダード',
        description: 'スタンダードヘビーカラー',
      },
      stealth: {
        name: 'ステルス',
        description: 'ダークデストロイヤー仕様',
      },
      neon: {
        name: 'ネオン',
        description: 'プラズマキャノンスタイル',
      },
      gold: {
        name: 'ゴールド',
        description: 'ウォーシップアドミラル仕上げ',
      },
      veteran: {
        name: 'ベテラン',
        description: 'シージブレイカーカラー',
      },
    },
  },
  leaderboard: {
    title: 'リーダーボード',
    rank: '順位',
    name: '名前',
    score: 'スコア',
    wave: 'ウェーブ',
    noScores: 'まだスコアがありません。ゲームをプレイして最初の記録を作りましょう！',
    close: '閉じる',
  },
  challenges: {
    title: 'デイリーチャレンジ',
    daily: 'デイリー',
    progress: '進捗',
    reward: '報酬',
    complete: '完了',
    completed: '完了済み',
    refresh: '更新',
    refreshIn: '更新まで',
    noActiveChallenges: 'アクティブなチャレンジがありません',
    killCount: {
      name: 'エネミーハンター',
      description: '戦闘で敵を倒す',
    },
    combo: {
      name: 'コンボマスター',
      description: 'コンボを達成する',
    },
    survival: {
      name: 'サバイバー',
      description: '複数のウェーブを生き残る',
    },
    boss: {
      name: 'ボススレイヤー',
      description: '強力なボスを倒す',
    },
    accuracy: {
      name: 'シャープシューター',
      description: '高い精度を維持する',
    },
    powerUp: {
      name: 'パワーコレクター',
      description: 'パワーアップを集める',
    },
    noDamage: {
      name: 'アンタッチャブル',
      description: 'ダメージを受けずにウェーブをクリアする',
    },
  },
  weeklyEvent: {
    title: 'ウィークリーイベント',
    activeEvent: 'アクティブイベント',
    noActiveEvent: 'アクティブなイベントがありません。またお越しください！',
    eventModifiers: 'イベント修正',
    rewards: '報酬',
    playEvent: 'イベントをプレイ',
    viewLeaderboard: 'リーダーボードを見る',
    leaderboard: 'イベントリーダーボード',
    timeRemaining: '残り時間',
    eventEnded: 'イベント終了',
    remaining: '残り',
    participation: '参加賞',
    firstPlace: '1位',
    secondPlace: '2位',
    thirdPlace: '3位',
    topTen: 'トップ10',
    modifiers: {
      double_speed: {
        name: 'ダブルスピード',
        description: '敵と小惑星の移動速度が2倍',
      },
      no_powerups: {
        name: 'パワーアップなし',
        description: 'パワーアップがドロップしない',
      },
      rapid_bosses: {
        name: 'ラピッドボス',
        description: '3ウェーブごとにボスが出現',
      },
      bullet_hell: {
        name: '弾幕地獄',
        description: '敵の射撃速度が3倍',
      },
      glass_cannon: {
        name: 'ガラスの大砲',
        description: 'HPが1だがダメージが2倍',
      },
      big_asteroids: {
        name: '巨大小惑星',
        description: '小惑星のサイズが1.5倍',
      },
    },
  },
};
