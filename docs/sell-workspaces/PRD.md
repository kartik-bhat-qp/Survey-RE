# BI — Sell Workspaces

Status: Complete local draft requirements; native Slides population pending browser approval, 30 September 2026. Product owner: Prabal Gupta.

Incomplete native Slides draft (content transfer blocked by automatic approval review): https://docs.google.com/presentation/d/1Ub3owBRjkEXuxM-5D8Ei46yUxoCr7F-5BxTVhRCpKxI/edit

Target folder: BI Documents under 45-BI, https://drive.google.com/drive/folders/1oeQRZNwBjy2R4HcRXaxpYci0g_HeJLt4. Moving the private draft there awaits confirmation of inherited access.

Template family: PRD: Template; copied the nine-slide Interactive Saved Filters reference to preserve native layouts. Keep the BI cover illustration and footer logo, replace all source-specific text and hyperlinks.

Organizations need additional individual BI workspaces for separate projects. Users contact their CSM to purchase capacity; any organization user can then create a workspace when capacity is available.
Keep one included individual workspace for every user and exactly one organization workspace. Additional organization workspaces cannot be purchased.
This PRD defines the purchase-to-quota handoff, creation, deletion and quota enforcement. Current allocation is owner-confirmed on 30 September 2026; the new flow is a planned requirement.

User needs and scope
Included allocation and purchased quota
Create Workspace and unavailable states
Deletion and reusable capacity
Admin API contract and integrity
Acceptance criteria and prototype walkthrough

## Users, purchase and allocation

## One included workspace per user; purchased slots shared across the organization

Organization user: contact the CSM for more capacity, then create and own an additional individual workspace. The creator need not be the purchaser or organization administrator.
CSM and admin team: complete the purchase outside BI and update the organization entitlement exposed by the admin API. BI does not collect payment.
Reserve one individual workspace for each user. Used purchased slots = sum of each user’s workspaces beyond their first. Available slots = purchased slots minus used slots, with a minimum of zero.
Keep exactly one organization workspace, outside this quota. Sharing an existing individual workspace does not create or consume another slot.

## Create Workspace

Load the organization’s authoritative quota when opening the BI Workspaces page. Enable Create Workspace only when confirmed remaining capacity is greater than zero.
At zero capacity, disable the button and show this tooltip on hover and keyboard focus: “Please reach out to your CSM for purchasing additional workspaces.” Repeat the guidance as visible helper text.
Create opens a name dialog for an individual workspace only. Require a trimmed, nonempty name; Cancel consumes nothing. On success, add the workspace to the creator’s list and refresh capacity.
While quota is loading or unavailable, disable creation and show the relevant checking/retry state. An API failure must never be presented as proof that a purchase is required. Existing workspace access remains available.

## Delete and reuse capacity

## Protect every user’s last individual workspace

A user with more than one individual workspace can delete an eligible owned workspace. Protect the last remaining individual workspace; the original workspace is not permanently pinned if another remains. Preserve existing authorization and content-deletion safeguards.
Ask for confirmation with the workspace name and deletion consequences. Cancel or failed deletion must leave workspace count and capacity unchanged.
After successful deletion, return one slot to the organization pool. Any organization user may use it; it is not reserved for the person who deleted it.
Example: two users each have one included workspace, plus two purchased slots. Alex uses both slots. Alex deletes one additional workspace; Kartik can use the returned slot. The organization workspace remains one.

## Admin API and integrity requirements

Admin provides organization entitlement. Agree whether its limit includes baseline allocation or only purchased extras; normalize once and never count the organization workspace against individual capacity. Field names and endpoint are still to be agreed.
BI needs total entitlement, organization-wide usage and remaining capacity, including workspaces the current user cannot see. Never infer quota from the visible list alone. Refresh after creation, successful deletion and entitlement updates.
The server must atomically validate membership, authorization and remaining quota when creating. Two users competing for the final slot cannot both succeed. Retry safely without duplicate creation or double release. A conflict preserves the entered name and refreshes availability.
Enforce the per-user minimum during deletion and prevent extra organization workspaces server-side. Confirm membership changes, entitlement reductions, deletion completion and legacy allocation before production rollout.

## AC-01 through AC-10

AC-01/02: Each user retains at least one individual workspace. Exactly one organization workspace exists; no purchase or creation option increases that count.
AC-03/04: Any organization user can consume a purchased slot. Zero capacity disables Create Workspace and exposes the exact CSM tooltip by hover and keyboard.
AC-05/06: Successful creation consumes one slot; Cancel, invalid input and failed requests consume none. Quota loading/failure blocks creation without a false upsell.
AC-07/08: The last individual workspace cannot be deleted. Successful eligible deletion returns one shared slot; Cancel or failure returns none.
AC-09/10: Final-slot races and repeated requests never oversubscribe or duplicate. Purchase/deletion refreshes use organization-wide data; shared access never double-counts usage.

Open Survey-RE directly: https://survey-re.vercel.app/ → Workspaces.
Create a named workspace using the available slot. Confirm the remaining count reaches zero and Create Workspace shows the CSM guidance.
Delete an owned workspace and confirm creation becomes available again. Delete down to one and verify the final individual workspace is protected.
Open Prototype scenarios. Switch between Kartik and Alex; simulate a purchase, another user consuming capacity, and loading/unavailable API responses. Verify Retry and the fixed organization workspace.
The implemented local review is http://localhost:3000/workspaces. Synthetic state resets on reload. No real purchase, admin API, durable storage or server concurrency is implemented; production release and hosted deployment are not claimed.

## Implementation assumptions and open decisions

- Purchased quota is a shared pool above the one-per-user baseline. Do not allow unprovisioned users’ baseline slots to be consumed by other users.
- Existing workspace permissions remain. Prototype deletion is owner-only; no new ability to delete a colleague’s workspace is granted.
- Prototype names are capped at 100 characters; confirm the existing production naming rule.
- Admin/BI teams must agree payload semantics, freshness, atomic quota ownership, idempotency, membership changes and legacy entitlements. These are integration decisions, not invented API endpoints.
- Releasing a slot follows successful deletion; async cleanup/tombstone behavior must be specified. Billing/refunds, transfer of ownership, membership management and purchasing organization workspaces are out of scope.
- No production behavior was verified or changed in this task.
