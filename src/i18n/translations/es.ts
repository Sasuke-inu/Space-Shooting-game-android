import { Translations } from '../types';

export const es: Translations = {
  menu: {
    play: 'Jugar',
    settings: 'Configuración',
    highScores: 'Puntuaciones',
    ships: 'Naves',
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
    selectShip: 'Seleccionar Nave',
    compareShips: 'Comparar Naves',
    locked: 'Bloqueada',
    selected: 'Seleccionada',
    insufficientCredits: 'Créditos Insuficientes',
    specialAbility: 'Habilidad Especial',
    cooldown: 'Tiempo de Recarga',
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
    support: {
      name: 'Soporte',
      description: 'Nave sanadora que repara el casco en combate',
    },
    stealth: {
      name: 'Sigilo',
      description: 'Nave de camuflaje que atraviesa enemigos',
    },
    heavy: {
      name: 'Pesado',
      description: 'Potencia de fuego devastadora con ataques cargados',
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
    speed: 'Velocidad',
    fireRate: 'Cadencia de Fuego',
    damage: 'Daño',
    hull: 'Casco',
  },
  enemyTypes: {
    scout: 'Explorador',
    tank: 'Tanque',
    sniper: 'Francotirador',
    bomber: 'Bombardero',
    healer: 'Sanador',
    juggernaut: 'Juggernaut',
  },
  bossTypes: {
    destroyer: 'Destructor',
    carrier: 'Portador',
    dreadnought: 'Acorazado',
    mothership: 'Nave Nodriza',
  },
  statistics: {
    title: 'Estadísticas',
    tabs: {
      overview: 'Resumen',
      perShip: 'Estadísticas por Nave',
      achievements: 'Logros',
    },
    charts: {
      scoreProgression: 'Progresión de Puntuación',
      killsByType: 'Muertes por Tipo',
      waveProgression: 'Progresión de Oleadas',
      playTimeByShip: 'Tiempo de Juego por Nave',
    },
    labels: {
      bestCombo: 'Mejor Combo',
      bossKills: 'Jefes Eliminados',
      powerUpsCollected: 'Potenciadores Recogidos',
      favoriteShip: 'Nave Favorita',
      noDataYet: 'Aún no hay datos',
      playToUnlock: 'Juega para desbloquear',
    },
  },
  general: {
    confirm: 'Confirmar',
    cancel: 'Cancelar',
    save: 'Guardar',
    back: 'Atrás',
    on: 'Activado',
    off: 'Desactivado',
    credits: 'Créditos',
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
    support: {
      default: {
        name: 'Estándar',
        description: 'Colores estándar del soporte',
      },
      stealth: {
        name: 'Sigilo',
        description: 'Esquema de médico encubierto',
      },
      neon: {
        name: 'Neón',
        description: 'Estilo de sanador bioluminiscente',
      },
      gold: {
        name: 'Oro',
        description: 'Acabado de guardián sagrado',
      },
      veteran: {
        name: 'Veterano',
        description: 'Colores de cirujano de campo',
      },
    },
    stealth: {
      default: {
        name: 'Estándar',
        description: 'Colores estándar del sigilo',
      },
      stealth: {
        name: 'Sigilo',
        description: 'Esquema de operativo fantasma',
      },
      neon: {
        name: 'Neón',
        description: 'Estilo de cambio de fase',
      },
      gold: {
        name: 'Oro',
        description: 'Acabado de élite fantasma',
      },
      veteran: {
        name: 'Veterano',
        description: 'Colores de asesino en las sombras',
      },
    },
    heavy: {
      default: {
        name: 'Estándar',
        description: 'Colores estándar del pesado',
      },
      stealth: {
        name: 'Sigilo',
        description: 'Esquema de destructor oscuro',
      },
      neon: {
        name: 'Neón',
        description: 'Estilo de cañón de plasma',
      },
      gold: {
        name: 'Oro',
        description: 'Acabado de almirante de buque de guerra',
      },
      veteran: {
        name: 'Veterano',
        description: 'Colores de rompedor de asedios',
      },
    },
  },
  leaderboard: {
    title: 'Tabla de Clasificación',
    rank: 'Rango',
    name: 'Nombre',
    score: 'Puntuación',
    wave: 'Oleada',
    noScores: '¡Aún no hay puntuaciones. Juega una partida para establecer tu primer récord!',
    close: 'Cerrar',
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
  weeklyEvent: {
    title: 'Evento Semanal',
    activeEvent: 'Evento Activo',
    noActiveEvent: '¡No hay evento activo. Vuelve pronto!',
    eventModifiers: 'Modificadores del Evento',
    rewards: 'Recompensas',
    playEvent: 'Jugar Evento',
    viewLeaderboard: 'Ver Clasificación',
    leaderboard: 'Clasificación del Evento',
    timeRemaining: 'Tiempo Restante',
    eventEnded: 'Evento Finalizado',
    remaining: 'restante',
    participation: 'Participación',
    firstPlace: '1er Lugar',
    secondPlace: '2do Lugar',
    thirdPlace: '3er Lugar',
    topTen: 'Top 10',
    modifiers: {
      double_speed: {
        name: 'Doble Velocidad',
        description: 'Enemigos y asteroides se mueven el doble de rápido',
      },
      no_powerups: {
        name: 'Sin Potenciadores',
        description: 'Los potenciadores no aparecen',
      },
      rapid_bosses: {
        name: 'Jefes Rápidos',
        description: 'Aparece un jefe cada 3 oleadas',
      },
      bullet_hell: {
        name: 'Infierno de Balas',
        description: 'Los enemigos disparan 3 veces más rápido',
      },
      glass_cannon: {
        name: 'Cañón de Cristal',
        description: 'Tienes solo 1 HP pero infliges el doble de daño',
      },
      big_asteroids: {
        name: 'Asteroides Grandes',
        description: 'Los asteroides son 1.5 veces más grandes',
      },
    },
  },
};
