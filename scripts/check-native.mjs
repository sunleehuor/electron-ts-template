import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

// read package.json dependencies only (not devDependencies)
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const dependencies = Object.keys(pkg.dependencies ?? {});

console.log('\n🔍 Checking native modules in dependencies only...\n');

const native = [];
const pureJs = [];

for (const dep of dependencies) {
  const depPath = join('node_modules', dep);
  const gypFile = join(depPath, 'binding.gyp');
  const buildDir = join(depPath, 'build', 'Release');
  const pkgJson = join(depPath, 'package.json');

  // check 1 — binding.gyp exists
  if (existsSync(gypFile)) {
    native.push({ name: dep, reason: 'binding.gyp found' });
    continue;
  }

  // check 2 — .node file in build/Release
  if (existsSync(buildDir)) {
    const files = readdirSync(buildDir);
    const nodeFile = files.find((f) => f.endsWith('.node'));
    if (nodeFile) {
      native.push({ name: dep, reason: `${nodeFile} found` });
      continue;
    }
  }

  // check 3 — gypfile: true in package.json
  if (existsSync(pkgJson)) {
    const depPkg = JSON.parse(readFileSync(pkgJson, 'utf-8'));
    if (depPkg.gypfile === true) {
      native.push({ name: dep, reason: 'gypfile: true in package.json' });
      continue;
    }
  }

  pureJs.push(dep);
}

// results
if (native.length) {
  console.log('🔴 Native modules (need rebuild + asarUnpack):');
  native.forEach(({ name, reason }) => {
    console.log(`   ${name} ← ${reason}`);
  });
} else {
  console.log('✅ No native modules found in dependencies');
}

console.log(`\n🟢 Pure JS modules (${pureJs.length} total) — no action needed`);
console.log('\n📋 Suggested build config:');

if (native.length) {
  const asarUnpack = native.map(({ name }) => `"node_modules/${name}/**"`);
  const files = native.map(({ name }) => `"node_modules/${name}/**"`);

  console.log(`
"build": {
  "npmRebuild": true,
  "asarUnpack": [
    "node_modules/**/*.node",
    ${asarUnpack.join(',\n    ')}
  ],
  "files": [
    "dist/electron/**/*",
    "package.json",
    ${files.join(',\n    ')}
  ]
}`);
} else {
  console.log(`
"build": {
  "npmRebuild": false,
  "files": [
    "dist/electron/**/*",
    "package.json"
  ]
}`);
}

console.log('');
