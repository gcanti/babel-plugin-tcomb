type User = { name: string };

export function getUser(userId: string): Promise<User> {
  return axios.get('').then(p => (p.data: User))
}

const a = ('a string': A)
const b = ({}: B)

function coerce<A, B>(a: A): B {
  return ((a: any): B)
}
