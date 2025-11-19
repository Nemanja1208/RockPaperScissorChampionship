import { Player, Move, MatchHistory, MatchResult } from '../types/player';

type ExpertName = 'random' | 'frequency' | 'lastMove' | 'transition';

interface OpponentModel {
  totalCounts: Record<Move, number>;
  transitionCounts: Record<Move, Record<Move, number>>;
  lastOpponentMove?: Move;
  lastMyMove?: Move;
  lastResult?: MatchResult;
  expertScores: Record<ExpertName, number>;
  roundsPlayed: number;
}

export class MohannedPlayer implements Player {
  readonly name = 'Mohanned';
  readonly description = 'Blackbelt RPS championship';

  private moveCount = 0;

  // Per-opponent memory
  private opponents = new Map<string, OpponentModel>();

  // List of experts we use
  private readonly experts: ExpertName[] = [
    'random',
    'frequency',
    'lastMove',
    'transition',
  ];

  // Priority for tie-breaking between experts (lower index = higher priority)
  private readonly expertPriority: ExpertName[] = [
    'transition',
    'lastMove',
    'frequency',
    'random',
  ];

  /**
   * Called each time a move is needed vs a given opponent
   */
  makeMove(opponentName: string, history: MatchHistory[]): Move {
    this.moveCount++;

    // === Hard counters for known built-in bots ===========================
    // Rock Solid: always plays rock -> we always play paper
    if (opponentName === 'Rock Solid') {
      return 'paper';
    }

    // Cycle Master: cycles rock -> paper -> scissors -> ...
    // Next move is deterministic given the last one.
    if (opponentName === 'Cycle Master' && history.length > 0) {
      const lastOpp = history[history.length - 1].opponentMove;
      const predictedNext = this.getCycleNextMove(lastOpp);
      return this.getCounter(predictedNext);
    }
    // =====================================================================

    // Get or create per-opponent model
    const model = this.getOrCreateOpponentModel(opponentName);

    // Sync model from history if we have history but no internal data yet
    if (model.roundsPlayed === 0 && history.length > 0) {
      this.rebuildModelFromHistory(model, history);
    }

    const totalRoundsSoFar = Math.max(model.roundsPlayed, history.length);

    // Exploration vs exploitation
    const baseEpsilon = 0.05; // 5% random long-term
    const earlyRounds = 3;    // heavy exploration for first 3 rounds
    const explorationRate =
      totalRoundsSoFar < earlyRounds ? 0.5 : baseEpsilon;

    if (Math.random() < explorationRate) {
      // Exploration step: play random to stay unpredictable
      return this.getRandomMove();
    }

    // Exploitation: follow the best-performing expert for this opponent
    const bestExpert = this.getBestExpert(model);
    return this.getExpertMove(bestExpert, model);
  }

  /**
   * Called after each match – we use this to learn and improve
   */
  onMatchResult(
    opponentName: string,
    myMove: Move,
    opponentMove: Move,
    result: MatchResult
  ): void {
    const model = this.getOrCreateOpponentModel(opponentName);

    // 1) Score each expert based on what it *would* have played
    for (const expert of this.experts) {
      const predictedMove = this.getExpertMove(expert, model);
      const hypotheticalResult = this.getResult(predictedMove, opponentMove);

      if (hypotheticalResult === 'win') {
        model.expertScores[expert] += 1;
      } else if (hypotheticalResult === 'lose') {
        model.expertScores[expert] -= 1;
      }
      // draw = 0, no change
    }

    // 2) Update frequency stats
    model.totalCounts[opponentMove] += 1;
    model.roundsPlayed += 1;

    // 3) Update transition stats (based on opponent's last move)
    if (model.lastOpponentMove) {
      model.transitionCounts[model.lastOpponentMove][opponentMove] += 1;
    }

    // 4) Update last move / result info
    model.lastOpponentMove = opponentMove;
    model.lastMyMove = myMove;
    model.lastResult = result;
  }

  // ===== Expert logic =====

  private getExpertMove(expert: ExpertName, model: OpponentModel): Move {
    switch (expert) {
      case 'random':
        return this.getRandomMove();
      case 'frequency':
        return this.frequencyExpert(model);
      case 'lastMove':
        return this.lastMoveExpert(model);
      case 'transition':
        return this.transitionExpert(model);
      default:
        return this.getRandomMove();
    }
  }

  // Counter their most common move overall
  private frequencyExpert(model: OpponentModel): Move {
    const counts = model.totalCounts;
    const sum = counts.rock + counts.paper + counts.scissors;

    if (sum === 0) {
      return this.getRandomMove();
    }

    let mostCommon: Move = 'rock';
    let best = counts.rock;

    if (counts.paper > best) {
      best = counts.paper;
      mostCommon = 'paper';
    }
    if (counts.scissors > best) {
      best = counts.scissors;
      mostCommon = 'scissors';
    }

    return this.getCounter(mostCommon);
  }

  // Assume they might repeat their last move; counter it
  private lastMoveExpert(model: OpponentModel): Move {
    const last = model.lastOpponentMove;
    if (!last) {
      return this.getRandomMove();
    }
    return this.getCounter(last);
  }

