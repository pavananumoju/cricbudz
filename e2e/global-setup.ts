import { runSeed } from './seed';

export default async function globalSetup() {
  await runSeed();
}
