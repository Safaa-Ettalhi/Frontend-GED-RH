export enum UserRole {
  ADMIN = 'admin',        
  RH = 'rh',              
  MANAGER = 'manager',    
  CANDIDATE = 'candidate', 
}

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Admin',
  [UserRole.RH]: 'RH',
  [UserRole.MANAGER]: 'Manager',
  [UserRole.CANDIDATE]: 'Candidat',
}

export const REGISTER_ROLE_OPTIONS = [
  { value: UserRole.RH, label: 'RH (Ressources Humaines)' },
  { value: UserRole.MANAGER, label: 'Manager' },
  { value: UserRole.CANDIDATE, label: 'Candidat' },
]

export const ROLE_PERMISSIONS = {
  [UserRole.ADMIN]: {
    canViewDashboard: true,
    canManageCandidates: true,
    canManageDocuments: true,
    canManageInterviews: true,
    canManageForms: true,
    canManageUsers: true,
    canManageOrganizations: true,
    canViewAllNotifications: true,
  },
  [UserRole.RH]: {
    canViewDashboard: true,
    canManageCandidates: true,
    canManageDocuments: true,
    canManageInterviews: true,
    canManageForms: true,
    canManageUsers: false,
    canManageOrganizations: false,
    canViewAllNotifications: true,
  },
  [UserRole.MANAGER]: {
    canViewDashboard: true,
    canManageCandidates: true,
    canManageDocuments: true,
    canManageInterviews: true,
    canManageForms: false,
    canManageUsers: false,
    canManageOrganizations: false,
    canViewAllNotifications: true,
  },
  [UserRole.CANDIDATE]: {
    canViewDashboard: true,
    canManageCandidates: false,
    canManageDocuments: false,
    canManageInterviews: false,
    canManageForms: false,
    canManageUsers: false,
    canManageOrganizations: false,
    canViewAllNotifications: false,
  },
}

export function hasPermission(role: UserRole, permission: keyof typeof ROLE_PERMISSIONS[UserRole]): boolean {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false
}

export function isAdmin(role: string): boolean {
  return role === UserRole.ADMIN
}

export function isManager(role: string): boolean {
  return role === UserRole.MANAGER
}

export function isCandidate(role: string): boolean {
  return role === UserRole.CANDIDATE
}

export function isRH(role: string): boolean {
  return role === UserRole.RH
}
