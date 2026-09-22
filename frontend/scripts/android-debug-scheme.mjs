/**
 * The debug APK talks to a plain-HTTP API on the developer's machine
 * (http://10.0.2.2:8000). Capacitor serves the app from https://localhost by
 * default, and from that secure origin the WebView blocks every product photo
 * on the HTTP host as mixed content — the catalogue loads with no pictures.
 *
 * A release build points at an HTTPS deployment, where https://localhost is
 * both correct and necessary, so capacitor.config.json keeps it. This script
 * rewrites only the copy Gradle bundles into the debug APK, after `cap sync`
 * has written it and before `assembleDebug` packages it.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const bundled = 'android/app/src/main/assets/capacitor.config.json';
const config = JSON.parse(readFileSync(bundled, 'utf8'));

config.server = { ...config.server, androidScheme: 'http', cleartext: true };
config.android = { ...config.android, allowMixedContent: true };

writeFileSync(bundled, `${JSON.stringify(config, null, 2)}\n`);
console.log('debug build: app served from http://localhost, same scheme as the dev API');
