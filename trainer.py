#!/usr/bin/env python3
"""
Chess opening sparring bot.

The bot announces an opening and plays the opponent's side; you play the
other side from memory, one move at a time (SAN, e.g. e4, Nf3, Bb5, O-O).
Only the opening is drilled -- the drill ends when the book line ends.

Usage:
    python trainer.py                  # start drilling (weakest openings first)
    python trainer.py --no-board       # don't print the board after each move
    python trainer.py --opening Najdorf
    python trainer.py --list           # list all openings in the book

In-drill commands:  h = hint, s = show remaining moves,
                    g = give up, b = toggle board, q = quit
"""
import argparse
import json
import os
import random
import sys

try:
    import chess
except ImportError:
    sys.exit("The 'chess' package is missing. Install it with:  pip install chess")

# ----------------------------------------------------------------------------
# The book: each drill is a single main line. "side" is the color YOU play.
# Moves are in SAN, alternating White/Black starting from the initial position.
# ----------------------------------------------------------------------------

BOOK = [
    # --------------------------- You play White ---------------------------
    dict(
        name="Italian Game",
        side="w",
        moves="e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d3 d6 O-O O-O".split(),
        intro=("The Italian Game is chess's oldest opening: fight for the center, "
               "develop every piece toward the middle, and castle early. This slow, "
               "solid version keeps a healthy pawn structure while preparing the "
               "central break d4."),
        notes=[
            "Grab your share of the center and open lines for the bishop and queen — the classical first move.",
            "Black claims an equal share of the center and frees their pieces at the same time.",
            "Develop a knight toward the center and attack the e5 pawn — one move, three jobs.",
            "Defend e5 with a developing move of its own. Golden rule: don't defend with pawns if a piece can do it.",
            "Develop toward the center and aim at f7 — the weakest square in Black's camp, defended only by the king.",
            "Black mirrors perfectly: develop, aim at f2, and get ready to castle. This solid setup is called the Giuoco Pianissimo.",
            "Prepare the central break d4: the c-pawn will support it without exposing the queen.",
            "Develop the last minor piece and counterattack e4 at the same time — always develop with tempo when you can.",
            "Solidly support e4 and keep the tension. White finishes development before opening the game.",
            "Open the light-squared bishop's diagonal and reinforce e5 — flexible and safe.",
            "King safety first! Get the king out of the center before starting the fight.",
            "Both kings are safe and every piece has a job — the middlegame begins with roughly equal chances.",
        ],
        idea="Slow build-up: c3 and d3 prepare d4 later, and Bc4 eyes f7.",
    ),
    dict(
        name="Ruy Lopez (Closed)",
        side="w",
        moves="e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3".split(),
        intro=("The Ruy Lopez (Spanish Game) is the oldest and most respected answer "
               "to 1...e5. White pressures the knight that guards e5, builds a slow "
               "kingside attack behind a safe king, and only plays d4 once every "
               "piece is working."),
        notes=[
            "Take the center and open lines — the classical start.",
            "Black stakes an equal claim; the fight for the center begins.",
            "Develop with an attack on e5 — the model developing move.",
            "Defend e5 with a developing piece; symmetry with a purpose.",
            "The Spanish bishop: put long-range pressure on the knight that guards e5.",
            "The Morphy Defense: kick the bishop before it can trade itself for the c6-knight and damage Black's pawns.",
            "Keep the pressure from a safe square — the bishop still eyes the knight.",
            "Develop and counterattack e4 at once — Black develops with tempo too.",
            "Castle before opening the center: king safety outranks a quick d4 here.",
            "Break the pin by preparing to castle; solid development comes first.",
            "Add a second attacker to e5 and prepare c3+d4 — rooks belong on files that are about to open.",
            "Win space on the queenside and chase the bishop one more square.",
            "Retreat, but keep aiming at f7 — this bishop is a lifelong kingside attacker.",
            "Open the light-squared bishop and solidify e5. Black's setup is complete and flexible.",
            "Prepare d4 behind the pawn chain — the closed Ruy build-up is finished.",
        ],
        idea="Bb5 hits the knight guarding e5; build with Re1, Bb3 and c3 before d4.",
    ),
    dict(
        name="Scotch Game (Classical)",
        side="w",
        moves="e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6 Nxc6 bxc6 e5 Qe7 Qe2 Nd5 c4".split(),
        intro=("The Scotch Game opens the center on move three. If you like fast, "
               "open piece play instead of slow maneuvering, this is the classical "
               "way to meet 1...e5 — immediate clarity in the center."),
        notes=[
            "Take the center and open lines for your pieces.",
            "Black mirrors — an equal, classical start.",
            "Develop the knight toward the center with a threat on e5.",
            "Defend e5 with a developing move.",
            "Open the center immediately: challenge e5 so the position unlocks while both sides are developed evenly.",
            "Trade a center pawn for activity: open lines for Black's pieces.",
            "Recapture with development — the knight takes a strong central post.",
            "Develop and counterattack e4 at the same time.",
            "Trade on c6 first: double Black's pawns before they can castle — a long-term structural target.",
            "Recapture toward the center and open the b-file for the rook — structure given, activity gained.",
            "Use the extra space: push e5 and open the f1-bishop's diagonal in one move.",
            "Defend and develop: the queen hits e5 while getting into the game.",
            "Defend e5 a third time and keep every plan open — solid and flexible.",
            "The knight finds a great central square, attacking the pawn that chains White's position.",
            "Kick the knight with a pawn and take even more central space.",
        ],
        idea="Open the center immediately with d4; the e5 push gains space.",
    ),
    dict(
        name="Queen's Gambit Declined (Classical)",
        side="w",
        moves="d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 Nbd7 Rc1 c6".split(),
        intro=("The Queen's Gambit Declined is rock-solid chess: Black doesn't grab "
               "anything, just locks the center down. White's plan is patient — finish "
               "development, build up, and only then break with cxd5."),
        notes=[
            "Occupy the center and open the queen and bishop — the most solid first move.",
            "Black stakes an equal claim; the classical central standoff.",
            "The Queen's Gambit: attack d5 from the side and fight for the center with the c-pawn.",
            "Decline the gambit and reinforce d5 — solid, classical, and still world-champion approved.",
            "Develop and add a second attacker to d5 — every move should do more than one job.",
            "Develop while defending d5 and controlling e4 — the natural move.",
            "The pin: the f6-knight can't move without giving up its guard duty on d5.",
            "Break the pin by preparing to castle — resolve piece pressure with development.",
            "Open the dark-squared bishop and shore up d4. White finishes the pyramid build-up.",
            "Get the king safe first; the pawn breaks can wait.",
            "Complete development and guard e5 — only now think about breaks.",
            "Bring the b8-knight toward the center, where the middlegame will be fought.",
            "Prepare the cxd5 break on the file that will open — set the mousetrap, don't spring it early.",
            "Give d5 a third defender and free the queen — Black's fortress is ready.",
        ],
        idea="Pin the knight with Bg5, finish development, then prepare cxd5.",
    ),
    dict(
        name="London System",
        side="w",
        moves="d4 d5 Nf3 Nf6 Bf4 e6 e3 c5 c3 Nc6 Nbd2 Bd6 Bg3".split(),
        intro=("The London System is the ultimate low-theory opening: one safe setup "
               "against almost everything — Bf4, e3, c3, Nbd2, then a slow build-up. "
               "Learn it once and you can play it for the rest of your chess life."),
        notes=[
            "Take the center with the most flexible pawn.",
            "Black stakes a claim — the fight for d4/e4 squares begins.",
            "Develop toward the center; the knight supports e4 and d4 ideas.",
            "Black develops and controls e4 — completely normal.",
            "The London bishop: develop OUTSIDE the pawn chain before e3 locks it in — the key idea of the whole system.",
            "Black opens the light-squared bishop and prepares ...c5 counterplay.",
            "The little pyramid move: e3 supports d4 and opens the f1-bishop. Simple and strong.",
            "Strike at d4 with the c-pawn — Black plays for immediate central counterplay.",
            "Prop up d4 so nothing is loose: the c3-d4-e3 pyramid is very hard to crack.",
            "A third attacker on d4 — Black keeps the pressure while developing.",
            "Develop the last piece and defend d4 one more time. Every London move is safe and useful.",
            "Black develops and offers a bishop trade to make life easier.",
            "Retreat instead of trading: the bishop keeps watch on the kingside where Black will castle.",
        ],
        idea="A fixed, easy-to-remember setup: Bf4, e3, c3, Nbd2. No theory fights.",
    ),
    dict(
        name="Vienna Game (Gambit)",
        side="w",
        moves="e4 e5 Nc3 Nf6 f4 d5 fxe5 Nxe4 Nf3 Be7 d4".split(),
        intro=("The Vienna Gambit is the aggressive way to meet 1...e5: hit the center "
               "with f4 before Black is organized. Black's best defense declines the "
               "pawn — and even then White gets a beautiful big center."),
        notes=[
            "Take the center — and keep the f-pawn free for a quick strike.",
            "Black claims an equal center.",
            "Develop WITHOUT blocking the f-pawn: this little difference is what makes the Vienna dangerous.",
            "The most testing reply: develop and attack e4 immediately.",
            "The gambit! Strike the center and open the f1-bishop's diagonal. If Black grabs on e5, White gets a monster center.",
            "Decline and counterattack — Black's most reliable defense.",
            "Accept the space: the pawn lands in the heart of the center and cramps Black.",
            "Black grabs a pawn too — but the e4-knight is loose and will be kicked.",
            "Develop naturally and prepare d4: the center is coming back with interest.",
            "Black develops and castles before the e4-knight gets traded off — sensible defense.",
            "Build the full pawn center: two powerful pawns against Black's scattered ones. That's the gambit's point.",
        ],
        idea="f4 strikes the center at once; recapture and hit back with d4.",
    ),
    dict(
        name="English Opening (Reversed Sicilian)",
        side="w",
        moves="c4 e5 Nc3 Nf6 g3 d5 cxd5 Nxd5 Bg2 Nb6 Nf3 Nc6 O-O".split(),
        intro=("The English Opening is a Sicilian Defense with colors reversed — and "
               "the extra tempo White gains makes a real difference. The plan: "
               "fianchetto the g2-bishop and apply slow, lasting pressure on d5."),
        notes=[
            "Fight for d5 from the side: control the center without occupying it — hypermodern and flexible.",
            "Black claims the center in Sicilian style, but White has a free tempo up on development.",
            "Develop and increase the pressure on d5.",
            "Develop with flexibility — the knight controls e4 and helps hold d5.",
            "Prepare the fianchetto: the g2-bishop will press along the whole long diagonal — the English's main weapon.",
            "Challenge the center before all of White's pieces point at it.",
            "Open lines and force the issue — the position becomes a reversed Sicilian, with White a tempo up.",
            "Recapture with development, keeping the knight active in the center.",
            "The fianchetto bishop arrives, staring down the entire long diagonal at d5. The pressure starts.",
            "Step out of the bishop's glare while staying flexible — c4 and d5 squares are still watched.",
            "Develop the last minor piece toward the center; White's build-up is nearly done.",
            "Match development and fight for the d4/e5 central squares.",
            "Castle, connect rooks, and complete the setup — the slow squeeze on d5 comes next.",
        ],
        idea="A Sicilian with an extra tempo: fianchetto and pressure d5.",
    ),
    # --------------------------- You play Black ---------------------------
    dict(
        name="Sicilian Defense (Najdorf)",
        side="b",
        moves="e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Bg5 e6 f4 Be7".split(),
        intro=("The Najdorf is the most celebrated line of the Sicilian — Fischer's "
               "and Kasparov's weapon. Black accepts slightly less space in exchange "
               "for dynamic queenside and central counterplay against White's center."),
        notes=[
            "White takes the center — and Black immediately fights back from the side.",
            "The Sicilian! Instead of mirroring, Black unbalances the game and plays for a win with the c-pawn strike.",
            "Develop and prepare d4 — White's most testing way to meet the Sicilian.",
            "Open the light-squared bishop's diagonal and stop any early e5. Flexibility first.",
            "The Open Sicilian: White strikes the center and opens lines — maximum ambition.",
            "Trade a wing pawn for a center pawn and open the c-file for the rook — a great deal for Black.",
            "White recaptures in the center; the knight is strong there but slightly exposed to ...a6 and ...e5 ideas.",
            "Develop and attack e4 at the same time — develop with tempo.",
            "Defend e4 and develop. The main-line battleground is set.",
            "The Najdorf move: control b5 so the bishop can't check or trade itself comfortably, while keeping BOTH ...e5 and ...e6 available. Flexibility is the whole point.",
            "The sharpest try: pin the knight and prepare the f4/e5 space-gaining pushes.",
            "Open the light-squared bishop, kill the Bb5 ideas for good, and eye ...b5 counterplay on the queenside.",
            "Build the big center — White claims space, but every pawn pushed is a pawn that can be attacked.",
            "Develop, castle, and prepare the counterstrike: ...Qb6, ...b5 or ...d5 — Black's pieces wake up.",
        ],
        idea="...a6 controls b5 and keeps both ...e5 and ...e6 available.",
    ),
    dict(
        name="French Defense (Steinitz)",
        side="b",
        moves="e4 e6 d4 d5 Nc3 Nf6 e5 Nfd7 f4 c5 Nf3 Nc6".split(),
        intro=("The French Defense is a fighter's opening: Black gives White a big "
               "pawn center purely so it can be attacked. The Steinitz line is the "
               "classic plan — hem in the f6-knight, then strike the chain's base "
               "with ...c5."),
        notes=[
            "White grabs the center — the French's whole strategy is built around undermining it.",
            "Prepare ...d5: the French keeps the position closed at first and plays for a pawn-chain battle.",
            "White builds the ideal pawn duo; e4 and d4 together control lots of key squares.",
            "The defining French move: attack the chain's base (e4) head-on and lock the structure.",
            "Defend e4 and develop — the main line keeps maximum tension.",
            "Add a third attacker to e4 — constant pressure on the base of the chain.",
            "White pushes the chain forward for space — but every pushed pawn is also a target that can't retreat.",
            "The Steinitz retreat: step back with PURPOSE — the knight now eyes the c5 and e5 squares.",
            "Support e5 and grab kingside space — but f4 can become weak too. The chain cuts the board in two.",
            "Strike the base! ...c5 against d4 is the heart of every French strategy.",
            "Develop and defend d4 — the natural square, keeping things solid.",
            "Complete development, add a fourth attacker to d4, and prepare ...Qb6 — Black's pieces are fully awake.",
        ],
        idea="Bottle the knight in with Nfd7, then undermine e5 with ...c5.",
    ),
    dict(
        name="Caro-Kann Defense (Classical)",
        side="b",
        moves="e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 h4 h6 Nf3 Nd7".split(),
        intro=("The Caro-Kann is the solid cousin of the French: Black challenges e4 "
               "WITHOUT shutting in the light-squared bishop. The Classical variation "
               "develops that bishop outside the pawn chain — healthy, durable chess "
               "with almost no risk."),
        notes=[
            "White takes the center with big ambitions.",
            "The Caro-Kann signature: prepare ...d5 while keeping the c8-bishop's diagonal free. That's the whole idea.",
            "White builds the big pawn center.",
            "NOW the challenge to e4 comes — with the bishop still able to develop freely.",
            "Defend e4 — the Classical line keeps the tension as long as possible.",
            "Trade before the bishop gets locked in: release the tension and open the c-file for the rook.",
            "White recaptures with the knight — a strong central post, but now it can be harassed.",
            "The signature move: develop the 'problem bishop' OUTSIDE the pawn chain, with tempo against the knight.",
            "The knight retreats and harasses the bishop back — but Black's bishop remains useful.",
            "Step back calmly. The bishop stays outside the chain and Black has zero weaknesses.",
            "Try to embarrass the g6-bishop with a pawn storm — White's only way to pose a question.",
            "Give the bishop a landing square on h7 and stop h5. Simple, effective, unhurried.",
            "Develop normally — White has spent two tempi on h4 and h6; Black is fully level.",
            "Bring the last knight to life — Black's development flows out smoothly.",
        ],
        idea="Develop the light-squared bishop OUTSIDE the pawn chain with Bf5.",
    ),
    dict(
        name="King's Indian Defense (Mar del Plata)",
        side="b",
        moves="d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O Nc6 d5 Ne7".split(),
        intro=("The King's Indian is the boldest defense against 1.d4: Black lets "
               "White build a huge center just to blow it up with ...e5. The Mar del "
               "Plata setup leads to the most famous kingside attacks in chess "
               "history — with both kings castling in opposite directions."),
        notes=[
            "White takes the center; Black develops and hides its plans.",
            "Develop and prepare the fianchetto — hypermodern: control the center with pieces first.",
            "Claim queenside space and prepare Nc3 — White's classical big-center setup.",
            "Fianchetto time: this bishop will become Black's best piece, pressing at d4 and supporting ...e5.",
            "Develop and defend e4/d5 — the center grows on White's side only. That's the KID bargain.",
            "The dragon bishop lands on g7 — the long diagonal is loaded.",
            "White takes the FULL center — exactly what King's Indian players want: a big, juicy target.",
            "Solid support for e5; the light-squared bishop's diagonal opens too. The shell is complete.",
            "Natural development — White's perfect classical center is finished.",
            "Castle early: the king tucks away while the attack prepares itself.",
            "Quiet development; White finishes the build-up before choosing a plan.",
            "The explosion begins: ...e5 hits the center and gains kingside space in one move.",
            "White castles too — now the legendary race: White storms the queenside, Black storms the king.",
            "Develop with maximum pressure on d4 — White must commit to a plan.",
            "Close the center with the pawn wedge and grab queenside space — the Mar del Plata structure.",
            "The knight reroutes to e7 to make room for the ...f5 pawn storm against White's king.",
        ],
        idea="Fianchetto, castle, then hit the center with ...e5.",
    ),
    dict(
        name="Slav Defense (Main Line)",
        side="b",
        moves="d4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5 e3 e6 Bxc4 Bb4".split(),
        intro=("The Slav Defense defends d5 with ...c6, keeping the light-squared "
               "bishop free — which makes it the most solid way to meet the Queen's "
               "Gambit. In the main line Black even grabs the c4 pawn and fights "
               "to hold it with active piece play."),
        notes=[
            "White takes the center; Black stakes an equal claim.",
            "The classical standoff — both pawns control key central squares.",
            "The Queen's Gambit: attack d5 from the side to undermine Black's center.",
            "The Slav! Support d5 with a pawn while keeping the c8-bishop free. So healthy compared to ...e6.",
            "Develop toward the center — natural and flexible.",
            "Develop and attack e4 — symmetry with a point.",
            "Develop and defend e4; White is ready for the e4 push if Black does nothing.",
            "Take the pawn! Black is temporarily up a pawn — White will win it back with tempo, but Black buys free development.",
            "Stop ...b5, which would save the extra pawn. A necessary little pawn move.",
            "The key Slav idea again: develop the light-squared bishop OUTSIDE the chain, with tempo against the knight.",
            "Open the f1-bishop so it can recapture on c4 and shore up d4.",
            "A quiet strengthening move: open the d7 square for the knight and prepare the pin that follows.",
            "White regains the pawn — material is level and the position is full of life.",
            "Develop WITH pressure: the pin against c3 makes the knight a target — activity as compensation.",
        ],
        idea="Take on c4 and develop Bf5 before locking in with ...e6.",
    ),
    dict(
        name="Nimzo-Indian Defense (Rubinstein)",
        side="b",
        moves="d4 Nf6 c4 e6 Nc3 Bb4 e3 O-O Bd3 d5 Nf3 c5 O-O Nc6".split(),
        intro=("The Nimzo-Indian is the classiest answer to 1.d4 — hypermodern "
               "chess: control the center with pieces first, pawns later. Bb4 pins "
               "the very knight that fights for e4, without Black committing a "
               "single center pawn."),
        notes=[
            "White takes the center with the most ambitious pawn — the fight for d4 and e4 begins.",
            "White occupies the center; Black develops and keeps its options wide open.",
            "More central control — White prepares Nc3 and the perfect pawn duo.",
            "Open the f8-bishop and prepare the pin — flexible, hypermodern development.",
            "Develop; White's ideal center setup is complete.",
            "The Nimzo! Pin the knight — the piece that fights for e4 — and threaten ...Bxc3 to wreck White's pawn structure.",
            "The Rubinstein setup: White avoids the doubled pawns, plays solidly, and keeps a small pull.",
            "Castle fast: in hypermodern openings, king safety comes before the pawn strikes.",
            "Develop toward the center and support a future e4 push.",
            "NOW take the center with pawns — the bishop is out, the king is safe, the timing is perfect.",
            "Develop naturally toward the center — good moves stay good.",
            "Strike at d4 and open the c-file — Black's counterplay almost always starts with ...c5.",
            "White castles; the central tension is preserved — whoever breaks first must be ready.",
            "Full development and maximum pressure on d4. Black has equalized comfortably.",
        ],
        idea="Pin the knight with Bb4, then hit the center with ...d5 and ...c5.",
    ),
    dict(
        name="Philidor Defense",
        side="b",
        moves="e4 e5 Nf3 d6 d4 exd4 Nxd4 Nf6 Nc3 Be7".split(),
        intro=("The Philidor Defense is the honest, low-theory way to play 1...e5: "
               "solid, no big risks, easy to remember. Black trades early and reaches "
               "a playable middlegame with none of the theory headaches of the Open "
               "games."),
        notes=[
            "The classical start — center control and fast development.",
            "Black mirrors with an equal center.",
            "Develop with a threat on e5 — the natural attack.",
            "Instead of defending e5 with a knight, Black plays the flexible d6: the c8-bishop stays free. That's the Philidor's signature.",
            "White challenges the center at once.",
            "Trade and open the game — Black sidesteps the clogged tension.",
            "Recapture into a strong central square.",
            "Develop and counterattack e4 immediately — develop with tempo.",
            "Defend e4 and develop — the natural square for the queen's knight.",
            "Develop, prepare to castle, and enjoy a solid position with zero surprises.",
        ],
        idea="A solid, low-theory e5 defense: keep d6, trade in the center.",
    ),
    dict(
        name="Ruy Lopez (Closed, as Black)",
        side="b",
        moves="e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3 O-O".split(),
        intro=("The closed Ruy Lopez from the Black side: you trade some space for "
               "solid structure, then fight for the d5 break and queenside expansion. "
               "One of the most reliable ways to answer 1.e4 in all of chess."),
        notes=[
            "White takes the center — the classical fight begins.",
            "Take your share of the center and open lines: the classical equalizer.",
            "White develops with a threat on e5.",
            "Defend e5 with a developing move — never waste a tempo.",
            "The Spanish bishop pressures the knight that guards e5.",
            "The Morphy Defense: kick the bishop so it can't trade itself for the c6-knight and double your pawns.",
            "The bishop keeps the pressure from a safe distance.",
            "Develop and counterattack e4 — develop with tempo whenever possible.",
            "White castles first: king safety before grabbing space.",
            "Break the pin and prepare to castle — development over material.",
            "White builds up: the rook joins the attack on e5 and prepares c3+d4.",
            "Claim queenside space and chase the bishop one more square.",
            "The bishop retreats but keeps aiming at f7 — watch out for kingside attacks later.",
            "Open the light-squared bishop and solidify e5. Your setup is complete.",
            "White prepares d4 behind the chain — the build-up is finished.",
            "Castle and complete development: the closed Ruy structure is on the board — Black's plans revolve around the ...d5 break and queenside space.",
        ],
        idea="...a6 and ...b5 claim space; tuck the bishop to e7 and castle.",
    ),
]

