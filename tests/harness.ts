type TestCase = {
  name: string;
  run: () => void;
};

const tests: TestCase[] = [];

export function registerTest(name: string, run: () => void): void {
  tests.push({ name, run });
}

export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message} (expected ${String(expected)}, got ${String(actual)})`);
  }
}

export function runAllTests(): void {
  let failed = 0;

  for (const test of tests) {
    try {
      test.run();
      console.log(`PASS ${test.name}`);
    } catch (error) {
      failed += 1;
      const reason = error instanceof Error ? error.message : String(error);
      console.error(`FAIL ${test.name}: ${reason}`);
    }
  }

  if (failed > 0) {
    throw new Error(`${failed} test(s) failed.`);
  }

  console.log(`PASS ${tests.length} test(s) total.`);
}
