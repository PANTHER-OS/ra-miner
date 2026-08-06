import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Cloud, Sparkles, Wind } from "lucide-react";
import type { Country } from "@/lib/countries";
import { describeWeather, fetchWeather, localTimeFor, wordOfDay, type WeatherNow } from "@/lib/sensory";

export function SensoryPanel({ country }: { country: Country }) {
  const [now, setNow] = useState(() => new Date());
  const [wx, setWx] = useState<WeatherNow | null>(null);
  const [wxErr, setWxErr] = useState(false);

  const tz = country.timezones?.[0];

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setWx(null);
    setWxErr(false);
    if (!country.latlng) return;
    let cancelled = false;
    fetchWeather(country.latlng[0], country.latlng[1])
      .then((d) => !cancelled && setWx(d))
      .catch(() => !cancelled && setWxErr(true));
    return () => {
      cancelled = true;
    };
  }, [country.latlng]);

  const time = useMemo(() => localTimeFor(tz, now), [tz, now]);
  const word = useMemo(
    () => wordOfDay(country.languages ? Object.keys(country.languages) : undefined, country.cca2),
    [country],
  );
  const weather = wx ? describeWeather(wx.code) : null;

  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-border bg-[image:linear-gradient(135deg,oklch(0.23_0.03_260/0.7),oklch(0.18_0.02_260/0.4))] p-4">
      <header className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Vitrine sensorial · agora
        </h3>
      </header>

      <div className="grid grid-cols-2 gap-2">
        {/* Hora local */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="col-span-2 rounded-xl border border-border bg-surface/60 p-3"
        >
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-primary/80" />
            Hora local
          </div>
          {time ? (
            <div className="mt-1 flex items-baseline gap-2">
              <span className="gold-text font-mono text-3xl font-bold tabular-nums tracking-tight">
                {time.hh}:{time.mm}
                <span className="text-lg text-muted-foreground">:{time.ss}</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {time.label}
              </span>
            </div>
          ) : (
            <div className="mt-1 text-sm text-muted-foreground">Fuso indisponível</div>
          )}
        </motion.div>

        {/* Clima */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="rounded-xl border border-border bg-surface/60 p-3"
        >
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            <Cloud className="h-3.5 w-3.5 text-primary/80" />
            Clima agora
          </div>
          {weather && wx ? (
            <div className="mt-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl">{weather.icon}</span>
                <span className="text-2xl font-semibold text-foreground tabular-nums">
                  {wx.tempC}°
                </span>
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">
                {weather.text}
              </div>
            </div>
          ) : wxErr ? (
            <div className="mt-1 text-xs text-muted-foreground">Sem dados no momento</div>
          ) : (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="h-4 w-16 animate-pulse rounded bg-muted/40" />
            </div>
          )}
        </motion.div>

        {/* Vento */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-xl border border-border bg-surface/60 p-3"
        >
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            <Wind className="h-3.5 w-3.5 text-primary/80" />
            Vento
          </div>
          {wx ? (
            <div className="mt-1 text-2xl font-semibold text-foreground tabular-nums">
              {wx.wind}
              <span className="ml-1 text-xs font-normal text-muted-foreground">km/h</span>
            </div>
          ) : (
            <div className="mt-2 h-4 w-14 animate-pulse rounded bg-muted/40" />
          )}
        </motion.div>

        {/* Palavra do dia */}
        <motion.div
          key={word.word.word}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="col-span-2 rounded-xl border border-primary/30 bg-[image:linear-gradient(135deg,oklch(0.82_0.14_78/0.08),transparent)] p-3"
        >
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Palavra do dia
            </div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-primary/80">
              intraduzível
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-2 flex-wrap">
            <span className="gold-text text-xl font-semibold">{word.word.word}</span>
            <span className="text-xs italic text-muted-foreground">/{word.word.ipa}/</span>
          </div>
          <p className="mt-1 text-sm leading-snug text-foreground/90">
            {word.word.meaning}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
