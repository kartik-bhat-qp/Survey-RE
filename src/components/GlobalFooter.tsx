'use client';

const BI_STATS_FOOTER_COPY = 'QuestionPro Admin | Business Intelligence v1.1.15';

export function GlobalFooter({ copy = BI_STATS_FOOTER_COPY }: { copy?: string }) {
  return (
    <footer className="relative z-10 shrink-0 bg-white px-4 py-3 text-[11px] leading-none text-[#999999] sm:px-6">
      {copy}
    </footer>
  );
}
