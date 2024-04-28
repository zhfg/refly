import { genUID } from './utils/id';

const num = parseInt(process.argv[process.argv.length - 1]) || 0;

for (let i = 1; i <= num; i++) {
  console.log(`update users set uid = '${genUID()}' where id = ${i};`);
}
