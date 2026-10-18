'use client';

import React from 'react';
import Link from 'next/link';

export default function BillingSettingsPage() {
  const invoices = [
    { date: 'Oct 12, 2026', amount: '$19.00', status: 'Paid', invoiceNumber: 'INV-2026-1012' },
    { date: 'Sep 12, 2026', amount: '$19.00', status: 'Paid', invoiceNumber: 'INV-2026-0912' },
    { date: 'Aug 12, 2026', amount: '$19.00', status: 'Paid', invoiceNumber: 'INV-2026-0812' },
  ];

  return (
    <div className="space-y-6">
      {/* Current Plan Card (Screen 36) */}
      <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-1">
            Current Plan
          </div>
          <div className="text-2xl font-bold text-white flex items-center gap-2">
            <span>Creator</span>
            <span className="text-sm font-normal text-[#9CA3AF]">· $19/mo</span>
          </div>
          <p className="text-xs font-mono text-[#E5A93C] mt-1.5">
            Renews Nov 12, 2026
          </p>
        </div>

        <Link
          href="/pricing"
          className="border border-[#2E333D] hover:bg-[#181B20] text-xs font-medium text-white px-5 py-2.5 rounded-xl transition-colors self-start md:self-auto"
        >
          Change plan
        </Link>
      </div>

      {/* Invoices List */}
      <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6 md:p-8 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-white">Invoices</h2>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
            Download receipts for Cutline Studio platform subscription.
          </p>
        </div>

        <div className="divide-y divide-[#1C2028]">
          {invoices.map((inv, idx) => (
            <div
              key={idx}
              className="py-3.5 flex items-center justify-between hover:bg-[#15181D] px-2 rounded-lg transition-colors"
            >
              <div>
                <div className="text-sm font-medium text-white">{inv.date}</div>
                <div className="text-xs font-mono text-[#9CA3AF]">
                  {inv.invoiceNumber} · {inv.status}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-mono text-sm text-white">{inv.amount}</span>
                <button
                  type="button"
                  onClick={() => alert(`Downloading invoice ${inv.invoiceNumber}...`)}
                  className="bg-[#181B20] hover:bg-[#22262E] border border-[#2E333D] text-[11px] font-mono text-[#E5A93C] px-3 py-1 rounded-lg transition-colors"
                >
                  PDF
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Screen 36 Honest Disclosure */}
        <div className="pt-4 border-t border-[#1C2028] text-xs font-mono text-[#9CA3AF]">
          Provider costs (Gemini, PixVerse, ElevenLabs) are billed directly on your provider invoices.
        </div>
      </div>
    </div>
  );
}
