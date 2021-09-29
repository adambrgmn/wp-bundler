export async function add(...nums: number[]) {
  let spread = { wtf: 'foo', bar: 'baz' };
  let { wtf, bar } = spread;

  return nums.reduce((a, b) => a + b, 0);
}

export async function sub(init: number, ...nums: number[]) {
  return nums.reduce((a, b) => a - b, init);
}
