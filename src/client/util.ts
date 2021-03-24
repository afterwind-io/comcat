const chars = 'abcdefghij1234567890';
export function getUniqueId(): string {
  let id = '';

  while (id.length < 8) {
    id += chars.charAt(Math.floor(Math.random() * 20));
  }

  return id;
}
