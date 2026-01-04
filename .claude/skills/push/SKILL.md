---
name: push
description: Smart git push with automatic staging and contextual commit messages. Use when user wants to push changes, commit code, save to git, or push to repository.
---

# Smart Git Push

## Instructions

Perform an intelligent git push workflow:

1. Run `git status` to see all changes
2. Stage all changes with `git add .`
3. Generate a contextual commit message based on the changes
4. Commit with the generated message
5. Push to the current branch
6. Confirm success

## Commit Message Generation

Analyze the changes and create a concise, descriptive commit message:
- Start with a verb (Add, Update, Fix, Refactor, etc.)
- Be specific about what changed
- Keep it under 72 characters for the first line
- Include the required co-author footer:

```
[Commit message]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

## Workflow Steps

1. `git status` - Review what's changed
2. `git add .` - Stage all changes
3. Generate commit message based on file changes
4. `git commit -m "[message]"` using HEREDOC format
5. `git push` to current branch
6. Show push result

## Safety Checks

- Verify we're not on a protected branch without explicit confirmation
- Ensure there are actually changes to commit
- Confirm remote repository exists
- Verify push succeeded

## Commit Message Examples

- "Add launch-hq, new-app, and check-apps skills"
- "Fix Portfolio app port configuration"
- "Update HQ to include Assistant application"
- "Refactor ChromeBot into modular structure"

## Example Triggers

- "Push my changes"
- "Commit and push"
- "Push to git"
- "Save these changes"

## Expected Output

Show the user:
1. What files changed
2. The commit message used
3. Confirmation that push succeeded
4. Current branch and remote status
