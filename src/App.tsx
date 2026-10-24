import { MotionConfig } from "framer-motion";
import { useEffect } from "react";
import { audio } from "./audio";
import { loadNeuralVoices } from "./voice";
import { StoryDirector } from "./components/Story";
import { Toasts } from "./components/Toasts";
import { useGame } from "./game/GameContext";
import { prefersReducedMotion } from "./game/settings";
import { Accusation } from "./screens/Accusation";
import { Board } from "./screens/Board";
import { CaseSelect } from "./screens/CaseSelect";
import { CrimeScene } from "./screens/CrimeScene";
import { Interrogation } from "./screens/Interrogation";
import { MapScreen } from "./screens/MapScreen";
import { Notebook } from "./screens/Notebook";
import { Office } from "./screens/Office";
import { Profile } from "./screens/Profile";
import { Resolution } from "./screens/Resolution";
import { Settings } from "./screens/Settings";
import { Welcome } from "./screens/Welcome";

const SCREENS: Record<string, () => JSX.Element | null> = {
  welcome: Welcome, office: Office, cases: CaseSelect, scene: CrimeScene, interrogate: Interrogation, board: Board,
  notebook: Notebook, map: MapScreen, accuse: Accusation, resolution: Resolution, profile: Profile, settings: Settings,
};

export function App() {
  const { ready, fatal, route, settings } = useGame();

  useEffect(() => { if (settings.voiceEngine === "neural") loadNeuralVoices(); }, [settings.voiceEngine]);

  useEffect(() => {
    if (route.name === "office" || route.name === "notebook" || route.name === "board" || route.name === "accuse") audio.setAmbience("office");
    if (route.name === "welcome") audio.setAmbience("street");
    window.scrollTo(0, 0);
  }, [route.name]);

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center"><div className="font-display text-2xl tracking-[0.3em] text-smoke-400 animate-pulse">BLACKWOOD FILES</div></div>;
  }
  if (fatal) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="font-display text-2xl text-paper-100">The precinct is unreachable</h1>
        <p className="max-w-md text-smoke-300">{fatal}</p>
        <button className="text-amber-300 underline" onClick={() => window.location.reload()}>Try again</button>
      </div>
    );
  }
  const Screen = SCREENS[route.name] ?? Welcome;
  return (
    <MotionConfig reducedMotion={prefersReducedMotion(settings) ? "always" : "never"}>
      <div className="grain min-h-screen">
        <Screen />
        <Toasts />
        <StoryDirector />
      </div>
    </MotionConfig>
  );
}
