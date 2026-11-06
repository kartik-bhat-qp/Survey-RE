'use client';

import { useMemo } from 'react';
import { usePersistedState } from '@/hooks/usePersistedState';
import {
  CONTACT_HUB_CURRENT_USER_KEY,
  CONTACT_HUB_USERS,
  defaultCurrentUser,
  roleById,
  userById,
  userCanAccessGroupShare,
  userCanAccessScope,
  userHasPermission,
  type ContactPermissionId,
} from '@/data/mock-contact-hub-access';
import {
  CONTACT_HUB_STORAGE_KEY,
  EMPTY_CONTACT_HUB,
  contactOwnership,
  groupOwnership,
  groupSharing,
  normalizeContactHubState,
  type ContactGroup,
  type ContactHubState,
  type ContactRecord,
} from '@/data/mock-contact-hub';

export function useContactHubSession() {
  const [rawHub, setRawHub] = usePersistedState(
    CONTACT_HUB_STORAGE_KEY,
    EMPTY_CONTACT_HUB,
  );
  const [currentUserId, setCurrentUserId] = usePersistedState(
    CONTACT_HUB_CURRENT_USER_KEY,
    defaultCurrentUser().id,
  );

  const hub = useMemo(() => normalizeContactHubState(rawHub), [rawHub]);
  const currentUser = userById(currentUserId) ?? defaultCurrentUser();
  const role = roleById(currentUser.roleId);

  function setHub(updater: ContactHubState | ((current: ContactHubState) => ContactHubState)) {
    setRawHub((current) => {
      const normalized = normalizeContactHubState(current);
      return typeof updater === 'function' ? updater(normalized) : updater;
    });
  }

  function can(permission: ContactPermissionId): boolean {
    return userHasPermission(currentUser, permission);
  }

  function canViewContact(contact: ContactRecord): boolean {
    if (!userHasPermission(currentUser, 'contacts.view')) return false;
    const meta = contactOwnership(contact);
    return userCanAccessScope(
      currentUser,
      meta.accessScope,
      meta.owningTeamId,
      meta.createdBy,
    );
  }

  function canViewGroup(group: ContactGroup): boolean {
    if (!userHasPermission(currentUser, 'groups.view')) return false;
    const meta = groupOwnership(group);
    const share = groupSharing(group);
    return (
      userCanAccessScope(currentUser, meta.accessScope, meta.owningTeamId, meta.createdBy) ||
      userCanAccessGroupShare(currentUser, share, meta.createdBy)
    );
  }

  const visibleContacts = hub.contacts.filter((contact) => canViewContact(contact));
  const visibleGroups = hub.groups.filter((group) => canViewGroup(group));

  function switchUser(userId: string) {
    if (CONTACT_HUB_USERS.some((user) => user.id === userId)) {
      setCurrentUserId(userId);
    }
  }

  return {
    hub,
    setHub,
    currentUser,
    role,
    users: CONTACT_HUB_USERS,
    can,
    canViewContact,
    canViewGroup,
    visibleContacts,
    visibleGroups,
    switchUser,
  };
}
