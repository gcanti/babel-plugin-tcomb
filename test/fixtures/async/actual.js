async function foo(): Promise<string> {
  return await bar();
}

const f = async(): Promise<void> => {
  await somePromise();
};
