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
      <header className="sticky top-0 z-30 -mx-0 border-b border-violet-400/25 bg-[#160b2e] px-5 py-3.5 text-center text-white shadow-[0_8px_28px_rgba(88,28,135,0.35)] sm:hidden">
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

      <header className="animate-float-up hidden border-b border-border/60 px-6 py-8 sm:block lg:px-10">
        <h1 className="font-display text-4xl font-black tracking-tight lg:text-5xl">{title}</h1>
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
          <p className="label-mono mt-2 text-[11px] text-muted-foreground">{subtitleText}</p>
        ) : null}
      </header>
    </>
  );
}
