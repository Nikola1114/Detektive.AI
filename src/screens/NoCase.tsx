import { Briefcase } from "lucide-react";
import { Button } from "../components/ui";
import { useGame } from "../game/GameContext";

/** Shown on in-game screens when no case is open yet. */
export function NoCase() {
  const { go, startCase } = useGame();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <Briefcase size={40} className="text-smoke-500" />
      <h1 className="font-display text-2xl text-paper-100">No case on your desk</h1>
      <p className="max-w-sm text-smoke-300">Open a case file to begin investigating.</p>
      <div className="flex gap-3">
        <Button variant="primary" onClick={async () => { if (await startCase("case-001")) go("office?briefing"); }}>Open Case 001</Button>
        <Button onClick={() => go("cases")}>Browse case files</Button>
      </div>
    </div>
  );
}
