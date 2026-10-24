import { Download, RotateCcw, Trash2, Volume2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { api } from "../api";
import { GameLayout } from "../components/GameLayout";
import { Button, Modal, SectionTitle } from "../components/ui";
import { useGame } from "../game/GameContext";

export function Settings() {
  const { settings, setSettings, info, caseId, startCase, go, resetAll, notify, state } = useGame();
  const [confirm, setConfirm] = useState<null | "case" | "all">(null);

  const exportSave = async () => {
    try {
      const data = await api("GET", "/api/export");
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url; a.download = "detective-ai-save.json"; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { notify("error", (e as Error).message); }
  };

  return (
    <GameLayout active="settings">
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <SectionTitle kicker="Preferences" title="Settings" />

        <Section title="Sound">
          <Toggle label="Enable sound" hint="Rain, city ambience, a quiet score and discovery cues — all synthesised in your browser." checked={settings.sound} onChange={(v) => setSettings({ sound: v })} icon={<Volume2 size={16} />} />
          <Slider label="Ambience" value={settings.ambient} disabled={!settings.sound} onChange={(v) => setSettings({ ambient: v })} />
          <Slider label="Music" value={settings.music} disabled={!settings.sound} onChange={(v) => setSettings({ music: v })} />
          <Slider label="Sound effects" value={settings.sfx} disabled={!settings.sound} onChange={(v) => setSettings({ sfx: v })} />
        </Section>

        <Section title="Accessibility">
          <div className="flex flex-wrap items-center justify-between gap-3 py-2">
            <div><div className="text-sm text-paper-100">Motion</div><div className="text-xs text-smoke-400">"System" follows your device's reduced-motion setting.</div></div>
            <div className="flex gap-1" role="radiogroup" aria-label="Motion">
              {(["system", "on", "off"] as const).map((m) => (
                <Button key={m} size="sm" variant={settings.motion === m ? "primary" : "ghost"} role="radio" aria-checked={settings.motion === m} onClick={() => setSettings({ motion: m })}>{m === "system" ? "System" : m === "on" ? "Full" : "Reduced"}</Button>
              ))}
            </div>
          </div>
          <Toggle label="Larger text" checked={settings.textLarge} onChange={(v) => setSettings({ textLarge: v })} />
          <Toggle label="High contrast text" hint="Brightens secondary text and removes film grain." checked={settings.highContrast} onChange={(v) => setSettings({ highContrast: v })} />
        </Section>

        <Section title="Graphics">
          <Toggle label="Film grain" checked={settings.grain} onChange={(v) => setSettings({ grain: v })} />
          <Toggle label="Rain effects" checked={settings.rain} onChange={(v) => setSettings({ rain: v })} />
        </Section>

        <Section title="Data">
          <p className="mb-3 text-sm text-smoke-400">Your progress is saved on the game server automatically after every meaningful action, tied to an anonymous session on this browser.</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={exportSave}><Download size={14} />Export save</Button>
            <Button size="sm" onClick={() => setConfirm("case")} disabled={!caseId || !state}><RotateCcw size={14} />Restart current case</Button>
            <Button size="sm" variant="danger" onClick={() => setConfirm("all")}><Trash2 size={14} />Delete all progress</Button>
          </div>
        </Section>

        <Section title="About">
          <div className="space-y-1 text-sm text-smoke-300">
            <div>Dialogue engine: {info?.aiDialogue ? <span className="text-emerald-300">AI ({info.aiModel}), constrained by authored case facts</span> : <span className="text-amber-300">Authored dialogue (no AI key configured on the server)</span>}</div>
            <div>Storage: server-side save files</div>
          </div>
        </Section>
      </div>

      <Modal open={confirm !== null} onClose={() => setConfirm(null)} title={confirm === "all" ? "Delete all progress?" : "Restart this case?"}>
        <p className="text-smoke-200">{confirm === "all" ? "Your rank, achievements and every case will be permanently erased." : "All evidence, deductions, notes and interviews for this case will be lost. Your rank and achievements are kept."}</p>
        <div className="mt-5 flex gap-3">
          <Button variant="danger" onClick={async () => {
            if (confirm === "all") await resetAll();
            else if (caseId && (await startCase(caseId, { reset: true }))) { setConfirm(null); go("office?briefing"); }
          }}>{confirm === "all" ? "Delete everything" : "Restart case"}</Button>
          <Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button>
        </div>
      </Modal>
    </GameLayout>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="panel mb-4 p-5"><h2 className="label-caps mb-2">{title}</h2><div className="divide-y divide-white/5">{children}</div></section>;
}

function Toggle({ label, hint, checked, onChange, icon }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void; icon?: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-3">
      <span><span className="flex items-center gap-2 text-sm text-paper-100">{icon}{label}</span>{hint && <span className="block text-xs text-smoke-400">{hint}</span>}</span>
      <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-amber-500" : "bg-char-600"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-paper-100 shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </label>
  );
}

function Slider({ label, value, onChange, disabled }: { label: string; value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const id = `s-${label}`;
  return (
    <div className={`flex items-center justify-between gap-4 py-3 ${disabled ? "opacity-40" : ""}`}>
      <label htmlFor={id} className="text-sm text-paper-100">{label}</label>
      <input id={id} type="range" min={0} max={1} step={0.05} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} className="w-48" />
    </div>
  );
}
