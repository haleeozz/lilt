# Lilt

A local-first prototype for consolidating Spotify playlists and library items into one account. Built from a real account migration; this repository contains no personal migration data.

Lilt reads source accounts and writes only to a configured destination. It never deletes source content. Playback, automatic folder organization, automatic privacy changes, source cleanup, and the original personal cover-generation workflow are outside this release.

## Requirements

- Node.js 22 or later. Python and third-party npm packages are not required.
- Your own Spotify developer application with Web API access.
- An active Premium subscription for the development app owner, and all participating accounts allowlisted in that app. Check the [current Spotify access requirements](https://developer.spotify.com/documentation/web-api/concepts/quota-modes).

## Setup

1. Create a Spotify developer app and register exactly `http://127.0.0.1:8889/callback` as its redirect URI. Select Web API. A client secret is not used: authentication uses PKCE.
2. Copy `.env.example` to `.env` and fill in your client ID, destination user ID and comma-separated source user IDs. User IDs are Spotify profile identifiers, not email addresses or display names. Target and sources must be distinct. The app supports one to four sources; Spotify's development-mode user cap still applies.
3. Run `npm start`. Open the local URL printed in the terminal. It contains a randomly generated local access key; keep the URL private.
4. Connect MAIN and each source using Spotify's login and authorization screens. Lilt checks that the authenticated ID matches the configured role. Sources receive read permissions only.
5. Read and accept the playlist visibility warning, then start the transfer. Existing liked songs remain saved. A report is written to `data/transfer-report.json`.

If changing the port, also change the redirect URI registered in Spotify. The default 8889 avoids colliding with another local application on 8888.

## Privacy and limitations

API playlist listing flags do not guarantee access privacy. Newly created copies may be public. **Set and verify playlist privacy in the Spotify app yourself.** Lilt requires consent before creating or adding playlist items. Descriptions carry a migration marker for recovery; do not edit those markers or copied playlist contents while resuming.

OAuth tokens stay in process memory. Local content snapshots and journals persist under `data/`, which is ignored by Git. They can contain personal listening and playlist information. Restarting the server requires reconnecting the accounts; keep the same account configuration and journal to resume the original migration. Use a separate private checkout/data directory for a different destination.

Read failures, unavailable/local tracks and missing permissions are recorded or stop the transfer. Public third-party lists whose contents cannot be read may be saved by reference rather than copied. A report with `complete: false` requires review; do not assume every item transferred. Some endpoints may be unavailable under your Spotify app's current access mode.

The tool verifies library additions and exact copied playlist order. If a committed batch loses its response, resuming reads the target first. If target contents diverge from the expected prefix, Lilt stops instead of replacing them.

`QUOTA_EXCEEDED` stops requests immediately. Ordinary rate-limit responses receive bounded retries honoring `Retry-After`; pauses over 60 seconds stop the operation. Spotify does not document a guaranteed quota reset time in the cited guide. A different client ID is not a supported quota workaround.

This is a personal-use prototype, not a hosted service or a promise of universal Spotify API access. Commercial deployment needs a separate assessment of Spotify access requirements and terms.

## Offline demo and verification

```sh
npm run demo
npm test
npm run check:release
```

The offline demo uses synthetic identifiers and builds a migration plan without network requests. Tests simulate lost responses, restart/resume behavior, edited targets, account identity mismatches and quota failures. Live Spotify integration has not been rerun on this generalized release because API quota was exhausted during the original migration.

## Publishing

Publish only this directory, never the original private work folder. See [release checklist](docs/release-checklist.md). The MIT license covers this project's code; Spotify's API and content remain governed by Spotify's terms.
