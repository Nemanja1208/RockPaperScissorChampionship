import { Player, Move, MatchHistory, MatchResult } from '../types/player';

export class GabbzPlayer implements Player {
  readonly name = 'GabbzMaster';
  readonly description = 'The ultimate rock-paper-scissors strategist!';

  // Performance tracking for adaptive behavior
  private recentResults: MatchResult[] = [];
  private currentStrategy: 'pattern' | 'counter' | 'adaptive' | 'random' = 'pattern';
  
  // Opponent-specific data storage
  private opponentData: Map<string, OpponentProfile> = new Map();

  makeMove(opponentName: string, history: MatchHistory[]): Move {
    // Initialize or get opponent profile
    if (!this.opponentData.has(opponentName)) {
      this.opponentData.set(opponentName, {
        patterns: new Map(),
        moveCounts: { rock: 0, paper: 0, scissors: 0 },
        recentMoves: [],
        predictedNext: null
      });
    }

    const profile = this.opponentData.get(opponentName)!;

    // No history? Play safe with rock
    if (history.length === 0) {
      return 'rock';
    }

    // Update opponent profile with latest data
    this.updateOpponentProfile(profile, history);

    // Choose strategy based on performance and data available
    this.updateStrategy();

    // Execute chosen strategy
    return this.executeStrategy(profile, history);
  }

  onMatchResult(opponentName: string, _myMove: Move, opponentMove: Move, result: MatchResult): void {
    // Track recent performance for adaptive behavior
    this.recentResults.push(result);
    if (this.recentResults.length > 7) {
      this.recentResults.shift(); // Keep last 7 results
    }

    // Update opponent profile with the actual move they made
    const profile = this.opponentData.get(opponentName);
    if (profile) {
      profile.recentMoves.push(opponentMove);
      if (profile.recentMoves.length > 10) {
        profile.recentMoves.shift(); // Keep last 10 moves
      }
    }
  }

  private updateOpponentProfile(profile: OpponentProfile, history: MatchHistory[]): void {
    const opponentMoves = history.map(h => h.opponentMove);
    
    // Update move frequency counts
    profile.moveCounts = { rock: 0, paper: 0, scissors: 0 };
    opponentMoves.forEach(move => {
      profile.moveCounts[move]++;
    });

    // Detect patterns in recent moves (sequences of 2-4 moves)
    this.detectPatterns(profile, opponentMoves);
  }

  private detectPatterns(profile: OpponentProfile, moves: Move[]): void {
    // Look for patterns of length 2-4 in the last 15 moves
    const recentMoves = moves.slice(-15);
    
    for (let patternLength = 2; patternLength <= Math.min(4, recentMoves.length - 1); patternLength++) {
      for (let i = 0; i <= recentMoves.length - patternLength - 1; i++) {
        const pattern = recentMoves.slice(i, i + patternLength).join('-');
        const nextMove = recentMoves[i + patternLength];
        
        if (!profile.patterns.has(pattern)) {
          profile.patterns.set(pattern, { nextMoves: [], confidence: 0 });
        }
        
        profile.patterns.get(pattern)!.nextMoves.push(nextMove);
      }
    }

    // Calculate pattern confidence and predict next move
    this.calculatePatternPrediction(profile, recentMoves);
  }

  private calculatePatternPrediction(profile: OpponentProfile, moves: Move[]): void {
    profile.predictedNext = null;
    let bestConfidence = 0;

    // Try patterns of different lengths, starting with longest
    for (let length = Math.min(4, moves.length); length >= 2; length--) {
      if (moves.length < length) continue;
      
      const lastPattern = moves.slice(-length).join('-');
      const patternData = profile.patterns.get(lastPattern);
      
      if (patternData && patternData.nextMoves.length >= 2) {
        // Calculate most common next move after this pattern
        const nextMoveCounts = { rock: 0, paper: 0, scissors: 0 };
        patternData.nextMoves.forEach(move => {
          nextMoveCounts[move]++;
        });
        
        const totalOccurrences = patternData.nextMoves.length;
        const mostCommonMove = Object.entries(nextMoveCounts)
          .sort((a, b) => b[1] - a[1])[0] as [Move, number];
        
        const confidence = (mostCommonMove[1] / totalOccurrences) * (totalOccurrences / 10); // Boost confidence with more data
        
        if (confidence > bestConfidence && confidence > 0.4) { // Minimum confidence threshold
          bestConfidence = confidence;
          profile.predictedNext = mostCommonMove[0];
          patternData.confidence = confidence;
        }
      }
    }
  }

  private updateStrategy(): void {
    if (this.recentResults.length < 3) {
      this.currentStrategy = 'pattern';
      return;
    }

    const wins = this.recentResults.filter(r => r === 'win').length;
    const winRate = wins / this.recentResults.length;

    // Adaptive strategy selection based on performance
    if (winRate > 0.6) {
      // Keep current strategy if winning
      return;
    } else if (winRate < 0.3) {
      // Change strategy if losing badly
      this.currentStrategy = this.getNextStrategy();
    } else if (winRate < 0.45) {
      // Moderate performance, try different approach
      this.currentStrategy = 'adaptive';
    }
  }

  private getNextStrategy(): 'pattern' | 'counter' | 'adaptive' | 'random' {
    const strategies: ('pattern' | 'counter' | 'adaptive' | 'random')[] = ['pattern', 'counter', 'adaptive', 'random'];
    const currentIndex = strategies.indexOf(this.currentStrategy);
    return strategies[(currentIndex + 1) % strategies.length];
  }

  private executeStrategy(profile: OpponentProfile, history: MatchHistory[]): Move {
    const lastOpponentMove = history[history.length - 1].opponentMove;

    switch (this.currentStrategy) {
      case 'pattern':
        // Use pattern prediction if available
        if (profile.predictedNext && Math.random() < 0.8) { // 80% trust in pattern
          return this.getCounter(profile.predictedNext);
        }
        // Fallback to frequency analysis
        return this.getCounter(this.getMostCommonMove(profile.moveCounts));

      case 'counter':
        // Counter their most frequent move
        return this.getCounter(this.getMostCommonMove(profile.moveCounts));

      case 'adaptive':
        // Mix of countering last move and most common move
        if (history.length % 2 === 0) {
          return this.getCounter(lastOpponentMove);
        } else {
          return this.getCounter(this.getMostCommonMove(profile.moveCounts));
        }

      case 'random':
        // Pure randomness with slight bias
        return this.getWeightedRandomMove();

      default:
        return this.getCounter(lastOpponentMove);
    }
  }

  private getMostCommonMove(counts: Record<Move, number>): Move {
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])[0][0] as Move;
  }

  private getCounter(move: Move): Move {
    const counters: Record<Move, Move> = {
      rock: 'paper',
      paper: 'scissors',
      scissors: 'rock',
    };
    return counters[move];
  }

  private getWeightedRandomMove(): Move {
    // Slight bias towards rock and paper (statistically more common in tournaments)
    const weights = [0.35, 0.35, 0.3];
    const random = Math.random();
    
    if (random < weights[0]) return 'rock';
    if (random < weights[0] + weights[1]) return 'paper';
    return 'scissors';
  }
}

// Type definitions for opponent profiling
interface OpponentProfile {
  patterns: Map<string, PatternData>;
  moveCounts: Record<Move, number>;
  recentMoves: Move[];
  predictedNext: Move | null;
}

interface PatternData {
  nextMoves: Move[];
  confidence: number;
}