import { Award, Lock, Pencil } from "lucide-react";
import { useState } from "react";
import type { Profile as P } from "../../shared/api";
import { api } from "../api";
import { GameLayout } from "../components/GameLayout";
import { Button, SectionTitle } from "../components/ui";
import { useGame } from "../game/GameContext";

const RANKS = ["Rookie Detective", "Investigator", "Senior Detective", "Inspector", "Chief Inspector", "Master Detective", "Legendary Detective"];

export function Profile() {
  const { profile, setProfile, notify } = useGame();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.displayName ?? "");
  if (!profile) return null;
  const span = profile.nextRank ? profile.nextRank.xp - profile.rankFloor : 1;
  const pct = profile.nextRank ? ((profile.xp - profile.rankFloor) / span) * 100 : 100;

  const saveName = async () => {
    try { setProfile(await api<P>("PATCH", "/api/profile", { displayName: name })); setEditing(false); } catch (e) { notify("error", (e as Error).message); }
  };

  return (
    <GameLayout active="profile">
      <div className="mx-auto max-w-5xl p-4 sm:p-6">
        <SectionTitle kicker="Personnel file" title="Detective Profile" />
        <div className="grid gap-5 lg:grid-cols-3">
          <section className="panel-paper p-6 lg:col-span-1">
            <div className="font-type text-xs uppercase tracking-widest text-char-500">Blackwood City PD</div>
            {editing ? (
              <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); void saveName(); }}>
                <label htmlFor="dn" className="sr-only">Display name</label>
                <input id="dn" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} className="min-w-0 flex-1 rounded border border-char-900/20 bg-white/60 px-2 py-1 font-type text-char-900" />
                <Button size="sm" variant="paper" className="!bg-char-900 !text-amber-300" type="submit">Save</Button>
              </form>
            ) : (
              <h2 className="mt-1 flex items-center gap-2 font-display text-2xl font-bold text-char-900">Det. {profile.displayName}
                <button onClick={() => { setName(profile.displayName); setEditing(true); }} aria-label="Edit name" className="text-char-500 hover:text-char-900"><Pencil size={15} /></button>
              </h2>
            )}
            <div className="mt-4 font-type text-sm text-char-700">Rank</div>
            <div className="font-display text-3xl font-bold text-amber-700">{profile.rank}</div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-char-900/10"><div className="h-full bg-amber-600" style={{ width: `${pct}%` }} /></div>
            <div className="mt-1 font-type text-xs text-char-600">{profile.xp} XP{profile.nextRank ? ` — ${profile.nextRank.xp - profile.xp} XP to ${profile.nextRank.title}` : " — the highest rank"}</div>
            <ol className="mt-5 space-y-1">
              {RANKS.map((r, i) => <li key={r} className={`font-type text-sm ${i <= profile.rankIndex ? "text-char-900" : "text-char-500"}`}>{i <= profile.rankIndex ? "★" : "☆"} {r}</li>)}
            </ol>
          </section>

          <section className="panel p-5 lg:col-span-2">
            <div className="label-caps mb-3">Service record</div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Cases solved", profile.stats.casesSolved], ["Cases closed", profile.stats.casesClosed], ["Clues found", profile.stats.clues], ["Deductions", profile.stats.deductions],
                ["Contradictions", profile.stats.contradictions], ["Interviews", profile.stats.interviews], ["False accusations", profile.stats.falseAccusations],
              ].map(([k, v]) => (
                <div key={k as string} className="rounded-lg border border-white/5 bg-white/[0.02] p-3"><div className="font-display text-2xl font-bold text-paper-100">{v}</div><div className="text-[0.65rem] uppercase tracking-wider text-smoke-400">{k}</div></div>
              ))}
            </div>
            <div className="label-caps mb-3 mt-6">Achievements ({profile.achievements.filter((a) => a.unlockedAt).length}/{profile.achievements.length})</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {profile.achievements.map((a) => (
                <div key={a.id} className={`flex items-start gap-3 rounded-lg border p-3 ${a.unlockedAt ? "border-amber-500/40 bg-amber-500/5" : "border-white/5 opacity-60"}`}>
                  <div className={`rounded-full p-2 ${a.unlockedAt ? "bg-amber-500/20 text-amber-300" : "bg-white/5 text-smoke-500"}`}>{a.unlockedAt ? <Award size={18} /> : <Lock size={18} />}</div>
                  <div><div className="font-semibold text-paper-100">{a.title}</div><div className="text-xs text-smoke-400">{a.description}</div></div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </GameLayout>
  );
}
