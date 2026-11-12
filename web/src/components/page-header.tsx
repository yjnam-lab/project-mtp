// 하위 화면 공통 머리말(검은 띠 + 가는 영문 + 굵은 한글 제목)
import Link from "next/link";

export const container = "mx-auto w-full max-w-[1440px] px-5 md:px-[76px]";

const NAV = [
  { href: "/diagnose", label: "진단" },
  { href: "/explore", label: "탐색" },
];

export function PageHeader({
  en,
  title,
  children,
  current,
}: {
  en: string;
  title: string;
  children?: React.ReactNode;
  current: string;
}) {
  return (
    <header className="bg-foreground text-background">
      <div className={`${container} flex items-center justify-between py-6`}>
        <Link href="/" className="text-sm font-bold hover:text-brand">
          ← Paris Étoile
        </Link>
        <nav className="flex gap-6 text-sm font-bold">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={current === n.href ? "page" : undefined}
              className={current === n.href ? "border-b-2 border-brand pb-0.5" : "text-background/60 hover:text-background"}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className={`${container} pt-10 pb-16 md:pt-16 md:pb-24`}>
        <p className="text-5xl font-extralight tracking-tight md:text-7xl">{en}</p>
        <h1 className="mt-6 text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
        {children && <p className="mt-4 max-w-2xl leading-relaxed text-background/70">{children}</p>}
      </div>
    </header>
  );
}
