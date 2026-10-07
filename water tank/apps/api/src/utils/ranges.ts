export type RangeKey = "hour" | "today" | "7d" | "30d" | "all";

export const getRangeStart = (range: RangeKey) => {
  const now = new Date();

  if (range === "hour") {
    return new Date(now.getTime() - 60 * 60 * 1000);
  }

  if (range === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  if (range === "7d") {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  
  if (range === "30d") {
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return new Date(0); // "all"
};
