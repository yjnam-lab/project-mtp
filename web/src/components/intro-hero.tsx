"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import "./intro-hero.css";

// 사진: web/public/intro/1.jpg ~ 4.jpg (원본 PNG를 가로 2200px 이하 JPG로 변환해 사용)
// 사진이 없을 때는 회색 그라데이션이 대신 보입니다. pos는 잘릴 때 남길 위치(가로 세로)
const SCENES = [
  { src: "/intro/1.jpg", caption: "La tour Eiffel", pos: "50% 35%", fallback: "linear-gradient(to bottom, #1c1c1c, #8a8a8a)" },
  { src: "/intro/2.jpg", caption: "La Seine", pos: "62% 55%", fallback: "linear-gradient(to bottom, #3a3a3a, #b4b4b4)" },
  { src: "/intro/3.jpg", caption: "Le café", pos: "40% 60%", fallback: "linear-gradient(to bottom, #151515, #4a4a4a)" },
  { src: "/intro/4.jpg", caption: "La table", pos: "55% 60%", fallback: "radial-gradient(circle at center, #5a5a5a, #0b0b0b)" },
];

const TITLE = "Bien placé ?";
const SCENE_GAP = 1150; // 장면 간격(ms)
const TITLE_AT = 4500; // 제목 등장 시점(ms)
const END_AT = 5600; // 인트로 끝(ms)

const NAV = [
  { href: "/diagnose", label: "Diagnose" },
  { href: "/explore", label: "Explore" },
  { href: "/evidence", label: "Evidence" },
];

type Phase = "idle" | "play" | "title" | "done";

export function IntroHero() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [active, setActive] = useState(-1);
  const [run, setRun] = useState(0);
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  const finish = useCallback(() => {
    clearTimers();
    setPhase("done");
  }, [clearTimers]);

  const play = useCallback(() => {
    clearTimers();
    setActive(-1);
    setPhase("idle");
    setRun((r) => r + 1);
    later(() => {
      setPhase("play");
      SCENES.forEach((_, i) => later(() => setActive(i), i * SCENE_GAP));
      later(() => setPhase("title"), TITLE_AT);
      later(finish, END_AT);
    }, 50);
  }, [clearTimers, later, finish]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(() => (reduce ? setPhase("done") : play()), 0);
    return () => {
      window.clearTimeout(t);
      clearTimers();
    };
  }, [play, clearTimers]);

  const playing = phase === "play" || phase === "title";

  return (
    <section className={"ih-stage"} data-phase={phase}>
      {SCENES.map((s, i) => (
        <div
          key={`${run}-${i}`}
          aria-hidden="true"
          className={cn(
            "ih-scene",
            i === SCENES.length - 1 && "ih-last",
            playing && i === active && "ih-on",
            i <= active && "ih-zoom",
          )}
          style={{ backgroundImage: `url(${s.src}), ${s.fallback}`, backgroundPosition: s.pos }}
        />
      ))}
      <div className={"ih-shade"} />

      <div className={"ih-layer"}>
        <div className={"ih-in"}>
          <header className={"ih-nav"}>
            <Link href="/" className={"ih-logo"}>
              Paris Étoile
            </Link>
            <nav className={"ih-links"}>
              {NAV.map((n) => (
                <Link key={n.href} href={n.href}>
                  {n.label}
                </Link>
              ))}
            </nav>
          </header>
        </div>

        <div className={cn("ih-in", "ih-bottom")}>
          <p className={"ih-cap"} aria-hidden="true">
            {active >= 0 && (
              <>
                <b>0{active + 1}</b>
                {SCENES[active].caption}
              </>
            )}
          </p>
          <h1 className={"ih-title"} aria-label={TITLE}>
            {TITLE.split("").map((ch, i) => (
              <span key={i} aria-hidden="true" style={{ transitionDelay: `${i * 55}ms` }}>
                {ch === " " ? "\u00a0" : ch}
              </span>
            ))}
          </h1>
          <p className={"ih-sub"}>숙소의 가치, 주변의 별이 말해 줍니다.</p>
          <div className={"ih-foot"}>
            {phase === "done" ? (
              <button type="button" className={"ih-ctl"} onClick={play}>
                인트로 다시 보기 ↻
              </button>
            ) : (
              <button type="button" className={"ih-ctl"} onClick={finish}>
                건너뛰기 →
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={"ih-bar"} />
    </section>
  );
}
