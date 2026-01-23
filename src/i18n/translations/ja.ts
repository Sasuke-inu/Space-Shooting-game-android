import { Translations } from '../types';

export const ja: Translations = {
  menu: {
    play: 'プレイ',
    settings: '設定',
    highScores: 'ハイスコア',
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
  },
};
