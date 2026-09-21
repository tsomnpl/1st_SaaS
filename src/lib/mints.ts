export function mintNoun(count: number) {
  return count > 1 ? "Mints" : "Mint";
}

export function afficheNoun(count: number) {
  return count > 1 ? "affiches" : "affiche";
}

export function mintBalanceLabel(count: number) {
  return `${count} ${mintNoun(count)} = ${count} ${afficheNoun(count)}`;
}
