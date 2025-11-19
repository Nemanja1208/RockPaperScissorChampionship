import { Player, Move, MatchHistory, MatchResult } from '../types/player';

export class DorsasPlayer implements Player {
  readonly name = 'DorsasPlayer';
  readonly description = 'Adaptive counter-strategy based on opponent history';

  makeMove(_opponentName: string, history: MatchHistory[]): Move {
    if (history.length === 0) {
      return 'paper';
    }

    const counts: Record<Move, number> = {
      rock: 0,
      paper: 0,
      scissors: 0,
    };

    for (const match of history) {
      counts[match.opponentMove]++;
    }

    const mostCommon = Object.entries(counts).sort(
      (a, b) => b[1] - a[1]
    )[0][0] as Move;

    return this.counter(mostCommon);
  }

  private counter(move: Move): Move {
    const counterMap: Record<Move, Move> = {
      rock: 'paper',
      paper: 'scissors',
      scissors: 'rock',
    };

    return counterMap[move];
  }

  onMatchResult?(
    _opponentName: string,
    _myMove: Move,
    _opponentMove: Move,
    _result: MatchResult
  ): void {
  }
}
