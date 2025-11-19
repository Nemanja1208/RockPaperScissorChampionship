import { Player, Move, MatchHistory, MatchResult } from '../types/player';

export class IsakoDavidPlayer implements Player {
  // REQUIRED: Unique name for your player
  readonly name = 'IsakoDavidPlayer';

  // OPTIONAL: Describe your strategy
  readonly description = 'Brief description of what your player does';

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
    const safeHistory = history ?? [];

    if (safeHistory.length === 0) {
      const finalMove = this.getRandomMove();
      this.moveCount++;
      return finalMove;
    }

    const lossStreakLength = 3;
    if (safeHistory.length >= lossStreakLength) {
      const lastMatches = safeHistory.slice(-lossStreakLength);
      const isLossStreak = lastMatches.every((match) => match.result === 'lose');
      if (isLossStreak) {
        const finalMove = this.getRandomMove();
        this.moveCount++;
        return finalMove;
      }
    }

    const maxMatchesToAnalyze = 10;
    const recentMatches = safeHistory.slice(-maxMatchesToAnalyze);

    if (recentMatches.length === 0) {
      const finalMove = this.getRandomMove();
      this.moveCount++;
      return finalMove;
    }

    const opponentMoveCounts: Record<Move, number> = {
      rock: 0,
      paper: 0,
      scissors: 0,
    };

    recentMatches.forEach((match) => {
      opponentMoveCounts[match.opponentMove]++;
    });

    const maxCount = Math.max(...Object.values(opponentMoveCounts));
    const mostCommonMoves = (Object.entries(opponentMoveCounts) as [Move, number][])
      .filter(([, count]) => count === maxCount)
      .map(([move]) => move);

    const predictedOpponentMove =
      mostCommonMoves.length === 1
        ? mostCommonMoves[0]
        : mostCommonMoves[Math.floor(Math.random() * mostCommonMoves.length)];

    const counterMove = this.getCounter(predictedOpponentMove);
    const randomPlayProbability = 0.2;
    const shouldPlayRandomly = Math.random() < randomPlayProbability;
    const finalMove = shouldPlayRandomly ? this.getRandomMove() : counterMove;

    this.moveCount++;
    return finalMove;
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
    // TODO: Optional - track results to improve strategy

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
