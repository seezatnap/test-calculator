type CheckStatus = "pass" | "fail";

export interface ArtifactValidation {
  readonly path: string;
  readonly present: boolean;
}

export interface PreflightInput {
  readonly currentBranch: string;
  readonly expectedBranch: string;
  readonly artifacts: ReadonlyArray<ArtifactValidation>;
  readonly runInputs: Readonly<Record<string, unknown>>;
  readonly requiredRunInputKeys: ReadonlyArray<string>;
}

export interface PreflightCheckResult {
  readonly name:
    | "branch-alignment"
    | "artifact-validation"
    | "run-input-validation";
  readonly status: CheckStatus;
  readonly details: string;
}

export interface PreflightReport {
  readonly passed: boolean;
  readonly checks: ReadonlyArray<PreflightCheckResult>;
  readonly requiredActions: ReadonlyArray<string>;
}

export type RecoveryStatus = "not-attempted" | "succeeded" | "failed";

export interface FailureTriageInput {
  readonly failingCommand: string;
  readonly shortError: string;
  readonly probableRootCause: string;
  readonly branch: string;
  readonly logPath: string;
  readonly recoveryStatus: RecoveryStatus;
}

export type FailureNextStep =
  | "attempt-safe-recovery"
  | "retry-command"
  | "request-human-review";

export interface FailureTriageDecision {
  readonly nextStep: FailureNextStep;
  readonly summary: string;
  readonly context: FailureTriageInput;
}

export type HumanReviewReason =
  | "branch-drift"
  | "artifact-mismatch"
  | "run-input-invalid"
  | "safe-recovery-failed";

export interface HumanReviewGateInput {
  readonly preflight: PreflightReport;
  readonly triage?: FailureTriageDecision;
}

export interface HumanReviewGateDecision {
  readonly requiresHumanReview: boolean;
  readonly reasons: ReadonlyArray<HumanReviewReason>;
}

export interface DeliveryRubricInput {
  readonly correctness: number;
  readonly safety: number;
  readonly traceability: number;
}

export interface DeliveryRubricScore {
  readonly correctness: number;
  readonly safety: number;
  readonly traceability: number;
  readonly total: number;
  readonly maxTotal: number;
  readonly pass: boolean;
}

const RUBRIC_MAX = {
  correctness: 5,
  safety: 3,
  traceability: 2
} as const;

export const DELIVERY_PASS_THRESHOLD = 8;

const PHASE_1_REQUIRED_ARTIFACT_PATHS = [
  ".morgan/source-files/01-phase1webglfoundation-instructions.md",
  "prds/phase-1-webgl-foundation-prd.md"
] as const;

const PHASE_1_RUN_INPUT_INTENT = {
  artifact: "Phase1WebGLFoundation",
  sourceBranch: "main",
  targetBranch: "feature/phase-1-webgl-foundation"
} as const;

export function runPreflightChecks(input: PreflightInput): PreflightReport {
  const checks: Array<PreflightCheckResult> = [];
  const requiredActions: Array<string> = [];

  const branchAligned = input.currentBranch === input.expectedBranch;
  checks.push({
    name: "branch-alignment",
    status: branchAligned ? "pass" : "fail",
    details: branchAligned
      ? `Current branch "${input.currentBranch}" matches expected branch.`
      : `Branch mismatch: current "${input.currentBranch}", expected "${input.expectedBranch}".`
  });

  if (!branchAligned) {
    requiredActions.push(
      "Stop execution and request branch clarification before continuing."
    );
  }

  const missingExpectedArtifactPaths = PHASE_1_REQUIRED_ARTIFACT_PATHS.filter(
    (requiredPath) =>
      !input.artifacts.some(
        (artifact) => artifact.path === requiredPath && artifact.present
      )
  );
  const artifactsValid = missingExpectedArtifactPaths.length === 0;
  checks.push({
    name: "artifact-validation",
    status: artifactsValid ? "pass" : "fail",
    details: artifactsValid
      ? `Validated ${PHASE_1_REQUIRED_ARTIFACT_PATHS.length} required Phase 1 artifact paths.`
      : `Missing required Phase 1 artifact paths: ${missingExpectedArtifactPaths.join(", ")}.`
  });

  if (!artifactsValid) {
    requiredActions.push(
      "Restore missing artifact files or correct path mappings before sprint launch."
    );
  }

  const requiredRunInputKeys = Array.from(
    new Set([...input.requiredRunInputKeys, ...Object.keys(PHASE_1_RUN_INPUT_INTENT)])
  );
  const invalidRunInputKeys = requiredRunInputKeys.filter(
    (key) => !isRunInputValid(input.runInputs[key])
  );
  const mismatchedIntentInputs = Object.entries(PHASE_1_RUN_INPUT_INTENT)
    .filter(([key, expectedValue]) => {
      const actualValue = input.runInputs[key];
      return isRunInputValid(actualValue) && actualValue !== expectedValue;
    })
    .map(
      ([key, expectedValue]) =>
        `${key} (expected "${expectedValue}", received "${String(input.runInputs[key])}")`
    );
  const runInputsValid =
    invalidRunInputKeys.length === 0 && mismatchedIntentInputs.length === 0;
  const runInputIssues = [...invalidRunInputKeys, ...mismatchedIntentInputs];

  checks.push({
    name: "run-input-validation",
    status: runInputsValid ? "pass" : "fail",
    details: runInputsValid
      ? `Validated ${requiredRunInputKeys.length} required run inputs.`
      : `Missing, invalid, or mismatched run inputs: ${runInputIssues.join(", ")}.`
  });

  if (!runInputsValid) {
    requiredActions.push("Provide explicit values for all required run inputs.");
  }

  return {
    passed: checks.every((check) => check.status === "pass"),
    checks,
    requiredActions
  };
}

