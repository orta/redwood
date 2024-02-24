// @ts-check
import fs from 'fs'
import path from 'path'

import { config } from 'dotenv'

/**
 * @param { string } cwd
 * @returns {(yargs: import('yargs').Argv) => void}
 */
export const addAdditionalEnvFiles = (cwd) => (yargs) => {
  // Allow for additional .env files to be included via --include-env
  if ('includeEnv' in yargs && Array.isArray(yargs.includeEnv)) {
    for (const suffix of yargs.includeEnv) {
      const envPath = path.join(cwd, `.env.${suffix}`)
      if (!fs.existsSync(envPath)) {
        throw new Error(
          `Couldn't find an .env file at '${envPath}' - which was noted via --include-env`
        )
      }

      config({ path: envPath })
    }
  }

  // Support automatically matching a .env file based on the NODE_ENV
  if (process.env.NODE_ENV) {
    const processBasedEnvPath = `${cwd}/.env.${process.env.NODE_ENV}`
    if (fs.existsSync(processBasedEnvPath)) {
      config({ path: processBasedEnvPath })
    }
  }
}
