/**
 * TEMPLATE FILE - Copy this to create your own player!
 *
 * Instructions:
 * 1. Copy this file and rename it (e.g., JohnDoePlayer.ts)
 * 2. Rename the class to match your name
 * 3. Update the name and description
 * 4. Implement your strategy in makeMove()
 * 5. Export your player in index.ts
 * 6. Add your player to App.tsx
 * 7. Run tests and enjoy!
 */

import { Player, Move, MatchHistory, MatchResult } from '../types/player';

export class LastPlayerStanding implements Player {
    // REQUIRED: Unique name for your player
    readonly name = 'LastPlayerStanding';

    // OPTIONAL: Describe your strategy
    readonly description = 'If you snooze, you lose.';

    // OPTIONAL: Store any state your player needs
    private moveCount = 0;
    // Add more state as needed...

    /**
     * REQUIRED: This method is called each time your player needs to make a move
     *
     * @param opponentName - The name of who you're playing against
     * @param history - Array of previous matches against THIS specific opponent
     * @returns Your chosen move: 'rock', 'paper', or 'scissors'
     */
    makeMove(opponentName: string, history: MatchHistory[]): Move {
        // Mark opponentName as intentionally unused for now
        // (we could use it later for per-opponent strategies)
        void opponentName;

        // Track how many moves this player has made in total
        this.moveCount++;

        // If we have no history against this opponent, play randomly
        if (history.length === 0) {
            return this.getRandomMove();
        }

        // Analyze opponent's recent history and pick a smart move

        // Only look at the last few rounds to react to recent behavior
        const roundsToConsider = 5;
        const startIndex = Math.max(0, history.length - roundsToConsider);

        // Count how many times the opponent has played each move in the recent rounds
        let rockCount = 0;
        let paperCount = 0;
        let scissorsCount = 0;

        for (let index = startIndex; index < history.length; index++) {
            const match = history[index];

            if (match.opponentMove === 'rock') {
                rockCount++;
            } else if (match.opponentMove === 'paper') {
                paperCount++;
            } else if (match.opponentMove === 'scissors') {
                scissorsCount++;
            }
        }

        // Decide which move the opponent plays most often in these recent rounds
        let mostCommonOpponentMove: Move = 'rock';
        let highestCount = rockCount;

        if (paperCount > highestCount) {
            mostCommonOpponentMove = 'paper';
            highestCount = paperCount;
        }

        if (scissorsCount > highestCount) {
            mostCommonOpponentMove = 'scissors';
            highestCount = scissorsCount;
        }

        // Mix strategy:
        //  - 80% of the time: play the counter to their most common recent move
        //  - 20% of the time: play a random move to stay unpredictable
        const randomValue = Math.random();

        if (randomValue < 0.8) {
            // Counter their favorite recent move
            return this.getCounter(mostCommonOpponentMove);
        } else {
            // Occasionally play random to avoid being too predictable
            return this.getRandomMove();
        }
    }

    /**
     * OPTIONAL: Called after each match to inform you of the result
     * Use this to learn from matches and update your strategy
     *
     * @param opponentName - Who you just played
     * @param myMove - What you played
     * @param opponentMove - What they played
     * @param result - Did you win, lose, or draw?
     */
    onMatchResult(
        opponentName: string,
        myMove: Move,
        opponentMove: Move,
        result: MatchResult
    ): void {
        // Example: Log results
        console.log(`Match vs ${opponentName}: ${myMove} vs ${opponentMove} = ${result}`);

        // Example: Update internal strategy based on results
        if (result === 'win') {
            // Do something when you win
        } else if (result === 'lose') {
            // Do something when you lose
        }
    }

    /**
     * OPTIONAL: Add helper methods
     */
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

    // Add more helper methods as needed...
}
