# Book Bot target policy

## Status

The book-discovery SNS bot must **not target @jellyfish.1619959 / にゃおん**.

jellyfish is now reserved for:
- oddly specific everyday Japan
- Japanese stationery and tools
- omiyage / packaging / shopping culture
- visitor micro-tips
- unusual Japanese products and services

Books, literature, authors, reading paths, and `books.antonbase.com` are explicitly outside the jellyfish character.

## Operational rule

- Scheduled live posting from this repository to jellyfish is disabled.
- GitHub Actions must remain preview-only until a different account is deliberately configured.
- Do not re-enable jellyfish as the default target just because old credentials or Gist state still exist.
- If this bot is revived, configure a dedicated book account first and then rewrite the persona for that account.

## Safety against accidental reuse

Any future agent working on this repository should treat historical jellyfish references as legacy configuration, not product intent.
