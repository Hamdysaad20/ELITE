export function formatOrderRef(
  clientOrderRef?: string | null,
  id?: string,
): string {
  if (clientOrderRef) {
    const lastSegment = clientOrderRef.split("-").pop();
    if (lastSegment) return lastSegment.toUpperCase().slice(0, 8);
  }
  if (id) return id.slice(0, 8).toUpperCase();
  return "—";
}
