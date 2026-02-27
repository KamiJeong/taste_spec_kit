# Telegram Bot Template for Codex Issue Updates

Use this template to connect GitHub issue progress events to Telegram notifications.

## 1) Create Telegram Bot

1. Open Telegram and start chat with `@BotFather`.
2. Run `/newbot`.
3. Save the bot token (format: `123456:ABC...`).

## 2) Get Chat ID

Option A (private chat):

1. Send any message to your bot.
2. Open:
   `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Find `chat.id` value.

Option B (group chat):

1. Add bot to group.
2. Send message in group.
3. Use `getUpdates` and copy group `chat.id` (usually negative integer).

## 3) Set GitHub Secrets

Repository -> Settings -> Secrets and variables -> Actions -> New repository secret

- `TELEGRAM_BOT_TOKEN` = your bot token
- `TELEGRAM_CHAT_ID` = target chat id

## 4) Trigger Events

Workflow: `.github/workflows/codex-issue-progress-notify.yml`

Triggered when one of labels is added to an issue:

- `spec-done`
- `plan-done`
- `tasks-done`

## 5) Expected Outputs

- Telegram message with repository, issue, phase, and issue URL
- GitHub issue comment describing current phase update

## 6) Test Procedure

1. Create a test issue.
2. Add label `spec-done`.
3. Verify:
   - Actions run success
   - Telegram message delivered
   - issue comment created
