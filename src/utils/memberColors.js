import { AUTHOR_COLORS } from '../components/Map/FairgroundsMap';

// Golden-angle hue rotation gives visually distinct colors indefinitely,
// used only once the curated AUTHOR_COLORS palette is exhausted.
function generateColor(seed) {
  const hue = (seed * 137.508) % 360;
  return `hsl(${hue.toFixed(0)}, 65%, 45%)`;
}

// Builds a { memberId: color } map ensuring every member has a unique pin color.
// The current user always keeps their preferred (profile) color. Other members
// keep theirs too unless it collides with an already-claimed color, in which case
// they're reassigned the next available palette color (or a generated one).
export function getMemberColorMap(members, currentUserId) {
  const colorMap = {};
  const used = new Set();

  const currentIdx = members.findIndex((m) => m.id === currentUserId);
  if (currentIdx >= 0) {
    const currentMember = members[currentIdx];
    const preferred = currentMember.color || AUTHOR_COLORS[currentIdx % AUTHOR_COLORS.length];
    colorMap[currentMember.id] = preferred;
    used.add(preferred);
  }

  members.forEach((member, idx) => {
    if (member.id === currentUserId) return;

    const preferred = member.color || AUTHOR_COLORS[idx % AUTHOR_COLORS.length];
    if (!used.has(preferred)) {
      colorMap[member.id] = preferred;
      used.add(preferred);
      return;
    }

    const fallback = AUTHOR_COLORS.find((c) => !used.has(c));
    if (fallback) {
      colorMap[member.id] = fallback;
      used.add(fallback);
      return;
    }

    let seed = idx + 1;
    let generated = generateColor(seed);
    while (used.has(generated)) {
      seed += 1;
      generated = generateColor(seed);
    }
    colorMap[member.id] = generated;
    used.add(generated);
  });

  return colorMap;
}
