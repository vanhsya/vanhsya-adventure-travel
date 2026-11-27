import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Booking,
  PaymentTransactionRecord,
  TravelBookingRecord,
  VynoAccountProfile,
} from '../types';
import { TOURS_DATA } from '../constants';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import SeoHead from '../components/SeoHead';
import { ReceiptModal } from '../components/ReceiptModal';
import { TripFeedbackSection, TripFeedbackModal } from '../components/TripFeedback';
import { BRAND_CONTACTS, UAE_EMIRATES } from '../utils/utm';

const DashboardPage: React.FC = () => {
  const { bookings } = useAppContext();
  const { user, token, favorites, loading: authLoading, login, register, logout, updateProfile, toggleFavorite } =
    useAuth();

  const [selectedBookingForFeedback, setSelectedBookingForFeedback] = useState<Booking | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // Account Sign-In / Registration State
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [emirateInput, setEmirateInput] = useState<string>('Dubai');
  const [consentEmailInput, setConsentEmailInput] = useState(true);
  const [consentWhatsappInput, setConsentWhatsappInput] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [profileSavedMsg, setProfileSavedMsg] = useState<string | null>(null);

  // Editable Profile Fields when Signed In
  const [editPhone, setEditPhone] = useState('');
  const [editEmirate, setEditEmirate] = useState('Dubai');
  const [editConsentEmail, setEditConsentEmail] = useState(true);
  const [editConsentWhatsapp, setEditConsentWhatsapp] = useState(true);
  const [profileBusy, setProfileBusy] = useState(false);

  // Server Bookings & Receipt Modal
  const [serverBookings, setServerBookings] = useState<TravelBookingRecord[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [refLookupInput, setRefLookupInput] = useState('');
  const [refLookupError, setRefLookupError] = useState<string | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptBooking, setReceiptBooking] = useState<TravelBookingRecord | null>(null);
  const [receiptTx, setReceiptTx] = useState<PaymentTransactionRecord | null>(null);

  // VYNO Participation Points Summary
  const [vynoProfile, setVynoProfile] = useState<VynoAccountProfile | null>(null);

  // Membership ID verification lookup
  const [lookupId, setLookupId] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<{
    membershipId: string;
    fullName: string;
    emirate: string;
    createdAt: string;
  } | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const loadAccountData = useCallback(async () => {
    if (!token) {
      setServerBookings([]);
      setVynoProfile(null);
      return;
    }
    setBookingsLoading(true);
    try {
      const [bookRes, vynoRes] = await Promise.all([
        fetch('/api/my/bookings', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/vyno/profile', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (bookRes.ok) {
        const bData = await bookRes.json();
        setServerBookings(bData.bookings || []);
      }
      if (vynoRes.ok) {
        const vData = await vynoRes.json();
        setVynoProfile(vData.profile || null);
      }
    } catch {
      // non-fatal
    } finally {
      setBookingsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      setEditPhone(user.phone || '');
      setEditEmirate(user.emirate || 'Dubai');
      setEditConsentEmail(Boolean(user.consentEmail));
      setEditConsentWhatsapp(Boolean(user.consentWhatsapp));
    }
    loadAccountData();
  }, [user, loadAccountData]);

  const savedTours = useMemo(
    () => TOURS_DATA.filter((tour) => favorites.includes(tour.slug)),
    [favorites]
  );

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (authMode === 'login') {
      const res = await login(emailInput.trim(), passwordInput);
      if (!res.ok) setAuthError(res.error || 'Unable to sign in.');
      else setPasswordInput('');
    } else {
      const res = await register({
        fullName: fullNameInput.trim(),
        email: emailInput.trim(),
        password: passwordInput,
        phone: phoneInput.trim(),
        emirate: emirateInput,
        consentEmail: consentEmailInput,
        consentWhatsapp: consentWhatsappInput,
      });
      if (!res.ok) setAuthError(res.error || 'Unable to create account.');
      else setPasswordInput('');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileBusy(true);
    setProfileSavedMsg(null);
    const res = await updateProfile({
      phone: editPhone.trim(),
      emirate: editEmirate,
      consentEmail: editConsentEmail,
      consentWhatsapp: editConsentWhatsapp,
    });
    setProfileBusy(false);
    if (res.ok) {
      setProfileSavedMsg('Preferences & consent settings saved.');
    } else {
      setProfileSavedMsg(res.error || 'Unable to save preferences.');
    }
  };

  const openReceiptByRef = async (bookingRef: string) => {
    setRefLookupError(null);
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(bookingRef.trim().toUpperCase())}`);
      const data = await res.json();
      if (!res.ok || !data.booking) {
        setRefLookupError(data.error || 'Booking reference not found.');
        return;
      }
      setReceiptBooking(data.booking);
      setReceiptTx(data.transaction || null);
      setReceiptOpen(true);
    } catch {
      setRefLookupError('Unable to fetch booking receipt.');
    }
  };

  const handleVerifyMembership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupId.trim()) return;
    setLookupLoading(true);
    setLookupError(null);
    setLookupResult(null);

    try {
      const res = await fetch(`/api/members/${encodeURIComponent(lookupId.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setLookupError(data.error || 'Membership ID not found.');
      } else {
        setLookupResult(data.member);
      }
    } catch {
      setLookupError('Unable to check membership ID.');
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-20 pt-28 min-h-screen text-gray-100">
      <SeoHead
        title="Explorer & Member Dashboard — Vanhsya Social Club"
        description="Sign in to your Vanhsya Explorer account, inspect saved favorites and receipts, verify Founding Member IDs, and manage trip feedback."
        path="/dashboard"
      />

      <header className="text-center mb-12 space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.26em] text-purple-300">
          {BRAND_CONTACTS.clubName} · {BRAND_CONTACTS.companyName}
        </p>
        <h1 className="text-4xl md:text-6xl font-black font-cinzel text-white">
          Explorer Dashboard
        </h1>
        <p className="text-sm sm:text-base max-w-2xl mx-auto text-gray-400">
          Manage your Vanhsya Explorer profile, saved favorites, official booking receipts, VYNO participation ledger, and trip reviews.
        </p>
      </header>

      {/* Explorer Account + VYNO Points Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-14">
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-[#130E20] border border-purple-500/30 space-y-5">
          {user ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-300">
                    Signed In Explorer Account
                  </span>
                  <h2 className="text-2xl font-cinzel font-bold text-white mt-1">{user.fullName}</h2>
                  <p className="text-xs text-gray-400">{user.email}</p>
                  {user.membershipId && (
                    <span className="inline-block mt-2 px-2.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-[11px] font-mono text-emerald-300">
                      Founding Pass: {user.membershipId}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="px-4 py-2 rounded-xl border border-rose-500/40 text-rose-200 hover:bg-rose-950/40 text-xs font-semibold"
                >
                  Sign Out
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 mb-1">WhatsApp / Phone</label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+971 50 ..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1">Emirate / Base</label>
                    <select
                      value={editEmirate}
                      onChange={(e) => setEditEmirate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0814] border border-white/15 text-white"
                    >
                      {UAE_EMIRATES.map((em) => (
                        <option key={em} value={em}>{em}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editConsentEmail}
                      onChange={(e) => setEditConsentEmail(e.target.checked)}
                      className="accent-purple-500"
                    />
                    <span>Receive email trip &amp; meetup updates</span>
                  </label>
                  <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editConsentWhatsapp}
                      onChange={(e) => setEditConsentWhatsapp(e.target.checked)}
                      className="accent-emerald-500"
                    />
                    <span>Receive WhatsApp concierge notifications</span>
                  </label>
                </div>

                {profileSavedMsg && (
                  <p className="text-emerald-300 font-medium">{profileSavedMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={profileBusy}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  {profileBusy ? 'Saving...' : 'Save Account Preferences'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-xl font-cinzel font-bold text-white">
                    {authMode === 'login' ? 'Sign In to Vanhsya Account' : 'Create Explorer Account'}
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Save favorites across devices, sync bookings, and track VYNO Participation Points.
                  </p>
                </div>
                <div className="flex gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setAuthError(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-semibold ${
                      authMode === 'login' ? 'bg-purple-600 text-white' : 'text-gray-400'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('register');
                      setAuthError(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-semibold ${
                      authMode === 'register' ? 'bg-purple-600 text-white' : 'text-gray-400'
                    }`}
                  >
                    Create Account
                  </button>
                </div>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200">
                  {authError}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-3 text-xs">
                {authMode === 'register' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      value={fullNameInput}
                      onChange={(e) => setFullNameInput(e.target.value)}
                      placeholder="Full Name *"
                      className="px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white"
                    />
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="WhatsApp (+971 ...)"
                      className="px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Email Address *"
                    className="px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white"
                  />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder={authMode === 'register' ? 'Password (min 8 chars) *' : 'Password *'}
                    className="px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white"
                  />
                </div>

                {authMode === 'register' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <select
                        value={emirateInput}
                        onChange={(e) => setEmirateInput(e.target.value)}
                        className="px-3.5 py-2.5 rounded-xl bg-[#0B0814] border border-white/15 text-white"
                      >
                        {UAE_EMIRATES.map((em) => (
                          <option key={em} value={em}>{em}</option>
                        ))}
                      </select>
                      <div className="flex flex-wrap items-center gap-3 text-gray-300">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={consentEmailInput}
                            onChange={(e) => setConsentEmailInput(e.target.checked)}
                            className="accent-purple-500"
                          />
                          <span>Email Opt-In</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={consentWhatsappInput}
                            onChange={(e) => setConsentWhatsappInput(e.target.checked)}
                            className="accent-emerald-500"
                          />
                          <span>WhatsApp Opt-In</span>
                        </label>
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase tracking-wider disabled:opacity-60"
                >
                  {authLoading
                    ? 'Please wait...'
                    : authMode === 'login'
                    ? 'Sign In to Dashboard'
                    : 'Create Explorer Account'}
                </button>
              </form>
            </>
          )}
        </div>

        {/* VYNO Points Summary & Quick Shortcuts */}
        <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-[#130E20] border border-cyan-500/25 space-y-5 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-300">
              VYNO Participation Ledger (Compliance Gated)
            </span>
            <h2 className="text-xl font-cinzel font-bold text-white">
              {vynoProfile ? `${vynoProfile.pointsBalance.toLocaleString()} PTS` : 'Explorer Points Hub'}
            </h2>
            {vynoProfile ? (
              <p className="text-xs text-gray-300">
                Streak: <strong className="text-cyan-300">{vynoProfile.checkinStreak} day(s)</strong> · Referral Code:{' '}
                <code className="text-purple-300">{vynoProfile.referralCode}</code>
              </p>
            ) : (
              <p className="text-xs text-gray-400">
                Sign in or link an EVM wallet to accumulate server-verified participation points across daily check-ins, quizzes, and referrals.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2 text-xs font-semibold">
            <Link to="/daily-rewards" className="p-3 rounded-xl bg-amber-500/15 border border-amber-400/30 hover:bg-amber-500/25 text-amber-100">
              Open Participation Points Arcade &rarr;
            </Link>
            <Link to="/vyno" className="p-3 rounded-xl bg-cyan-500/15 border border-cyan-400/30 hover:bg-cyan-500/25 text-cyan-100">
              Web3 Wallet Verification Console &rarr;
            </Link>
            <Link to="/book" className="p-3 rounded-xl bg-purple-600/20 border border-purple-400/30 hover:bg-purple-600/35 text-purple-100">
              Travel Booking Hub (Packages, Flights, Hotels) &rarr;
            </Link>
            <Link to="/ventures" className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white">
              Ventures, Charity &amp; Couples Adventures &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Membership Lookup */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#130E20] border border-purple-500/25 space-y-4 mb-14">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-cinzel font-bold text-white">
              Verify Founding Member Digital ID
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Enter your <span className="font-mono text-purple-300">VSC-UAE-...</span> code to confirm your active UAE 18+ Founding Membership status.
            </p>
          </div>
          <Link to="/social-club" className="text-xs font-semibold text-purple-300 hover:text-white shrink-0">
            Claim New Founding Pass &rarr;
          </Link>
        </div>
        <form onSubmit={handleVerifyMembership} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={lookupId}
            onChange={(e) => setLookupId(e.target.value)}
            placeholder="VSC-UAE-0001-XXXX"
            className="flex-1 px-4 py-3 rounded-xl bg-black/50 border border-white/15 text-sm text-white font-mono"
          />
          <button
            type="submit"
            disabled={lookupLoading}
            className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider"
          >
            {lookupLoading ? 'Checking...' : 'Verify ID'}
          </button>
        </form>

        {lookupError && <p className="text-xs text-rose-300">{lookupError}</p>}
        {lookupResult && (
          <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-xs space-y-1">
            <p className="font-bold text-emerald-300">Verified Founding Member</p>
            <p className="text-white font-semibold">{lookupResult.fullName}</p>
            <p className="text-gray-300 font-mono">
              {lookupResult.membershipId} · {lookupResult.emirate}, UAE
            </p>
          </div>
        )}
      </div>

      {/* Saved Favorites */}
      <section className="mb-14 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h2 className="text-2xl font-cinzel font-bold text-white">
            Saved Favorites ({savedTours.length})
          </h2>
          <Link to="/" className="text-xs font-semibold text-purple-300 hover:text-white">
            Explore Catalog &rarr;
          </Link>
        </div>

        {savedTours.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {savedTours.map((t) => (
              <div key={t.slug} className="rounded-2xl bg-[#130E20] border border-white/10 overflow-hidden flex flex-col">
                <img
                  src={t.images[0]}
                  alt={t.title}
                  className="h-40 w-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <p className="text-[10px] font-mono uppercase text-cyan-300">{t.city}, {t.country}</p>
                    <h3 className="text-base font-cinzel font-bold text-white mt-0.5">{t.title}</h3>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <Link
                      to={`/tours/${t.slug}`}
                      className="px-3.5 py-2 rounded-lg bg-purple-600 text-white font-semibold"
                    >
                      Book Now
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(t.slug, 'experience')}
                      className="px-3 py-2 rounded-lg border border-white/10 text-gray-300 hover:text-rose-300"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl border border-dashed border-white/15 text-center text-sm text-gray-400">
            Tap the heart icon on any experience card to save itineraries to your favorites.
          </div>
        )}
      </section>

      {/* Server-Recorded Travel Bookings & Receipts */}
      <section className="mb-14 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-2xl font-cinzel font-bold text-white">
              Official Bookings &amp; Receipts
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Persistent reservations linked to your account, or look up any booking by its <span className="font-mono text-cyan-300">VNS-...</span> reference.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={refLookupInput}
              onChange={(e) => setRefLookupInput(e.target.value)}
              placeholder="Lookup Ref (e.g. VNS-...)"
              className="px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white font-mono"
            />
            <button
              type="button"
              onClick={() => refLookupInput.trim() && openReceiptByRef(refLookupInput)}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
            >
              Find Receipt
            </button>
          </div>
        </div>

        {refLookupError && <p className="text-xs text-rose-300">{refLookupError}</p>}

        {bookingsLoading ? (
          <p className="text-xs text-gray-400">Loading account bookings...</p>
        ) : serverBookings.length > 0 ? (
          <div className="space-y-4">
            {serverBookings.map((b) => (
              <div
                key={b.id}
                className="p-5 rounded-2xl bg-[#130E20] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-cyan-300">{b.bookingRef}</span>
                    <span className="px-2 py-0.5 rounded bg-purple-900/60 text-purple-200 uppercase font-semibold">
                      {b.status.replace('_', ' ')}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-200 uppercase font-semibold">
                      Payment: {b.paymentStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h3 className="text-lg font-cinzel font-bold text-white">{b.itemTitle}</h3>
                  <p className="text-gray-400">
                    {b.travelDate} ({b.timeSlot}) · {b.guests} guest(s) · {b.currency} {b.displayTotal.toLocaleString()}
                  </p>
                  {b.meetingPoint && (
                    <p className="text-[11px] text-gray-500">Meeting Hub: {b.meetingPoint}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openReceiptByRef(b.bookingRef)}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                  >
                    View Official Receipt
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl border border-dashed border-white/15 text-center text-sm text-gray-400">
            {user
              ? 'No server-recorded bookings on this account yet.'
              : 'Sign in above to view all bookings tied to your email, or paste a VNS-... booking reference to download your receipt.'}
          </div>
        )}
      </section>

      {/* Local Session Bookings for TripFeedback */}
      {bookings.length > 0 && (
        <section className="mb-14 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="text-2xl font-cinzel font-bold text-white">Recent Passport Bookings</h2>
            <Link to="/ai-planner" className="text-xs font-semibold text-purple-300 hover:text-white">
              Plan a Journey &rarr;
            </Link>
          </div>

          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex flex-col sm:flex-row items-center gap-5 p-5 rounded-2xl bg-[#130E20] border border-white/10"
              >
                <img
                  src={booking.tourImage}
                  alt={booking.tourTitle}
                  className="w-full sm:w-28 h-20 rounded-xl object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-lg font-cinzel font-bold text-white">{booking.tourTitle}</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Booking {booking.id} · {booking.date} · Status: {booking.status}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {booking.status === 'completed' && (
                    <button
                      onClick={() => {
                        setSelectedBookingForFeedback(booking);
                        setIsFeedbackModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold"
                    >
                      Leave Review
                    </button>
                  )}
                  <Link
                    to={`/tours/${booking.tourSlug}`}
                    className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold"
                  >
                    View Tour
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <TripFeedbackSection />

      {isFeedbackModalOpen && (
        <TripFeedbackModal
          isOpen={isFeedbackModalOpen}
          bookingToReview={selectedBookingForFeedback}
          onClose={() => setIsFeedbackModalOpen(false)}
        />
      )}

      <ReceiptModal
        isOpen={receiptOpen}
        booking={receiptBooking}
        payment={receiptTx}
        onClose={() => setReceiptOpen(false)}
      />
    </div>
  );
};

export default DashboardPage;
