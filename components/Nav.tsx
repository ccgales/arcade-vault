"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setEmail(session?.user.email ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isActive = (name: "biblioteca" | "salon" | "acerca-de") => {
    if (name === "biblioteca") {
      return (
        pathname.startsWith("/biblioteca") || pathname.startsWith("/juegos")
      );
    }
    if (name === "acerca-de") {
      return pathname.startsWith("/acerca-de");
    }
    return pathname.startsWith("/salon");
  };

  const close = () => setOpen(false);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    close();
    router.refresh();
  };

  const displayName = email ? email.split("@")[0].toUpperCase() : null;

  return (
    <>
      <nav className="av-nav">
        <Link href="/" className="logo" onClick={close}>
          <div className="logo-mark"></div>
          <div className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">VAULT</span>
          </div>
        </Link>
        <div className="links">
          <Link
            href="/biblioteca"
            className={isActive("biblioteca") ? "active" : ""}
          >
            Biblioteca
          </Link>
          <Link href="/salon" className={isActive("salon") ? "active" : ""}>
            Salón de la Fama
          </Link>
          <Link
            href="/acerca-de"
            className={isActive("acerca-de") ? "active" : ""}
          >
            Acerca de
          </Link>
        </div>
        <div className="spacer"></div>
        <div className="coin-counter">
          <span className="coin"></span>
          <span>CRÉDITOS · 03</span>
        </div>
        {displayName ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              className="mono neon-cyan"
              style={{ fontSize: 12, letterSpacing: "0.08em" }}
            >
              {displayName}
            </span>
            <button className="btn ghost" onClick={signOut}>
              Salir
            </button>
          </div>
        ) : (
          <Link href="/auth" className="btn auth-btn">
            Iniciar Sesión
          </Link>
        )}
        <button
          className="btn ghost hamburger"
          onClick={() => setOpen(true)}
          aria-label="Menú"
        >
          ≡
        </button>
      </nav>

      <div
        className={"av-mobile-backdrop" + (open ? " open" : "")}
        onClick={close}
      ></div>
      <aside className={"av-mobile-panel" + (open ? " open" : "")}>
        <div
          className="pixel neon-cyan"
          style={{ fontSize: 11, marginBottom: 16 }}
        >
          MENÚ
        </div>
        <Link
          href="/biblioteca"
          className={isActive("biblioteca") ? "active" : ""}
          onClick={close}
        >
          Biblioteca
        </Link>
        <Link
          href="/salon"
          className={isActive("salon") ? "active" : ""}
          onClick={close}
        >
          Salón de la Fama
        </Link>
        <Link
          href="/acerca-de"
          className={isActive("acerca-de") ? "active" : ""}
          onClick={close}
        >
          Acerca de
        </Link>
        {displayName ? (
          <>
            <div className="pixel neon-cyan" style={{ fontSize: 11 }}>
              {displayName}
            </div>
            <button
              className="btn ghost"
              style={{ marginTop: 8 }}
              onClick={signOut}
            >
              Salir
            </button>
          </>
        ) : (
          <Link href="/auth" onClick={close}>
            Iniciar Sesión
          </Link>
        )}
        <div style={{ flex: 1 }}></div>
        <div
          className="pixel"
          style={{
            fontSize: 9,
            color: "var(--ink-faint)",
            letterSpacing: "0.16em",
          }}
        >
          CRÉDITOS · 03
        </div>
      </aside>
    </>
  );
}
