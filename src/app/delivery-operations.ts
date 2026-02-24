export type PreflightCheckId =
  | "branch-alignment"
  | "artifact-validation"
  | "run-input-validation";

export type IssueSeverity = "warning" | "error";

export interface PreflightIssue {
  checkId: PreflightCheckId;
  severity: IssueSeverity;
  code: string;
  message: string;
  requiresHumanReview: boolean;
}

export interface BranchAlignmentCheck {
  expectedSourceBranch: string;
  expectedTargetBranch: string;
  actualSourceBranch: string;
  actualTargetBranch: string;
}

export interface ArtifactValidationInput {
  name: string;
  path: string;
  exists: boolean;
  valid: boolean;
  details?: string;
}

export interface RunInputValidationInput {
  name: string;
  provided: boolean;
  valid: boolean;
  details?: string;
}

export interface PreflightCheckInput {
  branchAlignment: BranchAlignmentCheck;
  artifacts: readonly ArtifactValidationInput[];
  runInputs: readonly RunInputValidationInput[];
  checkedAtIso?: string;
}

export interface PreflightReport {
  status: "pass" | "fail";
  issues: readonly PreflightIssue[];
  checkedAtIso: string;
}

const buildIssue = (
  checkId: PreflightCheckId,
  code: string,
  message: string,
  severity: IssueSeverity = "error",
  requiresHumanReview = false
): PreflightIssue => ({
  checkId,
  severity,
  code,
  message,
  requiresHumanReview
});

export const runPreflightChecks = (input: PreflightCheckInput): PreflightReport => {
  const issues: PreflightIssue[] = [];
  const { branchAlignment } = input;

  if (branchAlignment.expectedSourceBranch !== branchAlignment.actualSourceBranch) {
    issues.push(
      buildIssue(
        "branch-alignment",
        "BRANCH_SOURCE_MISMATCH",
        `Expected source branch "${branchAlignment.expectedSourceBranch}" but got "${branchAlignment.actualSourceBranch}".`,
        "error",
        true
      )
    );
  }

  if (branchAlignment.expectedTargetBranch !== branchAlignment.actualTargetBranch) {
    issues.push(
      buildIssue(
        "branch-alignment",
        "BRANCH_TARGET_MISMATCH",
        `Expected target branch "${branchAlignment.expectedTargetBranch}" but got "${branchAlignment.actualTargetBranch}".`,
        "error",
        true
      )
    );
  }

  for (const artifact of input.artifacts) {
    if (!artifact.exists) {
      issues.push(
        buildIssue(
          "artifact-validation",
          "ARTIFACT_MISSING",
          `Required artifact "${artifact.name}" is missing at ${artifact.path}.`
        )
      );
      continue;
    }

    if (!artifact.valid) {
      const detailsSuffix = artifact.details !== undefined ? ` (${artifact.details})` : "";
      issues.push(
        buildIssue(
          "artifact-validation",
          "ARTIFACT_INVALID",
          `Artifact "${artifact.name}" failed validation at ${artifact.path}${detailsSuffix}.`
        )
      );
    }
  }

  for (const runInput of input.runInputs) {
    if (!runInput.provided) {
      issues.push(
        buildIssue(
          "run-input-validation",
          "RUN_INPUT_MISSING",
          `Run input "${runInput.name}" is required but was not provided.`
        )
      );
      continue;
    }

    if (!runInput.valid) {
      const detailsSuffix = runInput.details !== undefined ? ` (${runInput.details})` : "";
      issues.push(
        buildIssue(
          "run-input-validation",
          "RUN_INPUT_INVALID",
          `Run input "${runInput.name}" failed validation${detailsSuffix}.`
        )
      );
    }
  }

  return {
    status: issues.length === 0 ? "pass" : "fail",
    issues,
    checkedAtIso: input.checkedAtIso ?? new Date().toISOString()
  };
};

export type TriageStage =
  | "proceed"
  | "branch-clarification"
  | "repair-artifacts"
  | "repair-run-inputs"
  | "rerun-preflight"
  | "request-human-review";

export interface TriageStep {
  order: number;
  stage: TriageStage;
  owner: "agent" | "human";
  rationale: string;
}

