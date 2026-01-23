import { Translations } from '../types';

export const zh: Translations = {
  menu: {
    play: '开始游戏',
    settings: '设置',
    highScores: '最高分',
    quit: '退出',
  },
  game: {
    score: '分数',
    wave: '波次',
    lives: '生命',
    hull: '护盾',
    combo: '连击',
    paused: '已暂停',
    gameOver: '游戏结束',
    restart: '重新开始',
    mainMenu: '主菜单',
  },
  settings: {
    title: '设置',
    language: '语言',
    theme: '主题',
    sound: '音效',
    music: '音乐',
    vibration: '震动',
    controls: '控制',
    sensitivity: '摇杆灵敏度',
    joystickSize: '摇杆大小',
    autoFire: '自动射击',
    invertY: '反转Y轴',
    general: '通用',
    account: '账户',
    resetProgress: '重置进度',
    resetSettings: '重置设置',
    resetProgressConfirm: '确定要重置所有进度吗？此操作无法撤销。',
    resetSettingsConfirm: '确定要将所有设置重置为默认值吗?',
    small: '小',
    medium: '中',
    large: '大',
  },
  ships: {
    fighter: {
      name: '战斗机',
      description: '速度和火力均衡的飞船',
    },
    scout: {
      name: '侦察机',
      description: '快速灵活，适合闪避',
    },
    tank: {
      name: '坦克',
      description: '重装甲和强大武器，但速度慢',
    },
    interceptor: {
      name: '拦截机',
      description: '闪电般快速，具有速射能力',
    },
  },
  achievements: {
    firstKill: {
      name: '首杀',
      description: '摧毁你的第一个敌人',
    },
    sharpshooter: {
      name: '神枪手',
      description: '在一局游戏中达到90%的准确率',
    },
    survivor: {
      name: '幸存者',
      description: '完成一局游戏而不死亡',
    },
    waveRider: {
      name: '波次骑士',
      description: '到达第10波',
    },
    destroyer: {
      name: '毁灭者',
      description: '在一局游戏中摧毁100个敌人',
    },
    untouchable: {
      name: '无敌',
      description: '60秒内不受伤害',
    },
    speedDemon: {
      name: '速度恶魔',
      description: '在2分钟内到达第5波',
    },
    comboMaster: {
      name: '连击大师',
      description: '达到20倍连击',
    },
    closeCall: {
      name: '死里逃生',
      description: '以1%护盾值幸存',
    },
    bulletHell: {
      name: '弹幕地狱',
      description: '在一局游戏中发射1000发子弹',
    },
    asteroid: {
      name: '小行星猎人',
      description: '摧毁50颗小行星',
    },
    veteran: {
      name: '老兵',
      description: '玩50局游戏',
    },
  },
  stats: {
    gamesPlayed: '游戏次数',
    totalScore: '总分',
    highScore: '最高分',
    totalKills: '总击杀数',
    accuracy: '准确率',
    longestStreak: '最长连击',
    highestWave: '最高波次',
    totalPlayTime: '总游戏时间',
    averageScore: '平均分数',
    totalDeaths: '总死亡次数',
  },
  general: {
    confirm: '确认',
    cancel: '取消',
    save: '保存',
    back: '返回',
    on: '开',
    off: '关',
  },
  tutorial: {
    title: '欢迎来到太空射击游戏！',
    skip: '跳过教程',
    next: '下一步',
    movement: '使用左侧的摇杆移动你的飞船。练习躲避小行星和敌人！',
    firing: '点击右侧的射击按钮进行射击。按住它进行连续射击，或在设置中启用自动射击。',
    powerups: '收集能量道具获得临时能力：护盾（蓝色）、快速射击（红色）、散射（黄色）和磁铁（紫色）。',
    combos: '快速摧毁敌人以建立连击！在2秒内连续击杀，将你的分数倍增至3倍。',
    abilities: '每艘飞船都有特殊能力。充能完成后点击能力按钮释放强大效果！',
    complete: '你准备好了！祝你好运，指挥官。愿星辰与你同在。',
  },
};
