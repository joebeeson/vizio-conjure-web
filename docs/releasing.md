# Releasing

Releases use npm Trusted Publishing. The repository and package must be public
for provenance, and the workflow has `id-token: write` without an npm token.

1. Update the version in `package.json` and `package-lock.json`.
2. Run `npm run check`, `npm run test:coverage`, and `npm pack --dry-run`.
3. Configure npm Trusted Publishing for `joebeeson/vizio-conjure-web` and
   `.github/workflows/release.yml`.
4. Create and push an annotated `vX.Y.Z` tag.
5. The release workflow validates the tag, publishes with provenance (`next`
   for prereleases), and attaches the `.tgz` to a GitHub release.

No npm token belongs in GitHub secrets or repository files.
