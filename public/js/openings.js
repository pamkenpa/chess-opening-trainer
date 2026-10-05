// Opening classifier: identifies an opening from canonical SAN moves.
// classify(sanMoves) -> { name, eco, family, familyName } | null  (longest prefix wins)
// Check/mate symbols are ignored when matching.

const T = (moves, name, eco, family, familyName) => ({ moves, name, eco, family, familyName });
const TABLE = [
  // --- 1.e4 e5: Ruy Lopez ---
  T(['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7', 'Re1', 'b5', 'Bb3', 'O-O', 'c3', 'd5', 'exd5', 'Nxd5', 'Nxe5', 'Nxe5', 'Rxe5', 'c6', 'd4', 'Bd6', 'Re1', 'Qh4', 'g3', 'Qh3'], 'Ruy Lopez: Marshall Attack', 'C89', 'ruy'),
  T(['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7', 'Re1', 'b5', 'Bb3', 'd6', 'c3', 'O-O', 'h3', 'Nb8'], 'Ruy Lopez: Breyer Variation', 'C90', 'ruy'),
  T(['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7', 'Re1', 'b5', 'Bb3', 'd6', 'c3', 'O-O', 'h3', 'Bb7'], 'Ruy Lopez: Zaitsev Variation', 'C92', 'ruy'),
  T(['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7', 'Re1', 'b5', 'Bb3', 'd6', 'c3', 'O-O', 'h3', 'Na5'], 'Ruy Lopez: Chigorin Variation', 'C96', 'ruy'),
  T(['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7', 'Re1', 'b5', 'Bb3', 'd6', 'c3', 'O-O', 'h3'], 'Ruy Lopez: Closed', 'C84', 'ruy'),
  T(['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Bxc6', 'dxc6'], 'Ruy Lopez: Exchange Variation', 'C68', 'ruy'),
  T(['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'Nf6'], 'Ruy Lopez: Berlin Defence', 'C65', 'ruy'),
  T(['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'f5'], 'Ruy Lopez: Schliemann Defence', 'C63', 'ruy'),
  T(['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'd6'], 'Ruy Lopez: Old Steinitz Defence', 'C62', 'ruy'),
  T(['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6'], 'Ruy Lopez: Morphy Defence', 'C70', 'ruy'),
  T(['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'], 'Ruy Lopez Opening', 'C60', 'ruy'),
  // --- 1.e4 e5: Italian ---
  T(['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'b4'], 'Italian Game: Evans Gambit', 'C51', 'italian'),
  T(['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'Ng5'], 'Italian Game: Knight Attack', 'C57', 'italian'),
  T(['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd3', 'd6'], 'Italian Game: Giuoco Pianissimo', 'C50', 'italian'),
  T(['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'd3'], 'Italian Game: Two Knights Defence', 'C55', 'italian'),
  T(['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5'], 'Italian Game: Giuoco Piano', 'C50', 'italian'),
  T(['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'], 'Italian Game', 'C50', 'italian'),
  // --- 1.e4 e5: other ---
  T(['e4', 'e5', 'Nf3', 'Nc6', 'd4', 'exd4', 'Nxd4', 'Nf6', 'Nxc6'], 'Scotch Game', 'C45', 'kings-pawn'),
  T(['e4', 'e5', 'Nf3', 'Nc6', 'd4'], 'Scotch Game', 'C44', 'kings-pawn'),
  T(['e4', 'e5', 'Nf3', 'Nc6', 'Nc3', 'Nf6', 'Bb5'], 'Four Knights Game: Spanish Variation', 'C48', 'kings-pawn'),
  T(['e4', 'e5', 'Nf3', 'Nc6', 'Nc3', 'Nf6'], 'Four Knights Game', 'C46', 'kings-pawn'),
  T(['e4', 'e5', 'Nf3', 'Nf6', 'Nxe5', 'd6', 'Nf3', 'Nxe4', 'd4', 'd5', 'Bd3', 'Bd6', 'O-O', 'O-O', 'c4', 'c6'], 'Petrov\u2019s Defence: Modern Attack', 'C43', 'kings-pawn'),
  T(['e4', 'e5', 'Nf3', 'Nf6'], 'Petrov\u2019s Defence', 'C42', 'kings-pawn'),
  T(['e4', 'e5', 'Nf3', 'd6', 'd4', 'exd4', 'Nxd4', 'Nf6', 'Nc3', 'Be7', 'Bc4', 'O-O', 'O-O'], 'Philidor Defence: Hanham Setup', 'C41', 'kings-pawn'),
  T(['e4', 'e5', 'Nf3', 'd6'], 'Philidor Defence', 'C41', 'kings-pawn'),
  T(['e4', 'e5', 'Nf3'], 'King\u2019s Knight Opening', 'C40', 'kings-pawn'),
  T(['e4', 'e5', 'f4', 'exf4', 'Nf3'], 'King\u2019s Gambit Accepted', 'C36', 'kings-pawn'),
  T(['e4', 'e5', 'f4', 'exf4'], 'King\u2019s Gambit Accepted', 'C33', 'kings-pawn'),
  T(['e4', 'e5', 'f4', 'd5'], 'Falkbeer Counter-Gambit', 'C31', 'kings-pawn'),
  T(['e4', 'e5', 'f4'], 'King\u2019s Gambit', 'C30', 'kings-pawn'),
  T(['e4', 'e5', 'Nc3', 'Nf6', 'f4'], 'Vienna Gambit', 'C29', 'kings-pawn'),
  T(['e4', 'e5', 'Nc3', 'Nf6'], 'Vienna Game: Falkbeer', 'C27', 'kings-pawn'),
  T(['e4', 'e5', 'Nc3'], 'Vienna Game', 'C25', 'kings-pawn'),
  T(['e4', 'e5', 'Bc4', 'Nf6', 'd4', 'exd4', 'Nf3'], 'Bishop\u2019s Opening: Gambit', 'C24', 'kings-pawn'),
  T(['e4', 'e5', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd4', 'exd4', 'cxd4', 'Bb4+', 'Bd2', 'Bxd2+', 'Nxd2'], 'Bishop\u2019s Opening: Main Line', 'C27', 'kings-pawn'),
  T(['e4', 'e5', 'Bc4'], 'Bishop\u2019s Opening', 'C23', 'kings-pawn'),
  T(['e4', 'e5', 'd4', 'exd4', 'Qxd4', 'Nc6'], 'Centre Game', 'C21', 'kings-pawn'),
  T(['e4', 'e5', 'd4'], 'Centre Game', 'C21', 'kings-pawn'),
  T(['e4', 'e5'], 'King\u2019s Pawn Game', 'C20', 'kings-pawn'),
  // --- Sicilian ---
  T(['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6', 'Be3', 'e5', 'Nb3', 'Be7', 'f3', 'O-O', 'Qd2', 'Nbd7'], 'Sicilian Defence: Najdorf, English Attack', 'B90', 'sicilian'),
  T(['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'], 'Sicilian Defence: Najdorf Variation', 'B90', 'sicilian'),
  T(['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'g6', 'Be3', 'Bg7'], 'Sicilian Defence: Dragon Variation', 'B70', 'sicilian'),
  T(['e4', 'c5', 'Nf3', 'e6', 'd4', 'cxd4', 'Nxd4', 'Nc6'], 'Sicilian Defence: Taimanov Variation', 'B45', 'sicilian'),
  T(['e4', 'c5', 'Nf3', 'Nc6'], 'Sicilian Defence: Old Sicilian', 'B30', 'sicilian'),
  T(['e4', 'c5', 'Nc3'], 'Sicilian Defence: Closed', 'B23', 'sicilian'),
  T(['e4', 'c5', 'c3'], 'Sicilian Defence: Alapin Variation', 'B22', 'sicilian'),
  T(['e4', 'c5', 'd4'], 'Sicilian Defence: Open', 'B54', 'sicilian'),
  T(['e4', 'c5'], 'Sicilian Defence', 'B20', 'sicilian'),
  // --- Caro-Kann ---
  T(['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5', 'Ng3', 'Bg6', 'h4', 'h6', 'Nf3', 'Nd7', 'h5', 'Bh7', 'Bd3', 'Bxd3', 'Qxd3'], 'Caro-Kann Defence: Classical', 'B18', 'caro'),
  T(['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5'], 'Caro-Kann Defence: Classical', 'B18', 'caro'),
  T(['e4', 'c6', 'd4', 'd5', 'e5'], 'Caro-Kann Defence: Advance', 'B12', 'caro'),
  T(['e4', 'c6', 'd4', 'd5'], 'Caro-Kann Defence', 'B12', 'caro'),
  T(['e4', 'c6'], 'Caro-Kann Defence', 'B10', 'caro'),
  // --- French ---
  T(['e4', 'e6', 'd4', 'd5', 'Nc3', 'Bb4'], 'French Defence: Winawer Variation', 'C15', 'french', 'French Defence'),
  T(['e4', 'e6', 'd4', 'd5', 'Nc3', 'Nf6'], 'French Defence: Classical', 'C11', 'french', 'French Defence'),
  T(['e4', 'e6', 'd4', 'd5', 'e5'], 'French Defence: Advance', 'C02', 'french', 'French Defence'),
  T(['e4', 'e6', 'd4', 'd5', 'Nd2'], 'French Defence: Tarrasch Variation', 'C03', 'french', 'French Defence'),
  T(['e4', 'e6', 'd4', 'd5'], 'French Defence: Normal Variation', 'C01', 'french', 'French Defence'),
  T(['e4', 'e6', 'd4'], 'French Defence', 'C00', 'french', 'French Defence'),
  T(['e4', 'e6'], 'French Defence', 'C00', 'french', 'French Defence'),
  // --- other semi-open ---
  T(['e4', 'd5', 'exd5', 'Qxd5', 'Nc3', 'Qa5'], 'Scandinavian Defence: Main Line', 'B01', 'scandinavian', 'Scandinavian Defence'),
  T(['e4', 'd5', 'exd5', 'Qxd5', 'Nc3'], 'Scandinavian Defence: Main Line', 'B01', 'scandinavian', 'Scandinavian Defence'),
  T(['e4', 'd5', 'exd5', 'Nf6'], 'Scandinavian Defence: Modern', 'B01', 'scandinavian', 'Scandinavian Defence'),
  T(['e4', 'd5'], 'Scandinavian Defence', 'B01', 'scandinavian', 'Scandinavian Defence'),
  T(['e4', 'd6', 'd4', 'Nf6'], 'Pirc Defence', 'B07', 'pirc', 'Pirc Defence'),
  T(['e4', 'g6', 'd4', 'Nf6'], 'Modern Defence', 'B06', 'modern', 'Modern Defence'),
  T(['e4', 'g6'], 'Modern Defence', 'B06', 'modern', 'Modern Defence'),
  T(['e4', 'Nf6', 'e5', 'Nd5', 'd4', 'd6'], 'Alekhine\u2019s Defence: Modern', 'B03', 'alekhine', 'Alekhine\u2019s Defence'),
  T(['e4', 'Nf6'], 'Alekhine\u2019s Defence', 'B02', 'alekhine', 'Alekhine\u2019s Defence'),
  // --- 1.d4 ---
  T(['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Be7', 'e3', 'O-O', 'Nf3', 'h6', 'Bh4', 'b6', 'cxd5', 'Nxd5', 'Bxe7', 'Qxe7', 'Nxd5', 'exd5'], 'Queen\u2019s Gambit Declined: Exchange', 'D35', 'qgd'),
  T(['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5'], 'Queen\u2019s Gambit Declined: Classical', 'D50', 'qgd'),
  T(['d4', 'd5', 'c4', 'e6'], 'Queen\u2019s Gambit Declined', 'D30', 'qgd'),
  T(['d4', 'd5', 'c4', 'dxc4'], 'Queen\u2019s Gambit Accepted', 'D20', 'qgd'),
  T(['d4', 'd5', 'c4', 'c6', 'Nf3', 'Nf6', 'Nc3', 'dxc4', 'a4', 'Bf5', 'e3', 'e6', 'Bxc4', 'Bb4'], 'Slav Defence: Main Line', 'D15', 'slav'),
  T(['d4', 'd5', 'c4', 'c6'], 'Slav Defence', 'D10', 'slav'),
  T(['d4', 'd5', 'c4'], 'Queen\u2019s Gambit', 'D06', 'qgd'),
  T(['d4', 'd5', 'Bf4', 'Nf6', 'e3', 'e6', 'Nf3', 'c5', 'c3'], 'London System', 'D02', 'london'),
  T(['d4', 'd5', 'Bf4'], 'London System', 'D02', 'london'),
  T(['d4', 'd5', 'Nf3', 'Nf6', 'Bf4'], 'London System', 'D02', 'london'),
  T(['d4', 'd5'], 'Queen\u2019s Pawn Game', 'D00', 'qpd', 'Queen\u2019s Pawn Game'),
  T(['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'd5'], 'Gr\u00FCnfeld Defence', 'D80', 'grunfeld', 'Gr\u00FCnfeld Defence'),
  T(['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7'], 'King\u2019s Indian Defence', 'E60', 'indian', 'Indian Game'),
  T(['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4'], 'Nimzo-Indian Defence', 'E20', 'indian', 'Indian Game'),
  T(['d4', 'Nf6', 'c4', 'e6'], 'Indian Game: East Indian', 'E00', 'indian', 'Indian Game'),
  T(['d4', 'Nf6', 'c4'], 'Indian Game', 'E00', 'indian', 'Indian Game'),
  T(['d4', 'Nf6'], 'Indian Game', 'A45', 'indian', 'Indian Game'),
  T(['d4', 'f5'], 'Dutch Defence', 'A80', 'dutch', 'Dutch Defence'),
  T(['d4'], 'Queen\u2019s Pawn Opening', 'A40', 'qpd', 'Queen\u2019s Pawn Game'),
  // --- flanks ---
  T(['c4', 'e5'], 'English Opening: Reversed Sicilian', 'A20', 'english', 'English Opening'),
  T(['c4'], 'English Opening', 'A10', 'english', 'English Opening'),
  T(['Nf3', 'd5', 'g3'], 'King\u2019s Indian Attack', 'A07', 'kia', 'King\u2019s Indian Attack'),
  T(['Nf3', 'd5'], 'Zukertort Opening', 'A06', 'reti', 'R\u00E9ti Opening'),
  T(['Nf3', 'd5', 'd4'], 'Queen\u2019s Pawn Game: Zukertort', 'A06', 'reti', 'R\u00E9ti Opening'),
  T(['Nf3'], 'R\u00E9ti Opening', 'A04', 'reti', 'R\u00E9ti Opening'),
  T(['f4'], 'Bird\u2019s Opening', 'A02', 'birds', 'Bird\u2019s Opening'),
  T(['g3'], 'Benko Opening', 'A00', 'benko', 'Benko Opening'),
  T(['b3'], 'Larsen\u2019s Opening', 'A01', 'larsen', 'Larsen\u2019s Opening'),
  T(['e4'], 'King\u2019s Pawn Opening', 'B00', 'kings-pawn')
];

const norm = (s) => s.replace(/[+#]/g, '');

export function classify(sanMoves) {
  const seq = (sanMoves || []).map(norm);
  let best = null;
  for (const e of TABLE) {
    if (e.moves.length > seq.length) continue;
    let ok = true;
    for (let i = 0; i < e.moves.length; i++) {
      if (e.moves[i] !== seq[i]) { ok = false; break; }
    }
    if (ok && (!best || e.moves.length > best.moves.length)) best = e;
  }
  return best;
}
