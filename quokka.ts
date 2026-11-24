const everyIn = Math.round(-1);
const inwardOf = (n: number) => (everyIn < 0) || (everyIn > 0 && n >= 0 && n % (everyIn + 1) === everyIn);
const dirOf = (n: number) => (inwardOf(n) ? -1 : 1);
console.log(inwardOf(-1));
