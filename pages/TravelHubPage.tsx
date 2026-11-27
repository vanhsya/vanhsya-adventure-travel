import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SeoHead from '../components/SeoHead';
import { ReceiptModal } from '../components/ReceiptModal';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { TOURS_DATA } from '../constants';
import {
  PaymentTransactionRecord,
  ProviderStatusMap,
  TravelBookingRecord,
  TravelEnquiryRecord,
  TravelPackage,
} from '../types';
import { formatPrice } from '../utils/currency';
import { BRAND_CONTACTS, buildWhatsAppDirectEnquiryUrl } from '../utils/utm';

type TravelTab = 'packages' | 'flights' | 'hotels' | 'buses';

const TravelHubPage: React.FC = () => {
  const location = useLocation();
  const { currency } = useAppContext();
  const { user, token } = useAuth();

  const deriveTab = (pathname: string): TravelTab => {
    if (pathname.includes('/flights')) return 'flights';
    if (pathname.includes('/hotels')) return 'hotels';
    if (pathname.includes('/buses')) return 'buses';
    return 'packages';
  };

  const [activeTab, setActiveTab] = useState<TravelTab>(() => deriveTab(location.pathname));
  const [packages, setPackages] = useState<TravelPackage[]>([]);
  const [providerStatus, setProviderStatus] = useState<ProviderStatusMap | null>(null);
  const [loading, setLoading] = useState(true);

  // Selected Package Booking State
  const [selectedPackage, setSelectedPackage] = useState<TravelPackage | null>(null);
  const [travelDate, setTravelDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = useState('');
  const [guests, setGuests] = useState(2);
  const [customerName, setCustomerName] = useState(user?.fullName || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [specialRequests, setSpecialRequests] = useState('');
  const [bookingBusy, setBookingBusy] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Receipt Modal
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptBooking, setReceiptBooking] = useState<TravelBookingRecord | null>(null);
  const [receiptTx, setReceiptTx] = useState<PaymentTransactionRecord | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [checkoutNote, setCheckoutNote] = useState<string | null>(null);

  // Provider Live Search Diagnostic + Concierge Enquiry Form
  const [providerNotice, setProviderNotice] = useState<string | null>(null);
  const [enqOrigin, setEnqOrigin] = useState('Dubai (DXB)');
  const [enqDestination, setEnqDestination] = useState('');
  const [enqDepart, setEnqDepart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [enqReturn, setEnqReturn] = useState('');
  const [enqGuests, setEnqGuests] = useState(2);
  const [enqName, setEnqName] = useState(user?.fullName || '');
  const [enqEmail, setEnqEmail] = useState(user?.email || '');
  const [enqPhone, setEnqPhone] = useState(user?.phone || '');
  const [enqNotes, setEnqNotes] = useState('');
  const [enqSubmitting, setEnqSubmitting] = useState(false);
  const [enqSaved, setEnqSaved] = useState<TravelEnquiryRecord | null>(null);
  const [enqError, setEnqError] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(deriveTab(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    if (user) {
      setCustomerName((prev) => prev || user.fullName);
      setCustomerEmail((prev) => prev || user.email);
      setCustomerPhone((prev) => prev || user.phone || '');
      setEnqName((prev) => prev || user.fullName);
      setEnqEmail((prev) => prev || user.email);
      setEnqPhone((prev) => prev || user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch('/api/travel/packages').then((r) => r.json()).catch(() => ({ packages: [] })),
      fetch('/api/travel/providers/status').then((r) => r.json()).catch(() => null),
    ])
      .then(([pkgData, statusData]) => {
        if (!active) return;
        const list = Array.isArray(pkgData.packages) ? pkgData.packages : [];
        setPackages(list);
        if (list.length > 0 && !selectedPackage) {
          setSelectedPackage(list[0]);
          setTimeSlot(list[0].timeSlots?.[0] || 'Morning Departure');
        }
        if (statusData) setProviderStatus(statusData);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleCheckProviderSearch = async (service: 'flights' | 'hotels' | 'buses') => {
    setProviderNotice(null);
    try {
      const res = await fetch(`/api/travel/${service}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: enqOrigin,
          destination: enqDestination || 'Dubai',
          departDate: enqDepart,
        }),
      });
      const data = await res.json();
      setProviderNotice(data.message || 'Checked supplier gateway status.');
    } catch {
      setProviderNotice('Unable to reach supplier status gateway.');
    }
  };

  const handleBookPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage) return;
    setBookingBusy(true);
    setBookingError(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const bookRes = await fetch('/api/bookings', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          bookingType: 'package',
          itemSlug: selectedPackage.slug,
          travelDate,
          timeSlot: timeSlot || selectedPackage.timeSlots?.[0] || 'Flexible Schedule',
          guests,
          currency,
          customerName,
          customerEmail,
          customerPhone,
          specialRequests,
        }),
      });
      const bookData = await bookRes.json();
      if (!bookRes.ok || !bookData.booking) {
        setBookingError(bookData.error || 'Could not create package reservation.');
        return;
      }

      const createdBooking: TravelBookingRecord = bookData.booking;
      const payRes = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingRef: createdBooking.bookingRef }),
      });
      const payData = await payRes.json();

      setReceiptBooking(createdBooking);
      setReceiptTx(payData.transaction || null);
      setCheckoutUrl(payData.checkoutUrl || null);
      setCheckoutNote(payData.message || null);
      setReceiptOpen(true);
    } catch {
      setBookingError('Network error while reserving package.');
    } finally {
      setBookingBusy(false);
    }
  };

  const handleSubmitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnqSubmitting(true);
    setEnqError(null);
    setEnqSaved(null);
    const serviceType = activeTab === 'packages' ? 'custom_package' : activeTab;
    try {
      const res = await fetch('/api/travel/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType,
          fullName: enqName,
          email: enqEmail,
          phone: enqPhone,
          origin: enqOrigin,
          destination: enqDestination,
          departDate: enqDepart,
          returnDate: enqReturn,
          guests: enqGuests,
          notes: enqNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEnqError(data.error || 'Could not submit concierge request.');
      } else {
        setEnqSaved(data.enquiry);
        setEnqNotes('');
      }
    } catch {
      setEnqError('Network error while submitting request.');
    } finally {
      setEnqSubmitting(false);
    }
  };

  return (
    <div className="pt-20 pb-20 min-h-screen bg-[#07050C] text-gray-200">
      <SeoHead
        title="Book Travel, Flight Desks, Hotels & Packages — Vanhsya Global Travels"
        description="Reserve curated Vanhsya travel packages with official HTML receipts, or submit flight pre-booking, hotel, and regional coach concierge requests in Dubai & UAE."
        path="/book"
      />

      <ReceiptModal
        isOpen={receiptOpen}
        booking={receiptBooking}
        payment={receiptTx}
        checkoutUrl={checkoutUrl}
        checkoutNote={checkoutNote}
        onClose={() => setReceiptOpen(false)}
      />

      {/* Hero Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-10 border-b border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-400/35 text-emerald-200 text-xs font-mono uppercase tracking-[0.22em]">
              Vanhsya Travel Hub · Direct Booking &amp; Concierge
            </span>
            <h1 className="text-4xl sm:text-6xl font-cinzel font-black text-white leading-tight">
              Packages, Flights, Hotels &amp; Coach Desks
            </h1>
            <p className="text-sm sm:text-base text-gray-300">
              Reserve server-verified UAE &amp; global packages with downloadable booking receipts, or request live quotes for flights, hotels, and intercity coaches directly from our Dubai desk ({BRAND_CONTACTS.email}).
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 text-xs shrink-0">
            <a
              href={buildWhatsAppDirectEnquiryUrl('Hi Vanhsya Booking Desk! I need assistance booking travel, flights, or packages.')}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              WhatsApp {BRAND_CONTACTS.whatsappDisplay}
            </a>
            <Link
              to="/ventures"
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold"
            >
              Flight Pre-Booking &amp; Kiosks &rarr;
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2.5 mt-8">
          {(
            [
              { id: 'packages', label: 'Curated Travel Packages' },
              { id: 'flights', label: 'Flights & Pre-Booking Desk' },
              { id: 'hotels', label: 'Hotels & Resorts Desk' },
              { id: 'buses', label: 'Intercity Coaches & Transfers' },
            ] as Array<{ id: TravelTab; label: string }>
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setProviderNotice(null);
              }}
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
        {activeTab === 'packages' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Package Cards */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-cinzel font-bold text-white">Verified Curated Packages</h2>
                <span className="text-xs text-gray-400 font-mono">
                  {providerStatus?.stripe.configured ? 'Stripe Checkout Active' : 'Concierge Invoice Ready'}
                </span>
              </div>

              {loading ? (
                <div className="p-8 rounded-2xl bg-[#130E20] border border-white/10 text-sm text-gray-400">
                  Loading curated travel packages...
                </div>
              ) : (
                <div className="space-y-4">
                  {packages.map((pkg) => {
                    const isSelected = selectedPackage?.id === pkg.id;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => {
                          setSelectedPackage(pkg);
                          setTimeSlot(pkg.timeSlots?.[0] || 'Flexible Schedule');
                        }}
                        className={`cursor-pointer rounded-3xl overflow-hidden border transition-all grid grid-cols-1 sm:grid-cols-12 ${
                          isSelected
                            ? 'bg-[#181128] border-purple-400 shadow-2xl'
                            : 'bg-[#120D1D] border-white/10 hover:border-purple-400/45'
                        }`}
                      >
                        <div className="sm:col-span-5 h-48 sm:h-auto relative">
                          <img
                            src={pkg.coverImageUrl || '/assets/aistudio/image_1f4b465a.png'}
                            alt={pkg.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="sm:col-span-7 p-5 space-y-2.5">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-purple-300 uppercase font-bold">{pkg.category}</span>
                            <span className="text-gray-400">{pkg.durationLabel}</span>
                          </div>
                          <h3 className="text-xl font-cinzel font-bold text-white">{pkg.title}</h3>
                          <p className="text-xs text-gray-400">{pkg.subtitle}</p>
                          <p className="text-xs text-gray-300">
                            <strong className="text-white">Meeting Point:</strong> {pkg.meetingPoint}
                          </p>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {pkg.highlights.map((h) => (
                              <span
                                key={h}
                                className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-gray-300"
                              >
                                {h}
                              </span>
                            ))}
                          </div>
                          <div className="pt-2 flex items-center justify-between border-t border-white/10">
                            <span className="text-lg font-black text-cyan-300">
                              {formatPrice(pkg.priceUsd, currency)}
                            </span>
                            <span className="text-xs font-semibold text-purple-200">
                              {isSelected ? '✓ Selected for Checkout' : 'Select Package →'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Quick link to 13 Global Guided Tours */}
              <div className="p-6 rounded-2xl bg-[#120D1D] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-cinzel font-bold text-white">Signature Global Day Tours ({TOURS_DATA.length})</h3>
                  <Link to="/ai-planner" className="text-xs text-purple-300 hover:text-white">
                    Or Customize with AI Planner &rarr;
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TOURS_DATA.slice(0, 6).map((t) => (
                    <Link
                      key={t.id}
                      to={`/tours/${t.slug}`}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-purple-600/30 border border-white/10 text-xs text-gray-200"
                    >
                      {t.city}: {t.title.split(':')[0]}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Package Checkout Form */}
            <form
              onSubmit={handleBookPackage}
              className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-[#130E20] border border-purple-400/35 shadow-2xl space-y-4 text-xs sticky top-24"
            >
              <div>
                <p className="font-mono uppercase tracking-widest text-purple-300 font-bold">
                  Server-Verified Package Checkout
                </p>
                <h3 className="text-2xl font-cinzel font-bold text-white mt-1">
                  {selectedPackage?.title || 'Select a Package'}
                </h3>
              </div>

              {bookingError && (
                <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200">
                  {bookingError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-300 mb-1">Travel Date *</label>
                  <input
                    type="date"
                    required
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-300 mb-1">Guests *</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    required
                    value={guests}
                    onChange={(e) => setGuests(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                  />
                </div>
              </div>

              {selectedPackage?.timeSlots?.length ? (
                <div>
                  <label className="block font-semibold text-gray-300 mb-1">Preferred Time Slot</label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0814] border border-white/15 text-sm text-white"
                  >
                    {selectedPackage.timeSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div>
                <label className="block font-semibold text-gray-300 mb-1">Lead Traveler Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-300 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-300 mb-1">WhatsApp / Phone</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+971..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">Special Requests</label>
                <textarea
                  rows={2}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Pickup location, dietary needs, or celebration notes..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                />
              </div>

              {selectedPackage && (
                <div className="p-4 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-between">
                  <span className="text-gray-300 font-semibold">Estimated Package Total ({guests} guests)</span>
                  <span className="text-xl font-black text-amber-300">
                    {formatPrice(selectedPackage.priceUsd * guests, currency)}
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={bookingBusy || !selectedPackage}
                className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase tracking-wider disabled:opacity-50"
              >
                {bookingBusy ? 'Creating Reservation...' : 'Reserve & Generate Official Receipt'}
              </button>
              <p className="text-[11px] text-gray-400 text-center">
                Questions or custom group quotes? Write to {BRAND_CONTACTS.email} or {BRAND_CONTACTS.supportEmail}.
              </p>
            </form>
          </div>
        ) : (
          /* Flights / Hotels / Buses Live Status + Honest Concierge Request */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-5">
              <div className="p-6 rounded-3xl bg-[#130E20] border border-purple-500/30 space-y-4">
                <p className="text-xs font-mono uppercase tracking-widest text-cyan-300 font-bold">
                  Supplier Integration Status
                </p>
                <h2 className="text-2xl font-cinzel font-bold text-white capitalize">
                  {activeTab} Live Feed Check
                </h2>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  Vanhsya never displays fabricated ticket fares or invented hotel availability. Query live supplier status below or submit a concierge request so our travel desk confirms real-time rates directly.
                </p>

                <button
                  type="button"
                  onClick={() => handleCheckProviderSearch(activeTab)}
                  className="w-full py-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-200 font-bold text-xs uppercase tracking-wider"
                >
                  Check {activeTab.toUpperCase()} API Gateway Status
                </button>

                {providerNotice && (
                  <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-400/35 text-xs text-amber-100 leading-relaxed">
                    {providerNotice}
                  </div>
                )}

                <div className="pt-3 border-t border-white/10 text-xs space-y-2 text-gray-300">
                  <p>
                    <strong className="text-white">Bookings &amp; Pre-Bookings:</strong> {BRAND_CONTACTS.email}
                  </p>
                  <p>
                    <strong className="text-white">24/7 Support &amp; Changes:</strong> {BRAND_CONTACTS.supportEmail}
                  </p>
                  <p>
                    <strong className="text-white">WhatsApp Express Desk:</strong> {BRAND_CONTACTS.whatsappDisplay}
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              {enqSaved ? (
                <div className="p-8 rounded-3xl bg-[#130E20] border border-emerald-400/40 space-y-4">
                  <p className="text-xs font-mono uppercase text-emerald-300 font-bold">
                    Request Reference: {enqSaved.enquiryRef}
                  </p>
                  <h3 className="text-2xl font-cinzel font-bold text-white">
                    Concierge Request Logged
                  </h3>
                  <p className="text-sm text-gray-300">
                    Your {enqSaved.serviceType} itinerary from <strong>{enqSaved.origin || 'UAE'}</strong> to{' '}
                    <strong>{enqSaved.destination}</strong> is saved in our admin queue. Our Dubai specialists will send verified fare quotes to{' '}
                    <strong>{enqSaved.email}</strong>.
                  </p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <a
                      href={buildWhatsAppDirectEnquiryUrl(
                        `Hello Vanhsya! Follow-up on my ${enqSaved.serviceType} request ${enqSaved.enquiryRef} (${enqSaved.origin} -> ${enqSaved.destination} on ${enqSaved.departDate}).`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                    >
                      Fast-Track on WhatsApp
                    </a>
                    <button
                      type="button"
                      onClick={() => setEnqSaved(null)}
                      className="px-5 py-2.5 rounded-xl bg-white/10 text-white text-xs font-semibold"
                    >
                      Submit Another Request
                    </button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmitEnquiry}
                  className="p-6 sm:p-8 rounded-3xl bg-[#130E20] border border-purple-500/30 space-y-4 text-xs"
                >
                  <h3 className="text-2xl font-cinzel font-bold text-white capitalize">
                    Request Verified {activeTab} Quote
                  </h3>
                  {enqError && (
                    <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200">
                      {enqError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">Origin City / Airport *</label>
                      <input
                        type="text"
                        required
                        value={enqOrigin}
                        onChange={(e) => setEnqOrigin(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">Destination *</label>
                      <input
                        type="text"
                        required
                        value={enqDestination}
                        onChange={(e) => setEnqDestination(e.target.value)}
                        placeholder={activeTab === 'hotels' ? 'Dubai Marina / Abu Dhabi Corniche' : 'London LHR / Tokyo HND'}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">Departure / Check-in *</label>
                      <input
                        type="date"
                        required
                        value={enqDepart}
                        onChange={(e) => setEnqDepart(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">Return / Check-out</label>
                      <input
                        type="date"
                        value={enqReturn}
                        onChange={(e) => setEnqReturn(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">Travelers</label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={enqGuests}
                        onChange={(e) => setEnqGuests(Math.max(1, Number(e.target.value)))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={enqName}
                        onChange={(e) => setEnqName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={enqEmail}
                        onChange={(e) => setEnqEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">WhatsApp Number</label>
                      <input
                        type="tel"
                        value={enqPhone}
                        onChange={(e) => setEnqPhone(e.target.value)}
                        placeholder="+971..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-300 mb-1">Preferences &amp; Cabin / Class Notes</label>
                    <textarea
                      rows={3}
                      value={enqNotes}
                      onChange={(e) => setEnqNotes(e.target.value)}
                      placeholder="Flexible dates, airline preferences, airport transfer needs, or multi-city legs..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={enqSubmitting}
                    className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase tracking-wider disabled:opacity-50"
                  >
                    {enqSubmitting ? 'Submitting Request...' : `Submit Verified ${activeTab} Request`}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default TravelHubPage;
