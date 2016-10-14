function dump({
  obj,
  dumper = (obj): string => "object: " + obj,
}): string {
  return dumper(obj);
}