STATS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "progress.json")

# Make chess glyphs and '·' safe on Windows terminals and piped output.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass


# ----------------------------------------------------------------------------
# Book validation + helpers
# ----------------------------------------------------------------------------

def validate_book():
    """Replay every line to catch typos before the user wastes a drill."""
    problems = []
    for drill in BOOK:
        board = chess.Board()
        for san in drill["moves"]:
            try:
                board.push_san(san)
            except ValueError:
                problems.append(f"{drill['name']}: illegal or ambiguous move '{san}'")
                break
    if problems:
        sys.exit("Book self-check failed:\n  " + "\n  ".join(problems))


def parse_san(board, text):
    """Parse user input tolerantly; returns a Move or None."""
    text = text.strip()
    if not text:
        return None
    candidates = [text]
    # Accept lowercase piece letters ("nf3"), but never touch "b4"/"d5" files.
    if text[0] in "nbqrk":
        candidates.append(text[0].upper() + text[1:])
    for cand in candidates:
        try:
            return board.parse_san(cand)
        except ValueError:
            continue
    return None


def numbered_moves(moves, start=0):
    """['e4','e5',...] -> '1.e4 e5 2.Nf3 Nc6'."""
    parts = []
    for idx in range(start, len(moves)):
        if idx % 2 == 0:
            parts.append(f"{idx // 2 + 1}.{moves[idx]}")
        else:
            parts.append(moves[idx])
    return " ".join(parts)


