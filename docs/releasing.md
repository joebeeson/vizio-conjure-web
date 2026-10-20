# Releasing

The repository remains private and the package is not published to npm during
Milestone 1. A release tag is still useful for producing a reviewable package
archive and a GitHub release without exposing the package publicly.

1. Update the version in `package.json` and `package-lock.json`.
2. Run `npm run check`, `npm run test:coverage`, and `npm pack --dry-run`.
3. Create and push an annotated `vX.Y.Z` tag.
4. The release workflow validates the tag and attaches the `.tgz` package to a
   GitHub release.

When the package is ready to become public, remove `private`, configure npm
trusted publishing for this workflow, and add a separately reviewed publish
job. No npm token belongs in GitHub secrets or repository files for this
milestone.
