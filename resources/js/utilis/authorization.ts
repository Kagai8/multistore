export const hasRole = (role: string, userRoles: string[] = []) =>
    userRoles.includes(role);

export const hasPermission = (requiredPermissions: string[], userPermissions: string[]) =>
    requiredPermissions.some(permission => userPermissions.includes(permission));

