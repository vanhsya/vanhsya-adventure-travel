import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SeoHead from '../components/SeoHead';
import { useAuth } from '../contexts/AuthContext';
import { VynoAccountProfile, VynoLedgerEntry } from '../types';

interface QuizQuestion {
  id: string;
  category: string;
  question: string;
  options: string[];
  points: number;
}

interface LeaderboardEntry {
  rank: number;
  displayName: string;
  pointsBalance: number;
  lifetimePoints: number;
  checkinStreak: number;
}

const DailyRewardsPage: React.FC = () => {
  const { user, token } = useAuth();
  const [accountKeyInput, setAccountKeyInput] = useState(() =>
    user?.walletAddress || user?.membershipId || ''
  );
  const [activeKey, setActiveKey] = useState<string>('');
  const [profile, setProfile] = useState<VynoAccountProfile | null>(null);
  const [ledger, setLedger] = useState<VynoLedgerEntry[]>([]);
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [complianceNotice, setComplianceNotice] = useState('');
  const [tokenEnabled, setTokenEnabled] = useState(false);

  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});

  const effectiveAccountKey = token
    ? ''
    : activeKey || user?.walletAddress || user?.membershipId || accountKeyInput.trim();

  const loadVynoHub = useCallback(async () => {
    try {
      const [statusRes, quizRes, lbRes] = await Promise.all([
        fetch('/api/vyno/status'),
        fetch('/api/vyno/quiz-questions'),
        fetch('/api/vyno/leaderboard'),
      ]);
      if (statusRes.ok) {
        const st = await statusRes.json();
        setComplianceNotice(st.complianceNotice || '');
        setTokenEnabled(Boolean(st.tokenDistributionEnabled));
      }
      if (quizRes.ok) {
        const q = await quizRes.json();
        setQuizzes(q.questions || []);
      }
      if (lbRes.ok) {
        const lb = await lbRes.json();
        setLeaderboard(lb.leaderboard || []);
      }

      if (token || effectiveAccountKey) {
        const url = token
          ? '/api/vyno/profile'
          : `/api/vyno/profile?accountKey=${encodeURIComponent(effectiveAccountKey)}`;
        const profRes = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (profRes.ok) {
          const p = await profRes.json();
          setProfile(p.profile || null);
          setLedger(p.ledger || []);
        }
      }
    } catch {
      // non-fatal
    }
  }, [token, effectiveAccountKey]);

  useEffect(() => {
    if (user?.walletAddress && !activeKey) {
      setAccountKeyInput(user.walletAddress);
    }
    loadVynoHub();
  }, [user, activeKey, loadVynoHub]);

  const handleLoadExplorerKey = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!accountKeyInput.trim()) {
      setErrorMsg('Enter your Founding Member ID (VSC-UAE-...), wallet address (0x...), or explorer alias.');
      return;
    }
    setActiveKey(accountKeyInput.trim());
  };

  const postAction = async (endpoint: string, bodyPayload: Record<string, any> = {}, label = 'action') => {
    setBusyAction(label);
    setErrorMsg(null);
    setFeedback(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          accountKey: effectiveAccountKey || undefined,
          displayName: user?.fullName || undefined,
          walletAddress: user?.walletAddress || undefined,
          ...bodyPayload,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Action could not be completed.');
        return;
      }
      setFeedback(
        data.message ||
          (data.prizeLabel
            ? `${data.prizeLabel} awarded! (+${data.pointsAwarded} PTS)`
            : data.badgeLabel
            ? `${data.badgeLabel} revealed! (+${data.pointsAwarded} PTS)`
            : `+${data.pointsAwarded || 0} Participation Points recorded.`)
      );
      await loadVynoHub();
    } catch {
      setErrorMsg('Network error communicating with VYNO ledger.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleAttemptClaim = async () => {
    setBusyAction('claim');
    setErrorMsg(null);
    setFeedback(null);
    try {
      const res = await fetch('/api/vyno/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountKey: effectiveAccountKey }),
      });
      const data = await res.json();
      setErrorMsg(data.error || 'Token conversion is currently gated pending compliance review.');
    } catch {
      setErrorMsg('Unable to check token claim status.');
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="pt-28 pb-24 min-h-screen bg-[#0D0A14] text-white px-4">
      <SeoHead
        title="Participation Points Arcade & Compliance Gate | Vanhsya"
        description="Server-verified non-financial Participation Points check-ins, spin wheel, scratch card, and UAE knowledge quizzes while token distributions remain compliance-gated."
        path="/daily-rewards"
      />

      <div className="max-w-6xl mx-auto space-y-10">
        {/* Compliance Header */}
        <div className="p-6 sm:p-8 rounded-3xl border border-amber-500/40 bg-[#151121] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-block text-xs font-mono uppercase tracking-[0.25em] text-amber-300 border border-amber-500/35 bg-amber-500/10 px-3 py-1 rounded-full">
              {tokenEnabled ? 'Verified Contract Active' : 'Participation Points Mode · Compliance Review Gate'}
            </span>
            <Link to="/vyno" className="text-xs font-semibold text-cyan-300 hover:underline">
              Open Web3 Signature Console &rarr;
            </Link>
          </div>
          <h1 className="text-3xl sm:text-5xl font-cinzel font-black text-white">
            VYNO Explorer Participation Arcade
          </h1>
          <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
            {complianceNotice ||
              'On-chain VYNO token transfers, APY yields, and wallet withdrawals remain disabled pending compliance approval. Interactive actions here award server-verified Participation Points only.'}
          </p>
        </div>

        {/* Account Selector / Profile Bar */}
        <div className="p-6 rounded-3xl bg-[#130E20] border border-purple-500/30 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-6 space-y-2">
            {user ? (
              <div>
                <p className="text-xs font-mono uppercase text-cyan-300">Authenticated Account Ledger</p>
                <p className="text-lg font-bold text-white">{user.fullName}</p>
                <p className="text-xs text-gray-400">
                  Streak: {profile?.checkinStreak || 0} day(s) · Balance:{' '}
                  <strong className="text-amber-300">{profile?.pointsBalance || 0} PTS</strong>
                </p>
              </div>
            ) : (
              <form onSubmit={handleLoadExplorerKey} className="space-y-2">
                <label className="block text-xs font-semibold text-gray-300">
                  Enter Wallet (0x...), Founding ID (VSC-UAE-...), or Alias (or{' '}
                  <Link to="/dashboard" className="text-purple-300 underline">
                    Sign In
                  </Link>
                  )
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={accountKeyInput}
                    onChange={(e) => setAccountKeyInput(e.target.value)}
                    placeholder="VSC-UAE-0001-XXXX or 0x... or explorer_name"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-xs text-white font-mono"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold"
                  >
                    Load Ledger
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="lg:col-span-6 grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-2xl bg-black/45 border border-white/10">
              <p className="text-[10px] font-mono uppercase text-gray-400">Points Balance</p>
              <p className="text-2xl font-black text-amber-300 mt-1">
                {profile?.pointsBalance ?? 0}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-black/45 border border-white/10">
              <p className="text-[10px] font-mono uppercase text-gray-400">Daily Streak</p>
              <p className="text-2xl font-black text-cyan-300 mt-1">
                {profile?.checkinStreak ?? 0}d
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-black/45 border border-white/10">
              <p className="text-[10px] font-mono uppercase text-gray-400">Token Claim</p>
              <button
                type="button"
                onClick={handleAttemptClaim}
                disabled={busyAction === 'claim'}
                className="mt-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold text-gray-200"
              >
                {tokenEnabled ? 'Claim' : 'Gated'}
              </button>
            </div>
          </div>
        </div>

        {feedback && (
          <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200">
            {feedback}
          </div>
        )}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200">
            {errorMsg}
          </div>
        )}

        {/* Daily Activities */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-[#130E20] border border-white/10 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-[11px] font-mono uppercase text-cyan-300">Daily Streak Bonus</span>
              <h2 className="text-xl font-cinzel font-bold text-white mt-1">Daily Explorer Check-In</h2>
              <p className="text-xs text-gray-400 mt-2">
                Record your verified daily check-in (20–100 Participation Points based on consecutive streak).
              </p>
            </div>
            <button
              type="button"
              disabled={(!token && !effectiveAccountKey) || busyAction === 'checkin' || profile?.canCheckinToday === false}
              onClick={() => postAction('/api/vyno/checkin', {}, 'checkin')}
              className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold disabled:opacity-50"
            >
              {profile?.canCheckinToday === false
                ? 'Checked In Today ✓'
                : busyAction === 'checkin'
                ? 'Recording...'
                : 'Claim Daily Check-In'}
            </button>
          </div>

          <div className="p-6 rounded-3xl bg-[#130E20] border border-white/10 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-[11px] font-mono uppercase text-purple-300">Server-CSPRNG Spin</span>
              <h2 className="text-xl font-cinzel font-bold text-white mt-1">Emirates Compass Wheel</h2>
              <p className="text-xs text-gray-400 mt-2">
                Once per UTC day, spin our server-verified wheel for 15 to 120 Participation Points.
              </p>
            </div>
            <button
              type="button"
              disabled={(!token && !effectiveAccountKey) || busyAction === 'spin' || profile?.canSpinToday === false}
              onClick={() => postAction('/api/vyno/spin', {}, 'spin')}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold disabled:opacity-50"
            >
              {profile?.canSpinToday === false
                ? 'Spun Today ✓'
                : busyAction === 'spin'
                ? 'Spinning...'
                : 'Spin Wheel'}
            </button>
          </div>

          <div className="p-6 rounded-3xl bg-[#130E20] border border-white/10 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-[11px] font-mono uppercase text-amber-300">Daily Reveal</span>
              <h2 className="text-xl font-cinzel font-bold text-white mt-1">Twilight Scratch Pass</h2>
              <p className="text-xs text-gray-400 mt-2">
                Reveal today&apos;s Golden Dune or Twilight Oasis Participation Pass on the server ledger.
              </p>
            </div>
            <button
              type="button"
              disabled={(!token && !effectiveAccountKey) || busyAction === 'scratch' || profile?.canScratchToday === false}
              onClick={() => postAction('/api/vyno/scratch', {}, 'scratch')}
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold disabled:opacity-50"
            >
              {profile?.canScratchToday === false
                ? 'Revealed Today ✓'
                : busyAction === 'scratch'
                ? 'Revealing...'
                : 'Reveal Scratch Pass'}
            </button>
          </div>
        </div>

        {/* UAE Knowledge Quizzes */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#130E20] border border-white/10 space-y-6">
          <div>
            <h2 className="text-2xl font-cinzel font-bold text-white">UAE &amp; Web3 Knowledge Quizzes</h2>
            <p className="text-xs text-gray-400 mt-1">
              Answer correctly to earn permanent Participation Points on your ledger.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {quizzes.map((q) => {
              const solved = profile?.completedQuizIds?.includes(q.id);
              return (
                <div key={q.id} className="p-5 rounded-2xl bg-black/45 border border-white/10 space-y-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase text-purple-300">{q.category}</span>
                    <span className="font-mono font-bold text-amber-300">+{q.points} PTS</span>
                  </div>
                  <p className="text-sm font-semibold text-white">{q.question}</p>
                  <div className="space-y-1.5">
                    {q.options.map((opt, idx) => (
                      <label
                        key={idx}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer ${
                          selectedAnswers[q.id] === idx
                            ? 'border-purple-400 bg-purple-950/40 text-white'
                            : 'border-white/10 text-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`quiz-${q.id}`}
                          disabled={solved}
                          checked={selectedAnswers[q.id] === idx}
                          onChange={() => setSelectedAnswers((prev) => ({ ...prev, [q.id]: idx }))}
                          className="accent-purple-500"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={solved || (!token && !effectiveAccountKey) || selectedAnswers[q.id] === undefined || busyAction === q.id}
                    onClick={() => postAction('/api/vyno/quiz', { quizId: q.id, selectedIndex: selectedAnswers[q.id] }, q.id)}
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold disabled:opacity-50"
                  >
                    {solved ? 'Completed ✓' : 'Submit Answer'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ledger + Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-[#130E20] border border-white/10 space-y-4">
            <h2 className="text-xl font-cinzel font-bold text-white">Your Points Ledger</h2>
            {ledger.length === 0 ? (
              <p className="text-xs text-gray-400">Load your account or complete any check-in/quiz above to see server ledger entries.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1 text-xs">
                {ledger.map((item) => (
                  <div key={item.id} className="p-3 rounded-xl bg-black/45 border border-white/10 flex justify-between gap-2">
                    <div>
                      <p className="font-semibold text-white">{item.description}</p>
                      <p className="text-[10px] font-mono text-gray-400">
                        {item.entryRef} · {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-emerald-300 shrink-0">
                      +{item.pointsDelta} PTS
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 rounded-3xl bg-[#130E20] border border-white/10 space-y-4">
            <h2 className="text-xl font-cinzel font-bold text-white">Top Participation Leaderboard</h2>
            {leaderboard.length === 0 ? (
              <p className="text-xs text-gray-400">No leaderboard points recorded yet.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {leaderboard.map((row) => (
                  <div key={row.rank} className="p-3 rounded-xl bg-black/45 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-purple-600/30 text-purple-200 font-mono font-bold flex items-center justify-center">
                        #{row.rank}
                      </span>
                      <span className="font-semibold text-white">{row.displayName}</span>
                    </div>
                    <span className="font-mono text-amber-300 font-bold">{row.pointsBalance} PTS</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyRewardsPage;
