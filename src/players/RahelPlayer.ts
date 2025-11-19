import { Player, Move, MatchHistory } from '../types/player';

export class RahelPlayer implements Player {
  readonly name = 'Rahel';
  readonly description = 'A simple counter-strategy player';

  makeMove(_opponentName: string, history: MatchHistory[]): Move {
    // Om det är första rundan, spela rock
    if (history.length === 0) {
      return 'rock';
    }

    // Ta reda på vad motståndaren spelade sist
    const lastMatch = history[history.length - 1];
    const theirLastMove = lastMatch.opponentMove;

    // Kontra deras senaste drag
    if (theirLastMove === 'rock') return 'paper';
    if (theirLastMove === 'paper') return 'scissors';
    return 'rock';
  }
}
