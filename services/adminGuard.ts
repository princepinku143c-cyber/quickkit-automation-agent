
import { UserPlan } from '../types';

/**
 * Hard Block Function: Throws error if user is not an Admin/Owner.
 * Use this in protected components or service calls.
 */
export function requireAdmin(user: UserPlan | null) {
  if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER')) {
    throw new Error("UNAUTHORIZED: Access denied. Admin privileges required.");
  }
}

/**
 * Boolean Check: Use for conditional UI rendering (hiding buttons).
 */
export function isAdmin(user: UserPlan | null): boolean {
  return !!user && (user.role === 'ADMIN' || user.role === 'OWNER');
}
