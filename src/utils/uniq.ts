type Compare<T> = (subj: T, other: T) => boolean;

function byReference<T>(subject: T, other: T) {
  return subject === other;
}

export function uniq<T>(arr: T[], compare: Compare<T> = byReference): T[] {
  return arr.filter((subject, index, _this) => {
    return _this.findIndex((other) => compare(subject, other)) === index;
  });
}
