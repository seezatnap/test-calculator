export type CheckStatus = "pass" | "fail";

export type PreflightCheckId = "branch-alignment" | "artifact-validation" | "run-input-validation";

export interface ArtifactCheckInput {
  path: string;
  exists: boolean;
  hasContent: boolean;
}

export interface RunInputCheckInput {
  name: string;
  value: string | null | undefined;
}

export interface PreflightInput {
  currentBranch: string;
  expectedAgentBranch: string;
  expectedSprintBranch: string;
  artifacts: readonly ArtifactCheckInput[];
  runInputs: readonly RunInputCheckInput[];
}

export interface PreflightCheckResult {
  id: PreflightCheckId;
  status: CheckStatus;
  details: string;
  requiredOperatorAction: string | null;
}

export interface PreflightReport {
  status: CheckStatus;
  checks: readonly PreflightCheckResult[];
}

const pass = (id: PreflightCheckId, details: string): PreflightCheckResult => ({
  id,
  status: "pass",
  details,
  requiredOperatorAction: null,
});

const fail = (
  id: PreflightCheckId,
  details: string,
  requiredOperatorAction: string,
): PreflightCheckResult => ({
  id,
  status: "fail",
  details,
  requiredOperatorAction,
});

export const runPreflightChecks = (input: PreflightInput): PreflightReport => {
  const checks: PreflightCheckResult[] = [];

  const branchAligned =
    input.currentBranch === input.expectedAgentBranch && input.expectedSprintBranch.trim().length > 0;
  checks.push(
    branchAligned
      ? pass(
          "branch-alignment",
          `Branch alignment verified for ${input.currentBranch} against sprint ${input.expectedSprintBranch}.`,
        )
      : fail(
          "branch-alignment",
          `Expected ${input.expectedAgentBranch} with sprint ${input.expectedSprintBranch}, got ${input.currentBranch}.`,
          "Stop and request branch clarification before continuing.",
        ),
  );

  const invalidArtifacts = input.artifacts.filter((artifact) => !artifact.exists || !artifact.hasContent);
  checks.push(
    invalidArtifacts.length === 0
      ? pass("artifact-validation", `Validated ${input.artifacts.length} required artifacts.`)
      : fail(
          "artifact-validation",
          `Invalid artifacts: ${invalidArtifacts.map((artifact) => artifact.path).join(", ")}.`,
          "Stop and fix artifact/run-input availability before execution.",
        ),
  );

  const invalidRunInputs = input.runInputs.filter((runInput) => {
    const value = runInput.value;
    return typeof value !== "string" || value.trim().length === 0;
  });
  checks.push(
    invalidRunInputs.length === 0
      ? pass("run-input-validation", `Validated ${input.runInputs.length} run-input values.`)
      : fail(
          "run-input-validation",
          `Missing run-input values: ${invalidRunInputs.map((runInput) => runInput.name).join(", ")}.`,
          "Stop and provide explicit run-inputs before execution.",
        ),
  );

  return {
    status: checks.every((check) => check.status === "pass") ? "pass" : "fail",
    checks,
  };
};

export type FailureClass = "branch-drift" | "artifact-input" | "build-test" | "environment";

export interface FailureInput {
  failingCommand: string;
  shortError: string;
  probableRootCause: string;
  failureClass: FailureClass;
  safeRecoveryAttempted: boolean;
  safeRecoverySucceeded: boolean;
}

export interface FailureTriageReport {
  failureClass: FailureClass;
  nextAction: "continue" | "request-human-review";
  summary: string;
}

export const triageFailure = (input: FailureInput): FailureTriageReport => {
  if (!input.safeRecoveryAttempted) {
    return {
      failureClass: input.failureClass,
      nextAction: "continue",
      summary: `Attempt one safe recovery for "${input.failingCommand}" before escalation. Root cause: ${input.probableRootCause}.`,
    };
  }

  if (input.safeRecoverySucceeded) {
    return {
      failureClass: input.failureClass,
      nextAction: "continue",
      summary: `Safe recovery succeeded for "${input.failingCommand}" after "${input.shortError}".`,
    };
  }

  return {
    failureClass: input.failureClass,
    nextAction: "request-human-review",
    summary: `Safe recovery failed for "${input.failingCommand}". Request human review with branch and log context.`,
  };
};

export interface HumanReviewContext {
  unresolvedBranchMismatch: boolean;
  unresolvedArtifactMismatch: boolean;
  unresolvedSpecConflict: boolean;
  safeRecoveryFailed: boolean;
  destructiveOperationRequired: boolean;
  rubricTieRequiresJudgment: boolean;
}

export const shouldRequestHumanReview = (context: HumanReviewContext): boolean =>
  Object.values(context).some((value) => value);

export type RubricCriterion = "correctness" | "safety" | "traceability";

export interface RubricCriterionDefinition {
  criterion: RubricCriterion;
  maxPoints: number;
  description: string;
}

export const DELIVERY_RUBRIC: readonly RubricCriterionDefinition[] = [
  {
    criterion: "correctness",
    maxPoints: 5,
    description: "Implements requested behavior with no obvious regressions.",
  },
  {
    criterion: "safety",
    maxPoints: 3,
    description: "Handles branch/process failures safely and reports uncertainty.",
  },
  {
    criterion: "traceability",
    maxPoints: 2,
    description: "Decisions and outputs are inspectable with clear context.",
  },
];

export interface RubricScoreInput {
  correctness: number;
  safety: number;
  traceability: number;
}

export interface RubricScoreReport {
  byCriterion: Readonly<Record<RubricCriterion, number>>;
  total: number;
  maxTotal: number;
  pass: boolean;
  tieBreakOrder: readonly RubricCriterion[];
}

const clampScore = (score: number, maxScore: number): number =>
  Math.max(0, Math.min(score, maxScore));

export const scoreDeliveryRubric = (input: RubricScoreInput): RubricScoreReport => {
  const correctness = clampScore(input.correctness, 5);
  const safety = clampScore(input.safety, 3);
  const traceability = clampScore(input.traceability, 2);

  const byCriterion: Readonly<Record<RubricCriterion, number>> = {
    correctness,
    safety,
    traceability,
  };

  const total = correctness + safety + traceability;
  return {
    byCriterion,
    total,
    maxTotal: 10,
    pass: total >= 8 && correctness >= 4 && safety >= 2,
    tieBreakOrder: ["correctness", "safety"],
  };
};
