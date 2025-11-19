# GitHub Publishing Checklist

Before pushing to GitHub:

## Security ✅

- [x] Private keys excluded from git (*.json in .gitignore)
- [x] No hardcoded secrets in code
- [x] Token addresses moved to config.ts
- [ ] Remove any personal wallet addresses from code
- [ ] Review all files for sensitive info

## Code Quality

- [ ] Run tests: `anchor test`
- [ ] Check for linter errors
- [ ] Remove console.logs from production code
- [ ] Update all TODOs

## Documentation

- [x] Updated README.md with:
  - [x] Project description
  - [x] Installation instructions
  - [x] Deployment guide
  - [x] Usage examples
- [x] Example config files created
- [ ] Add LICENSE file
- [ ] Add CONTRIBUTING.md (optional)

## Configuration

- [x] config.ts for frontend settings
- [x] test-tokens.example.json for reference
- [ ] Update config.ts with placeholder values
- [ ] Add .env.example if using environment variables

## Cleanup

- [x] Remove old backup files (*.old)
- [x] Remove duplicate components
- [ ] Remove unused dependencies
- [ ] Clear test-tokens.json (or add to .gitignore)
- [ ] Remove personal data from git history

## Files to Verify

```bash
# Check what will be committed
git status

# Check for private keys
find . -name "*keypair*.json" -o -name "*-key.json"

# Check for hardcoded addresses
grep -r "asuav" --exclude-dir=node_modules .
```

## Before First Commit

```bash
# Make sure .gitignore is committed first
git add .gitignore
git commit -m "Add comprehensive .gitignore"

# Then add everything else
git add .
git status  # Review what will be committed
git commit -m "Initial commit: Solana token swap escrow"
```

## After Publishing

- Add GitHub topics: solana, anchor, web3, defi, typescript
- Add a nice banner image/logo
- Create issues for known TODOs
- Set up GitHub Actions for CI/CD (optional)

