import { SimPhaseState, SimPhaseStateTransitionSpec } from './model/common';

/**
 * User interface
 */
export const CONTROL_PANEL_WIDTH_PX = 300;


/**
 * Simulation
 */
export const FRAMES_PER_SEC = 30;

export const MIN_SIM_SPEED = 0.5;
export const MAX_SIM_SPEED = 5.0;
export const DEFAULT_SIM_SPEED = 2.0;

export const CELL_SIZE_PX = 64;
export const CELL_BORDER_WIDTH_PX = 3;

// The order of the keys indicates the state sequence order
export const SIM_PHASE_STATE_TRANSITION_SPECS: {
  [state in SimPhaseState]: SimPhaseStateTransitionSpec
} = {
  addingGridCells: { phaseDuration: 1 },
  removingTiles: { phaseDuration: 1 },
  transitioningTiles: { phaseDuration: 2 },
  showingPlaceholders: { phaseDuration: 1 },
  addingTiles: { phaseDuration: 1 },
};

// Phase states in correct sequence order
export const SIM_PHASE_STATES = Object.keys(
  SIM_PHASE_STATE_TRANSITION_SPECS
) as SimPhaseState[];


export const ITERATION_PHASE_DURATION =
  Object.values(SIM_PHASE_STATE_TRANSITION_SPECS)
    .map(s => s.phaseDuration)
    .reduce((sum, d) => sum + d, 0);
