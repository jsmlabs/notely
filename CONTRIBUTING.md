# Contributing

Thanks for your interest in Notely. Before starting, open an issue to discuss a proposed change. **No open-source license is currently granted**: permission to view a repository does not by itself grant rights to redistribute or reuse its code. The repository owner should explicitly select a license/contribution policy before accepting outside code contributions.

## Local checks

```bash
npm run check
npm test
npm run audit:release
```

Keep changes small and focused. Preserve the Manifest V3 permission set, the `notely.notes.v1` key, existing persisted note formats, and backup compatibility unless a migration is specified. Tests must exercise user-observable behavior, including negative and repeated-interaction cases. Do not claim installed Chrome runtime coverage based on mocked storage tests.

## Pull requests

Explain the problem, reproduce steps, code changes, tests actually run, and remaining host-specific verification. Do not commit credentials, user notes, backups, wallet secrets or `.pem` extension keys. Use a feature branch and request review; avoid force-pushing shared branches.