def render_board(board, flip=False):
    """Small unicode board; flip=True puts Black at the bottom."""
    ranks = range(7, -1, -1) if not flip else range(0, 8)
    files = list(range(0, 8)) if not flip else list(range(7, -1, -1))
    lines = []
    for r in ranks:
        cells = []
        for f in files:
            piece = board.piece_at(chess.square(f, r))
            if piece:
                cells.append(piece.unicode_symbol())
            else:
                cells.append("·" if (f + r) % 2 == 0 else " ")
        lines.append(f"{r + 1}  " + " ".join(cells))
    labels = " ".join("abcdefgh"[f] for f in files)
    lines.append("   " + labels)
    return "\n".join(lines)


# ----------------------------------------------------------------------------
# Progress tracking (persisted so weak openings come back more often)
# ----------------------------------------------------------------------------

def load_stats():
    try:
        with open(STATS_FILE, encoding="utf-8") as fh:
            return json.load(fh)
    except (OSError, ValueError):
        return {}


def save_stats(stats):
    try:
        with open(STATS_FILE, "w", encoding="utf-8") as fh:
            json.dump(stats, fh, indent=2)
    except OSError as exc:
        print(f"(could not save progress: {exc})")


def record_result(stats, name, perfect):
    entry = stats.setdefault(name, {"drills": 0, "perfect": 0})
    entry["drills"] += 1
    if perfect:
        entry["perfect"] += 1


