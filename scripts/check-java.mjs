// Preflight for the Firebase-emulator scripts (AUDIT.md P2-18). firebase-tools
// refuses any Java < 21 with an opaque crash; this fails first with a clear
// message. Wired as `pretest:rules` / `preemulators` in package.json.
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

// firebase-tools resolves Java from JAVA_HOME first, then PATH — mirror that.
const javaBin = process.env.JAVA_HOME ? join(process.env.JAVA_HOME, 'bin', 'java') : 'java';

function parseMajor(text) {
  // `java -version` prints e.g. `openjdk version "21.0.11"` or `"1.8.0_492"`.
  const m = text.match(/version "(\d+)(?:\.(\d+))?/);
  if (!m) return null;
  const major = Number(m[1]);
  return major === 1 && m[2] ? Number(m[2]) : major; // "1.8" -> 8
}

const res = spawnSync(javaBin, ['-version'], { encoding: 'utf8' });
if (res.error) {
  if (res.error.code === 'ENOENT') {
    console.error('\n✗ Java was not found on PATH. The Firebase emulator suite needs JDK 21+.');
    console.error('  See RUNBOOK.md section 6.\n');
    process.exit(1);
  }
  console.warn(`⚠ Could not run java (${res.error.code}); letting firebase-tools decide.`);
  process.exit(0);
}

// The version banner goes to stderr on every JDK; stdout as a fallback.
const major = parseMajor(`${res.stderr || ''}${res.stdout || ''}`);
if (major == null) {
  console.warn('⚠ Could not read a Java version; letting firebase-tools decide.');
  process.exit(0);
}
if (major < 21) {
  console.error(`\n✗ Java ${major} detected — firebase-tools needs JDK 21+.`);
  console.error('  Point JAVA_HOME at a 21+ JDK, e.g. on macOS:');
  console.error('    export JAVA_HOME=$(/usr/libexec/java_home -v 21)');
  console.error('  See RUNBOOK.md section 6.\n');
  process.exit(1);
}
