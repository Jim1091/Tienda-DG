export default function LiveSchedule({ schedule, tiktokUrl }: { schedule: string; tiktokUrl: string }) {
  const label = <span className="live-schedule-label">
    <svg className="live-tiktok-logo" viewBox="0 0 32 32" width="22" height="22" fill="none" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 4v16a6 6 0 1 1-6-6m6-10c1 4.1 3.8 6.3 8 6.6" stroke="#25f4ee" transform="translate(-1.5 1)"/>
      <path d="M19 4v16a6 6 0 1 1-6-6m6-10c1 4.1 3.8 6.3 8 6.6" stroke="#fe2c55" transform="translate(1.5 -1)"/>
      <path d="M19 4v16a6 6 0 1 1-6-6m6-10c1 4.1 3.8 6.3 8 6.6" stroke="currentColor"/>
    </svg>
    Lives en TikTok
  </span>;
  return <aside className="live-schedule" aria-label="Horario de lives en TikTok">
    <div className="live-schedule-inner">
      {tiktokUrl
        ? <a className="live-schedule-brand" href={tiktokUrl} target="_blank" rel="noopener noreferrer" aria-label="Visitar nuestro TikTok">{label}</a>
        : <span className="live-schedule-brand">{label}</span>}
      <p><strong>Horario</strong><span>{schedule}</span></p>
    </div>
  </aside>;
}
