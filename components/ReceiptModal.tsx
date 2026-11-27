import React from 'react';
import { PaymentTransactionRecord, TravelBookingRecord } from '../types';
import { BRAND_CONTACTS, buildWhatsAppDirectEnquiryUrl } from '../utils/utm';

interface ReceiptModalProps {
  isOpen: boolean;
  booking: TravelBookingRecord | null;
  payment?: PaymentTransactionRecord | null;
  checkoutUrl?: string | null;
  checkoutNote?: string | null;
  onClose: () => void;
}

const escapeHtml = (str: string) =>
  String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  booking,
  payment,
  checkoutUrl,
  checkoutNote,
  onClose,
}) => {
  if (!isOpen || !booking) return null;

  const handleDownloadHtmlReceipt = () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Vanhsya Receipt ${escapeHtml(booking.bookingRef)}</title>
<style>
  body { font-family: Arial, sans-serif; background: #f8fafc; color: #0f172a; padding: 32px; }
  .card { max-width: 680px; margin: 0 auto; background: #fff; border: 1px solid #cbd5e1; border-radius: 16px; padding: 32px; }
  .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px; }
  .brand { font-size: 20px; font-weight: 800; color: #5b21b6; }
  .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
  .total { font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 12px; }
  .footer { margin-top: 24px; font-size: 12px; color: #475569; }
</style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div>
        <div class="brand">${escapeHtml(BRAND_CONTACTS.companyName)}</div>
        <div>${escapeHtml(BRAND_CONTACTS.websiteDisplay)} · UAE</div>
      </div>
      <div style="text-align:right">
        <strong>Booking Ref:</strong> ${escapeHtml(booking.bookingRef)}<br/>
        <strong>Date:</strong> ${escapeHtml(new Date(booking.createdAt).toLocaleString())}
      </div>
    </div>
    <div class="row"><span>Experience / Package</span><strong>${escapeHtml(booking.itemTitle)}</strong></div>
    <div class="row"><span>Travel Date</span><span>${escapeHtml(booking.travelDate)} (${escapeHtml(booking.timeSlot)})</span></div>
    ${booking.meetingPoint ? `<div class="row"><span>Meeting Point</span><span>${escapeHtml(booking.meetingPoint)}</span></div>` : ''}
    <div class="row"><span>Guest Name</span><span>${escapeHtml(booking.customerName)}</span></div>
    <div class="row"><span>Email</span><span>${escapeHtml(booking.customerEmail)}</span></div>
    <div class="row"><span>Travelers</span><span>${booking.guests}</span></div>
    <div class="row"><span>Booking Status</span><strong>${escapeHtml(booking.status.toUpperCase())}</strong></div>
    <div class="row"><span>Payment Status</span><strong>${escapeHtml(booking.paymentStatus.toUpperCase())}</strong></div>
    ${payment?.txRef ? `<div class="row"><span>Transaction Ref</span><span>${escapeHtml(payment.txRef)}</span></div>` : ''}
    <div class="row total"><span>Server-Verified Total</span><span>${escapeHtml(booking.currency)} ${booking.displayTotal.toLocaleString()} ($${booking.totalUsd.toLocaleString()} USD)</span></div>
    <div class="footer">
      Bookings &amp; Ventures: ${escapeHtml(BRAND_CONTACTS.email)} · Support &amp; Cancellations: ${escapeHtml(BRAND_CONTACTS.supportEmail)} · WhatsApp: ${escapeHtml(BRAND_CONTACTS.whatsappDisplay)}
    </div>
  </div>
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${booking.bookingRef}-Vanhsya-Receipt.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-[#130E20] border border-purple-400/40 p-6 sm:p-8 text-gray-100 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-amber-300">
              Vanhsya Booking Confirmation
            </p>
            <h2 className="text-2xl font-cinzel font-bold text-white mt-1">
              {booking.itemTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close receipt modal"
            className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-gray-300"
          >
            &times;
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-black/45 border border-white/10 space-y-2.5 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">Booking Reference</span>
            <span className="font-mono font-bold text-cyan-300">{booking.bookingRef}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Date &amp; Slot</span>
            <span className="text-white font-semibold">
              {booking.travelDate} · {booking.timeSlot}
            </span>
          </div>
          {booking.meetingPoint && (
            <div className="flex justify-between gap-4">
              <span className="text-gray-400 shrink-0">Meeting Point</span>
              <span className="text-gray-200 text-right">{booking.meetingPoint}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-400">Travelers</span>
            <span className="text-white">{booking.guests} Guest(s)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Payment Status</span>
            <span className="font-mono uppercase text-amber-300 font-bold">
              {payment?.status || booking.paymentStatus}
            </span>
          </div>
          {payment?.txRef && (
            <div className="flex justify-between">
              <span className="text-gray-400">Transaction Ref</span>
              <span className="font-mono text-gray-200">{payment.txRef}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-white/10 text-sm">
            <span className="font-bold text-white">Total</span>
            <span className="font-mono font-bold text-amber-300">
              {booking.currency} {booking.displayTotal.toLocaleString()} (${booking.totalUsd.toLocaleString()} USD)
            </span>
          </div>
        </div>

        {checkoutNote && (
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-400/35 text-xs text-amber-100 leading-relaxed">
            {checkoutNote}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {checkoutUrl ? (
            <a
              href={checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-center"
            >
              Complete Stripe Checkout &rarr;
            </a>
          ) : (
            <a
              href={buildWhatsAppDirectEnquiryUrl(
                `Hello Vanhsya! I have reserved booking ${booking.bookingRef} for "${booking.itemTitle}" (${booking.travelDate}, ${booking.guests} guests) and would like payment / confirmation assistance.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-center"
            >
              Confirm via WhatsApp Concierge
            </a>
          )}
          <button
            type="button"
            onClick={handleDownloadHtmlReceipt}
            className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold"
          >
            Download Official Receipt (.html)
          </button>
        </div>

        <p className="text-[11px] text-center text-gray-400">
          Need assistance or rescheduling? Contact {BRAND_CONTACTS.supportEmail} or {BRAND_CONTACTS.email}.
        </p>
      </div>
    </div>
  );
};
