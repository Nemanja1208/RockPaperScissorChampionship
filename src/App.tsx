import { useState, useEffect } from 'react';
import { Tournament } from './tournament/Tournament';
import { Player, PlayerStats, Match } from './types/player';
import { Leaderboard } from './components/Leaderboard';
import { MatchDisplay } from './components/MatchDisplay';
import { TournamentControls } from './components/TournamentControls';
import { PlayerList } from './components/PlayerList';
import { CountdownTimer } from './components/CountdownTimer';
import {
  RandomPlayer,
  RockPlayer,
  CyclePlayer,
  CounterPlayer,
  TomasPlayer,
  AdaptivePlayer,
} from './players';

/**
 * STUDENTS: Import your player here and add it to the playerList array below!
 * Example:
 * import { MyPlayer } from './players/MyPlayer';
 */

function App() {
  // Initialize players
  const [players] = useState<Player[]>([
    new RandomPlayer(),
    new RockPlayer(),
    new CyclePlayer(),
    new CounterPlayer(),
    new TomasPlayer(),
    new AdaptivePlayer(),
    /**
     * STUDENTS: Add your player instance here!
     * Example:
     * new MyPlayer(),
     */
  ]);

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [leaderboard, setLeaderboard] = useState<PlayerStats[]>([]);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [completedMatches, setCompletedMatches] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showUnauthorizedMessage, setShowUnauthorizedMessage] = useState(false);
  const [targetTime] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(15, 0, 0, 0);
    return tomorrow;
  });

  // Initialize tournament
  useEffect(() => {
    const newTournament = new Tournament(players);

    // Calculate total matches (n * (n-1) / 2 for round-robin)
    const total = (players.length * (players.length - 1)) / 2;
    setTotalMatches(total);

    // Listen to tournament events
    newTournament.addListener((event) => {
      if (event.type === 'start') {
        setIsRunning(true);
        setCompletedMatches(0);
        if (event.stats) {
          setLeaderboard(Array.from(event.stats.values()));
        }
      } else if (event.type === 'match') {
        if (event.match) {
          setCurrentMatch(event.match);
        }
        if (event.stats) {
          setLeaderboard(
            Array.from(event.stats.values()).sort((a, b) => {
              if (b.points !== a.points) return b.points - a.points;
              if (b.wins !== a.wins) return b.wins - a.wins;
              return a.name.localeCompare(b.name);
            })
          );
        }
        setCompletedMatches((prev) => prev + 1);
      } else if (event.type === 'complete') {
        setIsRunning(false);
        if (event.stats) {
          setLeaderboard(
            Array.from(event.stats.values()).sort((a, b) => {
              if (b.points !== a.points) return b.points - a.points;
              if (b.wins !== a.wins) return b.wins - a.wins;
              return a.name.localeCompare(b.name);
            })
          );
        }
      }
    });

    setTournament(newTournament);
    setLeaderboard(newTournament.getLeaderboard());
  }, [players]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = import.meta.env.VITE_TOURNAMENT_PASSWORD;

    if (password === correctPassword) {
      setIsAuthorized(true);
      setShowUnauthorizedMessage(false);
      if (tournament && !isRunning) {
        tournament.runTournament(1500); // 1.5 seconds between matches
      }
    } else {
      setShowUnauthorizedMessage(true);
      setPassword('');
      setTimeout(() => setShowUnauthorizedMessage(false), 3000);
    }
  };

  const handleStart = () => {
    if (!isAuthorized) {
      setShowUnauthorizedMessage(true);
      setTimeout(() => setShowUnauthorizedMessage(false), 3000);
      return;
    }

    if (tournament && !isRunning) {
      tournament.runTournament(1500); // 1.5 seconds between matches
    }
  };

  const handleReset = () => {
    if (tournament && !isRunning) {
      tournament.reset();
      setLeaderboard(tournament.getLeaderboard());
      setCurrentMatch(null);
      setCompletedMatches(0);
    }
  };

  return (
    <div className="min-h-screen p-8">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
        <div className="absolute top-1/3 -right-48 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="rounded-xl text-6xl font-bold mb-4 p-4 text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text animate-glow">
            🪨📄✂️ Rock Paper Scissors Tournament
          </h1>
          <p className="text-xl text-gray-300">
            Nemo Sensei Battle Arena
          </p>
        </header>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left column - Leaderboard */}
          <div className="lg:col-span-1">
            <Leaderboard stats={leaderboard} />
          </div>

          {/* Middle column - Match display and controls */}
          <div className="lg:col-span-2 space-y-6">
            {!isAuthorized && completedMatches === 0 ? (
              <>
                {/* Countdown Timer */}
                <CountdownTimer targetTime={targetTime} />

                {/* Password Input */}
                <div className="glass rounded-3xl p-8">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-transparent bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text mb-2">
                      🔐 Sensei Authorization Required
                    </h2>
                    <p className="text-gray-300 text-sm">
                      Only Nemo Sensei can start the tournament
                    </p>
                  </div>

                  {/* Unauthorized Message */}
                  {showUnauthorizedMessage && (
                    <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 animate-shake">
                      <div className="text-center">
                        <div className="text-6xl mb-3 animate-bounce">🙅‍♂️</div>
                        <div className="text-2xl font-bold text-red-400 mb-2">
                          No No No!
                        </div>
                        <div className="text-gray-300">
                          Only <span className="text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text font-bold">Nemo Sensei</span> can start the tournament
                        </div>
                        <div className="text-sm text-gray-400 mt-2">
                          You can run it locally if you want...
                        </div>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter sensei password..."
                        className="w-full px-6 py-4 rounded-xl bg-gray-800/50 border border-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      Start Tournament
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <>
                <MatchDisplay match={currentMatch} isActive={isRunning} />
                <TournamentControls
                  isRunning={isRunning}
                  onStart={handleStart}
                  onReset={handleReset}
                  totalMatches={totalMatches}
                  completedMatches={completedMatches}
                />
              </>
            )}
          </div>
        </div>

        {/* Players list */}
        <div className="mb-6">
          <PlayerList players={players} />
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-400 text-sm mt-12">
          <p className="glass rounded-2xl p-4 inline-block">
            Built with React, TypeScript, Vite, and TailwindCSS
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
