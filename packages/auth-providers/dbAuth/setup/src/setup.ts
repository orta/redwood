import terminalLink from 'terminal-link'
import yargs from 'yargs'

export const command = 'dbAuth'
export const description = 'Set up auth for for dbAuth'

export function builder(yargs: yargs.Argv) {
  yargs
    .option('force', {
      alias: 'f',
      default: false,
      description: 'Overwrite existing configuration',
      type: 'boolean',
    })
    .option('webauthn', {
      alias: 'w',
      default: null,
      description: 'Include WebAuthn support (TouchID/FaceID)',
      type: 'boolean',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#setup-auth'
      )}`
    )
}

export interface Args {
  webauthn: boolean
  force: boolean
}

export const handler = async (options: Args) => {
  const { handler } = await import('./setupHandler.js')
  return handler(options)
}
