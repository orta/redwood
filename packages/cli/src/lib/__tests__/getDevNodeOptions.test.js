import { describe, it, expect } from 'vitest'

import { getDevNodeOptions } from '../../commands/devHandler'

describe('getNodeOptions', () => {
  const enableSourceMapsOption = '--enable-source-maps'

  it('defaults to enable-source-maps', () => {
    const nodeOptions = getDevNodeOptions()
    expect(nodeOptions).toEqual(enableSourceMapsOption)
  })

  it("doesn't specify `--enable-source-maps` twice", () => {
    process.env.NODE_OPTIONS = enableSourceMapsOption

    const nodeOptions = getDevNodeOptions()
    expect(nodeOptions).toEqual(enableSourceMapsOption)
  })

  it('merges existing options with `--enable-source-maps`', () => {
    const existingOptions = '--inspect --no-experimental-fetch'
    process.env.NODE_OPTIONS = existingOptions

    const nodeOptions = getDevNodeOptions()

    expect(nodeOptions).toEqual(`${existingOptions} ${enableSourceMapsOption}`)
  })
})
