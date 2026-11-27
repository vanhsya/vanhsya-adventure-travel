import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SeoHead from '../components/SeoHead';
import { useAuth } from '../contexts/AuthContext';
import { VynoAccountProfile } from '../types';
import { BRAND_CONTACTS, buildHashShareUrl, buildWhatsAppShareUrl } from '../utils/utm';

const ReferAndEarnPage: React.FC = () => {
  const { user, token } = useAuth();
  const [copied, setCopied] = useState(false);

  const [accountKeyInput, setAccountKeyInput] = useState(() => user?.membershipId || user?.walletAddress || '');
  const [profile, setProfile] = useState<VynoAccountProfile | null>(null);
  const [friendName, setFriendName] = useState('');
  const [friendEmail, setFriendEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const key = user?.membershipId || user?.walletAddress || accountKeyInput.trim();
    if (!token && !key) return;
    const url = token ? '/api/vyno/profile' : `/api/vyno/profile?accountKey=${encodeURIComponent(key)}`;
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.profile) setProfile(d.profile);
      })
      .catch(() => {});
  }, [token, user, accountKeyInput]);

  const shareUrl = buildHashShareUrl('/social-club', {
    source: 'member_invite',
    medium: 'referral_link',
    campaign: 'life_begins_with_a_hello',
    content: profile?.referralCode || undefined,
  });

  const whatsappUrl = buildWhatsAppShareUrl(
    `Life Begins With a Hello — Come alone, explore together with Vanhsya Social Club (UAE 18+). Join here: ${shareUrl}`
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFeedback(null);
    const activeKey = token ? undefined : accountKeyInput.trim() || 'guest:community';
    setSubmitting(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch('/api/vyno/referrals', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          accountKey: activeKey,
          displayName: user?.fullName,
          referredName: friendName.trim(),
          referredEmail: friendEmail.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Unable to log invite.');
      } else {
        setProfile(data.profile || null);
        setFriendName('');
        setFriendEmail('');
        setFeedback(`Invitation logged (${data.entryRef}). +${data.pointsAwarded} Participation Points added.`);
      }
    } catch {
      setErrorMsg('Network error submitting referral.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-28 pb-24 bg-[#0D0A14] min-h-screen text-white px-4">
      <SeoHead
        title="Invite Friends | Vanhsya Social Club UAE"
        description="Invite UAE residents (18+) to Vanhsya Social Club — Life Begins With a Hello. Come alone. Explore together."
        path="/refer-and-earn"
      />

      <div className="max-w-4xl mx-auto space-y-10">
        <div className="text-center space-y-4">
          <span className="text-xs font-mono uppercase tracking-[0.28em] text-[#C4B5FD]">
            Life Begins With a Hello
          </span>
          <h1 className="text-4xl sm:text-6xl font-black font-cinzel text-white">
            Invite Your Circle to Vanhsya Social Club
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-base leading-relaxed">
            Share your personal UTM invitation link via WhatsApp or Instagram so friends in the UAE (18+) can claim their Founding Member ID and RSVP for verified meetups.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-[#151121] border border-purple-500/25 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-cinzel font-bold text-white">Shareable Invitation Link</h2>
            {profile && (
              <span className="text-xs font-mono text-cyan-300">
                Code: {profile.referralCode} · Invites Recorded: {profile.referralsCount} · Balance: {profile.pointsBalance} PTS
              </span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-gray-300 break-all">
              {shareUrl}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="px-6 py-3 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-gray-200 shrink-0"
            >
              {copied ? 'Copied!' : 'Copy Invite Link'}
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl bg-emerald-600/25 hover:bg-emerald-600/35 border border-emerald-500/40 text-emerald-200 text-xs font-semibold"
            >
              Share on WhatsApp →
            </a>
            <a
              href={BRAND_CONTACTS.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-gray-200 text-xs font-semibold"
            >
              Follow {BRAND_CONTACTS.instagramHandle} →
            </a>
            <Link
              to="/partners/apply"
              className="px-6 py-3 rounded-xl bg-[#8A2BE2]/25 hover:bg-[#8A2BE2]/35 border border-purple-500/35 text-[#E9D5FF] text-xs font-semibold"
            >
              Apply as Community Host →
            </Link>
          </div>
        </div>

        {/* Log Direct Community Invitation (Participation Points) */}
        <form onSubmit={handleSubmitReferral} className="p-8 rounded-3xl bg-[#151121] border border-white/10 space-y-4 text-xs">
          <h2 className="text-xl font-cinzel font-bold text-white">Record a Friend Invitation (+50 Participation Points)</h2>
          {!token && (
            <div>
              <label className="block text-gray-300 mb-1">Your Founding ID, Wallet (0x...), or Alias</label>
              <input
                type="text"
                value={accountKeyInput}
                onChange={(e) => setAccountKeyInput(e.target.value)}
                placeholder="VSC-UAE-0001-XXXX or explorer_alias"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white font-mono"
              />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              value={friendName}
              onChange={(e) => setFriendName(e.target.value)}
              placeholder="Friend First Name *"
              className="px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white"
            />
            <input
              type="email"
              required
              value={friendEmail}
              onChange={(e) => setFriendEmail(e.target.value)}
              placeholder="Friend Email Address *"
              className="px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white"
            />
          </div>
          {errorMsg && <p className="text-rose-300">{errorMsg}</p>}
          {feedback && <p className="text-emerald-300">{feedback}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase tracking-wider"
          >
            {submitting ? 'Saving...' : 'Log Invitation'}
          </button>
        </form>

        <div className="p-6 rounded-2xl border border-amber-500/30 bg-amber-950/15 text-xs text-amber-100/90 leading-relaxed">
          <strong className="text-amber-300 font-mono uppercase">Compliance Notice:</strong> Monetary cash bounties or token-linked referral payouts remain disabled pending separate regulatory compliance review. Invitations award server-verified Participation Points and connect members directly with verified UAE Social Club experiences.
        </div>
      </div>
    </div>
  );
};

export default ReferAndEarnPage;
