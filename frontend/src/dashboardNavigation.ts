export interface NavigationItem { x: number; y: number }

export function nextDirectionalItem(origin: NavigationItem, items: readonly NavigationItem[], key: string): number {
  const horizontal = key === "ArrowLeft" || key === "ArrowRight";
  const sign = key === "ArrowRight" || key === "ArrowDown" ? 1 : -1;
  let best = -1;
  let score = Infinity;
  for (const [index, item] of items.entries()) {
    const major = (horizontal ? item.x - origin.x : item.y - origin.y) * sign;
    if (major <= 1) continue;
    const minor = Math.abs(horizontal ? item.y - origin.y : item.x - origin.x);
    const distance = major + minor * 1.8;
    if (distance < score) {
      score = distance;
      best = index;
    }
  }
  return best;
}
