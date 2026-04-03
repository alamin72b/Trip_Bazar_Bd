export function createReviewerDisplayName(email: string): string {
  const localPart = email.split('@')[0]?.trim().toLowerCase() ?? '';

  if (!localPart) {
    return 'rev***';
  }

  const visiblePart = localPart.slice(0, Math.min(3, localPart.length));

  return `${visiblePart}***`;
}
