import { Player, Move, MatchHistory, MatchResult } from '../types/player';

export class TomasPlayer implements Player {
  readonly name = 'Tomas';
  readonly description = 'Aggressive counter-attacker 🥊';

  makeMove(_opponentName: string, history: MatchHistory[]): Move {
    // First round: start solid with rock
    if (history.length === 0) {
      return 'rock';
    }

    // Look at this opponent's last move against me
    const lastMatch = history[history.length - 1];
    const lastOpponentMove = lastMatch.opponentMove;

    // Play the move that beats their last move
    if (lastOpponentMove === 'rock') return 'paper';      // paper beats rock
    if (lastOpponentMove === 'paper') return 'scissors';  // scissors beats paper
    if (lastOpponentMove === 'scissors') return 'rock';   // rock beats scissors

    // Fallback (shouldn’t really happen)
    return 'rock';
  }

  onMatchResult(
    _opponentName: string,
    _myMove: Move,
    _opponentMove: Move,
    _result: MatchResult
  ): void {
    // Optional: you can later use this to "learn" from results
  }
}
