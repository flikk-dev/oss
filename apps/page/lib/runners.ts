/**
 * The same command, however you run things.
 *
 * Plain module, no "use client": the docs page builds these on the server and
 * hands them to the terminal as props.
 */
export function runners(command: string) {
  return {
    pnpm: `pnpm dlx ${command}`,
    npm: `npx ${command}`,
    yarn: `yarn dlx ${command}`,
    bun: `bunx --bun ${command}`,
  };
}
