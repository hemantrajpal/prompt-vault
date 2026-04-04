# Contributing to Prompt Vault

Thank you for your interest in contributing! Prompt Vault is built on Google Apps Script and is beginner-friendly to contribute to.

## How to Contribute

### Reporting Bugs

1. **Search existing issues** first to avoid duplicates
2. Open a new issue using the **Bug Report** template
3. Include:
   - Steps to reproduce
   - Expected vs actual behaviour
   - Browser + device (especially for mobile issues)
   - Screenshot if relevant

### Suggesting Features

1. Open a **Feature Request** issue
2. Describe the problem it solves
3. If possible, describe how you'd expect it to work

### Submitting Code

1. **Fork** the repository
2. **Create a branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes** in the `src/` directory
4. **Test** by deploying to your own Apps Script project (see README setup guide)
5. **Commit** with a clear message:
   ```
   git commit -m "feat: add export to markdown"
   ```
6. **Push** and open a **Pull Request**

## Commit Message Convention

Use these prefixes:

| Prefix | When to use |
|--------|-------------|
| `feat:` | Adding a new feature |
| `fix:` | Fixing a bug |
| `docs:` | Documentation changes |
| `style:` | CSS / UI changes (no logic) |
| `refactor:` | Code restructuring without feature change |
| `chore:` | Dependency updates, build changes |

**Example:** `fix: prevent sidebar toggling on every mobile tap`

## Code Style

- **JavaScript**: Use `const`/`let`, arrow functions, template literals
- **CSS**: Follow the existing CSS variable system (`--bg`, `--fg`, `--primary`, etc.)
- **Google Apps Script**: Keep backend functions small and focused; always return `{ success: true }` or throw meaningful errors

## ⚠️ Security Rules

**Never commit:**
- API keys (Anthropic, etc.)
- Spreadsheet IDs
- Email addresses
- Any `Script Properties` values

All secrets belong in **Google Apps Script → Project Settings → Script Properties**.

## Development Setup

1. Follow the **Setup Guide** in the README
2. Deploy as a **Dev deployment** (not the production one) while testing
3. Use `console.log()` in `.gs` files — view output via **Apps Script → Executions**
4. Use browser DevTools for frontend debugging

## Questions?

Open a **Discussion** on GitHub or mention it in an issue.
