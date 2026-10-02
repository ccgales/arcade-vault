"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const PASSWORD_TOO_SHORT = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;

function mapAuthError(error: { message: string; code?: string }): string {
  const msg = error.message.toLowerCase();
  if (msg.includes("invalid login credentials")) {
    return "Correo o contraseña incorrectos.";
  }
  if (
    error.code === "weak_password" ||
    (msg.includes("password") && msg.includes("at least"))
  ) {
    return PASSWORD_TOO_SHORT;
  }
  if (msg.includes("email") && msg.includes("invalid")) {
    return "El correo no tiene un formato válido.";
  }
  return "No pudimos completar la operación. Intentá de nuevo.";
}

export default function Auth() {
  const router = useRouter();
  const [tab, setTab] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [signedUpEmail, setSignedUpEmail] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(
    null,
  );

  const switchTab = (next: "in" | "up") => {
    setTab(next);
    setError(null);
  };

  const fail = (message: string) => {
    setError(message);
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!EMAIL_RE.test(email)) {
      fail("El correo no tiene un formato válido.");
      return;
    }
    if (!password) {
      fail("Ingresá tu contraseña.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (authError) {
      fail(mapAuthError(authError));
      return;
    }

    router.push("/biblioteca");
  };

  const signup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!EMAIL_RE.test(email)) {
      fail("El correo no tiene un formato válido.");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      fail(PASSWORD_TOO_SHORT);
      return;
    }
    if (password !== confirmPassword) {
      fail("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);

    if (authError) {
      fail(mapAuthError(authError));
      return;
    }

    // Correo ya registrado y confirmado: signUp no devuelve error, pero el
    // usuario resultante no trae identidades ni sesión (supabase-js 2.112.4).
    if (data.user && data.user.identities?.length === 0) {
      fail("Ya existe una cuenta con este correo. Iniciá sesión.");
      return;
    }

    setSignedUpEmail(email);
  };

  const submit = tab === "in" ? login : signup;

  const loginWithProvider = async (provider: "google" | "github") => {
    setError(null);
    setOauthLoading(provider);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    // En éxito, signInWithOAuth redirige el navegador al proveedor y esta
    // función nunca llega a completarse; solo hace falta manejar el error.
    if (authError) {
      fail(mapAuthError(authError));
      setOauthLoading(null);
    }
  };

  return (
    <div className="av-auth-wrap fade-in">
      <div className={"auth-card" + (shake ? " shake" : "")}>
        <div className="auth-header">
          <div className="mark"></div>
          <h2 className="neon-cyan">ARCADE VAULT</h2>
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--ink-faint)",
              letterSpacing: "0.16em",
              marginTop: 6,
            }}
          >
            ACCESO AL SISTEMA · v2.6
          </div>
        </div>

        {signedUpEmail ? (
          <div className="terminal-success">
            <div className="term-bar">
              <span className="dot r"></span>
              <span className="dot y"></span>
              <span className="dot g"></span>
              <span className="term-title">VAULT-OS // TERMINAL</span>
            </div>
            <div className="term-body">
              <div className="line">
                <span className="prompt">vault@arcade:~$</span>{" "}
                ./confirm_account
              </div>
              <div className="line dim">[OK] Cuenta creada…</div>
              <div className="line dim">
                [OK] Enviando correo de verificación…
              </div>
              <div className="line success">
                &gt; REVISÁ TU CORREO. TE ENVIAMOS UN LINK A {signedUpEmail}.
                <span className="caret">_</span>
              </div>
              <div style={{ marginTop: 18 }}>
                <button
                  className="btn ghost"
                  type="button"
                  onClick={() => {
                    setSignedUpEmail(null);
                    setTab("in");
                  }}
                >
                  VOLVER A INICIAR SESIÓN
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="auth-tabs">
              <button
                className={tab === "in" ? "on" : ""}
                onClick={() => switchTab("in")}
              >
                INICIAR SESIÓN
              </button>
              <button
                className={tab === "up" ? "on" : ""}
                onClick={() => switchTab("up")}
              >
                CREAR CUENTA
              </button>
            </div>

            <form onSubmit={submit}>
              <div className="field">
                <label>Correo electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jugador@vault.gg"
                />
              </div>
              <div className="field">
                <label>Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              {tab === "up" && (
                <div className="field slide-in">
                  <label>Repetir contraseña</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              )}

              {error && <div className="auth-error">{error}</div>}

              <button
                className="btn lg"
                type="submit"
                disabled={loading}
                style={{ width: "100%", marginTop: 8 }}
              >
                {loading ? (
                  <>
                    <span className="btn-led"></span> UN MOMENTO…
                  </>
                ) : tab === "in" ? (
                  "ENTRAR AL VAULT"
                ) : (
                  "CREAR Y JUGAR"
                )}
              </button>
            </form>

            <button
              className="btn ghost"
              style={{ width: "100%", marginTop: 10 }}
              onClick={() => router.push("/biblioteca")}
            >
              JUGAR COMO INVITADO
            </button>

            <div className="auth-divider">O CONTINÚA CON</div>
            <div className="social">
              <button
                className="btn ghost"
                type="button"
                disabled={oauthLoading !== null}
                onClick={() => loginWithProvider("google")}
              >
                {oauthLoading === "google" ? (
                  <>
                    <span className="btn-led"></span> CONECTANDO…
                  </>
                ) : (
                  "◆ GOOGLE"
                )}
              </button>
              <button
                className="btn ghost"
                type="button"
                disabled={oauthLoading !== null}
                onClick={() => loginWithProvider("github")}
              >
                {oauthLoading === "github" ? (
                  <>
                    <span className="btn-led"></span> CONECTANDO…
                  </>
                ) : (
                  "▣ GITHUB"
                )}
              </button>
            </div>

            <div
              style={{
                marginTop: 18,
                textAlign: "center",
                fontSize: 11,
                color: "var(--ink-faint)",
                letterSpacing: "0.1em",
              }}
            >
              AL ENTRAR ACEPTAS LOS TÉRMINOS DEL SALÓN ARCADE
            </div>
          </>
        )}
      </div>
    </div>
  );
}
