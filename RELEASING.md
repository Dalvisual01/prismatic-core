# Release guide

How to publish a new version of `@prismatic/core` for git-based consumers.

## Prerequisites

- Write access to [Dalvisual01/prismatic-core](https://github.com/Dalvisual01/prismatic-core)
- `gh` CLI logged in (`gh auth status`)
- Node.js and npm installed

## Versioning

Use [semver](https://semver.org/):

| Change type | Bump example |
|-------------|--------------|
| Breaking API / behavior | `0.1.0` → `0.2.0` (or `1.0.0` when stable) |
| New feature, backward compatible | `0.1.0` → `0.2.0` |
| Bug fix only | `0.1.0` → `0.1.1` |

Tags must match `package.json` version exactly: `v0.1.1` for `"version": "0.1.1"`.

## Release checklist

### 1. Finish changes on `main`

```bash
cd prismatic-core
git checkout main
git pull origin main
```

### 2. Bump version

Edit `package.json`:

```json
"version": "0.1.1"
```

### 3. Update changelog

Add a section to `CHANGELOG.md`:

```markdown
## 0.1.1 — YYYY-MM-DD

### Fixed
- …

### Added
- …
```

### 4. Build and verify

```bash
npm install
npm run build
```

`dist/` must be committed — git consumers install pre-built output and do not compile the library themselves.

Smoke-test locally in a consumer app:

```json
"@prismatic/core": "file:../prismatic-core"
```

Or point at your branch before tagging.

### 5. Commit

```bash
git add package.json CHANGELOG.md dist/
git commit -m "Release v0.1.1"
```

Include any source changes from the same release in this commit or prior commits on `main`.

### 6. Tag and push

```bash
git push origin main
git tag v0.1.1
git push origin v0.1.1
```

Always push the tag. Consumers pin `#v0.1.1` — without the tag, `npm install` resolves unpredictably.

Verify on GitHub: **Releases** or **Tags** should show `v0.1.1`.

### 7. Update consuming apps

In each app (e.g. pic-stretch), bump the dependency:

```json
"@prismatic/core": "github:Dalvisual01/prismatic-core#v0.1.1"
```

Then reinstall:

```bash
rm -rf node_modules/@prismatic
npm install
npm run build
```

Commit the updated `package.json` and `package-lock.json` in the app repo.

## Local development (no release)

Link the library without publishing:

```json
"@prismatic/core": "file:../prismatic-core"
```

After library changes:

```bash
cd prismatic-core && npm run build
cd ../pic-stretch && npm run dev
```

## Do not

- Pin production apps to `#main` or a branch name — use semver tags only
- Skip committing `dist/` — git installs need compiled JS + `.d.ts`
- Reuse or move an existing tag — delete and recreate only if no one has installed it yet
- Forget to bump `package.json` and the git tag together

## Optional: GitHub Release notes

Create a release with notes (optional, tags alone are enough for npm git deps):

```bash
gh release create v0.1.1 --title "v0.1.1" --notes-file CHANGELOG.md
```

## Future: npm publish

When ready to publish to npm, the same build applies. Add to `package.json` publishConfig if using a scope, then:

```bash
npm publish --access public
```

Consumers switch from:

```json
"github:Dalvisual01/prismatic-core#v0.1.1"
```

to:

```json
"@prismatic/core": "^0.1.1"
```

API and `dist/` layout stay the same.
