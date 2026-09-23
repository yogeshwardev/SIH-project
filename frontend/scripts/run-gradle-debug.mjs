import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const androidDir = join(frontendDir, 'android');

function supportedJava(home) {
  if (!home || !existsSync(join(home, 'release'))) return false;
  const release = readFileSync(join(home, 'release'), 'utf8');
  const major = Number(release.match(/JAVA_VERSION="(?:1\.)?(\d+)/)?.[1]);
  return major >= 17 && major <= 24;
}

const candidates = process.platform === 'win32'
  ? [process.env.JAVA_HOME, 'C:\\Program Files\\Java\\jdk-21', 'C:\\Program Files\\Java\\jdk-17', 'C:\\Program Files\\Android\\Android Studio\\jbr']
  : [process.env.JAVA_HOME, '/usr/lib/jvm/java-21-openjdk', '/usr/lib/jvm/java-17-openjdk'];
const javaHome = candidates.find(supportedJava);

if (!javaHome) {
  console.error('Android build requires JDK 17–24. Install JDK 21 or set JAVA_HOME to a supported JDK.');
  process.exit(1);
}

console.log(`Android build: using ${javaHome}`);
const command = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
const result = spawnSync(command, ['assembleDebug'], {
  cwd: androidDir,
  env: { ...process.env, JAVA_HOME: javaHome, PATH: `${join(javaHome, 'bin')}${process.platform === 'win32' ? ';' : ':'}${process.env.PATH || ''}` },
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
