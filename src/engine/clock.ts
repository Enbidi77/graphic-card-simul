import type { SimEvent } from './types';

export interface SimClockState {
  running: boolean;
  speed: number;
  frame: number;
  simTimeMs: number;
  activeStageId: number;
  maxHistory: number;
  events: SimEvent[];
  nextEventId: number;
}

export function createInitialClock(maxHistory = 200): SimClockState {
  return {
    running: false,
    speed: 1,
    frame: 1,
    simTimeMs: 0,
    activeStageId: 1,
    maxHistory,
    events: [],
    nextEventId: 1
  };
}

export function stepClock(
  state: SimClockState,
  stageCount = 13,
  stageDurationMs = 1.25
): SimClockState {
  const nextStage = state.activeStageId >= stageCount ? 1 : state.activeStageId + 1;
  const nextFrame = state.activeStageId >= stageCount ? state.frame + 1 : state.frame;
  return {
    ...state,
    frame: nextFrame,
    activeStageId: nextStage,
    simTimeMs: Number((state.simTimeMs + stageDurationMs).toFixed(2))
  };
}

export function appendBoundedEvents(
  state: SimClockState,
  incoming: SimEvent[]
): SimClockState {
  const combined = [...state.events, ...incoming];
  const trimmed =
    combined.length > state.maxHistory
      ? combined.slice(combined.length - state.maxHistory)
      : combined;
  return {
    ...state,
    events: trimmed,
    nextEventId: state.nextEventId + incoming.length
  };
}

export function resetClock(maxHistory = 200): SimClockState {
  return createInitialClock(maxHistory);
}
