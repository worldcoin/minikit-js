/**
 * Security research canary — HackerOne report #3943957 (Tools for Humanity)
 *
 * Purpose: verify whether fork-PR CI runs execute on self-hosted runners
 * without maintainer approval (GitHub "first-time contributor" default mode).
 *
 * This file is intentionally benign:
 *   - No network access (loopback only)
 *   - No secret access, no env exfiltration, no writes outside tmp
 *   - Prints only non-sensitive host metadata for run-log matching
 */
import { execSync } from 'child_process';

describe('CI canary (HackerOne #3943957)', () => {
  it('logs non-sensitive host metadata to the run log', () => {
    const marker = `CANARY-${process.env.GITHUB_RUN_ID ?? 'local'}-${Date.now()}`;
    const info = execSync(
      'echo "$marker host=$(uname -n) kernel=$(uname -r) arch=$(uname -m) runner=$RUNNER_NAME group=$RUNNER_GROUP"',
      { encoding: 'utf8' },
    ).trim();
    console.log(`[CANARY] ${info}`);
    expect(info).toContain('CANARY-');
  });
});

