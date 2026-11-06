export const CONTACT_HUB_CURRENT_USER_KEY = 'contact-hub:current-user';

export type ContactAccessScope = 'organization' | 'team' | 'private';

export type ContactHubRoleId =
  | 'organization-admin'
  | 'contact-manager'
  | 'group-owner'
  | 'distributor'
  | 'viewer';

export type ContactPermissionId =
  | 'contacts.view'
  | 'contacts.create'
  | 'contacts.edit'
  | 'contacts.delete'
  | 'contacts.import'
  | 'contacts.export'
  | 'groups.view'
  | 'groups.create'
  | 'groups.edit'
  | 'groups.delete'
  | 'groups.share'
  | 'groups.use-distribute'
  | 'suppression.manage'
  | 'attributes.manage'
  | 'access.manage'
  | 'teams.manage'
  | 'ownership.assign'
  | 'activity.view-org';

export type GroupShareMode = 'private' | 'users' | 'teams' | 'organization';

export type GroupSharePermission =
  | 'view'
  | 'use-distribute'
  | 'edit-membership'
  | 'edit-rules'
  | 'delete';

export interface ContactHubUser {
  id: string;
  name: string;
  email: string;
  roleId: ContactHubRoleId;
  teamIds: string[];
}

export interface ContactHubTeam {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
}

export interface ContactHubRole {
  id: ContactHubRoleId;
  label: string;
  description: string;
  permissions: ContactPermissionId[];
}

export interface ContactOwnership {
  createdBy: string;
  createdAt: string;
  lastModifiedBy: string;
  lastModifiedAt: string;
  owningTeamId?: string;
  accessScope: ContactAccessScope;
}

export interface GroupShareSettings {
  mode: GroupShareMode;
  userIds: string[];
  teamIds: string[];
  permissions: GroupSharePermission[];
}

export interface ContactHubAccessPolicy {
  defaultContactScope: ContactAccessScope;
  defaultGroupShareMode: GroupShareMode;
  importDoesNotTransferOwnership: boolean;
  uniqueIdentityField: 'email';
  allowCustomRolesLater: boolean;
}

export const CONTACT_ACCESS_SCOPE_LABEL: Record<ContactAccessScope, string> = {
  organization: 'Organization-wide',
  team: 'Team-level',
  private: 'Private',
};

export const GROUP_SHARE_MODE_LABEL: Record<GroupShareMode, string> = {
  private: 'Private to me',
  users: 'Share with selected users',
  teams: 'Share with selected teams',
  organization: 'Available to entire organization',
};

export const GROUP_SHARE_PERMISSION_LABEL: Record<GroupSharePermission, string> = {
  view: 'View',
  'use-distribute': 'Use for distribution',
  'edit-membership': 'Edit membership',
  'edit-rules': 'Edit group rules',
  delete: 'Delete',
};

export const CONTACT_PERMISSION_LABEL: Record<ContactPermissionId, string> = {
  'contacts.view': 'View contacts',
  'contacts.create': 'Create contacts',
  'contacts.edit': 'Edit contacts',
  'contacts.delete': 'Delete contacts',
  'contacts.import': 'Import contacts',
  'contacts.export': 'Export contacts',
  'groups.view': 'View groups',
  'groups.create': 'Create groups',
  'groups.edit': 'Edit groups',
  'groups.delete': 'Delete groups',
  'groups.share': 'Share groups',
  'groups.use-distribute': 'Use groups for distribution',
  'suppression.manage': 'Manage suppression',
  'attributes.manage': 'Manage custom attributes',
  'access.manage': 'Manage access policies',
  'teams.manage': 'Manage teams',
  'ownership.assign': 'Assign ownership',
  'activity.view-org': 'View organization-wide activity',
};

const ALL_PERMISSIONS = Object.keys(CONTACT_PERMISSION_LABEL) as ContactPermissionId[];

export const CONTACT_HUB_ROLES: ContactHubRole[] = [
  {
    id: 'organization-admin',
    label: 'Organization Admin',
    description:
      'Full control of organization contacts, groups, suppression, ownership, and access policy.',
    permissions: ALL_PERMISSIONS,
  },
  {
    id: 'contact-manager',
    label: 'Contact Manager',
    description:
      'Create and edit contacts, import/export, and manage shared groups within permitted scopes.',
    permissions: [
      'contacts.view',
      'contacts.create',
      'contacts.edit',
      'contacts.import',
      'contacts.export',
      'groups.view',
      'groups.create',
      'groups.edit',
      'groups.share',
      'groups.use-distribute',
      'attributes.manage',
      'activity.view-org',
    ],
  },
  {
    id: 'group-owner',
    label: 'Group Owner',
    description:
      'Manage assigned groups, membership, and conditions. Use owned groups for distribution.',
    permissions: [
      'contacts.view',
      'groups.view',
      'groups.edit',
      'groups.use-distribute',
    ],
  },
  {
    id: 'distributor',
    label: 'Distributor',
    description:
      'Select authorized contacts and groups for survey distribution. Cannot edit records.',
    permissions: ['contacts.view', 'groups.view', 'groups.use-distribute'],
  },
  {
    id: 'viewer',
    label: 'Viewer',
    description: 'Read authorized contact and group information only.',
    permissions: ['contacts.view', 'groups.view'],
  },
];

