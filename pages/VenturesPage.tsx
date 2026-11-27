import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SeoHead from '../components/SeoHead';
import { useAuth } from '../contexts/AuthContext';
import { SurpriseOrderRecord, VentureCategory, VentureRequestRecord } from '../types';
import { BRAND_CONTACTS, UAE_EMIRATES, buildWhatsAppDirectEnquiryUrl } from '../utils/utm';
import merchTshirtsImg from '../src/assets/images/vanhsya_merch_tshirts_1795771934781.jpg';
import kioskHubImg from '../src/assets/images/vanhsya_kiosk_hub_1795771935689.jpg';
import couplesCanyonImg from '../src/assets/images/couples_scary_canyon_1795771935899.jpg';
import charitySurpriseImg from '../src/assets/images/charity_surprise_celebration_1795771935937.jpg';

type VentureTab = 'franchises' | 'charity_merch' | 'surprises' | 'couples';

interface ImpactStats {
  totalOrders: number;
  tshirtsReserved: number;
  pledgedAed: number;
  surprisesPlanned: number;
  couplesRequests: number;
}

const COUPLES_SCARY_EXPERIENCES = [
  {
    id: 'hajar-cliff-via-ferrata',
    emirate: 'Ras Al Khaimah',
    intensity: 'EXTREME HEIGHTS · NIGHT RIG',
    title: 'Hajar Cliff Night Via Ferrata & Canyon Suspension',
    description:
      'Dual-harness moonlit traverse along sheer limestone walls overlooking the dry canyons of Jebel Jais, guided with two certified high-altitude spotters.',
    includes: ['Certified Dual-Harness Rig', 'Headlamp & Helmet Telemetry', 'Midnight Karaks & Recovery Fire'],
  },
  {
    id: 'red-dune-bivouac',
    emirate: 'Dubai Desert Border',
    intensity: 'DEEP WILDERNESS · AFTER DARK',
    title: 'Midnight Desert Bivouac & Blindfold Navigation Trial',
    description:
      'No resorts, no city glare. Navigate by compass and dune ridge silhouettes under infinite desert darkness before camping by open desert embers.',
    includes: ['4x4 Rescue Escort Standby', 'Twin Stargazing Dome Tent', 'Dawn Horizon Breakfast'],
  },
  {
    id: 'east-coast-trench-dive',
    emirate: 'Fujairah / Khor Fakkan',
    intensity: 'DUSK OCEAN · DEEP WATER',
    title: 'East Coast Dusk Trench Snorkel & Night Shoreline Challenge',
    description:
      'Tethered dusk ocean exploration along dramatic rocky coves where waves echo against volcanic sea cliffs at twilight.',
    includes: ['Surface Safety Dive Buoy', 'Thermal Wetsuits & Strobes', 'Beachfront Fire Recovery Dinner'],
  },
];

