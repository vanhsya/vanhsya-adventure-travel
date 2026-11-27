import QRCode from 'qrcode';
import { SocialEvent, SocialMember } from '../types';
import { BRAND_CONTACTS } from './utm';

export async function generateQrDataUrl(text: string, darkColor = '#140B24'): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 480,
    margin: 2,
    color: {
      dark: darkColor,
      light: '#FFFFFF',
    },
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 4
): number {
  const words = text.split(/\s+/);
  let line = '';
  let currentY = y;
  let lineCount = 0;

  for (let i = 0; i < words.length; i++) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = words[i];
      currentY += lineHeight;
      lineCount += 1;
      if (lineCount >= maxLines - 1) {
        break;
      }
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export async function generateEventPromoCardDataUrl(
  event: SocialEvent,
  shareUrl: string,
  format: 'invitation' | 'instagram-feed' | 'instagram-story' = 'invitation'
): Promise<string> {
  const width = format === 'invitation' ? 1200 : 1080;
  const height = format === 'instagram-story' ? 1920 : format === 'instagram-feed' ? 1350 : 1500;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  // Deep charcoal-purple ambient background
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#0C0816');
  bgGrad.addColorStop(0.5, '#170E2E');
  bgGrad.addColorStop(1, '#090710');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle lavender radial light
  const glow = ctx.createRadialGradient(width * 0.8, height * 0.16, 40, width * 0.8, height * 0.16, width * 0.7);
  glow.addColorStop(0, 'rgba(167, 139, 250, 0.28)');
  glow.addColorStop(1, 'rgba(12, 8, 22, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  const glowBottom = ctx.createRadialGradient(width * 0.18, height * 0.85, 30, width * 0.18, height * 0.85, width * 0.65);
  glowBottom.addColorStop(0, 'rgba(139, 92, 246, 0.18)');
  glowBottom.addColorStop(1, 'rgba(12, 8, 22, 0)');
  ctx.fillStyle = glowBottom;
  ctx.fillRect(0, 0, width, height);

  // Outer card frame
  const pad = 56;
  drawRoundedRect(ctx, pad, pad, width - pad * 2, height - pad * 2, 36);
  ctx.strokeStyle = 'rgba(196, 181, 253, 0.25)';
  ctx.lineWidth = 2;
  ctx.stroke();

  const innerX = pad + 56;
  const contentWidth = width - (pad + 56) * 2;
  let cursorY = pad + 88;

  // Brand + Campaign Header
  ctx.fillStyle = '#C4B5FD';
  ctx.font = '700 22px Inter, sans-serif';
  ctx.fillText('VANHSYA SOCIAL CLUB · UAE (18+)', innerX, cursorY);
  cursorY += 46;

  ctx.fillStyle = '#E9D5FF';
  ctx.font = 'italic 600 28px Georgia, serif';
  ctx.fillText(`"${BRAND_CONTACTS.campaignTitle}"`, innerX, cursorY);
  cursorY += 42;

  ctx.fillStyle = '#A78BFA';
  ctx.font = '600 20px Inter, sans-serif';
  ctx.fillText(`${BRAND_CONTACTS.tagline}  •  ${event.category.toUpperCase()}`, innerX, cursorY);
  cursorY += 56;

  // Divider line
  ctx.fillStyle = 'rgba(196, 181, 253, 0.22)';
  ctx.fillRect(innerX, cursorY, contentWidth, 2);
  cursorY += 68;

  // Event Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 62px Georgia, serif';
  cursorY = wrapText(ctx, event.title, innerX, cursorY, contentWidth, 74, 3);
  cursorY += 16;

  if (event.subtitle) {
    ctx.fillStyle = '#D1D5DB';
    ctx.font = '400 28px Inter, sans-serif';
    cursorY = wrapText(ctx, event.subtitle, innerX, cursorY, contentWidth, 40, 2);
    cursorY += 20;
  }

  // Event Details Panel
  const detailsY = cursorY + 12;
  const detailsHeight = format === 'instagram-story' ? 370 : 310;
  drawRoundedRect(ctx, innerX, detailsY, contentWidth, detailsHeight, 24);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.045)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const rowX = innerX + 40;
  let rowY = detailsY + 58;
  const drawDetail = (label: string, value: string) => {
    ctx.fillStyle = '#A78BFA';
    ctx.font = '700 18px Inter, sans-serif';
    ctx.fillText(label, rowX, rowY);
    ctx.fillStyle = '#F9FAFB';
    ctx.font = '600 26px Inter, sans-serif';
    ctx.fillText(value, rowX + 190, rowY);
    rowY += 56;
  };

  drawDetail('EMIRATE', `${event.city}, ${event.emirate}`);
  drawDetail('DATE', event.eventDate);
  drawDetail('TIME', event.endTime ? `${event.startTime} – ${event.endTime}` : event.startTime);
  drawDetail('VENUE', event.venueName);
  drawDetail('ENTRY', event.priceAed && event.priceAed > 0 ? `AED ${event.priceAed} · ${event.ageRestriction}` : `Complimentary RSVP · ${event.ageRestriction}`);

  // Footer QR & Official Channels
  const qrSize = format === 'instagram-story' ? 270 : 230;
  const footerBoxY = height - pad - 52 - (qrSize + 64);
  drawRoundedRect(ctx, innerX, footerBoxY, contentWidth, qrSize + 64, 24);
  ctx.fillStyle = 'rgba(13, 10, 24, 0.85)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(196, 181, 253, 0.25)';
  ctx.stroke();

  const qrUrl = await generateQrDataUrl(shareUrl, '#160B2B');
  const qrImg = await loadImage(qrUrl);
  const qrPadX = innerX + 32;
  const qrPadY = footerBoxY + 32;
  drawRoundedRect(ctx, qrPadX - 10, qrPadY - 10, qrSize + 20, qrSize + 20, 18);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.drawImage(qrImg, qrPadX, qrPadY, qrSize, qrSize);

  const infoX = qrPadX + qrSize + 44;
  let infoY = qrPadY + 40;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 28px Inter, sans-serif';
  ctx.fillText('Scan to RSVP & Confirm Your Seat', infoX, infoY);
  infoY += 44;

  ctx.fillStyle = '#C4B5FD';
  ctx.font = '500 22px Inter, sans-serif';
  ctx.fillText('Verified Stranger MeetUp · Limited Capacity', infoX, infoY);
  infoY += 54;

  ctx.fillStyle = '#E5E7EB';
  ctx.font = '600 22px Inter, sans-serif';
  ctx.fillText(`Web: ${BRAND_CONTACTS.websiteDisplay}`, infoX, infoY);
  infoY += 36;
  ctx.fillStyle = '#DDD6FE';
  ctx.fillText(`Instagram: ${BRAND_CONTACTS.instagramHandle}`, infoX, infoY);

  return canvas.toDataURL('image/png');
}

export async function generateFoundingMemberPassDataUrl(
  member: SocialMember,
  verifyUrl: string
): Promise<string> {
  const width = 1200;
  const height = 740;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#0D0917');
  grad.addColorStop(0.55, '#1D1238');
  grad.addColorStop(1, '#0B0813');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  const aura = ctx.createRadialGradient(width * 0.84, height * 0.2, 20, width * 0.84, height * 0.2, 480);
  aura.addColorStop(0, 'rgba(168, 85, 247, 0.35)');
  aura.addColorStop(1, 'rgba(13, 9, 23, 0)');
  ctx.fillStyle = aura;
  ctx.fillRect(0, 0, width, height);

  drawRoundedRect(ctx, 36, 36, width - 72, height - 72, 30);
  ctx.strokeStyle = 'rgba(196, 181, 253, 0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#C4B5FD';
  ctx.font = '700 20px Inter, sans-serif';
  ctx.fillText('VANHSYA SOCIAL CLUB · FOUNDING MEMBER ID', 84, 110);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 46px Georgia, serif';
  ctx.fillText(member.fullName, 84, 210);

  ctx.fillStyle = '#A78BFA';
  ctx.font = '700 32px monospace';
  ctx.fillText(member.membershipId, 84, 274);

  ctx.fillStyle = '#E5E7EB';
  ctx.font = '500 22px Inter, sans-serif';
  ctx.fillText(`Emirate: ${member.emirate}, UAE  ·  18+ Verified Resident`, 84, 340);

  ctx.fillStyle = '#D8B4FE';
  ctx.font = 'italic 600 24px Georgia, serif';
  ctx.fillText(`"${BRAND_CONTACTS.campaignTitle}" — ${BRAND_CONTACTS.tagline}`, 84, 412);

  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.fillRect(84, 520, 680, 1.5);

  ctx.fillStyle = '#D1D5DB';
  ctx.font = '600 20px Inter, sans-serif';
  ctx.fillText(`${BRAND_CONTACTS.websiteDisplay}   |   Instagram ${BRAND_CONTACTS.instagramHandle}`, 84, 580);
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '400 18px Inter, sans-serif';
  ctx.fillText(`Issued: ${new Date(member.createdAt).toLocaleDateString('en-AE', { year: 'numeric', month: 'short', day: 'numeric' })}`, 84, 622);

  const qrSize = 240;
  const qrUrl = await generateQrDataUrl(verifyUrl, '#160B2B');
  const qrImg = await loadImage(qrUrl);
  drawRoundedRect(ctx, width - 84 - qrSize - 14, 210, qrSize + 28, qrSize + 28, 22);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.drawImage(qrImg, width - 84 - qrSize, 224, qrSize, qrSize);

  ctx.fillStyle = '#C4B5FD';
  ctx.font = '600 16px Inter, sans-serif';
  ctx.fillText('CHECK-IN & VERIFY PASS', width - 84 - qrSize + 10, 502);

  return canvas.toDataURL('image/png');
}

export function triggerDataUrlDownload(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
