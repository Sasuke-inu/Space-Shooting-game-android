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
  challenges: {
    title: 'Desafíos Diarios',
    daily: 'Diario',
    progress: 'Progreso',
    reward: 'Recompensa',
    complete: 'Completar',
    completed: 'Completado',
    refresh: 'Actualizar',
    refreshIn: 'Se actualiza en',
    noActiveChallenges: 'No hay desafíos activos',
    killCount: {
      name: 'Cazador de Enemigos',
      description: 'Destruye enemigos en batalla',
    },
    combo: {
      name: 'Maestro del Combo',
      description: 'Logra una racha de combo',
    },
    survival: {
      name: 'Superviviente',
      description: 'Sobrevive múltiples oleadas',
    },
    boss: {
      name: 'Asesino de Jefes',
      description: 'Derrota jefes poderosos',
    },
    accuracy: {
      name: 'Tirador Experto',
      description: 'Mantén alta precisión',
    },
    powerUp: {
      name: 'Coleccionista de Poder',
      description: 'Recoge potenciadores',
    },
    noDamage: {
      name: 'Intocable',
      description: 'Completa oleadas sin recibir daño',
    },
  },
};
