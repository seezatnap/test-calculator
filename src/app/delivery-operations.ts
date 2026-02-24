export type PreflightIssueCode =
  | "branch_mismatch"
  | "branch_drift"
  | "artifact_missing"
  | "run_input_missing";

export type PreflightIssueSeverity = "error" | "warning";

export interface BranchAlignmentCheck {
  readonly currentBranch: string;
  readonly expectedAgentBranch: string;
  readonly sprintBranch: string;
  readonly driftDetected: boolean;
}

export interface ArtifactRunInputCheck {
  readonly artifactName: string;
  readonly artifactPath: string;
  readonly exists: boolean;
  readonly runInputProvided: boolean;
}

export interface PreflightChecksInput {
  readonly branch: BranchAlignmentCheck;
  readonly artifacts: readonly ArtifactRunInputCheck[];
}

export interface PreflightIssue {
  readonly code: PreflightIssueCode;
  readonly severity: PreflightIssueSeverity;
  readonly message: string;
}

export interface PreflightCheckResult {
  readonly passed: boolean;
  readonly issues: readonly PreflightIssue[];
}

export function runPreflightChecks(
  input: PreflightChecksInput
): PreflightCheckResult {
  const issues: PreflightIssue[] = [];

  const currentBranch = input.branch.currentBranch.trim();
  const expectedAgentBranch = input.branch.expectedAgentBranch.trim();
  const sprintBranch = input.branch.sprintBranch.trim();

  if (currentBranch !== expectedAgentBranch) {
    issues.push({
      code: "branch_mismatch",
      severity: "error",
      message: `Current branch (${currentBranch}) does not match expected agent branch (${expectedAgentBranch}).`
    });
  }

  if (sprintBranch.length === 0) {
    issues.push({
      code: "branch_mismatch",
      severity: "error",
      message: "Sprint branch is missing."
    });
  }

  if (input.branch.driftDetected) {
    issues.push({
      code: "branch_drift",
      severity: "error",
      message:
        "Branch drift was detected. Stop and request branch clarification before continuing."
    });
  }

  for (const artifact of input.artifacts) {
    if (!artifact.exists) {
      issues.push({
        code: "artifact_missing",
        severity: "error",
        message: `Artifact missing: ${artifact.artifactName} (${artifact.artifactPath}).`
      });
      continue;
    }

    if (!artifact.runInputProvided) {
      issues.push({
        code: "run_input_missing",
        severity: "error",
        message: `Run-input is missing for artifact: ${artifact.artifactName}.`
      });
    }
  }

  const passed = !issues.some((issue) => issue.severity === "error");

  return {
    passed,
    issues
  };
}

export type FailureKind =
  | "branch_mismatch"
  | "artifact_validation_failed"
  | "validation_gate_failed"
  | "review_gate_blocked"
  | "rubric_below_threshold"
  | "unknown";

export type TriageOwner = "agent" | "human-reviewer" | "sprint-lead";

export interface FailureSignal {
  readonly kind: FailureKind;
  readonly summary: string;
}

export interface TriageStep {
  readonly owner: TriageOwner;
  readonly instruction: string;
  readonly blocking: boolean;
}

export interface FailureTriagePath {
  readonly kind: FailureKind;
  readonly escalated: boolean;
  readonly steps: readonly TriageStep[];
}

export function buildFailureTriagePath(signal: FailureSignal): FailureTriagePath {
  switch (signal.kind) {
    case "branch_mismatch":
      return {
        kind: signal.kind,
        escalated: true,
        steps: [
          {
            owner: "agent",
            instruction:
              "Stop implementation, capture `git status` + `git branch --show-current`, and attach mismatch details.",
            blocking: true
          },
          {
            owner: "human-reviewer",
            instruction:
              "Clarify the intended agent/sprint branch mapping and provide explicit branch correction guidance.",
            blocking: true
          },
          {
            owner: "agent",
            instruction: "Resume only after alignment is confirmed by reviewer.",
            blocking: true
          }
        ]
      };

    case "artifact_validation_failed":
      return {
        kind: signal.kind,
        escalated: false,
        steps: [
          {
            owner: "agent",
            instruction:
              "Re-run artifact and run-input checks; repair missing files or invalid run-input metadata.",
            blocking: true
          },
          {
            owner: "agent",
            instruction:
              "Re-run preflight and continue only when checks pass.",
            blocking: true
          }
        ]
      };

    case "validation_gate_failed":
      return {
        kind: signal.kind,
        escalated: false,
        steps: [
          {
            owner: "agent",
            instruction:
              "Fix the smallest failing lint/typecheck/build/test issue and rerun the exact failing command.",
            blocking: true
          },
          {
            owner: "agent",
            instruction:
              "Run the full validation gate once targeted failures are resolved.",
            blocking: true
          }
        ]
      };

    case "review_gate_blocked":
      return {
        kind: signal.kind,
        escalated: true,
        steps: [
          {
            owner: "human-reviewer",
            instruction:
              "Review blocked decision points and provide go/no-go direction.",
            blocking: true
          }
        ]
      };

    case "rubric_below_threshold":
      return {
        kind: signal.kind,
        escalated: true,
        steps: [
          {
            owner: "agent",
            instruction:
              "Identify rubric categories below threshold and produce corrective deltas.",
            blocking: true
          },
          {
            owner: "sprint-lead",
            instruction:
              "Confirm whether corrective work fits sprint scope or requires spillover.",
            blocking: true
          }
        ]
      };

    default:
      return {
        kind: signal.kind,
        escalated: true,
        steps: [
          {
            owner: "agent",
            instruction: "Capture full failure context and reproduction steps.",
            blocking: true
          },
          {
            owner: "human-reviewer",
            instruction: "Classify the unknown failure and assign a remediation owner.",
            blocking: true
          }
        ]
      };
  }
}