  // Use transition statistics: based on their last move,
  // predict the most likely next move and counter it.
  private transitionExpert(model: OpponentModel): Move {
    const last = model.lastOpponentMove;
    if (!last) {
      return this.getRandomMove();
    }

    const nextCounts = model.transitionCounts[last];
    const total =
      nextCounts.rock + nextCounts.paper + nextCounts.scissors;

    if (total === 0) {
      // No transition info yet – fall back to lastMove expert
      return this.lastMoveExpert(model);
    }

    let predictedNext: Move = 'rock';
    let best = nextCounts.rock;

    if (nextCounts.paper > best) {
      best = nextCounts.paper;
      predictedNext = 'paper';
    }
    if (nextCounts.scissors > best) {
      best = nextCounts.scissors;
      predictedNext = 'scissors';
    }

    return this.getCounter(predictedNext);
  }

  // ===== Helpers & utilities =====

  private getOrCreateOpponentModel(opponentName: string): OpponentModel {
    let model = this.opponents.get(opponentName);
    if (!model) {
      model = {
        totalCounts: { rock: 0, paper: 0, scissors: 0 },
        transitionCounts: {
          rock: { rock: 0, paper: 0, scissors: 0 },
          paper: { rock: 0, paper: 0, scissors: 0 },
          scissors: { rock: 0, paper: 0, scissors: 0 },
        },
        // Small initial bias toward transition expert (good vs patterns)
        expertScores: {
          random: 0,
          frequency: 0,
          lastMove: 0,
          transition: 1,
        },
        roundsPlayed: 0,
      };
      this.opponents.set(opponentName, model);
    }
    return model;
  }

  private getBestExpert(model: OpponentModel): ExpertName {
    let bestExpert: ExpertName = 'transition';
    let bestScore = -Infinity;

    for (const expert of this.experts) {
      const score = model.expertScores[expert] ?? 0;

      if (score > bestScore) {
        bestScore = score;
        bestExpert = expert;
      } else if (score === bestScore) {
        // Tie-break: prefer expert with higher priority
        const currentIndex = this.expertPriority.indexOf(expert);
        const bestIndex = this.expertPriority.indexOf(bestExpert);

        if (currentIndex < bestIndex) {
          bestExpert = expert;
        }
      }
    }

    return bestExpert;
  }

  private getCounter(move: Move): Move {
    const counters: Record<Move, Move> = {
      rock: 'paper',
      paper: 'scissors',
      scissors: 'rock',
    };
    return counters[move];
  }

  // For Cycle Master: the next move in the fixed R->P->S->R cycle
  private getCycleNextMove(move: Move): Move {
    const nextInCycle: Record<Move, Move> = {
      rock: 'paper',
      paper: 'scissors',
      scissors: 'rock',
    };
    return nextInCycle[move];
  }

  private getRandomMove(): Move {
    const moves: Move[] = ['rock', 'paper', 'scissors'];
    return moves[Math.floor(Math.random() * moves.length)];
  }

  private getResult(myMove: Move, opponentMove: Move): MatchResult {
    if (myMove === opponentMove) return 'draw';

    if (
      (myMove === 'rock' && opponentMove === 'scissors') ||
      (myMove === 'paper' && opponentMove === 'rock') ||
      (myMove === 'scissors' && opponentMove === 'paper')
    ) {
      return 'win';
    }
    return 'lose';
  }

  private rebuildModelFromHistory(
    model: OpponentModel,
    history: MatchHistory[]
  ): void {
    // Reset everything just in case
    model.totalCounts.rock = 0;
    model.totalCounts.paper = 0;
    model.totalCounts.scissors = 0;
    model.transitionCounts.rock = { rock: 0, paper: 0, scissors: 0 };
    model.transitionCounts.paper = { rock: 0, paper: 0, scissors: 0 };
    model.transitionCounts.scissors = { rock: 0, paper: 0, scissors: 0 };
    model.expertScores.random = 0;
    model.expertScores.frequency = 0;
    model.expertScores.lastMove = 0;
    model.expertScores.transition = 1; // keep the bias
    model.roundsPlayed = 0;
    model.lastOpponentMove = undefined;
    model.lastMyMove = undefined;
    model.lastResult = undefined;

    for (const match of history) {
      const { myMove, opponentMove, result } = match;

      // Update frequency
      model.totalCounts[opponentMove] += 1;
      model.roundsPlayed += 1;

      // Update transitions based on previous opponent move
      if (model.lastOpponentMove) {
        model.transitionCounts[model.lastOpponentMove][opponentMove] += 1;
      }

      // Score experts as if they had played on that round
      for (const expert of this.experts) {
        const predictedMove = this.getExpertMove(expert, model);
        const hypotheticalResult = this.getResult(predictedMove, opponentMove);

        if (hypotheticalResult === 'win') {
          model.expertScores[expert] += 1;
        } else if (hypotheticalResult === 'lose') {
          model.expertScores[expert] -= 1;
        }
        // draw → no change
      }

      model.lastOpponentMove = opponentMove;
      model.lastMyMove = myMove;
      model.lastResult = result;
    }
  }
}