const VenturesPage: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  const deriveTab = (pathname: string, hash: string): VentureTab => {
    if (pathname.includes('/charity') || hash.includes('charity')) return 'charity_merch';
    if (pathname.includes('/couples') || hash.includes('couples')) return 'couples';
    if (hash.includes('surprises')) return 'surprises';
    return 'franchises';
  };

  const [activeTab, setActiveTab] = useState<VentureTab>(() => deriveTab(location.pathname, location.hash));
  const [impact, setImpact] = useState<ImpactStats>({
    totalOrders: 0,
    tshirtsReserved: 0,
    pledgedAed: 0,
    surprisesPlanned: 0,
    couplesRequests: 0,
  });

  // 1. Ventures / Kiosks / Space Franchises / Flight Pre-Booking Desk / Business Hub Spots
  const [ventureCat, setVentureCat] = useState<VentureCategory>('space_franchise');
  const [vName, setVName] = useState(user?.fullName || '');
  const [vOrg, setVOrg] = useState('');
  const [vEmail, setVEmail] = useState(user?.email || '');
  const [vPhone, setVPhone] = useState(user?.phone || '');
  const [vCity, setVCity] = useState('Dubai');
  const [vSpace, setVSpace] = useState('');
  const [vDate, setVDate] = useState('');
  const [vBudget, setVBudget] = useState('');
  const [vSummary, setVSummary] = useState('');
  const [vBusy, setVBusy] = useState(false);
  const [vSaved, setVSaved] = useState<VentureRequestRecord | null>(null);
  const [vError, setVError] = useState<string | null>(null);

  // 2. Printed T-Shirt & Charity Pledge State
  const [merchType, setMerchType] = useState<'printed_tshirt' | 'charity_pledge'>('printed_tshirt');
  const [mName, setMName] = useState(user?.fullName || '');
  const [mEmail, setMEmail] = useState(user?.email || '');
  const [mPhone, setMPhone] = useState(user?.phone || '');
  const [mSize, setMSize] = useState('M');
  const [mColor, setMColor] = useState('Obsidian Violet Crest');
  const [mQty, setMQty] = useState(1);
  const [mCause, setMCause] = useState('UAE Youth Discovery Bursaries');
  const [mPledge, setMPledge] = useState(95);
  const [mNotes, setMNotes] = useState('');
  const [mBusy, setMBusy] = useState(false);
  const [mSaved, setMSaved] = useState<SurpriseOrderRecord | null>(null);
  const [mError, setMError] = useState<string | null>(null);

  // 3. Unexpected Surprises State
  const [sName, setSName] = useState(user?.fullName || '');
  const [sEmail, setSEmail] = useState(user?.email || '');
  const [sPhone, setSPhone] = useState(user?.phone || '');
  const [sOccasion, setSOccasion] = useState('Birthday Unexpected Celebration');
  const [sRecipient, setSRecipient] = useState('');
  const [sEmirate, setSEmirate] = useState('Dubai');
  const [sDate, setSDate] = useState('');
  const [sNotes, setSNotes] = useState('');
  const [sBusy, setSBusy] = useState(false);
  const [sSaved, setSSaved] = useState<SurpriseOrderRecord | null>(null);
  const [sError, setSError] = useState<string | null>(null);

  // 4. Couples Scariest Adventure State
  const [cSelected, setCSelected] = useState(COUPLES_SCARY_EXPERIENCES[0].title);
  const [cName, setCName] = useState(user?.fullName || '');
  const [cEmail, setCEmail] = useState(user?.email || '');
  const [cPhone, setCPhone] = useState(user?.phone || '');
  const [cDate, setCDate] = useState('');
  const [cNotes, setCNotes] = useState('');
  const [cBusy, setCBusy] = useState(false);
  const [cSaved, setCSaved] = useState<SurpriseOrderRecord | null>(null);
  const [cError, setCError] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(deriveTab(location.pathname, location.hash));
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (user) {
      setVName((p) => p || user.fullName);
      setVEmail((p) => p || user.email);
      setVPhone((p) => p || user.phone || '');
      setMName((p) => p || user.fullName);
      setMEmail((p) => p || user.email);
      setMPhone((p) => p || user.phone || '');
      setSName((p) => p || user.fullName);
      setSEmail((p) => p || user.email);
      setSPhone((p) => p || user.phone || '');
      setCName((p) => p || user.fullName);
      setCEmail((p) => p || user.email);
      setCPhone((p) => p || user.phone || '');
    }
  }, [user]);

  const refreshImpact = () => {
    fetch('/api/charity/impact')
      .then((r) => r.json())
      .then((d) => {
        if (d && typeof d.totalOrders === 'number') setImpact(d);
      })
      .catch(() => {});
  };

  useEffect(() => {
    refreshImpact();
  }, []);

  const submitVenture = async (e: React.FormEvent) => {
    e.preventDefault();
    setVBusy(true);
    setVError(null);
    setVSaved(null);
    try {
      const res = await fetch('/api/ventures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: ventureCat,
          fullName: vName,
          organization: vOrg,
          email: vEmail,
          phone: vPhone,
          cityEmirate: vCity,
          spaceSizeSqft: vSpace,
          preferredDate: vDate,
          budgetBand: vBudget,
          summary: vSummary,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVError(data.error || 'Could not record venture submission.');
      } else {
        setVSaved(data.venture);
        setVSummary('');
      }
    } catch {
      setVError('Network error while submitting request.');
    } finally {
      setVBusy(false);
    }
  };

  const submitMerchOrCharity = async (e: React.FormEvent) => {
    e.preventDefault();
    setMBusy(true);
    setMError(null);
    setMSaved(null);
    try {
      const res = await fetch('/api/surprises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderType: merchType,
          fullName: mName,
          email: mEmail,
          phone: mPhone,
          occasionOrPackage:
            merchType === 'printed_tshirt' ? 'Vanhsya Printed Explorer T-Shirt' : 'Direct Charity Contribution Pledge',
          shirtSize: merchType === 'printed_tshirt' ? mSize : '',
          shirtColor: merchType === 'printed_tshirt' ? mColor : '',
          quantity: merchType === 'printed_tshirt' ? mQty : 1,
          charityCause: mCause,
          pledgeAmountAed: mPledge,
          notes: mNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMError(data.error || 'Unable to record order or pledge.');
      } else {
        setMSaved(data.order);
        setMNotes('');
        refreshImpact();
      }
    } catch {
      setMError('Network error saving reservation.');
    } finally {
      setMBusy(false);
    }
  };

  const submitSurprise = async (e: React.FormEvent) => {
    e.preventDefault();
    setSBusy(true);
    setSError(null);
    setSSaved(null);
    try {
      const res = await fetch('/api/surprises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderType: 'surprise_planner',
          fullName: sName,
          email: sEmail,
          phone: sPhone,
          occasionOrPackage: sOccasion,
          recipientFirstName: sRecipient,
          emirate: sEmirate,
          preferredDate: sDate,
          notes: sNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSError(data.error || 'Unable to save surprise plan.');
      } else {
        setSSaved(data.order);
        setSNotes('');
        refreshImpact();
      }
    } catch {
      setSError('Network error saving surprise request.');
    } finally {
      setSBusy(false);
    }
  };

  const submitCouplesChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    setCBusy(true);
    setCError(null);
    setCSaved(null);
    try {
      const selectedMeta = COUPLES_SCARY_EXPERIENCES.find((x) => x.title === cSelected);
      const res = await fetch('/api/surprises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderType: 'couples_adventure',
          fullName: cName,
          email: cEmail,
          phone: cPhone,
          occasionOrPackage: cSelected,
          emirate: selectedMeta?.emirate || 'Ras Al Khaimah',
          preferredDate: cDate,
          notes: cNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCError(data.error || 'Unable to reserve couples request.');
      } else {
        setCSaved(data.order);
        setCNotes('');
        refreshImpact();
      }
    } catch {
      setCError('Network error saving couples adventure request.');
    } finally {
      setCBusy(false);
    }
  };

  return (
    <div className="pt-20 pb-20 min-h-screen bg-[#07050C] text-gray-200">
      <SeoHead
        title="Ventures, Space Franchises, Charity Merch, Surprises & Couples Thrills — Vanhsya"
        description="Invest or host a Vanhsya Smart Kiosk, Business Hub Spot or Flight Pre-Booking franchise desk, reserve printed charity T-shirts, plan birthday surprises, or book scary couples adventures."
        path="/ventures"
      />

      {/* Top Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-8 border-b border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <span className="inline-block px-3.5 py-1 rounded-full bg-amber-950/55 border border-amber-400/35 text-amber-200 text-xs font-mono uppercase tracking-[0.22em]">
              Vanhsya Ecosystem Innovations · {BRAND_CONTACTS.websiteDisplay}
            </span>
            <h1 className="text-4xl sm:text-6xl font-cinzel font-black text-white leading-tight">
              Ventures, Franchises, Charity &amp; Lifestyle
            </h1>
            <p className="text-sm sm:text-base text-gray-300">
              Launch a Vanhsya travel kiosk or business hub franchise inside your venue, pre-book executive flight desks, reserve printed explorer T-shirts supporting UAE charity initiatives, craft unexpected birthday surprises, or challenge yourselves on scary couples nights.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center shrink-0">
            <div className="p-3 rounded-2xl bg-[#130E20] border border-white/10">
              <p className="text-xl font-black text-amber-300">{impact.tshirtsReserved}</p>
              <p className="text-[10px] font-mono uppercase text-gray-400">Tees Reserved</p>
            </div>
            <div className="p-3 rounded-2xl bg-[#130E20] border border-white/10">
              <p className="text-xl font-black text-emerald-300">AED {impact.pledgedAed}</p>
              <p className="text-[10px] font-mono uppercase text-gray-400">Charity Pledged</p>
            </div>
            <div className="p-3 rounded-2xl bg-[#130E20] border border-white/10">
              <p className="text-xl font-black text-purple-300">{impact.surprisesPlanned}</p>
              <p className="text-[10px] font-mono uppercase text-gray-400">Surprises Logged</p>
            </div>
            <div className="p-3 rounded-2xl bg-[#130E20] border border-white/10">
              <p className="text-xl font-black text-cyan-300">{impact.couplesRequests}</p>
              <p className="text-[10px] font-mono uppercase text-gray-400">Couples Challenges</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 mt-8">
          {(
            [
              { id: 'franchises', label: 'Invest, Space Franchises, Kiosks & Hub Spots' },
              { id: 'charity_merch', label: 'Charity Impact & Printed T-Shirts' },
              { id: 'surprises', label: 'Unexpected Birthday & Milestone Surprises' },
              { id: 'couples', label: 'Scariest Adventures for Couples' },
            ] as Array<{ id: VentureTab; label: string }>
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 border-purple-400 text-white shadow-lg'
                  : 'bg-[#120D1D] border-white/15 text-gray-300 hover:border-purple-400/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
        {activeTab === 'franchises' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-6 space-y-6">
              <div className="rounded-3xl overflow-hidden border border-white/15 bg-[#120D1D] shadow-2xl">
                <img src={kioskHubImg} alt="Vanhsya Smart Travel Kiosk and Business Hub Spot" className="w-full aspect-video object-cover" />
                <div className="p-6 space-y-3">
                  <span className="text-xs font-mono uppercase text-cyan-300 font-bold">
                    TURN YOUR SPACE INTO A TRAVEL &amp; SOCIAL HUB
                  </span>
                  <h2 className="text-2xl font-cinzel font-bold text-white">
                    Franchises, Kiosks, Flight Pre-Booking &amp; Business Hub Spots
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                    Property owners, specialty cafes, co-working spaces, and strategic investors can apply to deploy a Vanhsya Travel Kiosk, reserve Business Hub coworking spots, or pre-book corporate flight blocks. Every proposal is reviewed individually with transparent legal agreements—we never display speculative ROI claims.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {[
                  {
                    cat: 'space_franchise' as VentureCategory,
                    title: 'Space Franchise Desk',
                    desc: 'Have spare retail/lobby square footage? Host a branded Vanhsya kiosk with revenue-share terms agreed offline.',
                  },
                  {
                    cat: 'investment' as VentureCategory,
                    title: 'Strategic Investment Enquiry',
                    desc: 'Request our founder briefing deck and UAE expansion roadmap from info@vanhsya.com.',
                  },
                  {
                    cat: 'kiosk_booking' as VentureCategory,
                    title: 'Interactive Kiosk Deployment',
                    desc: 'Reserve a self-service Vanhsya travel & meetup check-in kiosk for hotels, events, or lounges.',
                  },
                  {
                    cat: 'business_hub' as VentureCategory,
                    title: 'Business Hub & Flight Pre-Book',
                    desc: 'Book a private business hub desk pass or priority multi-leg flight pre-booking block.',
                  },
                ].map((card) => (
                  <button
                    key={card.cat}
                    type="button"
                    onClick={() => setVentureCat(card.cat)}
                    className={`p-4 rounded-2xl text-left border transition-all ${
                      ventureCat === card.cat
                        ? 'bg-purple-950/50 border-purple-400 text-white'
                        : 'bg-[#120D1D] border-white/10 text-gray-300 hover:border-white/25'
                    }`}
                  >
                    <h3 className="font-cinzel font-bold text-base text-white">{card.title}</h3>
                    <p className="mt-1 text-gray-400 leading-relaxed">{card.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6">
              {vSaved ? (
                <div className="p-8 rounded-3xl bg-[#130E20] border border-emerald-400/40 space-y-4">
                  <p className="text-xs font-mono text-emerald-300 font-bold">REF: {vSaved.requestRef}</p>
                  <h3 className="text-2xl font-cinzel font-bold text-white">Venture / Space Application Saved</h3>
                  <p className="text-sm text-gray-300">
                    Your <strong>{vSaved.category.replace('_', ' ')}</strong> submission has been logged in our Dubai ventures queue. Our partnerships team ({BRAND_CONTACTS.email}) will contact <strong>{vSaved.email}</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => setVSaved(null)}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold"
                  >
                    Submit Another Proposal
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={submitVenture}
                  className="p-6 sm:p-8 rounded-3xl bg-[#130E20] border border-purple-500/30 space-y-4 text-xs"
                >
                  <h3 className="text-2xl font-cinzel font-bold text-white">Submit Venture or Booking Request</h3>
                  {vError && (
                    <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200">{vError}</div>
                  )}

                  <div>
                    <label className="block font-semibold text-gray-300 mb-1">Request Category *</label>
                    <select
                      value={ventureCat}
                      onChange={(e) => setVentureCat(e.target.value as VentureCategory)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0814] border border-white/15 text-sm text-white"
                    >
                      <option value="space_franchise">Space Franchise (I Have a Venue / Space)</option>
                      <option value="investment">Strategic Partnership / Investment Enquiry</option>
                      <option value="kiosk_booking">Smart Travel Kiosk Reservation</option>
                      <option value="flight_prebooking">Priority Flight Pre-Booking Desk</option>
                      <option value="business_hub">Business Hub Workstation Spot</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={vName}
                        onChange={(e) => setVName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">Company / Venue Name</label>
                      <input
                        type="text"
                        value={vOrg}
                        onChange={(e) => setVOrg(e.target.value)}
                        placeholder="Optional"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={vEmail}
                        onChange={(e) => setVEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">WhatsApp / Phone</label>
                      <input
                        type="tel"
                        value={vPhone}
                        onChange={(e) => setVPhone(e.target.value)}
                        placeholder="+971..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">City / Emirate</label>
                      <select
                        value={vCity}
                        onChange={(e) => setVCity(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0814] border border-white/15 text-sm text-white"
                      >
                        {UAE_EMIRATES.map((em) => (
                          <option key={em} value={em}>{em}</option>
                        ))}
                        <option value="International">International</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">Space Size (sq ft)</label>
                      <input
                        type="text"
                        value={vSpace}
                        onChange={(e) => setVSpace(e.target.value)}
                        placeholder="e.g., 120 sq ft corner"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">Target Date</label>
                      <input
                        type="date"
                        value={vDate}
                        onChange={(e) => setVDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-300 mb-1">Budget / Allocation Band (Optional)</label>
                    <input
                      type="text"
                      value={vBudget}
                      onChange={(e) => setVBudget(e.target.value)}
                      placeholder="e.g., Commercial Kiosk Lease, Seed Enquiry, 3-Seat Hub Pass"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-300 mb-1">Proposal / Booking Details *</label>
                    <textarea
                      required
                      rows={4}
                      value={vSummary}
                      onChange={(e) => setVSummary(e.target.value)}
                      placeholder="Describe your venue footfall, business hub needs, flight corridor pre-booking dates, or investment interest..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={vBusy}
                    className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase tracking-wider disabled:opacity-50"
                  >
                    {vBusy ? 'Saving Submission...' : 'Submit Official Venture Request'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {activeTab === 'charity_merch' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-6 space-y-5">
              <div className="rounded-3xl overflow-hidden border border-white/15 bg-[#120D1D] shadow-2xl">
                <img src={merchTshirtsImg} alt="Printed Vanhsya Explorer Charity T-Shirts" className="w-full aspect-[4/3] object-cover" />
                <div className="p-6 space-y-3">
                  <span className="text-xs font-mono uppercase text-emerald-300 font-bold">
                    WEAR THE HELLO · GIVE BACK IN THE UAE
                  </span>
                  <h2 className="text-2xl font-cinzel font-bold text-white">
                    Printed Vanhsya Explorer T-Shirts &amp; Charity Pledges
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                    Reserve limited-batch heavy cotton T-shirts printed with Vanhsya&apos;s celestial explorer emblem and community artwork. Every printed tee reservation supports UAE Youth Discovery Bursaries, Desert Cleanups, and Community Meal drives.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              {mSaved ? (
                <div className="p-8 rounded-3xl bg-[#130E20] border border-emerald-400/40 space-y-4">
                  <p className="text-xs font-mono text-emerald-300 font-bold">ORDER REF: {mSaved.orderRef}</p>
                  <h3 className="text-2xl font-cinzel font-bold text-white">Merch &amp; Charity Reservation Recorded</h3>
                  <p className="text-sm text-gray-300">
                    Thank you, {mSaved.fullName}! Cause: <strong>{mSaved.charityCause}</strong> · Pledge: <strong>AED {mSaved.pledgeAmountAed}</strong>. Confirm delivery/pickup on WhatsApp or via {BRAND_CONTACTS.infoEmail}.
                  </p>
                  <button
                    type="button"
                    onClick={() => setMSaved(null)}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold"
                  >
                    Reserve Another Item
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={submitMerchOrCharity}
                  className="p-6 sm:p-8 rounded-3xl bg-[#130E20] border border-purple-500/30 space-y-4 text-xs"
                >
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMerchType('printed_tshirt')}
                      className={`flex-1 py-2.5 rounded-xl font-bold border ${
                        merchType === 'printed_tshirt' ? 'bg-purple-600 border-purple-400 text-white' : 'bg-black/40 border-white/10 text-gray-300'
                      }`}
                    >
                      Printed Vanhsya T-Shirt
                    </button>
                    <button
                      type="button"
                      onClick={() => setMerchType('charity_pledge')}
                      className={`flex-1 py-2.5 rounded-xl font-bold border ${
                        merchType === 'charity_pledge' ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-black/40 border-white/10 text-gray-300'
                      }`}
                    >
                      Direct Charity Pledge
                    </button>
                  </div>

                  {mError && (
                    <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200">{mError}</div>
                  )}

                  {merchType === 'printed_tshirt' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-gray-300 mb-1">Size</label>
                        <select
                          value={mSize}
                          onChange={(e) => setMSize(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-[#0B0814] border border-white/15 text-sm text-white"
                        >
                          {['S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                            <option key={sz} value={sz}>{sz}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-gray-300 mb-1">Printed Colorway</label>
                        <select
                          value={mColor}
                          onChange={(e) => setMColor(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-[#0B0814] border border-white/15 text-sm text-white"
                        >
                          <option value="Obsidian Violet Crest">Obsidian Violet Crest</option>
                          <option value="Midnight Purple Gold Print">Midnight Purple Gold Print</option>
                          <option value="Sandstone Minimalist Hello">Sandstone Minimalist Hello</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-gray-300 mb-1">Quantity</label>
                        <input
                          type="number"
                          min={1}
                          max={25}
                          value={mQty}
                          onChange={(e) => setMQty(Math.max(1, Number(e.target.value)))}
                          className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">Charity Initiative *</label>
                      <select
                        value={mCause}
                        onChange={(e) => setMCause(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#0B0814] border border-white/15 text-sm text-white"
                      >
                        <option value="UAE Youth Discovery Bursaries">UAE Youth Discovery Bursaries</option>
                        <option value="Desert & Coastal Cleanup Fund">Desert &amp; Coastal Cleanup Fund</option>
                        <option value="Community Meal Sponsorship">Community Meal Sponsorship</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">Contribution / Pledge (AED)</label>
                      <input
                        type="number"
                        min={20}
                        value={mPledge}
                        onChange={(e) => setMPledge(Math.max(0, Number(e.target.value)))}
                        className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">Your Name *</label>
                      <input
                        type="text"
                        required
                        value={mName}
                        onChange={(e) => setMName(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={mEmail}
                        onChange={(e) => setMEmail(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">WhatsApp</label>
                      <input
                        type="tel"
                        value={mPhone}
                        onChange={(e) => setMPhone(e.target.value)}
                        placeholder="+971..."
                        className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-300 mb-1">Custom Sleeve Print / Pickup Note</label>
                    <textarea
                      rows={2}
                      value={mNotes}
                      onChange={(e) => setMNotes(e.target.value)}
                      placeholder="Custom explorer alias on sleeve, delivery emirate, or event pickup..."
                      className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={mBusy}
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-wider disabled:opacity-50"
                  >
                    {mBusy ? 'Recording...' : merchType === 'printed_tshirt' ? 'Reserve Printed T-Shirt & Pledge' : 'Record Charity Pledge'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {activeTab === 'surprises' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5">
              <div className="rounded-3xl overflow-hidden border border-white/15 bg-[#120D1D] shadow-2xl">
                <img src={charitySurpriseImg} alt="Unexpected Birthday and Milestone Surprises by Vanhsya" className="w-full aspect-[4/3] object-cover" />
                <div className="p-6 space-y-3">
                  <span className="text-xs font-mono uppercase text-amber-300 font-bold">
                    UNEXPECTED MOMENTS ENGINEERED IN SECRET
                  </span>
                  <h2 className="text-2xl font-cinzel font-bold text-white">
                    Birthday &amp; Milestone Surprise Architect
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                    Celebrating a birthday far from family in Dubai, planning a surprise arrival gift for a friend, or orchestrating a sunset desert milestone? Share the clue details secretly—our concierge handles venue coordination, printed keepsakes, and unexpected moments.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              {sSaved ? (
                <div className="p-8 rounded-3xl bg-[#130E20] border border-amber-400/40 space-y-4">
                  <p className="text-xs font-mono text-amber-300 font-bold">SURPRISE REF: {sSaved.orderRef}</p>
                  <h3 className="text-2xl font-cinzel font-bold text-white">Secret Surprise Plan Logged</h3>
                  <p className="text-sm text-gray-300">
                    Your <strong>{sSaved.occasionOrPackage}</strong> brief is saved confidentially under {sSaved.orderRef}. Coordinate directly via WhatsApp or {BRAND_CONTACTS.infoEmail}.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={buildWhatsAppDirectEnquiryUrl(`Hi Vanhsya! Secret follow-up for surprise request ${sSaved.orderRef} (${sSaved.occasionOrPackage}).`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                    >
                      Whisper on WhatsApp
                    </a>
                    <button
                      type="button"
                      onClick={() => setSSaved(null)}
                      className="px-5 py-2.5 rounded-xl bg-white/10 text-white text-xs font-semibold"
                    >
                      Plan Another Surprise
                    </button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={submitSurprise}
                  className="p-6 sm:p-8 rounded-3xl bg-[#130E20] border border-purple-500/30 space-y-4 text-xs"
                >
                  <h3 className="text-2xl font-cinzel font-bold text-white">Plan an Unexpected Surprise</h3>
                  {sError && (
                    <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200">{sError}</div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">Occasion *</label>
                      <select
                        value={sOccasion}
                        onChange={(e) => setSOccasion(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0814] border border-white/15 text-sm text-white"
                      >
                        <option value="Birthday Unexpected Celebration">Birthday Unexpected Celebration</option>
                        <option value="Surprise Airport / Dubai Welcome">Surprise Airport / Dubai Welcome</option>
                        <option value="Anniversary Lantern Reveal">Anniversary Lantern Reveal</option>
                        <option value="Mystery Gift Drop at Meetup Table">Mystery Gift Drop at Meetup Table</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">Recipient First Name / Nickname</label>
                      <input
                        type="text"
                        value={sRecipient}
                        onChange={(e) => setSRecipient(e.target.value)}
                        placeholder="Kept confidential"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">Emirate *</label>
                      <select
                        value={sEmirate}
                        onChange={(e) => setSEmirate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0814] border border-white/15 text-sm text-white"
                      >
                        {UAE_EMIRATES.map((em) => (
                          <option key={em} value={em}>{em}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">Target Date</label>
                      <input
                        type="date"
                        value={sDate}
                        onChange={(e) => setSDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">Your Name *</label>
                      <input
                        type="text"
                        required
                        value={sName}
                        onChange={(e) => setSName(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">Your Email *</label>
                      <input
                        type="email"
                        required
                        value={sEmail}
                        onChange={(e) => setSEmail(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">Your WhatsApp</label>
                      <input
                        type="tel"
                        value={sPhone}
                        onChange={(e) => setSPhone(e.target.value)}
                        placeholder="+971..."
                        className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-300 mb-1">What Should Happen? *</label>
                    <textarea
                      required
                      rows={3}
                      value={sNotes}
                      onChange={(e) => setSNotes(e.target.value)}
                      placeholder="Favorite flowers/music, printed Explorer tee gift box, cake note, sunset yacht cue, etc."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sBusy}
                    className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider disabled:opacity-50"
                  >
                    {sBusy ? 'Saving Secret Brief...' : 'Launch Secret Surprise Request'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {activeTab === 'couples' && (
          <div id="couples" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-5">
              <div className="rounded-3xl overflow-hidden border border-rose-500/30 bg-[#120D1D] shadow-2xl">
                <img src={couplesCanyonImg} alt="Scariest Couples Adventures Across UAE Canyons" className="w-full aspect-[4/3] object-cover" />
                <div className="p-6 space-y-2">
                  <span className="text-xs font-mono uppercase text-rose-300 font-bold">
                    HIGH-ADRENALINE DUAL EXPEDITIONS
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-cinzel font-bold text-white">
                    Scariest Adventures for Couples
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-300">
                    Nothing bonds two explorers faster than conquering darkness, altitude, and silence together under certified UAE expedition safety leads.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {COUPLES_SCARY_EXPERIENCES.map((exp) => {
                  const active = cSelected === exp.title;
                  return (
                    <div
                      key={exp.id}
                      onClick={() => setCSelected(exp.title)}
                      className={`cursor-pointer p-5 rounded-2xl border transition-all ${
                        active
                          ? 'bg-rose-950/35 border-rose-400 shadow-lg'
                          : 'bg-[#120D1D] border-white/10 hover:border-rose-400/40'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                        <span className="text-rose-300 font-bold">{exp.intensity}</span>
                        <span className="text-gray-400">{exp.emirate}</span>
                      </div>
                      <h3 className="text-lg font-cinzel font-bold text-white mt-1">{exp.title}</h3>
                      <p className="text-xs text-gray-300 mt-1">{exp.description}</p>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {exp.includes.map((inc) => (
                          <span key={inc} className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-gray-200">
                            {inc}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-5">
              {cSaved ? (
                <div className="p-8 rounded-3xl bg-[#130E20] border border-emerald-400/40 space-y-4">
                  <p className="text-xs font-mono text-emerald-300 font-bold">CHALLENGE REF: {cSaved.orderRef}</p>
                  <h3 className="text-2xl font-cinzel font-bold text-white">Couples Thrill Request Saved</h3>
                  <p className="text-sm text-gray-300">
                    Your request for <strong>{cSaved.occasionOrPackage}</strong> has been logged. Our expedition leads will confirm weather windows, safety waivers, and pricing directly with {cSaved.email}.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCSaved(null)}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold"
                  >
                    Request Another Challenge
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={submitCouplesChallenge}
                  className="p-6 sm:p-8 rounded-3xl bg-[#130E20] border border-rose-500/35 space-y-4 text-xs sticky top-24"
                >
                  <div>
                    <p className="font-mono uppercase tracking-widest text-rose-300 font-bold">Couples Thrill Desk</p>
                    <h3 className="text-xl font-cinzel font-bold text-white mt-1">{cSelected}</h3>
                  </div>

                  {cError && (
                    <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200">{cError}</div>
                  )}

                  <div>
                    <label className="block font-semibold text-gray-300 mb-1">Lead Explorer Name *</label>
                    <input
                      type="text"
                      required
                      value={cName}
                      onChange={(e) => setCName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={cEmail}
                        onChange={(e) => setCEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">WhatsApp</label>
                      <input
                        type="tel"
                        value={cPhone}
                        onChange={(e) => setCPhone(e.target.value)}
                        placeholder="+971..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-300 mb-1">Preferred Night / Weekend Date</label>
                    <input
                      type="date"
                      value={cDate}
                      onChange={(e) => setCDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-300 mb-1">Experience Level &amp; Notes</label>
                    <textarea
                      rows={3}
                      value={cNotes}
                      onChange={(e) => setCNotes(e.target.value)}
                      placeholder="Comfort with heights/darkness, anniversary note, hotel pickup preference..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={cBusy}
                    className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold uppercase tracking-wider disabled:opacity-50"
                  >
                    {cBusy ? 'Sending Request...' : 'Request Couples Thrill Briefing'}
                  </button>
                  <p className="text-[11px] text-gray-400 text-center">
                    All dual-harness climbs and night trails include mandatory safety orientation and 18+ confirmation.
                  </p>
                </form>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default VenturesPage;
