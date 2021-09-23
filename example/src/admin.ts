import { add } from './utils/math';

main()
  .then(() => {})
  .catch((error) => console.error(error));

async function main() {
  console.log(await add(1, 2, 3));
}
