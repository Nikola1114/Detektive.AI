import type { CaseDef } from "./types.ts";
import { case001 } from "./case001/index.ts";
import { loadGeneratedCases, saveGeneratedCase } from "../store.ts";

const builtIn: CaseDef[] = [case001];
const generated = new Map<string, CaseDef>(loadGeneratedCases().map((c) => [c.id, c]));

export function getCase(id: string): CaseDef | undefined {
  return builtIn.find((c) => c.id === id) ?? generated.get(id);
}

export function builtInCases(): CaseDef[] {
  return builtIn;
}

export function registerGenerated(def: CaseDef) {
  generated.set(def.id, def);
  saveGeneratedCase(def);
}
