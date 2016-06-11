type User = { name: string };

export function getUser(userId: string): Promise<User> {
  return axios.get('').then(p => (p.data: User))
}
