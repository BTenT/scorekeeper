export interface RulesSection {
  title: string
  items: string[]
}

export const t = {
  appName: 'Scorekeeper',
  subtitle: 'Hartenjagen & klaverjassen',
  newGame: 'Nieuw spel',
  newGameSamePlayers: 'Nieuw spel, zelfde spelers',
  inProgress: 'Bezig',
  finished: 'Afgelopen',
  noGames: 'Nog geen spellen. Begin een nieuw spel!',
  privacyPolicy: 'Privacybeleid',
  players: 'Spelers',
  playerName: (i: number) => `Speler ${i + 1}`,
  addPlayer: '+ Speler toevoegen',
  removePlayer: 'Verwijderen',
  rules: 'Spelregels',
  explain: 'Uitleg',
  close: 'Sluiten',
  playForMoney: 'Spelen om geld',
  paymentPerPoint: 'Cent per punt',
  paymentGameFee: 'Cent per spel',
  turnAt: 'Retour vanaf',
  playTo: 'Spelen tot',
  start: 'Starten',
  back: 'Terug',
  round: 'Ronde',
  enterRound: 'Ronde invoeren',
  remaining: (left: number, total: number) => `Nog ${left} van ${total} punten`,
  tooMany: (over: number) => `${over} punten te veel!`,
  save: 'Opslaan',
  cancel: 'Annuleren',
  pit: 'Pit!',
  pitTitle: (name: string) => `${name} haalt alles!`,
  pitSelf: (delta: number) => `${delta} voor de speler`,
  pitOthers: (delta: number) => `+${delta} voor de rest`,
  undoRound: 'Laatste ronde ongedaan maken',
  deleteGame: 'Spel verwijderen',
  deleteConfirm: 'Dit spel verwijderen?',
  winner: (name: string) => `${name} wint!`,
  payments: 'Afrekening',
  pays: (from: string, amount: string, to: string) => `${from} betaalt ${amount} aan ${to}`,
  paymentsNote: 'Exclusief verrekening van eventuele pit-potjes.',
  receivesTotal: (name: string, amount: string) => `${name} ontvangt ${amount}`,
  returnPhase: 'retour',
  returnBanner: 'Retourspel — punten tellen af',
  lowest: 'laagste',
  highest: 'hoogste',
  tieTitle: 'Meerdere spelers onder de 0!',
  tieQuestion: 'Wie heeft zich als eerste uitgemeld?',
  total: 'Totaal',
  // Klaverjassen
  gameTypeLabel: 'Spel',
  hartenjagen: 'Hartenjagen',
  klaverjassen: 'Klaverjassen',
  teams: 'Teams',
  teamWij: 'Wij',
  teamZij: 'Zij',
  variantLabel: 'Telling',
  firstDealer: 'Wie deelt eerst?',
  deals: (name: string) => `${name} deelt`,
  trumpQuestion: 'Wie maakte troef?',
  roem: 'Roem',
  resetRoem: 'wissen',
  points: 'Punten',
  klaverjasRemaining: (left: number) => (left === 0 ? 'Samen 162 ✓' : left > 0 ? `Nog ${left} tot 162` : `${-left} te veel!`),
  nat: 'nat',
  natWarning: (trump: string, other: string) => `${trump} gaat nat — alle punten en roem naar ${other}`,
  pitWarning: (name: string, bonus: number) => `Pit voor ${name}: alle punten + ${bonus}`,
  leading: 'aan kop',
  pointsShort: 'Pnt',
  pitColumn: 'Pit',
  draw: 'Gelijkspel!',
  // Rules popup
  rulesHartenjagen: (r: {
    pointsPerRound: number
    cards: string
    selfDelta: number
    othersDelta: number
    turnAt: number
    returnGame: boolean
    payment: { gameFee: string; perPoint: string } | null
  }): RulesSection[] => [
    {
      title: 'Punten',
      items: [
        `Elke ronde zijn er ${r.pointsPerRound} punten te verdelen: ${r.cards}.`,
        `Een ronde moet precies optellen tot ${r.pointsPerRound}.`,
      ],
    },
    {
      title: 'Pit (alles halen)',
      items: [
        `Wie alles haalt kiest zelf: ${r.selfDelta} voor zichzelf of +${r.othersDelta} voor alle anderen.`,
        ...(r.returnGame
          ? [
              'Een pit telt altijd direct op de score, ook tijdens het retourspel.',
              'Negatief staan door een pit vóór het retourspel is nog geen winst.',
            ]
          : ['Een pit telt direct op de score.']),
      ],
    },
    ...(r.returnGame
      ? [
          {
            title: 'Retourspel',
            items: [
              `Zodra één speler op ${r.turnAt} of hoger komt, gaat iedereen retour: vanaf de volgende ronde telt elk gehaald punt voor alle spelers omlaag.`,
              'De ronde waarin dat gebeurt telt nog gewoon omhoog, en de speler houdt de overschrijding.',
            ],
          },
          {
            title: 'Winnen',
            items: [
              'De eerste speler die tijdens het retourspel onder de 0 komt wint. Precies 0 is nog geen winst.',
              'Wie al negatief staat als het retourspel begint, wint direct.',
              'Komen meerdere spelers in dezelfde ronde onder de 0, dan wint wie zich als eerste heeft uitgemeld, ook als een ander lager staat.',
            ],
          },
        ]
      : [
          {
            title: 'Winnen',
            items: [
              'Er is geen retourspel.',
              `Zodra een speler op ${r.turnAt} of hoger komt, stopt het spel en wint de laagste speler.`,
              `Staan meerdere spelers gelijk op de laagste score, dan is het gelijkspel${r.payment ? ', zonder afrekening' : ''}.`,
            ],
          },
        ]),
    ...(r.payment
      ? [
          {
            title: 'Afrekening',
            items: [
              `Iedere verliezer betaalt de winnaar ${r.payment.gameFee} voor het spel plus ${r.payment.perPoint} per punt van de eigen eindscore. Bij een negatieve score alleen de ${r.payment.gameFee}.`,
              'Eventuele pit-potjes verreken je zelf.',
            ],
          },
        ]
      : []),
  ],
  rulesKlaverjasTelling: {
    volledig: [
      'Elke ronde zijn er 162 punten te verdelen, plus roem.',
      'Het eerste team op 1600 of hoger wint.',
      'Komen beide teams in dezelfde ronde over de 1600, dan wint de hoogste. Bij exact gelijke stand speel je door.',
    ],
    afgerond: [
      'Je telt de kaarten tot 162, de score wordt afgerond op tientallen: 82 wordt 8, 97 wordt 10.',
      'Het team waarvan je de punten intypt wordt afgerond, het andere team krijgt 16 min dat. Een ronde telt dus altijd op tot 16.',
      'Roem gaat er los overheen: 20 wordt 2.',
      'Het eerste team op 160 wint. Komen beide teams in dezelfde ronde over de 160, dan wint de hoogste. Bij exact gelijke stand speel je door.',
    ],
    concours: [
      'Je speelt altijd 16 rondes: iedereen deelt 4×.',
      'Elke ronde zijn er 162 punten te verdelen, 2592 in totaal.',
      'Punten, roem en pit worden per team los bijgehouden.',
      'Na de laatste ronde wint het team met het hoogste totaal van punten, roem en pit. Exact gelijk is gelijkspel.',
    ],
  },
  rulesKlaverjassen: (telling: string[], pitBonus: number): RulesSection[] => [
    { title: 'Telling', items: telling },
    {
      title: 'Nat',
      items: [
        'Het team dat troef maakt gaat nat als het inclusief roem niet méér punten heeft dan de tegenstander. 81–81 is dus ook nat.',
        'Dan gaan alle punten, alle roem en een eventuele pit-bonus naar de tegenstander.',
      ],
    },
    {
      title: 'Roem',
      items: [
        'Houd roem tijdens de ronde bij met de knoppen op het spelscherm.',
        'Bij het invoeren van de ronde kun je het bedrag nog aanpassen.',
      ],
    },
    {
      title: 'Pit',
      items: [`Een team dat alle slagen haalt krijgt alle punten plus ${pitBonus}, bovenop de roem.`],
    },
    {
      title: 'Delen',
      items: ['De app houdt bij wie er deelt; dat wisselt elke ronde tussen de teams.'],
    },
  ],
  teamWins: (name: string) => {
    const lower = name.trim().toLowerCase()
    return lower === 'wij' || lower === 'zij' ? `${name.trim()} winnen!` : `${name} wint!`
  },
}
