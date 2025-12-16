"use client";

import { Fragment } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  type DifficultyAdjustment,
  useDifficultyAdjustment,
} from "@/hooks/use-difficulty-adjustment";

const REFRESH_INTERVAL_MS = 60_000;
const RETARGET_WINDOW_BLOCKS = 2016;

export default function Home() {
  const {
    data,
    isError,
    isPending,
    error,
    isFetching,
  } = useDifficultyAdjustment({
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        {isPending && <SummarySkeleton />}

        {!isPending && isError && (
          <ErrorCard
            message={
              error instanceof Error
                ? error.message
                : "Unable to reach mempool.space right now."
            }
          />
        )}

        {!isPending && !isError && data && (
          <Fragment>
            <SummaryCard data={data} isFetching={isFetching} />
            <div className="grid gap-8 lg:grid-cols-2">
              <TimelineCard data={data} />
              <PaceCard data={data} />
            </div>
          </Fragment>
        )}
      </main>
    </div>
  );
}

function SummaryCard({
  data,
  isFetching,
}: {
  data: DifficultyAdjustment;
  isFetching: boolean;
}) {
  const stats = buildSummaryStats(data);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-3">
          <CardTitle className="text-3xl">
            Difficulty Adjustment
          </CardTitle>
          <Badge variant="secondary" className="flex items-center gap-1.5">
            {isFetching ? (
              <>
                <Spinner className="size-3" />
                Updating
              </>
            ) : (
              `Auto refresh ${formatDuration(REFRESH_INTERVAL_MS / 1000)}`
            )}
          </Badge>
        </div>
        <CardDescription>
          Live snapshot of the upcoming Bitcoin retarget window via
          mempool.space.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border/80 bg-card/40 p-4"
            >
              <p className="text-sm text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {stat.value}
              </p>
              {stat.helper && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {stat.helper}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TimelineCard({ data }: { data: DifficultyAdjustment }) {
  const remainingSeconds = msToSeconds(data.remainingTime);
  const estimated = normalizeTimestamp(data.estimatedRetargetDate);
  const offsetSeconds = msToSeconds(Math.abs(data.timeOffset));

  const offsetLabel =
    data.timeOffset === 0
      ? "Network pace is right on schedule."
      : `Network is ${
          data.timeOffset > 0 ? "running behind" : "running ahead"
        } by ${formatDuration(offsetSeconds)}.`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
        <CardDescription>
          How long until the next 2016-block retarget window closes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-sm text-muted-foreground">
            Estimated retarget
          </p>
          <p className="mt-1 text-xl font-semibold">
            {formatTimestamp(estimated)}
          </p>
          <Badge variant="outline" className="mt-2">
            {describeTimeUntil(estimated)}
          </Badge>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">
            Remaining time
          </p>
          <p className="mt-1 text-xl font-semibold">
            {formatDuration(remainingSeconds)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {offsetLabel}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">
            Next retarget height
          </p>
          <p className="mt-1 text-xl font-semibold">
            {data.nextRetargetHeight.toLocaleString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function PaceCard({ data }: { data: DifficultyAdjustment }) {
  const averageBlockTime = msToSeconds(data.timeAvg);
  const adjustedBlockTime = msToSeconds(data.adjustedTimeAvg);
  const minedBlocks = RETARGET_WINDOW_BLOCKS - data.remainingBlocks;
  const expectedBlocks = data.expectedBlocks ?? null;
  const blockDelta =
    expectedBlocks === null
      ? null
      : Math.round(minedBlocks - expectedBlocks);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Block Pace</CardTitle>
        <CardDescription>
          Are miners running faster or slower than the 10-minute target?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <p className="text-sm text-muted-foreground">
            Average block time
          </p>
          <p className="mt-1 text-xl font-semibold">
            {formatDuration(averageBlockTime)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Adjusted pace: {formatDuration(adjustedBlockTime)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">
            Blocks mined so far
          </p>
          <p className="mt-1 text-xl font-semibold">
            {minedBlocks.toLocaleString()} /{" "}
            {RETARGET_WINDOW_BLOCKS.toLocaleString()}
          </p>
          {typeof blockDelta === "number" && (
            <Badge
              variant={blockDelta < 0 ? "secondary" : "default"}
              className="mt-2"
            >
              {blockDelta > 0 ? "+" : ""}
              {blockDelta} blocks{" "}
              {blockDelta === 0
                ? "on pace"
                : blockDelta > 0
                  ? "ahead"
                  : "behind"}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <Card className="border-destructive/40 bg-destructive/5">
      <CardHeader>
        <CardTitle>Heads up</CardTitle>
        <CardDescription>
          Something went wrong while fetching the latest metrics.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-destructive">{message}</p>
      </CardContent>
    </Card>
  );
}

function SummarySkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-8 w-56 rounded-md" />
          <Skeleton className="h-6 w-40 rounded-full" />
        </div>
        <Skeleton className="h-4 w-72 rounded-md" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-border/80 bg-card/40 p-4"
            >
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="mt-3 h-7 w-24 rounded-md" />
              <Skeleton className="mt-2 h-4 w-40 rounded-md" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function buildSummaryStats(data: DifficultyAdjustment) {
  const minedBlocks = RETARGET_WINDOW_BLOCKS - data.remainingBlocks;

  return [
    {
      label: "Epoch progress",
      value: formatPercent(data.progressPercent),
      helper: `${minedBlocks.toLocaleString()} blocks mined`,
    },
    {
      label: "Forecast change",
      value: formatPercent(data.difficultyChange, true),
      helper: "Projected adjustment at the next retarget",
    },
    {
      label: "Remaining blocks",
      value: data.remainingBlocks.toLocaleString(),
      helper: `${RETARGET_WINDOW_BLOCKS.toLocaleString()} total in window`,
    },
    {
      label: "Remaining time",
      value: formatDuration(msToSeconds(data.remainingTime)),
      helper: describeTimeUntil(
        normalizeTimestamp(data.estimatedRetargetDate),
      ),
    },
    {
      label: "Next retarget height",
      value: data.nextRetargetHeight.toLocaleString(),
    },
    {
      label: "Previous change",
      value: formatPercent(data.previousRetarget, true),
      helper: data.previousTime
        ? `on ${formatDate(normalizeTimestamp(data.previousTime))}`
        : undefined,
    },
  ];
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
});

const shortDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatTimestamp(value: number) {
  return dateFormatter.format(new Date(value));
}

function formatDate(value: number) {
  return shortDateFormatter.format(new Date(value));
}

function formatPercent(value: number, withSign = false) {
  const formatted = value.toFixed(2);
  if (!withSign) {
    return `${formatted}%`;
  }
  return `${value > 0 ? "+" : ""}${formatted}%`;
}

function normalizeTimestamp(value: number) {
  return value < 10 ** 12 ? value * 1000 : value;
}

function msToSeconds(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return value / 1000;
}

const durationUnits = [
  { label: "d", seconds: 86_400 },
  { label: "h", seconds: 3_600 },
  { label: "m", seconds: 60 },
  { label: "s", seconds: 1 },
] as const;

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "—";
  }

  let remaining = Math.round(seconds);
  const parts: string[] = [];

  for (const unit of durationUnits) {
    if (remaining >= unit.seconds) {
      const value = Math.floor(remaining / unit.seconds);
      remaining -= value * unit.seconds;
      parts.push(`${value}${unit.label}`);
    }
    if (parts.length === 2) {
      break;
    }
  }

  if (parts.length === 0) {
    return "0s";
  }

  return parts.join(" ");
}

function describeTimeUntil(timestamp: number) {
  const diffSeconds = Math.round((timestamp - Date.now()) / 1000);

  if (diffSeconds > 0) {
    return `in ${formatDuration(diffSeconds)}`;
  }

  if (diffSeconds < 0) {
    return `${formatDuration(Math.abs(diffSeconds))} ago`;
  }

  return "right now";
}