export function triageFailure(
  input: FailureTriageInput
): FailureTriageDecision {
  switch (input.recoveryStatus) {
    case "not-attempted":
      return {
        nextStep: "attempt-safe-recovery",
        summary:
          "Capture context and execute one safe recovery attempt before requesting review.",
        context: input
      };
    case "succeeded":
      return {
        nextStep: "retry-command",
        summary:
          "Safe recovery succeeded; retry the original command and continue if it passes.",
        context: input
      };
    case "failed":
      return {
        nextStep: "request-human-review",
        summary:
          "Safe recovery failed; escalate with branch and log context for manual decision.",
        context: input
      };
    default: {
      const exhaustiveCheck: never = input.recoveryStatus;
      return exhaustiveCheck;
    }
  }
}

export function evaluateHumanReviewGate(
  input: HumanReviewGateInput
): HumanReviewGateDecision {
  const reasons: Array<HumanReviewReason> = [];

  for (const check of input.preflight.checks) {
    if (check.status === "pass") {
      continue;
    }

    if (check.name === "branch-alignment") {
      reasons.push("branch-drift");
      continue;
    }

    if (check.name === "artifact-validation") {
      reasons.push("artifact-mismatch");
      continue;
    }

    reasons.push("run-input-invalid");
  }

  if (input.triage?.nextStep === "request-human-review") {
    reasons.push("safe-recovery-failed");
  }

  return {
    requiresHumanReview: reasons.length > 0,
    reasons: uniqueReasons(reasons)
  };
}

export function scoreDeliveryRubric(
  input: DeliveryRubricInput
): DeliveryRubricScore {
  const correctness = clampScore(input.correctness, RUBRIC_MAX.correctness);
  const safety = clampScore(input.safety, RUBRIC_MAX.safety);
  const traceability = clampScore(input.traceability, RUBRIC_MAX.traceability);
  const total = correctness + safety + traceability;
  const maxTotal =
    RUBRIC_MAX.correctness + RUBRIC_MAX.safety + RUBRIC_MAX.traceability;

  return {
    correctness,
    safety,
    traceability,
    total,
    maxTotal,
    pass:
      total >= DELIVERY_PASS_THRESHOLD &&
      correctness >= 4 &&
      safety >= 2
  };
}

export function compareDeliveryScores(
  left: DeliveryRubricScore,
  right: DeliveryRubricScore
): number {
  if (left.total !== right.total) {
    return left.total - right.total;
  }

  if (left.correctness !== right.correctness) {
    return left.correctness - right.correctness;
  }

  if (left.safety !== right.safety) {
    return left.safety - right.safety;
  }

  return left.traceability - right.traceability;
}

function clampScore(value: number, max: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  if (value < 0) {
    return 0;
  }

  if (value > max) {
    return max;
  }

  return value;
}

function isRunInputValid(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (typeof value === "boolean") {
    return true;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "object") {
    return Object.keys(value).length > 0;
  }

  return false;
}

function uniqueReasons(
  reasons: ReadonlyArray<HumanReviewReason>
): ReadonlyArray<HumanReviewReason> {
  return Array.from(new Set(reasons));
}