export interface HumanReviewGateInput {
  readonly preflightPassed: boolean;
  readonly branchDriftDetected: boolean;
  readonly specAmbiguityDetected: boolean;
  readonly unresolvedFailures: readonly FailureKind[];
  readonly rubricScorePercent: number;
}

export interface HumanReviewGateDecision {
  readonly decision: "continue" | "request-human-review";
  readonly reasons: readonly string[];
}

export const RUBRIC_REVIEW_THRESHOLD = 85;

export function evaluateHumanReviewDecisionGate(
  input: HumanReviewGateInput
): HumanReviewGateDecision {
  const reasons: string[] = [];

  if (!input.preflightPassed) {
    reasons.push("Preflight checks failed.");
  }

  if (input.branchDriftDetected) {
    reasons.push("Branch drift is present.");
  }

  if (input.specAmbiguityDetected) {
    reasons.push("Spec ambiguity requires explicit human direction.");
  }

  if (input.unresolvedFailures.length > 0) {
    reasons.push(
      `Unresolved failures remain: ${input.unresolvedFailures.join(", ")}.`
    );
  }

  if (input.rubricScorePercent < RUBRIC_REVIEW_THRESHOLD) {
    reasons.push(
      `Rubric score (${input.rubricScorePercent}) is below threshold (${RUBRIC_REVIEW_THRESHOLD}).`
    );
  }

  if (reasons.length > 0) {
    return {
      decision: "request-human-review",
      reasons
    };
  }

  return {
    decision: "continue",
    reasons
  };
}

export interface SprintRubricWeights {
  readonly preflightOperations: number;
  readonly triageReadiness: number;
  readonly moduleContracts: number;
  readonly validationEvidence: number;
  readonly handoffQuality: number;
}

export interface SprintRubricScores {
  readonly preflightOperations: number;
  readonly triageReadiness: number;
  readonly moduleContracts: number;
  readonly validationEvidence: number;
  readonly handoffQuality: number;
}

export interface SprintRubricResult {
  readonly weightedScorePercent: number;
  readonly band: "excellent" | "pass" | "needs-work";
  readonly winnerEligible: boolean;
}

export const DEFAULT_SPRINT_RUBRIC_WEIGHTS: SprintRubricWeights = {
  preflightOperations: 20,
  triageReadiness: 20,
  moduleContracts: 25,
  validationEvidence: 20,
  handoffQuality: 15
};

const RUBRIC_KEYS: readonly (keyof SprintRubricScores)[] = [
  "preflightOperations",
  "triageReadiness",
  "moduleContracts",
  "validationEvidence",
  "handoffQuality"
];

function assertScoreInRange(score: number, key: keyof SprintRubricScores): void {
  if (score < 0 || score > 5) {
    throw new RangeError(`${key} score must be between 0 and 5.`);
  }
}

function sumWeights(weights: SprintRubricWeights): number {
  return (
    weights.preflightOperations +
    weights.triageReadiness +
    weights.moduleContracts +
    weights.validationEvidence +
    weights.handoffQuality
  );
}

export function scoreSprintRubric(
  scores: SprintRubricScores,
  weights: SprintRubricWeights = DEFAULT_SPRINT_RUBRIC_WEIGHTS
): SprintRubricResult {
  const totalWeight = sumWeights(weights);

  if (totalWeight !== 100) {
    throw new RangeError("Rubric weights must sum to 100.");
  }

  let weightedScore = 0;
  let minimumCategoryScore = Number.POSITIVE_INFINITY;

  for (const key of RUBRIC_KEYS) {
    const score = scores[key];
    const weight = weights[key];

    assertScoreInRange(score, key);

    minimumCategoryScore = Math.min(minimumCategoryScore, score);
    weightedScore += (score / 5) * weight;
  }

  const weightedScorePercent = Math.round(weightedScore * 100) / 100;

  let band: SprintRubricResult["band"];

  if (weightedScorePercent >= 90) {
    band = "excellent";
  } else if (weightedScorePercent >= 75) {
    band = "pass";
  } else {
    band = "needs-work";
  }

  return {
    weightedScorePercent,
    band,
    winnerEligible:
      weightedScorePercent >= RUBRIC_REVIEW_THRESHOLD && minimumCategoryScore >= 4
  };
}
