import { Translations } from '../types';

export const ko: Translations = {
  menu: {
    play: '플레이',
    settings: '설정',
    highScores: '최고 점수',
    quit: '종료',
  },
  game: {
    score: '점수',
    wave: '웨이브',
    lives: '생명',
    hull: '실드',
    combo: '콤보',
    paused: '일시정지',
    gameOver: '게임 오버',
    restart: '재시작',
    mainMenu: '메인 메뉴',
  },
  settings: {
    title: '설정',
    language: '언어',
    theme: '테마',
    sound: '효과음',
    music: '음악',
    vibration: '진동',
    controls: '조작',
    sensitivity: '조이스틱 감도',
    joystickSize: '조이스틱 크기',
    autoFire: '자동 발사',
    invertY: 'Y축 반전',
    general: '일반',
    account: '계정',
    resetProgress: '진행 상황 초기화',
    resetSettings: '설정 초기화',
    resetProgressConfirm: '모든 진행 상황을 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
    resetSettingsConfirm: '모든 설정을 기본값으로 초기화하시겠습니까?',
    small: '작게',
    medium: '보통',
    large: '크게',
  },
  ships: {
    fighter: {
      name: '전투기',
      description: '속도와 화력이 균형잡힌 우주선',
    },
    scout: {
      name: '정찰기',
      description: '빠르고 민첩하여 회피에 최적',
    },
    tank: {
      name: '탱크',
      description: '중장갑과 강력한 무기를 가졌지만 느림',
    },
    interceptor: {
      name: '요격기',
      description: '번개처럼 빠르고 연사 능력 보유',
    },
  },
  achievements: {
    firstKill: {
      name: '첫 번째 격파',
      description: '첫 번째 적을 파괴하세요',
    },
    sharpshooter: {
      name: '명사수',
      description: '게임에서 90% 정확도 달성',
    },
    survivor: {
      name: '생존자',
      description: '죽지 않고 게임 완료',
    },
    waveRider: {
      name: '웨이브 라이더',
      description: '웨이브 10 도달',
    },
    destroyer: {
      name: '파괴자',
      description: '한 게임에서 100명의 적 파괴',
    },
    untouchable: {
      name: '무적',
      description: '60초 동안 피해를 입지 않음',
    },
    speedDemon: {
      name: '스피드 데몬',
      description: '2분 안에 웨이브 5 도달',
    },
    comboMaster: {
      name: '콤보 마스터',
      description: '20배 콤보 달성',
    },
    closeCall: {
      name: '아슬아슬',
      description: '실드 1%로 생존',
    },
    bulletHell: {
      name: '탄막 지옥',
      description: '한 게임에서 1000발의 총알 발사',
    },
    asteroid: {
      name: '소행성 사냥꾼',
      description: '50개의 소행성 파괴',
    },
    veteran: {
      name: '베테랑',
      description: '50게임 플레이',
    },
  },
  stats: {
    gamesPlayed: '플레이한 게임',
    totalScore: '총 점수',
    highScore: '최고 점수',
    totalKills: '총 격파 수',
    accuracy: '정확도',
    longestStreak: '최장 연속 격파',
    highestWave: '최고 웨이브',
    totalPlayTime: '총 플레이 시간',
    averageScore: '평균 점수',
    totalDeaths: '총 사망 횟수',
  },
  general: {
    confirm: '확인',
    cancel: '취소',
    save: '저장',
    back: '뒤로',
    on: '켜짐',
    off: '꺼짐',
  },
  tutorial: {
    title: '스페이스 슈터에 오신 것을 환영합니다！',
    skip: '튜토리얼 건너뛰기',
    next: '다음',
    movement: '왼쪽 조이스틱을 사용하여 우주선을 이동하세요. 소행성과 적을 피하는 연습을 하세요！',
    firing: '오른쪽의 발사 버튼을 탭하여 발사하세요. 연속 발사를 위해 길게 누르거나 설정에서 자동 발사를 활성화하세요.',
    powerups: '파워업을 수집하여 임시 능력을 얻으세요: 실드 (파란색), 빠른 발사 (빨간색), 산탄 (노란색), 자석 (보라색).',
    combos: '적을 빠르게 파괴하여 콤보를 쌓으세요! 2초 이내에 연속으로 격파하면 점수가 최대 3배까지 증가합니다.',
    abilities: '각 우주선은 특수 능력을 가지고 있습니다. 충전되면 능력 버튼을 탭하여 강력한 효과를 발휘하세요！',
    complete: '준비되었습니다! 행운을 빕니다, 사령관. 별들이 함께하기를.',
  },
};
