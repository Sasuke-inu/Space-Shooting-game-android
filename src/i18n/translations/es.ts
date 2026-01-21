import { Translations } from '../types';

export const es: Translations = {
  menu: {
    play: 'Jugar',
    settings: 'Configuración',
    highScores: 'Puntuaciones',
    quit: 'Salir',
  },
  game: {
    score: 'Puntuación',
    wave: 'Oleada',
    lives: 'Vidas',
    hull: 'Casco',
    combo: 'Combo',
    paused: 'Pausado',
    gameOver: 'Fin del Juego',
    restart: 'Reiniciar',
    mainMenu: 'Menú Principal',
  },
  settings: {
    title: 'Configuración',
    language: 'Idioma',
    theme: 'Tema',
    sound: 'Efectos de Sonido',
    music: 'Música',
    vibration: 'Vibración',
    controls: 'Controles',
    sensitivity: 'Sensibilidad del Joystick',
    joystickSize: 'Tamaño del Joystick',
    autoFire: 'Disparo Automático',
    invertY: 'Invertir Eje Y',
    general: 'General',
    account: 'Cuenta',
    resetProgress: 'Restablecer Progreso',
    resetSettings: 'Restablecer Configuración',
    resetProgressConfirm: '¿Estás seguro de que quieres restablecer todo el progreso? Esto no se puede deshacer.',
    resetSettingsConfirm: '¿Estás seguro de que quieres restablecer toda la configuración a los valores predeterminados?',
    small: 'Pequeño',
    medium: 'Mediano',
    large: 'Grande',
  },
  ships: {
    fighter: {
      name: 'Caza',
      description: 'Nave equilibrada con buena velocidad y potencia de fuego',
    },
    scout: {
      name: 'Explorador',
      description: 'Rápido y ágil, perfecto para esquivar',
    },
    tank: {
      name: 'Tanque',
      description: 'Armadura pesada y armas poderosas, pero lento',
    },
    interceptor: {
      name: 'Interceptor',
      description: 'Súper rápido con capacidades de disparo rápido',
    },
  },
  achievements: {
    firstKill: {
      name: 'Primera Sangre',
      description: 'Destruye tu primer enemigo',
    },
    sharpshooter: {
      name: 'Tirador Experto',
      description: 'Logra un 90% de precisión en un juego',
    },
    survivor: {
      name: 'Superviviente',
      description: 'Completa un juego sin morir',
    },
    waveRider: {
      name: 'Jinete de Oleadas',
      description: 'Alcanza la oleada 10',
    },
    destroyer: {
      name: 'Destructor',
      description: 'Destruye 100 enemigos en un juego',
    },
    untouchable: {
      name: 'Intocable',
      description: 'No recibas daño durante 60 segundos',
    },
    speedDemon: {
      name: 'Demonio de Velocidad',
      description: 'Alcanza la oleada 5 en menos de 2 minutos',
    },
    comboMaster: {
      name: 'Maestro del Combo',
      description: 'Logra un combo de 20x',
    },
    closeCall: {
      name: 'Por los Pelos',
      description: 'Sobrevive con 1% de casco restante',
    },
    bulletHell: {
      name: 'Infierno de Balas',
      description: 'Dispara 1000 balas en un juego',
    },
    asteroid: {
      name: 'Cazador de Asteroides',
      description: 'Destruye 50 asteroides',
    },
    veteran: {
      name: 'Veterano',
      description: 'Juega 50 partidas',
    },
  },
  stats: {
    gamesPlayed: 'Partidas Jugadas',
    totalScore: 'Puntuación Total',
    highScore: 'Puntuación Máxima',
    totalKills: 'Muertes Totales',
    accuracy: 'Precisión',
    longestStreak: 'Racha Más Larga',
    highestWave: 'Oleada Más Alta',
    totalPlayTime: 'Tiempo Total de Juego',
    averageScore: 'Puntuación Promedio',
    totalDeaths: 'Muertes Totales',
  },
  general: {
    confirm: 'Confirmar',
    cancel: 'Cancelar',
    save: 'Guardar',
    back: 'Atrás',
    on: 'Activado',
    off: 'Desactivado',
  },
  skins: {
    fighter: {
      default: {
        name: 'Estándar',
        description: 'Colores clásicos del caza',
      },
      stealth: {
        name: 'Sigilo',
        description: 'Esquema de pintura de operaciones oscuras',
      },
      neon: {
        name: 'Neón',
        description: 'Estilo cyberpunk brillante',
      },
      gold: {
        name: 'Oro',
        description: 'Acabado dorado premium',
      },
      veteran: {
        name: 'Veterano',
        description: 'Colores de piloto élite',
      },
    },
    scout: {
      default: {
        name: 'Estándar',
        description: 'Colores estándar del explorador',
      },
      stealth: {
        name: 'Sigilo',
        description: 'Esquema de corredor en las sombras',
      },
      neon: {
        name: 'Neón',
        description: 'Estilo de corredor de alta velocidad',
      },
      gold: {
        name: 'Oro',
        description: 'Acabado de corredor campeón',
      },
      veteran: {
        name: 'Veterano',
        description: 'Colores de demonio de velocidad',
      },
    },
    tank: {
      default: {
        name: 'Estándar',
        description: 'Colores estándar del tanque',
      },
      stealth: {
        name: 'Sigilo',
        description: 'Negro de armadura pesada',
      },
      neon: {
        name: 'Neón',
        description: 'Esquema de brillo del ejecutor',
      },
      gold: {
        name: 'Oro',
        description: 'Revestimiento dorado de fortaleza',
      },
      veteran: {
        name: 'Veterano',
        description: 'Colores curtidos en batalla',
      },
    },
    interceptor: {
      default: {
        name: 'Estándar',
        description: 'Colores estándar del interceptor',
      },
      stealth: {
        name: 'Sigilo',
        description: 'Esquema de cazador silencioso',
      },
      neon: {
        name: 'Neón',
        description: 'Estilo de ataque relámpago',
      },
      gold: {
        name: 'Oro',
        description: 'Acabado de piloto as',
      },
      veteran: {
        name: 'Veterano',
        description: 'Colores de especialista EMP',
      },
    },
  },
};
