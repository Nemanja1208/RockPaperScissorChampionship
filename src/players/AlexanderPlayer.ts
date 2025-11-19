import { Player, Move, MatchHistory, MatchResult } from '../types/player';

export class AlexanderPlayer implements Player {
  readonly name = 'Alexander';
  readonly description = 'Plays only rock and scissors 🪨✂️';

  makeMove(_opponentName: string, history: MatchHistory[]): Move {
    // First round: always start with rock
    if (history.length === 0) {
      return 'rock';
    }

    
    const lastMatch = history[history.length - 1];
    const myLastMove = lastMatch.myMove;

    
    if (myLastMove === 'rock') {
      return 'scissors';
    } else {
      return 'rock';
    }
  }

  onMatchResult(
    _opponentName: string,
    _myMove: Move,
    _opponentMove: Move,
    _result: MatchResult
  ): void {
    
  }
}
