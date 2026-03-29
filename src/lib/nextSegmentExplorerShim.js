'use client';

export const SEGMENT_EXPLORER_SIMULATED_ERROR_MESSAGE =
  'NEXT_DEVTOOLS_SIMULATED_ERROR';

export function SegmentStateProvider({ children }) {
  return children;
}

export function SegmentViewNode({ children }) {
  return children;
}

export function SegmentViewStateNode() {
  return null;
}

export function SegmentBoundaryTriggerNode() {
  return null;
}

export function useSegmentState() {
  return {
    boundaryType: null,
    setBoundaryType: () => {},
  };
}