def pick_drill(stats, exclude=None, wanted=None):
    """Weighted random pick: never-drilled first, then frequently-failed ones."""
    if wanted:
        wanted = wanted.lower()
        for drill in BOOK:
            if wanted in drill["name"].lower():
                return drill
        print(f"No opening matches '{wanted}'. Type 'l' to see the list.")
        return None

    pool = [d for d in BOOK if d["name"] != exclude] or BOOK
    weights = []
    for drill in pool:
        entry = stats.get(drill["name"])
        if not entry or entry["drills"] == 0:
            weights.append(3.0)
        else:
            success = entry["perfect"] / entry["drills"]
            weights.append(0.3 + (1.0 - success))
    return random.choices(pool, weights=weights, k=1)[0]


def print_book_list():
    print("\nOpenings in the book:")
    for i, drill in enumerate(BOOK, 1):
        who = "White" if drill["side"] == "w" else "Black"
        own = drill["moves"][0 if drill["side"] == "w" else 1 :: 2]
        print(f"  {i:2d}. {drill['name']}  ({who}, {len(own)} moves)")
    print()


# ----------------------------------------------------------------------------
# The drill itself
# ----------------------------------------------------------------------------

def run_drill(drill, show_board):
    user_is_white = drill["side"] == "w"
    board = chess.Board()
    line = drill["moves"]

    print("\n" + "=" * 60)
    print(f"  {drill['name']}  --  you play {'White' if user_is_white else 'Black'}")
    print("  (h=hint  s=show line  g=give up  b=board  q=quit)")
    print("=" * 60)

    flawed = False        # any hint/show/wrong move spoils the "perfect" result
    quit_requested = False
    gave_up = False

    def show_pos():
        if show_board:
            print(render_board(board, flip=not user_is_white))

    idx = 0
    while idx < len(line) and not quit_requested and not gave_up:
        users_turn = (board.turn == chess.WHITE) == user_is_white
        expected = parse_san(board, line[idx])

        if not users_turn:
            board.push(expected)
            print(f"Bot plays: {line[idx]}")
            show_pos()
            idx += 1
            continue

        move_no = board.fullmove_number
        dots = "." if board.turn == chess.WHITE else "..."
        while True:
            try:
                raw = input(f"{move_no}{dots} your move: ").strip()
            except EOFError:
                quit_requested = True
                break
            if not raw:
                continue
            cmd = raw.lower()
            if cmd in ("q", "quit", "exit"):
                quit_requested = True
                break
            if cmd in ("b", "board"):
                show_board = not show_board
                if show_board:
                    print(render_board(board, flip=not user_is_white))
                continue
            if cmd in ("h", "hint"):
                flawed = True
                print(f"  Hint: the theory move is {line[idx]}")
                continue
            if cmd in ("s", "show"):
                flawed = True
                print(f"  Remaining: {numbered_moves(line, idx)}")
                continue
            if cmd in ("g", "giveup", "give up"):
                flawed = True
                gave_up = True
                print(f"  The line was: {numbered_moves(line)}")
                break
            mv = parse_san(board, raw)
            if mv is None:
                print(f"  '{raw}' is not a legal move in this position. Try again.")
                continue
            if mv != expected:
                flawed = True
                print(f"  X  {board.san(mv)} is not the theory move here. Try again.")
                continue
            board.push(mv)
            idx += 1
            break

    if quit_requested:
        return False, True

    if gave_up:
        print(f"\n  >> Gave up on: {drill['name']}")
    else:
        if show_board:
            print(render_board(board, flip=not user_is_white))
        verdict = "PERFECT" if not flawed else "complete"
        print(f"\n  >> Line {verdict}: {drill['name']}")
        print(f"     {numbered_moves(line)}")
        print(f"     Idea: {drill['idea']}")

    return not flawed, False


