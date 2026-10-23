const ROLE_HOME = {
  customer: '/customer',
  staff: '/staff/dashboard',
  branch_admin: '/admin/branch',
  super_admin: '/admin/super',
}

export const roleHome = (role) => ROLE_HOME[role] ?? '/'

// Turns the `from` location saved by the auth guard back into a path.
export const redirectTarget = (from) => {
  if (!from) return null
  if (typeof from === 'string') return from
  return `${from.pathname || ''}${from.search || ''}${from.hash || ''}` || null
}
