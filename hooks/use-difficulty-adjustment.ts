import { useQuery } from "@tanstack/react-query";

export type DifficultyAdjustment = {
  progressPercent: number;
  difficultyChange: number;
  estimatedRetargetDate: number;
  remainingBlocks: number;
  remainingTime: number;
  previousRetarget: number;
  nextRetargetHeight: number;
  timeAvg: number;
  adjustedTimeAvg: number;
  timeOffset: number;
  previousTime?: number;
  expectedBlocks?: number;
};

const API_URL =
  "https://mempool.space/api/v1/difficulty-adjustment";

async function fetchDifficultyAdjustment() {
  const response = await fetch(API_URL, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load difficulty adjustment");
  }

  return (await response.json()) as DifficultyAdjustment;
}

type UseDifficultyAdjustmentOptions = {
  enabled?: boolean;
  refetchInterval?: number;
};

export function useDifficultyAdjustment(
  { enabled = true, refetchInterval = 60_000 }: UseDifficultyAdjustmentOptions = {},
) {
  return useQuery({
    queryKey: ["difficulty-adjustment"],
    queryFn: fetchDifficultyAdjustment,
    refetchInterval,
    enabled,
  });
}