# ----------------------------------------------------------------------------
# Main loop
# ----------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(description="Chess opening sparring bot")
    ap.add_argument("--opening", help="drill a specific opening (substring match)")
    ap.add_argument("--no-board", action="store_true", help="hide the board")
    ap.add_argument("--list", action="store_true", help="list openings and exit")
    args = ap.parse_args()

    validate_book()
    stats = load_stats()

    if args.list:
        print_book_list()
        return

    show_board = not args.no_board
    last_name = None

    print(__doc__.strip().splitlines()[0])
    print("Bot names an opening, you play the moves from memory. Ctrl+C to stop.\n")

    while True:
        drill = pick_drill(stats, exclude=last_name, wanted=args.opening)
        if drill is None:
            if args.opening:   # explicit --opening that matched nothing
                break
            raw = input("> ")
            if raw.lower().startswith("l"):
                print_book_list()
            elif raw.lower().startswith("q"):
                break
            continue

        perfect, quit_requested = run_drill(drill, show_board)
        if not quit_requested:
            record_result(stats, drill["name"], perfect)
        save_stats(stats)
        last_name = drill["name"]

        if quit_requested:
            break

        stop = False
        while True:
            try:
                nxt = input("\n[Enter] next drill  (l=list  s=stats  q=quit) > ").strip().lower()
            except EOFError:
                stop = True
                break
            if not nxt:
                break
            if nxt.startswith("q"):
                stop = True
                break
            if nxt.startswith("l"):
                print_book_list()
            elif nxt.startswith("s"):
                print_stats(stats)
            # anything else just re-prompts
        if stop:
            break

    print("\nSession over.")
    print_stats(stats)


def print_stats(stats):
    print("\n  Progress (share of drills finished with no hint/mistake):")
    if not stats:
        print("  (no drills recorded yet)")
        return
    rows = []
    for drill in BOOK:
        entry = stats.get(drill["name"])
        if entry and entry["drills"]:
            pct = round(100 * entry["perfect"] / entry["drills"])
            rows.append((pct, drill["name"], entry["drills"]))
    rows.sort()
    for pct, name, n in rows:
        print(f"  {pct:3d}%   ({n} drill{'s' if n != 1 else ''})   {name}")


if __name__ == "__main__":
    try:
        main()
    except (KeyboardInterrupt, EOFError):
        print("\nStopped.")
