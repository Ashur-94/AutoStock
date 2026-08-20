import { SampleInvoicePreset } from '../types';

/**
 * Generates an authentic automotive supplier invoice mockup image as a Data URL
 * to allow instant preview and direct testing of the AI invoice scanner.
 */
export function generateInvoiceMockupImage(preset: SampleInvoicePreset): string {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 1050;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background - off-white paper texture
  ctx.fillStyle = '#fbfbf9';
  ctx.fillRect(0, 0, 800, 1050);

  // Subtle border / shadow
  ctx.strokeStyle = '#e2e4e8';
  ctx.lineWidth = 2;
  ctx.strokeRect(15, 15, 770, 1020);

  // Top header banner
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(25, 25, 750, 70);

  // Supplier Name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText(preset.supplier.toUpperCase(), 45, 68);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('OFFICIAL COMMERCIAL DISTRIBUTION INVOICE & PACKING LIST', 45, 84);

  // Invoice Details Box
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(25, 110, 750, 95);
  ctx.strokeStyle = '#cbd5e1';
  ctx.strokeRect(25, 110, 750, 95);

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('INVOICE NO:', 45, 138);
  ctx.fillText('INVOICE DATE:', 45, 162);
  ctx.fillText('PAYMENT TERMS:', 45, 186);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(preset.invoiceNumber, 150, 138);
  ctx.fillText(preset.date, 150, 162);
  ctx.fillText('Net 30 Commercial Auto Account', 170, 186);

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('BILLED TO / SHIP TO:', 440, 138);
  ctx.fillStyle = '#0f172a';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('Downtown Master Mechanic Auto Repair', 440, 158);
  ctx.fillText('Bay #4, 1042 Industrial Parkway', 440, 176);
  ctx.fillText('Account ID: ACCT-MM-94810', 440, 194);

  // Table Header
  const tableTop = 230;
  ctx.fillStyle = '#334155';
  ctx.fillRect(25, tableTop, 750, 36);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('ITEM # / SKU', 40, tableTop + 23);
  ctx.fillText('DESCRIPTION / PART NAME', 180, tableTop + 23);
  ctx.fillText('CATEGORY', 460, tableTop + 23);
  ctx.fillText('QTY', 570, tableTop + 23);
  ctx.fillText('UNIT COST', 625, tableTop + 23);
  ctx.fillText('EXT TOTAL', 710, tableTop + 23);

  // Line items
  let y = tableTop + 40;
  preset.sampleItems.forEach((item, index) => {
    // Alternating row background
    if (index % 2 === 1) {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(25, y, 750, 48);
    }
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(25, y + 48);
    ctx.lineTo(775, y + 48);
    ctx.stroke();

    // Text
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(item.partNumber, 40, y + 22);

    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(item.name.length > 38 ? item.name.slice(0, 36) + '...' : item.name, 180, y + 20);

    ctx.fillStyle = '#64748b';
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillText(`Loc: ${item.locationSuggestion || 'Auto Bay'} | Unit: ${item.unit}`, 180, y + 36);

    ctx.fillStyle = '#3b82f6';
    ctx.fillText(item.category, 460, y + 24);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(String(item.quantity), 575, y + 26);

    ctx.font = '12px monospace';
    ctx.fillText(`$${item.unitCost.toFixed(2)}`, 628, y + 26);

    const lineTotal = item.quantity * item.unitCost;
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`$${lineTotal.toFixed(2)}`, 712, y + 26);

    y += 48;
  });

  // Stamp / Received Badge
  ctx.save();
  ctx.translate(120, y + 80);
  ctx.rotate(-0.08);
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, 180, 56);
  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 15px monospace';
  ctx.fillText('RECEIVED & CHECKED', 12, 26);
  ctx.font = '11px monospace';
  ctx.fillText(`COUNT VERIFIED BY SHOP`, 14, 44);
  ctx.restore();

  // Summary and Total Box
  const summaryBoxY = y + 30;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(480, summaryBoxY, 295, 140);
  ctx.strokeStyle = '#cbd5e1';
  ctx.strokeRect(480, summaryBoxY, 295, 140);

  ctx.fillStyle = '#475569';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('Subtotal Parts:', 500, summaryBoxY + 30);
  ctx.fillText('Commercial Discount (5%):', 500, summaryBoxY + 55);
  ctx.fillText('State Automotive Tax:', 500, summaryBoxY + 80);

  const subtotal = preset.total / 1.04;
  ctx.fillStyle = '#0f172a';
  ctx.font = '13px monospace';
  ctx.fillText(`$${(subtotal * 1.05).toFixed(2)}`, 690, summaryBoxY + 30);
  ctx.fillText(`-$${(subtotal * 0.05).toFixed(2)}`, 686, summaryBoxY + 55);
  ctx.fillText(`$${(preset.total * 0.04).toFixed(2)}`, 690, summaryBoxY + 80);

  // Total Bar
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(480, summaryBoxY + 95, 295, 45);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText('NET TOTAL DUE:', 500, summaryBoxY + 124);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 18px monospace';
  ctx.fillText(`$${preset.total.toFixed(2)}`, 670, summaryBoxY + 124);

  // Bottom Notice
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText('Thank you for your commercial business. Return policy: 30 days on sealed uninstalled core parts.', 40, 990);
  ctx.fillText('Generated for AutoStock Mechanic AI Scanner Verification • Authentic parts certified OEM spec', 40, 1008);

  return canvas.toDataURL('image/jpeg', 0.92);
}
