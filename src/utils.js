const types = [];

export function uniqueType(type, count = 0) {
  const typ = count === 0 ? type : `${type}-${count}`;
  if (types.findIndex(t => t === typ) !== -1) {
    return unique(type, count + 1);
  }
  types.push(typ);
  return typ;
}
