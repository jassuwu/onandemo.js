// constraint: all timing must reference beats — never magic frame numbers.
export const beats = {
  enter: 0,
  chase: 60,
  antic: 150,
  cta: 240,
} as const satisfies Record<string, number>;

export type Beat = keyof typeof beats;
