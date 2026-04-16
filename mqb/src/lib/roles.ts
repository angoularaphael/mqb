export function canAccessStudentArea(role: string | undefined | null): boolean {
  const r = String(role ?? '').toLowerCase();
  return r === 'student' || r === 'admin';
}

export function canAccessParentArea(role: string | undefined | null): boolean {
  const r = String(role ?? '').toLowerCase();
  return r === 'parent' || r === 'admin';
}

export function canAccessTeacherArea(role: string | undefined | null): boolean {
  const r = String(role ?? '').toLowerCase();
  return r === 'teacher' || r === 'admin';
}

export function canAccessAdminArea(role: string | undefined | null): boolean {
  const r = String(role ?? '').toLowerCase();
  return r === 'admin';
}
