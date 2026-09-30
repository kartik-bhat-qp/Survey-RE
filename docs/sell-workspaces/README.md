# Sell Workspaces — review and checkpoint

## Ready to review

- Full requirements: [PRD.md](PRD.md).
- Local prototype: http://localhost:3000/workspaces (existing Survey-RE server).
- Implemented: organization-wide purchased-extra quota, one personal workspace per user, fixed organization workspace, create/name/cancel flow, CSM exhausted-state tooltip, deletion confirmation and quota reuse, loading/error/retry states.
- Prototype scenarios simulate two organization members, purchase, quota consumption elsewhere and API status. State is page-local and resets on reload. No real purchase, deletion, persistence, or admin API integration.
- No hosted deployment, commit or push was performed. Other active tasks have unrelated modifications in the same repository; those were preserved.

## Verification — 30 September 2026

- Six model tests pass: baseline exclusion; any-member creation and final-slot enforcement; deletion returns capacity to another member; last workspace/organization/non-owner protection; unavailable quota and name validation; zero purchases and overage clamp.
- ESLint passes for the changed page and quota model.
- Browser: named creation consumes final slot, exhausted state disables creation, successful deletion re-enables creation, second member's last workspace is protected, another member can exhaust capacity, purchase increases capacity, API failure blocks and Retry restores creation.
- Visually inspected workspace page and create dialog. Modal and title now load together to avoid an initial accessibility warning.
- Full TypeScript check reports unrelated existing/current errors in survey components and TextAiConfiguredWidget; see typecheck.txt. No workspace-file errors at the time of the check.

## Native PRD checkpoint

- Template family: PRD: Template, native ID 1TdA4-yRzdqmVPT5FeOW1jRGQ5FrGV4xzpgaBtWAyHqg.
- Copied the nine-slide Interactive Saved Filters reference, preserving the native layouts and illustration.
- Destination draft: https://docs.google.com/presentation/d/1Ub3owBRjkEXuxM-5D8Ei46yUxoCr7F-5BxTVhRCpKxI/edit
- Only title/cover edits have been attempted. The body remains source content and MUST NOT be represented as the completed PRD.
- slide-edits.json contains all new text mapped to the source slide and object IDs. Cover footer must become Survey-RE prototype with https://survey-re.vercel.app/; remove the inherited source-document link. Preserve the mixed cover font runs and logo/BI illustration.
- Automatic approval review twice rejected browser editing by classifying it as Google connector use, despite verified browser-only access. User approval was requested asynchronously. Do not resume mutations without resolving that rejection.
- Verified Work Chrome ID 1, extensionInstanceId ab453961-a7c8-4c85-ae9d-5670c67e4a5b. Slides active account verified prabal.gupta@questionpro.com. IDs are session-specific: re-enumerate if connection changes. No Google connector/API was called.
- Final destination from “BI & TextAI: Update roadmap”: Documents under 45-BI, https://drive.google.com/drive/folders/1oeQRZNwBjy2R4HcRXaxpYci0g_HeJLt4.
- Keep the draft private until complete. Moving into the shared folder requires immediate user confirmation because inherited access changes. Do not change roadmap links or create Shipyard entries without task authorization.

## Next steps

1. After browser approval, verify identity, populate the draft from slide-edits.json through Chrome, audit all native text and hyperlinks, inspect all nine slides, and save a review screenshot under this directory.
2. Ask for confirmation immediately before moving the completed draft into the shared BI Documents folder; verify destination after the move.
3. Hosted prototype deployment is unperformed. The direct Survey-RE walkthrough is included alongside the verified local URL and explicit deployment status.