export const buildFailureTriagePath = (report: PreflightReport): readonly TriageStep[] => {
  if (report.status === "pass") {
    return [
      {
        order: 1,
        stage: "proceed",
        owner: "agent",
        rationale: "All preflight checks passed."
      }
    ];
  }

  const steps: TriageStep[] = [];
  const hasBranchIssues = report.issues.some((issue) => issue.checkId === "branch-alignment");
  const hasArtifactIssues = report.issues.some((issue) => issue.checkId === "artifact-validation");
  const hasRunInputIssues = report.issues.some(
    (issue) => issue.checkId === "run-input-validation"
  );

  if (hasBranchIssues) {
    steps.push({
      order: steps.length + 1,
      stage: "branch-clarification",
      owner: "human",
      rationale:
        "Branch alignment drift detected. Stop execution and ask for branch clarification."
    });
  }

  if (hasArtifactIssues) {
    steps.push({
      order: steps.length + 1,
      stage: "repair-artifacts",
      owner: "agent",
      rationale: "Repair or regenerate missing/invalid artifacts."
    });
  }

  if (hasRunInputIssues) {
    steps.push({
      order: steps.length + 1,
      stage: "repair-run-inputs",
      owner: "agent",
      rationale: "Fix missing or invalid run-input values."
    });
  }

  steps.push({
    order: steps.length + 1,
    stage: "rerun-preflight",
    owner: "agent",
    rationale: "Re-run preflight checks before continuing."
  });

  if (hasBranchIssues || report.issues.some((issue) => issue.requiresHumanReview)) {
    steps.push({
      order: steps.length + 1,
      stage: "request-human-review",
      owner: "human",
      rationale: "Human review gate is required before launch."
    });
  }

  return steps;
};

export interface HumanReviewGateInput {
  preflightReport: PreflightReport;
  triageAttempts: number;
  rubricResult?: SprintRubricResult;
}

export interface HumanReviewGateResult {
  requiresHumanReview: boolean;
  decision: "proceed" | "review-required";
  reasons: readonly string[];
}

export const evaluateHumanReviewGate = (
  input: HumanReviewGateInput
): HumanReviewGateResult => {
  const reasons: string[] = [];
  const hasBranchIssues = input.preflightReport.issues.some(
    (issue) => issue.checkId === "branch-alignment"
  );

  if (hasBranchIssues) {
    reasons.push("Branch mismatch requires explicit human branch clarification.");
  }

  if (input.preflightReport.issues.some((issue) => issue.requiresHumanReview)) {
    reasons.push("At least one preflight issue is flagged for human review.");
  }

  if (input.preflightReport.status === "fail" && input.triageAttempts >= 2) {
    reasons.push("Automated triage reached retry limit (2 attempts) with unresolved failures.");
  }

  if (input.rubricResult !== undefined && input.rubricResult.outcome !== "pass") {
    reasons.push(
      `End-of-sprint rubric outcome "${input.rubricResult.outcome}" requires reviewer sign-off.`
    );
  }

  if (reasons.length === 0) {
    return {
      requiresHumanReview: false,
      decision: "proceed",
      reasons
    };
  }

  return {
    requiresHumanReview: true,
    decision: "review-required",
    reasons
  };
};

export type RubricCategory =
  | "preflightChecks"
  | "triagePath"
  | "humanGate"
  | "typedModuleBoundaries"
  | "validationAndTests";

export type RubricScores = Record<RubricCategory, number>;

export const END_OF_SPRINT_RUBRIC_WEIGHTS: Readonly<Record<RubricCategory, number>> =
  Object.freeze({
    preflightChecks: 0.25,
    triagePath: 0.2,
    humanGate: 0.15,
    typedModuleBoundaries: 0.25,
    validationAndTests: 0.15
  });

export interface RubricBreakdownItem {
  category: RubricCategory;
  rawScore: number;
  weight: number;
  weightedContribution: number;
}

export interface SprintRubricResult {
  weightedScore: number;
  maxScore: number;
  percentage: number;
  outcome: "pass" | "conditional" | "fail";
  breakdown: readonly RubricBreakdownItem[];
}

const round = (value: number, precision: number): number => Number(value.toFixed(precision));

const assertRubricScore = (category: RubricCategory, score: number): void => {
  if (!Number.isFinite(score) || score < 0 || score > 5) {
    throw new RangeError(`Rubric score for "${category}" must be between 0 and 5.`);
  }
};

export const scoreEndOfSprintRubric = (scores: RubricScores): SprintRubricResult => {
  const categories = Object.keys(END_OF_SPRINT_RUBRIC_WEIGHTS) as RubricCategory[];
  const breakdown: RubricBreakdownItem[] = [];
  let weightedScore = 0;

  for (const category of categories) {
    const rawScore = scores[category];
    assertRubricScore(category, rawScore);
    const weight = END_OF_SPRINT_RUBRIC_WEIGHTS[category];
    const weightedContribution = rawScore * weight;
    weightedScore += weightedContribution;
    breakdown.push({
      category,
      rawScore,
      weight,
      weightedContribution: round(weightedContribution, 4)
    });
  }

  const maxScore = 5;
  const percentage = round((weightedScore / maxScore) * 100, 2);
  const outcome: SprintRubricResult["outcome"] =
    percentage >= 85 ? "pass" : percentage >= 70 ? "conditional" : "fail";

  return {
    weightedScore: round(weightedScore, 4),
    maxScore,
    percentage,
    outcome,
    breakdown
  };
};
