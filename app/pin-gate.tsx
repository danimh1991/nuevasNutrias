"use client";

import { useEffect, useState } from "react";
import { Baby, LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import GrowthApp from "./growth-app";

const API_BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const pinEndpoint = `${API_BASE}/api/auth/pin`;

export default function PinGate() {
  const [status, setStatus] = useState<"checking" | "locked" | "unlocked">(
    "checking",
  );
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void fetch(pinEndpoint, { cache: "no-store", signal: controller.signal })
      .then((response) => setStatus(response.ok ? "unlocked" : "locked"))
      .catch((requestError: unknown) => {
        if (!(requestError instanceof DOMException && requestError.name === "AbortError")) {
          setStatus("locked");
        }
      });
    return () => controller.abort();
  }, []);

  async function unlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pin.length !== 4) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(pinEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "No se ha podido comprobar el PIN.");
        setPin("");
        return;
      }
      setStatus("unlocked");
    } catch {
      setError("No se ha podido comprobar el PIN. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  async function lock() {
    await fetch(pinEndpoint, { method: "DELETE" }).catch(() => undefined);
    setPin("");
    setError("");
    setStatus("locked");
  }

  if (status === "unlocked") return <GrowthApp onLock={lock} />;

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f6f8fb] px-5 py-10 text-[#17324d]">
      <div className="absolute -left-24 -top-20 size-72 rounded-full bg-[#dff3f1]" />
      <div className="absolute -bottom-28 -right-20 size-80 rounded-full bg-[#fff0d3]" />
      <section className="relative w-full max-w-sm rounded-[2rem] border border-[#dfe8ef] bg-white p-7 text-center shadow-2xl shadow-[#103f5c]/10 sm:p-9">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#087f8c] text-white shadow-lg shadow-[#087f8c]/20">
          <Baby size={32} />
        </span>
        <p className="font-display mt-4 text-2xl font-bold">Nuevas nutrias</p>
        {status === "checking" ? (
          <div className="py-10" role="status">
            <span className="mx-auto block size-7 animate-spin rounded-full border-2 border-[#b9d4dc] border-t-[#087f8c]" />
            <p className="mt-4 text-sm text-[#6f8395]">Comprobando acceso…</p>
          </div>
        ) : (
          <form onSubmit={unlock} className="mt-7">
            <span className="mx-auto grid size-11 place-items-center rounded-full bg-[#edf7f7] text-[#087f8c]">
              <LockKeyhole size={21} />
            </span>
            <h1 className="font-display mt-3 text-2xl font-bold">Introduce tu PIN</h1>
            <p className="mt-2 text-sm leading-relaxed text-[#6f8395]">
              Protegemos los datos de crecimiento de tus pequeños.
            </p>
            <InputOTP
              autoFocus
              maxLength={4}
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin}
              onChange={(value) => {
                setPin(value.replace(/\D/g, ""));
                setError("");
              }}
              disabled={submitting}
              aria-label="PIN de cuatro cifras"
              aria-invalid={Boolean(error)}
              containerClassName="mt-6 justify-center"
            >
              <InputOTPGroup className="gap-2">
                {[0, 1, 2, 3].map((index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    className="size-13 rounded-xl border bg-[#f8fafb] text-xl font-bold first:rounded-xl first:border last:rounded-xl"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
            <div className="mt-3 min-h-5" aria-live="polite">
              {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
            </div>
            <Button
              type="submit"
              className="mt-3 h-11 w-full rounded-xl bg-[#087f8c] font-bold hover:bg-[#086f7a]"
              disabled={pin.length !== 4 || submitting}
            >
              <ShieldCheck /> {submitting ? "Comprobando…" : "Acceder"}
            </Button>
          </form>
        )}
      </section>
    </main>
  );
}
