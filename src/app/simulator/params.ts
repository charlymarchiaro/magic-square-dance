import { SimPhaseState, SimPhaseStateTransitionSpec } from './model/common';

/**
 * User interface
 */
export const CONTROL_PANEL_WIDTH_PX = 300;


/**
 * Simulation
 */
export const FRAMES_PER_SEC = 30;
export const CELL_SIZE_PX = 64;
export const CELL_BORDER_WIDTH_PX = 2;

// The order of the keys indicates the state sequence order
export const SIM_PHASE_STATE_TRANSITION_SPECS: {
  [state in SimPhaseState]: SimPhaseStateTransitionSpec
} = {
  addingGridCells: { phaseDuration: 1 },
  removingTiles: { phaseDuration: 1 },
  transitioningTiles: { phaseDuration: 2 },
  showingPlaceholders: { phaseDuration: 1 },
  addingTiles: { phaseDuration: 1 },
}

// Phase states in correct sequence order
export const SIM_PHASE_STATES = Object.keys(
  SIM_PHASE_STATE_TRANSITION_SPECS
) as SimPhaseState[];
