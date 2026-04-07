/** Aligné sur le middleware : espace étudiant accessible aux rôles student et admin. */
export function canAccessStudentArea(role: string | undefined | null): boolean {
  const r = String(role ?? '').toLowerCase();
  return r === 'student' || r === 'admin';
}
