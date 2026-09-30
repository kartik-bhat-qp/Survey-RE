import assert from 'node:assert/strict';
import test from 'node:test';
import { workspaceCapacity, workspaceDeleteError, createIndividualWorkspace, deleteIndividualWorkspace } from '../src/data/workspace-quota.ts';
const workspace = (id, ownerId, kind = 'individual') => ({ id, ownerId, kind, name: `Workspace ${id}`, scope: 'mine', updatedAt: '2026-09-30', stats: { dashboards: 0, surveyStacks: 0, biVariables: 0, reports: 0 } });
const baseline = () => ({ purchasedSlots: 1, quotaStatus: 'ready', workspaces: [workspace(1, 'a'), workspace(2, 'b'), workspace(3, null, 'organization')] });
test('included personal and organization workspaces consume no purchased slots', () => assert.deepEqual(workspaceCapacity(baseline()), { used: 0, total: 1, available: 1 }));
test('any member can create; two requests cannot both consume the final slot', () => {
  const first = createIndividualWorkspace(baseline(), 'b', 'Research', '2026-09-30');
  assert.equal(first.error, null);
  const second = createIndividualWorkspace(first.state, 'a', 'Another', '2026-09-30');
  assert.match(second.error, /CSM/);
  assert.equal(second.state.workspaces.length, 4);
});
test('deleting either owned workspace frees capacity for a different member', () => {
  const created = createIndividualWorkspace(baseline(), 'a', 'Second', '2026-09-30');
  const deleted = deleteIndividualWorkspace(created.state, 'a', 1);
  assert.equal(deleted.error, null);
  assert.equal(workspaceCapacity(deleted.state).available, 1);
  assert.equal(deleted.state.purchasedSlots, 1);
  assert.equal(createIndividualWorkspace(deleted.state, 'b', 'Replacement', '2026-09-30').error, null);
});
test('last individual, organization, another owner and missing workspace are protected', () => {
  for (const id of [1, 2, 3, 999]) {
    assert.ok(workspaceDeleteError(baseline(), id, 'a'));
    assert.deepEqual(deleteIndividualWorkspace(baseline(), 'a', id).state, baseline());
  }
});
test('unverified quota and invalid names never allocate a workspace', () => {
  for (const quotaStatus of ['error', 'loading']) assert.ok(createIndividualWorkspace({ ...baseline(), quotaStatus }, 'a', 'Test', '2026-09-30').error);
  for (const name of ['   ', 'a'.repeat(101)]) assert.ok(createIndividualWorkspace(baseline(), 'a', name, '2026-09-30').error);
  assert.ok(createIndividualWorkspace(baseline(), 'unknown', 'Test', '2026-09-30').error);
});
test('zero purchases blocks creation; overage never produces negative availability', () => {
  assert.ok(createIndividualWorkspace({ ...baseline(), purchasedSlots: 0 }, 'a', 'Test', '2026-09-30').error);
  assert.equal(workspaceCapacity({ ...baseline(), purchasedSlots: 0, workspaces: [...baseline().workspaces, workspace(4, 'a')] }).available, 0);
});
