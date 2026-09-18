# Release checklist

Prepared locally as version 0.1.0; GitHub publication has not happened.

- [x] Separate release directory with configurable account identities.
- [x] No copied sessions, snapshots, OAuth tokens, journals, listening history or personal playlist covers.
- [x] PKCE authentication; no client secret requirement.
- [x] Manual transfer start and explicit visibility warning.
- [x] Source read-only policy; no deletion or source cleanup in this release.
- [x] Offline demo, meaningful transfer recovery tests and setup instructions.
- [ ] Rerun live integration when Spotify API access is available, or clearly retain the experimental label.
- [ ] Before every push, run tests and release scan; review Git staging and history as well as working files.
- [ ] Choose GitHub repository owner/name and publish this directory only.

The generic release scanner flags common secret formats and private runtime artifacts. It is a guardrail, not proof that arbitrary files are safe. Initial preparation also checks against the original project's actual identifiers and access keys locally, without including them in the release.

Suggested repository name: `lilt`. Suggested description: `A local-first Spotify account consolidation prototype with verified, resumable transfers.`

License: MIT for the project code. Generated sample identifiers are synthetic. No Spotify music files or album artwork are distributed.
