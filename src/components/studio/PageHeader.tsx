export function PageHeader({
  title,
  subtitle,
  links,
}: {
  title: string;
  subtitle: string;
  links?: { label: string; href: string }[];
}) {
  const subtitleText = subtitle.trim();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-fuchsia-300/20 bg-[#0b0419]/90 px-5 py-3.5 text-center text-white shadow-[0_10px_30px_rgba(8,4,20,0.5)] backdrop-blur-xl sm:hidden">
        <h1 className="font-display text-[1.75rem] font-black leading-none tracking-tight text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.45)]">
          {title}
        </h1>
        {links ? (
          <nav className="mt-2.5 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 text-[10px] font-bold text-violet-100/90">
            {links.map((link, index) => (
              <span key={link.href} className="flex items-center gap-2.5">
                {index > 0 && <span className="text-violet-400/70" aria-hidden="true">·</span>}
                <a href={link.href} className="transition-colors hover:text-white">
                  {link.label}
                </a>
              </span>
            ))}
          </nav>
        ) : subtitleText ? (
          <p className="mt-1.5 text-xs font-semibold text-violet-100/90">{subtitleText}</p>
        ) : null}
      </header>

      <header className="sticky top-0 z-40 mx-3 mt-3 hidden rounded-[1.5rem] border border-fuchsia-200/45 bg-[#100528]/88 px-6 py-5 text-white shadow-[0_10px_34px_rgba(65,24,138,0.4),0_0_24px_rgba(217,70,239,0.22),inset_0_1px_12px_rgba(255,255,255,0.1)] backdrop-blur-xl sm:block lg:px-8">
        <h1 className="font-display text-3xl font-black tracking-tight lg:text-4xl">{title}</h1>
        {links ? (
          <nav className="label-mono mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-muted-foreground">
            {links.map((link, index) => (
              <span key={link.href} className="flex items-center gap-3">
                {index > 0 && <span aria-hidden="true">·</span>}
                <a href={link.href} className="transition-colors hover:text-neon-violet">
                  {link.label}
                </a>
              </span>
            ))}
          </nav>
        ) : subtitleText ? (
          <p className="label-mono mt-1.5 text-[11px] text-violet-200/80">{subtitleText}</p>
        ) : null}
      </header>
    </>
  );
}
