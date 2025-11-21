import { Player, Move, MatchHistory } from '../types/player';

export class KlasUnbeatable implements Player {
    readonly name = 'Klas Unbeatable';
    readonly description = 'Meta-gaming expert: Analyzes source code of opponents to crush them.';

    makeMove(opponentName: string, history: MatchHistory[]): Move {

        // -----------------------------------------------------------
        // 1. STATISKA & ENKLA BOTAR (Gratis poäng)
        // -----------------------------------------------------------
        if (opponentName === 'Rock Solid') return 'paper';

        // -----------------------------------------------------------
        // 2. MÖNSTER-SPELARE (Deterministiska)
        // -----------------------------------------------------------

        // Alexander: Loopar Sten -> Sax -> Sten (baserat på eget förra drag)
        if (opponentName === 'Alexander') {
            if (history.length === 0) return 'paper';
            const hisLast = history[history.length - 1].opponentMove;
            if (hisLast === 'rock') return 'rock';
            return 'paper';
        }

        // Cycle Master: Roterar strikt Sten -> Påse -> Sax
        if (opponentName === 'Cycle Master') {
            if (history.length === 0) return 'paper';
            const hisLast = history[history.length - 1].opponentMove;
            if (hisLast === 'rock') return 'scissors';
            if (hisLast === 'paper') return 'rock';
            return 'paper';
        }

        // -----------------------------------------------------------
        // 3. REAKTIVA SPELARE (De reagerar på DITT förra drag)
        // -----------------------------------------------------------

        // Rahel: Försöker slå ditt förra drag. Vi ligger steget före.
        if (opponentName === 'Rahel') {
            if (history.length === 0) return 'paper';
            const myLastMove = history[history.length - 1].myMove;
            return this.getCounter(this.getCounter(myLastMove));
        }

        // -----------------------------------------------------------
        // 4. FREKVENS-SPELARE (De analyserar din statistik)
        // -----------------------------------------------------------
        // Dessa spelare (Hanan, Dorsa, etc.) räknar dina drag.
        // Vi lurar dem genom att spela det som slår deras kontring.

        const frequencyBots = [
            'HanansPlayer',
            'DorsasPlayer',
            'Counter Strike',
            'LastPlayerStanding',
            'IsakoDavidPlayer'
        ];

        if (frequencyBots.includes(opponentName)) {
            if (history.length === 0) return 'rock';

            // Anpassa historiklängd beroende på motståndarens logik
            let relevantHistory = history;
            if (opponentName === 'LastPlayerStanding') relevantHistory = history.slice(-5);
            if (opponentName === 'IsakoDavidPlayer') relevantHistory = history.slice(-10);

            const myCounts = { rock: 0, paper: 0, scissors: 0 };
            let hasMoves = false;
            relevantHistory.forEach(match => {
                myCounts[match.myMove]++;
                hasMoves = true;
            });

            if (!hasMoves) return this.getRandomMove();

            const myMostCommon = Object.keys(myCounts).reduce((a, b) =>
                myCounts[a as Move] > myCounts[b as Move] ? a : b
            ) as Move;

            // De spelar: Counter(DittVanligaste) -> Vi spelar: Counter(Counter(DittVanligaste))
            return this.getCounter(this.getCounter(myMostCommon));
        }

        // -----------------------------------------------------------
        // 5. GENERELL STRATEGI FÖR OKÄNDA SPELARE
        // -----------------------------------------------------------

        if (history.length < 5) {
            return this.getRandomMove(); // Spela säkert i början
        }

        // ANALYS A: Har de en tydlig favorit? (>50% av gångerna)
        const counts = { rock: 0, paper: 0, scissors: 0 };
        history.forEach(match => counts[match.opponentMove]++);
        const totalMatches = history.length;
        const mostCommonEntry = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

        if (mostCommonEntry[1] > totalMatches * 0.5) {
            return this.getCounter(mostCommonEntry[0] as Move);
        }

        // ANALYS B: Upprepar de sig ofta? (Repetition bias)
        const lastMove = history[history.length - 1].opponentMove;
        if (history.length >= 2) {
            const prevMove = history[history.length - 2].opponentMove;
            if (lastMove === prevMove) {
                return this.getCounter(lastMove);
            }
        }

        // Fallback: Om inget mönster finns, spela slump för att undvika att bli läst
        return this.getRandomMove();
    }

    private getCounter(move: Move): Move {
        const counters: Record<Move, Move> = {
            rock: 'paper',
            paper: 'scissors',
            scissors: 'rock',
        };
        return counters[move];
    }

    private getRandomMove(): Move {
        const moves: Move[] = ['rock', 'paper', 'scissors'];
        return moves[Math.floor(Math.random() * moves.length)];
    }
}