export const CONTACT_HUB_TEAMS: ContactHubTeam[] = [
  {
    id: 'team-research',
    name: 'Research Team',
    description: 'Core survey research and panel operations.',
    memberIds: ['user-anika', 'user-chris', 'user-maya'],
  },
  {
    id: 'team-cx',
    name: 'Customer Experience Team',
    description: 'CX programs and ongoing customer listening.',
    memberIds: ['user-anika', 'user-elena'],
  },
  {
    id: 'team-marketing',
    name: 'Marketing Team',
    description: 'Campaign audiences and newsletter outreach.',
    memberIds: ['user-chris', 'user-jordan'],
  },
  {
    id: 'team-hr',
    name: 'HR Team',
    description: 'Employee experience and internal research.',
    memberIds: ['user-maya'],
  },
  {
    id: 'team-regional',
    name: 'Regional Research Team',
    description: 'APAC and regional fieldwork coordination.',
    memberIds: ['user-anika', 'user-priya-admin'],
  },
];

export const CONTACT_HUB_USERS: ContactHubUser[] = [
  {
    id: 'user-priya-admin',
    name: 'Priya Menon',
    email: 'priya.menon@lantified.com',
    roleId: 'organization-admin',
    teamIds: ['team-regional'],
  },
  {
    id: 'user-anika',
    name: 'Anika Shah',
    email: 'anika.shah@lantified.com',
    roleId: 'contact-manager',
    teamIds: ['team-research', 'team-cx', 'team-regional'],
  },
  {
    id: 'user-chris',
    name: 'Chris Dalton',
    email: 'chris.dalton@lantified.com',
    roleId: 'group-owner',
    teamIds: ['team-research', 'team-marketing'],
  },
  {
    id: 'user-elena',
    name: 'Elena Vargas',
    email: 'elena.vargas@lantified.com',
    roleId: 'distributor',
    teamIds: ['team-cx'],
  },
  {
    id: 'user-maya',
    name: 'Maya Chen',
    email: 'maya.chen@lantified.com',
    roleId: 'viewer',
    teamIds: ['team-research', 'team-hr'],
  },
  {
    id: 'user-jordan',
    name: 'Jordan Blake',
    email: 'jordan.blake@lantified.com',
    roleId: 'distributor',
    teamIds: ['team-marketing'],
  },
];

export const DEFAULT_CONTACT_HUB_POLICY: ContactHubAccessPolicy = {
  defaultContactScope: 'organization',
  defaultGroupShareMode: 'teams',
  importDoesNotTransferOwnership: true,
  uniqueIdentityField: 'email',
  allowCustomRolesLater: true,
};

export function roleById(roleId: ContactHubRoleId): ContactHubRole {
  return CONTACT_HUB_ROLES.find((role) => role.id === roleId) ?? CONTACT_HUB_ROLES[4];
}

export function userById(userId: string): ContactHubUser | undefined {
  return CONTACT_HUB_USERS.find((user) => user.id === userId);
}

export function teamById(teamId: string): ContactHubTeam | undefined {
  return CONTACT_HUB_TEAMS.find((team) => team.id === teamId);
}

export function userHasPermission(
  user: ContactHubUser,
  permission: ContactPermissionId,
): boolean {
  return roleById(user.roleId).permissions.includes(permission);
}

export function defaultCurrentUser(): ContactHubUser {
  return CONTACT_HUB_USERS[0];
}

export function userCanAccessScope(
  user: ContactHubUser,
  scope: ContactAccessScope,
  owningTeamId: string | undefined,
  createdBy: string,
): boolean {
  if (user.roleId === 'organization-admin') return true;
  if (scope === 'organization') return true;
  if (scope === 'private') return createdBy === user.id;
  if (scope === 'team') {
    if (!owningTeamId) return createdBy === user.id;
    return user.teamIds.includes(owningTeamId);
  }
  return false;
}

export function userCanAccessGroupShare(
  user: ContactHubUser,
  sharing: GroupShareSettings,
  ownerId: string,
): boolean {
  if (user.roleId === 'organization-admin') return true;
  if (ownerId === user.id) return true;
  if (sharing.mode === 'organization') return true;
  if (sharing.mode === 'private') return false;
  if (sharing.mode === 'users') return sharing.userIds.includes(user.id);
  if (sharing.mode === 'teams') {
    return sharing.teamIds.some((teamId) => user.teamIds.includes(teamId));
  }
  return false;
}

export function groupAllowsPermission(
  sharing: GroupShareSettings,
  permission: GroupSharePermission,
): boolean {
  return sharing.permissions.includes(permission);
}
