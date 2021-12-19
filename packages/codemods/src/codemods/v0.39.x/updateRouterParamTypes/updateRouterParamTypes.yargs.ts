import fs from 'fs'
import path from 'path'

import task from 'tasuku'

import getRWPaths from '../../../lib/getRWPaths'
import isTSProject from '../../../lib/isTSProject'
import runTransform from '../../../lib/runTransform'

export const command = 'update-router-paramTypes'
export const description = '(v0.38->v0.39) Updates @redwoodjs/router paramTypes'

export const handler = () => {
  task(
    'Updating Routes.{tsx|js}',
    async ({ setWarning }: { setWarning: any }) => {
      const rwPaths = getRWPaths()

      const extns = isTSProject ? 'tsx' : 'js'
      const routesFilePath = path.join(rwPaths.web.src, `Routes.${extns}`)
      if (!fs.existsSync(routesFilePath)) {
        setWarning('Routes.{tsx|js} not found')
      } else {
        runTransform({
          transformPath: path.join(__dirname, 'updateRouterParamTypes.js'),
          targetPaths: [routesFilePath],
        })
      }
    }
  )
}
