// Built-in opening repertoire. Each line: the user trains ONE side;
// moves is the full SAN sequence (both players), tips are keyed by ply index (0-based).
export const BUILTIN_LINES = [
  {
    id: 'w-italian-pianissimo',
    family: 'italian',
    name: 'Italian Game — Giuoco Pianissimo',
    side: 'white',
    eco: 'C50',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd3', 'd6', 'O-O', 'O-O', 'Re1'],
    tips: {
      0: 'Take the centre and open lines for the bishop and queen.',
      4: 'Aim at f7 — the weakest square in Black\u2019s camp.',
      6: 'Prepare d4 to build a big centre.',
      8: 'Solid: keep the tension and avoid early trades.',
      10: 'Castle before opening the centre.',
      12: 'Rook to the semi-open file — d4 comes next.'
    }
  },
  {
    id: 'w-italian-two-knights',
    family: 'italian',
    name: 'Italian — Two Knights, 4.d3',
    side: 'white',
    eco: 'C55',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'd3', 'Bc5', 'c3', 'd6', 'O-O', 'O-O', 'Re1'],
    tips: {
      6: 'The modern quiet treatment — no 4.Ng5 theory to memorise.',
      8: 'The same Pianissimo build-up works against the Two Knights.'
    }
  },
  {
    id: 'w-ruy-closed',
    family: 'ruy',
    name: 'Ruy Lopez — Closed Main Line',
    side: 'white',
    eco: 'C84',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7', 'Re1', 'b5', 'Bb3', 'd6', 'c3', 'O-O', 'h3'],
    tips: {
      2: 'Hits e5 and prepares d4 — the main move since the 1800s.',
      6: 'The standard retreat: keeps pressure once ...b5 kicks the bishop.',
      8: 'King safety first; the rook already stares down the e-file.',
      12: 'Safe square that still watches the a2-g8 diagonal.',
      14: 'Classic build-up: d4 next, then Nbd2-f1-g3.',
      16: 'A luft for the king and it stops ...Ng4 ideas.'
    }
  },
  {
    id: 'w-ruy-berlin',
    family: 'ruy',
    name: 'Ruy Lopez — Berlin Defence',
    side: 'white',
    eco: 'C65',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'Nf6', 'O-O', 'Nxe4', 'd4', 'Nd6', 'Bxc6', 'dxc6', 'dxe5', 'Nf5', 'Qxd8+', 'Kxd8'],
    tips: {
      6: 'The Rio de Janeiro treatment: castle and dare Black to take on e4.',
      8: 'Strike the centre immediately — the pawn is yours in the endgame.',
      10: 'Break the pin and double Black\u2019s pawns; quality of pawns matters more than count here.',
      14: 'Trade queens and head for the famous Berlin endgame — White keeps a space edge.'
    }
  },
  {
    id: 'w-ruy-exchange',
    family: 'ruy',
    name: 'Ruy Lopez — Exchange Variation',
    side: 'white',
    eco: 'C68',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Bxc6', 'dxc6', 'O-O', 'f6', 'd4', 'exd4', 'Nxd4', 'c5', 'Nb3'],
    tips: {
      6: 'Dissolve the pin: give Black doubled pawns in exchange for a healthy structure.',
      8: 'Castle — then open the centre while Black\u2019s light bishop is buried.',
      10: 'Central strike. Black\u2019s e5 pawn must decide its fate.',
      14: 'Step back from the hit and prepare d2-d4 support; Black\u2019s queenside is a target.'
    }
  },
  {
    id: 'w-ruy-marshall',
    family: 'ruy',
    name: 'Ruy Lopez — Marshall Attack',
    side: 'white',
    eco: 'C89',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7', 'Re1', 'b5', 'Bb3', 'O-O', 'c3', 'd5', 'exd5', 'Nxd5', 'Nxe5', 'Nxe5', 'Rxe5', 'c6', 'd4', 'Bd6', 'Re1', 'Qh4', 'g3', 'Qh3'],
    tips: {
      14: 'The classical build-up — and the polite invitation to the famous Marshall gambit (…d5).',
      16: 'Accept the challenge: taking on d5 is the classical test.',
      18: 'Grab the e5 pawn — you will give material back, but on your terms.',
      20: 'The rook takes; Black regains it soon, but White keeps the healthier structure.',
      22: 'Return the pawn here — the d4-e5 chain cramps Black for the whole game.',
      24: 'Reroute the rook before the storm: Black\u2019s queen is eyeing h4-h3.',
      26: 'Necessary luft — the kingside attack is the entire point of Black\u2019s sacrifice.',
      27: 'The queen lands on h3, but White is structurally better: Qe2/Re3 hold comfortably.'
    }
  },
  {
    id: 'w-ruy-breyer',
    family: 'ruy',
    name: 'Ruy Lopez — Breyer Variation',
    side: 'white',
    eco: 'C90',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7', 'Re1', 'b5', 'Bb3', 'd6', 'c3', 'O-O', 'h3', 'Nb8', 'd4', 'Nbd7', 'Nbd2', 'Bb7', 'Bc2', 'Re8', 'Nf1', 'Bf8', 'Ng3', 'h6'],
    tips: {
      18: 'Finally the central break — Black\u2019s knight retreat to b8 made room for this.',
      20: 'Both knights can reach d2; the recapture plans to reroute via f1-g3.',
      22: 'The bishop hugs the second rank, watching the kingside the bishop left.',
      24: 'The signature reroute begins: f1-g3 sends fresh pressure toward e5.',
      26: 'The knight lands on g3, pointing at e5 and f5 — the Breyer fortress is set.',
      27: 'Black buys luft; typical plans for White are d5 or a knight leap to f5.'
    }
  },
  {
    id: 'w-ruy-schliemann',
    family: 'ruy',
    name: 'Ruy Lopez — Schliemann Defence',
    side: 'white',
    eco: 'C63',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'f5', 'Nc3', 'fxe4', 'Nxe4', 'd5', 'Nxe5', 'dxe4', 'Nxc6', 'Qg5', 'Qe2', 'Nf6', 'f4', 'Qxf4', 'Ne5+', 'c6', 'd4'],
    tips: {
      6: 'Against Black\u2019s wild Schliemann, the central counter 4.Nc3 is the principled test.',
      8: 'The knight grabs the pawn — now Black must prove compensation.',
      10: 'Strike the middle: the knight on e5 dominates the whole board.',
      12: 'Take on c6 — the knight is headed to e5 with tempo next.',
      14: 'Quiet and precise: the queen sidesteps every …Qxg2 trick.',
      16: 'f4 kicks the queen and guards the e5-knight in one move.',
      18: 'Check and regroup — the knight is a monster on e5.',
      20: 'Slam d4 down: a giant centre against scattered pieces.'
    }
  },
  {
    id: 'w-qgd-exchange',
    family: 'qgd',
    name: 'Queen\u2019s Gambit Declined — Exchange',
    side: 'white',
    eco: 'D35',
    moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Be7', 'e3', 'O-O', 'Nf3', 'h6', 'Bh4', 'b6', 'cxd5', 'Nxd5', 'Bxe7', 'Qxe7', 'Nxd5', 'exd5'],
    tips: {
      2: 'Fight for d5 with the c-pawn.',
      6: 'Pin the knight and add pressure to the centre.',
      12: 'The bishop steps back; it will trade itself off on e7 shortly.',
      14: 'Trade on d5 to reach the classic Carlsbad structure.',
      18: 'Regain the pawn — the healthier structure is yours.'
    }
  },
  {
    id: 'w-london',
    family: 'london',
    name: 'London System',
    side: 'white',
    eco: 'D02',
    moves: ['d4', 'd5', 'Bf4', 'Nf6', 'e3', 'e6', 'Nf3', 'c5', 'c3', 'Nc6', 'Nbd2', 'Bd6', 'Bg3', 'O-O', 'Bd3'],
    tips: {
      2: 'The London bishop eyes the kingside from f4.',
      6: 'Finish development before committing the centre.',
      8: 'Cement d4 — the c3/d4/e3 chain is rock solid.',
      10: 'Nbd2 is flexible: it may reroute via f1-g3.',
      14: 'Bd3, then Ne5 and a kingside build-up. Low theory, big fun.'
    }
  },
  {
    id: 'b-caro-classical',
    family: 'caro',
    name: 'Caro-Kann — Classical',
    side: 'black',
    eco: 'B18',
    moves: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5', 'Ng3', 'Bg6', 'h4', 'h6', 'Nf3', 'Nd7', 'h5', 'Bh7', 'Bd3', 'Bxd3', 'Qxd3'],
    tips: {
      1: 'Solid and resilient — challenge e4 right away.',
      7: 'Develop outside the pawn chain — a Caro-Kann trademark.',
      11: 'Push the pawn back; your position is very solid.',
      15: 'Even the retreat keeps your best bishop on its best diagonal.',
      17: 'Trade the light bishops — the structure is endgame-friendly.'
    }
  },
  {
    id: 'b-najdorf',
    family: 'najdorf',
    name: 'Sicilian Najdorf — English Attack',
    side: 'black',
    eco: 'B90',
    moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6', 'Be3', 'e5', 'Nb3', 'Be7', 'f3', 'O-O', 'Qd2', 'Nbd7'],
    tips: {
      1: 'The most combative answer to 1.e4 — fight for the initiative with the c-pawn.',
      9: 'The Najdorf move: takes b5 from White and prepares ...e5.',
      12: 'The ideal setup: ...e5 played, ...Be7 and ...O-O to follow.',
      17: 'f3 stops ...Ng4; expect Qd2, g4 and O-O-O — brace for the race.'
    }
  },
  {
    id: 'b-slav',
    family: 'slav',
    name: 'Slav Defence — Main Line',
    side: 'black',
    eco: 'D15',
    moves: ['d4', 'd5', 'c4', 'c6', 'Nf3', 'Nf6', 'Nc3', 'dxc4', 'a4', 'Bf5', 'e3', 'e6', 'Bxc4', 'Bb4', 'O-O'],
    tips: {
      1: 'Support d5 without shutting in the light bishop.',
      7: 'Grab the bishop pair trade — take on c4 at the right moment.',
      9: 'Develop outside the chain: the Slav\u2019s great advantage over the QGD.',
      13: 'Pin the knight and finish development; the pawn comes back anyway.'
    }
  },
  {
    id: 'b-berlin',
    family: 'ruy',
    name: 'Ruy Lopez — Berlin Defence',
    side: 'black',
    eco: 'C65',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'Nf6', 'O-O', 'Nxe4', 'd4', 'Nd6', 'Bxc6', 'dxc6', 'dxe5', 'Nf5', 'Qxd8+', 'Kxd8'],
    tips: {
      5: 'The Berlin — Kramnik\u2019s legendary drawing weapon.',
      7: 'Strike at e4 immediately; the ending you get is excellent.',
      11: 'Break the pin — doubled pawns are no problem here.',
      17: 'The famous Berlin endgame: solid, hard to crack, annoying for White.'
    }
  },
  {
    id: 'b-qgd-orthodox',
    family: 'qgd',
    name: 'QGD — Orthodox Setup (as Black)',
    side: 'black',
    eco: 'D35',
    moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Be7', 'e3', 'O-O', 'Nf3', 'h6', 'Bh4', 'b6', 'cxd5', 'Nxd5', 'Bxe7', 'Qxe7', 'Nxd5', 'exd5'],
    tips: {
      3: 'Hold d5 and free the dark-squared bishop.',
      7: 'Unwind naturally; e7 is the perfect square.',
      9: 'Castle early — this opening is famously sound.',
      11: 'h6 gains a tempo and pushes the bishop to h4.',
      17: 'Recapture with the queen and your rooks connect.'
    }
  },
  {
    id: 'w-scotch',
    name: 'Scotch Game — Main Line',
    side: 'white',
    family: 'kings-pawn',
    eco: 'C45',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4', 'exd4', 'Nxd4', 'Nf6', 'Nxc6', 'bxc6', 'e5', 'Qe7', 'Qe2', 'Nd5', 'c4', 'Nb6'],
    tips: {
      4: 'The Scotch strike: open the centre before Black is fully set up.',
      6: 'Recapture toward the middle — the d4-knight is a strong post.',
      8: 'Trade on c6: opening lines matters more than the bishop pair here.',
      10: 'e5 drives the f6-knight and buys real space.',
      12: 'The queen defends e5 and eyes the kingside.',
      14: 'Kick the knight off its beautiful d5-square.'
    }
  },
  {
    id: 'w-four-knights',
    name: 'Four Knights Game — Spanish Variation',
    side: 'white',
    family: 'kings-pawn',
    eco: 'C49',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Nc3', 'Nf6', 'Bb5', 'Bb4', 'O-O', 'O-O', 'd3', 'Bxc3', 'bxc3', 'd6', 'Bg5'],
    tips: {
      6: 'The Spanish pin — the Four Knights’ most testing line.',
      8: 'Castle into the symmetrical position; be the first to break it.',
      10: 'd3 keeps everything solid and frees the bishop.',
      12: 'Recapture with the pawn — doubled but with a half-open b-file.',
      14: 'Pin the knight and dare Black to loosen the kingside.'
    }
  },
  {
    id: 'w-kings-gambit',
    name: 'King’s Gambit — Main Line',
    side: 'white',
    family: 'kings-pawn',
    eco: 'C33',
    moves: ['e4', 'e5', 'f4', 'exf4', 'Nf3', 'g5', 'h4', 'g4', 'Ne5', 'Nf6', 'Bc4', 'd5', 'exd5', 'Nxd5', 'O-O'],
    tips: {
      2: 'The romantic gambit: a pawn for the centre and open lines.',
      4: 'Develop with tempo — the knight eyes the f4-pawn.',
      6: 'h4 provokes …g4, diverting the pawn from the kingside.',
      8: 'The knight centralizes before taking back on f4.',
      10: 'The bishop aims at f7 — the classic King’s Gambit idea.',
      12: 'Open the centre while Black’s king is stuck in the middle.',
      14: 'Castle up despite the pawn deficit — your pieces sing, Black’s do not.'
    }
  },
  {
    id: 'w-vienna',
    name: 'Vienna Game — Gambit Line',
    side: 'white',
    family: 'kings-pawn',
    eco: 'C29',
    moves: ['e4', 'e5', 'Nc3', 'Nf6', 'f4', 'd5', 'fxe5', 'Nxe4', 'Nf3', 'Be7', 'd4', 'O-O'],
    tips: {
      2: 'Flexible development that can explode into f4 at any moment.',
      4: 'The Vienna Gambit: a pawn for a huge central build-up.',
      6: 'Take first — the recapture on e5 comes with tempo.',
      8: 'Nf3 develops, defends, and prepares to castle.',
      10: 'Slam d4 down: pawns on d4 and e5 strangle Black.'
    }
  },
  {
    id: 'w-bishops-opening',
    name: 'Bishop’s Opening — Main Line',
    side: 'white',
    family: 'kings-pawn',
    eco: 'C27',
    moves: ['e4', 'e5', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd4', 'exd4', 'cxd4', 'Bb4+', 'Bd2', 'Bxd2+', 'Nxd2'],
    tips: {
      2: 'The oldest gambit line: bishop first, centre second.',
      4: 'Prepare d4 — the pawn duo is the whole plan.',
      6: 'Strike the centre.',
      8: 'Recapture with tempo — the d-pawn hits the c5-bishop.',
      10: 'Block the check and offer the bishop trade.',
      12: 'Recapture with the knight — the d4-pawn is strong and safe.'
    }
  },
  {
    id: 'b-petrov',
    name: 'Petrov’s Defence — Russian Game',
    side: 'black',
    family: 'kings-pawn',
    eco: 'C42',
    moves: ['e4', 'e5', 'Nf3', 'Nf6', 'Nxe5', 'd6', 'Nf3', 'Nxe4', 'd4', 'd5', 'Bd3', 'Bd6', 'O-O', 'O-O', 'c4', 'c6'],
    tips: {
      1: 'Counterattack the e5-pawn immediately — no need to defend passively.',
      5: 'd6 kicks the knight and underpins the centre.',
      7: 'Win the e4-pawn: the Petrov’s main idea.',
      9: 'Consolidate before grabbing more — d5 locks the position in your favour.',
      11: 'The bishop settles on its perfect diagonal.',
      15: 'c6 blunts the bishop and completes the fortress.'
    }
  },
  {
    id: 'b-philidor',
    name: 'Philidor Defence — Hanham Setup',
    side: 'black',
    family: 'kings-pawn',
    eco: 'C41',
    moves: ['e4', 'e5', 'Nf3', 'd6', 'd4', 'exd4', 'Nxd4', 'Nf6', 'Nc3', 'Be7', 'Bc4', 'O-O', 'O-O'],
    tips: {
      3: 'Solid as a rock: d6 supports e5 and frees the bishop.',
      5: 'Trade before White builds a full centre.',
      7: 'The knight attacks d4 and readies …Be7.',
      9: 'Unwind the f8-bishop before committing.',
      11: 'Castle into the Hanham setup — famously hard to crack.'
    }
  }
];

