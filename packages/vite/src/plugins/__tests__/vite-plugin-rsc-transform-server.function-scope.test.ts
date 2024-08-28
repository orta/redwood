import { vol } from 'memfs'
import type { TransformPluginContext } from 'rollup'
import { afterAll, beforeAll, describe, it, expect, vi } from 'vitest'

import { rscTransformUseServerPlugin } from '../vite-plugin-rsc-transform-server.js'

vi.mock('fs', async () => ({ default: (await import('memfs')).fs }))

const RWJS_CWD = process.env.RWJS_CWD

beforeAll(() => {
  process.env.RWJS_CWD = '/Users/tobbe/rw-app/'

  // Add a toml entry for getPaths et al.
  vol.fromJSON({ 'redwood.toml': '' }, process.env.RWJS_CWD)
})

afterAll(() => {
  process.env.RWJS_CWD = RWJS_CWD
})

function getPluginTransform() {
  const plugin = rscTransformUseServerPlugin()

  if (typeof plugin.transform !== 'function') {
    throw new Error('Plugin does not have a transform function')
  }

  // Calling `bind` to please TS
  // See https://stackoverflow.com/a/70463512/88106
  // Typecasting because we're only going to call transform, and we don't need
  // anything provided by the context.
  return plugin.transform.bind({} as TransformPluginContext)
}

const pluginTransform = getPluginTransform()

describe('rscTransformUseServerPlugin function scoped "use server"', () => {
  describe('top-level exports', () => {
    it('should handle named function', async () => {
      const id = 'some/path/to/actions.ts'
      const input = `
        import fs from 'node:fs'

        export async function formAction(formData: FormData) {
          'use server'

          await fs.promises.writeFile(
            'settings.json',
            \`{ "delay": \${formData.get('delay')} }\`
          )
        }`.trim()

      const output = await pluginTransform(input, id)

      if (typeof output !== 'string') {
        throw new Error('Expected output to be a string')
      }

      expect(output).toMatchInlineSnapshot(`
        "import fs from 'node:fs';
        export async function formAction(formData) {
          'use server';

          await fs.promises.writeFile('settings.json', \`{ "delay": \${formData.get('delay')} }\`);
        }
        import { registerServerReference } from "react-server-dom-webpack/server";
        registerServerReference(formAction, "some/path/to/actions.ts", "formAction");"
      `)
    })

    it('should handle arrow function', async () => {
      const id = 'some/path/to/actions.ts'
      const input = `
        import fs from 'node:fs'

        export const formAction = async (formData: FormData) => {
          'use server'

          await fs.promises.writeFile(
            'settings.json',
            \`{ "delay": \${formData.get('delay')} }\`
          )
        }`.trim()

      const output = await pluginTransform(input, id)

      if (typeof output !== 'string') {
        throw new Error('Expected output to be a string')
      }

      expect(output).toMatchInlineSnapshot(`
        "import fs from 'node:fs';
        export const formAction = async formData => {
          'use server';

          await fs.promises.writeFile('settings.json', \`{ "delay": \${formData.get('delay')} }\`);
        };
        import { registerServerReference } from "react-server-dom-webpack/server";
        registerServerReference(formAction, "some/path/to/actions.ts", "formAction");"
      `)
    })

    it('should handle default exported named function', async () => {
      const id = 'some/path/to/actions.ts'
      const input = `
        import fs from 'node:fs'

        export default async function formAction(formData: FormData) {
          'use server'

          await fs.promises.writeFile(
            'settings.json',
            \`{ "delay": \${formData.get('delay')} }\`
          )
        }`.trim()

      const output = await pluginTransform(input, id)

      if (typeof output !== 'string') {
        throw new Error('Expected output to be a string')
      }

      expect(output).toMatchInlineSnapshot(`
        "import fs from 'node:fs';
        export default async function formAction(formData) {
          'use server';

          await fs.promises.writeFile('settings.json', \`{ "delay": \${formData.get('delay')} }\`);
        }
        import { registerServerReference } from "react-server-dom-webpack/server";
        registerServerReference(formAction, "some/path/to/actions.ts", "default");"
      `)
    })

    it('should handle exports with two consts', async () => {
      const id = 'some/path/to/actions.ts'
      const input = `
        import fs from 'node:fs'

        export const fortyTwo = () => { 'use server'; return 42 }, formAction = async (formData: FormData) => {
          'use server'

          await fs.promises.writeFile(
            'settings.json',
            \`{ "delay": \${formData.get('delay')} }\`
          )
        }`.trim()

      const output = await pluginTransform(input, id)

      expect(output).toMatchInlineSnapshot(`
        "import fs from 'node:fs';
        export const fortyTwo = () => {
            'use server';

            return 42;
          },
          formAction = async formData => {
            'use server';

            await fs.promises.writeFile('settings.json', \`{ "delay": \${formData.get('delay')} }\`);
          };
        import { registerServerReference } from "react-server-dom-webpack/server";
        registerServerReference(fortyTwo, "some/path/to/actions.ts", "fortyTwo");
        registerServerReference(formAction, "some/path/to/actions.ts", "formAction");"
      `)
    })

    it('should handle named function and arrow function with separate export', async () => {
      const id = 'some/path/to/actions.ts'
      const input = `
        import fs from 'node:fs'

        const variable = 'value'

        export { formAction, arrowAction, variable }

        async function formAction(formData: FormData) {
          // A comment with 'use server' in it
          'use server'

          await fs.promises.writeFile(
            'settings.json',
            \`{ "delay": \${formData.get('delay')} }\`
          )
        }

        const arrowAction = async (formData: FormData) => {
          'use server'

          await fs.promises.writeFile(
            'settings.json',
            \`{ "delay": \${formData.get('delay')} }\`
          )
        }`.trim()

      const output = await pluginTransform(input, id)

      expect(output).toMatchInlineSnapshot(`
        "import fs from 'node:fs';
        const variable = 'value';
        export { formAction, arrowAction, variable };
        async function formAction(formData) {
          // A comment with 'use server' in it
          'use server';

          await fs.promises.writeFile('settings.json', \`{ "delay": \${formData.get('delay')} }\`);
        }
        const arrowAction = async formData => {
          'use server';

          await fs.promises.writeFile('settings.json', \`{ "delay": \${formData.get('delay')} }\`);
        };
        import { registerServerReference } from "react-server-dom-webpack/server";
        registerServerReference(formAction, "some/path/to/actions.ts", "formAction");
        registerServerReference(arrowAction, "some/path/to/actions.ts", "arrowAction");"
      `)
    })

    it.todo(
      "should handle named function and 'let' arrow function with separate export",
      async () => {
        const id = 'some/path/to/actions.ts'
        const input = `
        import fs from 'node:fs'

        const variable = 'value'

        export { formAction, letArrowAction, variable }

        async function formAction(formData: FormData) {
          // A comment with 'use server' in it
          'use server'

          await fs.promises.writeFile(
            'settings.json',
            \`{ "delay": \${formData.get('delay')} }\`
          )
        }

        // This one we don't know what'll happen to it. Had it been a const, we
        // could have transformed it without doing typeof first
        let letArrowAction = async (formData: FormData) => {
          'use server'

          await fs.promises.writeFile(
            'settings.json',
            \`{ "delay": \${formData.get('delay')} }\`
          )
        }

        letArrowAction = async (formData: FormData) => {
          // Not 'use server' anymore
        }

        `.trim()

        const output = await pluginTransform(input, id)

        expect(output).toMatchInlineSnapshot(`
        "import fs from 'node:fs';
        const variable = 'value';
        export { formAction, letArrowAction, variable };
        async function formAction(formData) {
          // A comment with 'use server' in it
          'use server';

          await fs.promises.writeFile('settings.json', \`{ "delay": \${formData.get('delay')} }\`);
        }

        // This one we don't know what'll happen to it. Had it been a const, we
        // could have transformed it without doing typeof first
        let letArrowAction = async formData => {
          'use server';

          await fs.promises.writeFile('settings.json', \`{ "delay": \${formData.get('delay')} }\`);
        };
        letArrowAction = async formData => {
          // Not 'use server' anymore
        };
        import { registerServerReference } from "react-server-dom-webpack/server";
        registerServerReference(formAction, "some/path/to/actions.ts", "formAction");
        if (typeof letArrowFunction === "function") registerServerReference(letArrowAction, "some/path/to/actions.ts", "letArrowAction");"
      `)
      },
    )

    it('should handle separate renamed export', async () => {
      const id = 'some/path/to/actions.ts'
      const input = `
        import fs from 'node:fs'

        async function formAction(formData: FormData) {
          'use server'

          await fs.promises.writeFile(
            'settings.json',
            \`{ "delay": \${formData.get('delay')} }\`
          )
        }

        const arrowAction = async (formData: FormData) => {
          'use server'

          await fs.promises.writeFile(
            'settings.json',
            \`{ "delay": \${formData.get('delay')} }\`
          )
        }

        export { formAction as fA, arrowAction }`.trim()

      const output = await pluginTransform(input, id)

      expect(output).toMatchInlineSnapshot(`
        "import fs from 'node:fs';
        async function formAction(formData) {
          'use server';

          await fs.promises.writeFile('settings.json', \`{ "delay": \${formData.get('delay')} }\`);
        }
        const arrowAction = async formData => {
          'use server';

          await fs.promises.writeFile('settings.json', \`{ "delay": \${formData.get('delay')} }\`);
        };
        export { formAction as fA, arrowAction };
        import { registerServerReference } from "react-server-dom-webpack/server";
        registerServerReference(formAction, "some/path/to/actions.ts", "fA");
        registerServerReference(arrowAction, "some/path/to/actions.ts", "arrowAction");"
      `)
    })

    it.todo('should handle default exported arrow function', async () => {
      const id = 'some/path/to/actions.ts'
      const input = `
        import fs from 'node:fs'

        export default const formAction = async (formData: FormData) => {
          'use server'

          await fs.promises.writeFile(
            'settings.json',
            \`{ "delay": \${formData.get('delay')} }\`
          )
        }`.trim()

      const output = await pluginTransform(input, id)

      if (typeof output !== 'string') {
        throw new Error('Expected output to be a string')
      }

      expect(output).toMatchInlineSnapshot(`
        "import fs from 'node:fs'

              export const formAction = async (formData: FormData) => {
                'use server'

                await fs.promises.writeFile(
                  'settings.json',
                  \`{ "delay": \${formData.get('delay')} }\`
                )
              }

        import {registerServerReference} from "react-server-dom-webpack/server";
        if (typeof formAction === "function") registerServerReference(formAction,"some/path/to/actions.ts","formAction");
        "
      `)
    })

    describe('without "use server"', () => {
      it('should not register named function', async () => {
        const id = 'some/path/to/actions.ts'
        const input = `
          import fs from 'node:fs'

          // A comment with 'use server' in it
          export async function formAction(formData: FormData) {
            await fs.promises.writeFile(
              'settings.json',
              \`{ "delay": \${formData.get('delay')} }\`
            )
          }`.trim()

        const output = await pluginTransform(input, id)

        if (typeof output !== 'string') {
          throw new Error('Expected output to be a string')
        }

        expect(output).toMatchInlineSnapshot(`
          "import fs from 'node:fs';

          // A comment with 'use server' in it
          export async function formAction(formData) {
            await fs.promises.writeFile('settings.json', \`{ "delay": \${formData.get('delay')} }\`);
          }"
        `)
      })

      it('should not register arrow function', async () => {
        const id = 'some/path/to/actions.ts'
        const input = `
          import fs from 'node:fs'

          // A comment with 'use server' in it
          export const formAction = async (formData: FormData) => {
            await fs.promises.writeFile(
              'settings.json',
              \`{ "delay": \${formData.get('delay')} }\`
            )
          }`.trim()

        const output = await pluginTransform(input, id)

        if (typeof output !== 'string') {
          throw new Error('Expected output to be a string')
        }

        expect(output).toMatchInlineSnapshot(`
          "import fs from 'node:fs';

          // A comment with 'use server' in it
          export const formAction = async formData => {
            await fs.promises.writeFile('settings.json', \`{ "delay": \${formData.get('delay')} }\`);
          };"
        `)
      })

      it('should not register default exported named function', async () => {
        const id = 'some/path/to/actions.ts'
        const input = `
          import fs from 'node:fs'

          // A comment with 'use server' in it
          export default async function formAction(formData: FormData) {
            await fs.promises.writeFile(
              'settings.json',
              \`{ "delay": \${formData.get('delay')} }\`
            )
          }`.trim()

        const output = await pluginTransform(input, id)

        if (typeof output !== 'string') {
          throw new Error('Expected output to be a string')
        }

        expect(output).toMatchInlineSnapshot(`
          "import fs from 'node:fs';

          // A comment with 'use server' in it
          export default async function formAction(formData) {
            await fs.promises.writeFile('settings.json', \`{ "delay": \${formData.get('delay')} }\`);
          }"
        `)
      })

      it('should not register exports with two consts', async () => {
        const id = 'some/path/to/actions.ts'
        const input = `
          import fs from 'node:fs'

          export const fortyTwo = () => 42, formAction = async (formData: FormData) => {
            'use server'

            await fs.promises.writeFile(
              'settings.json',
              \`{ "delay": \${formData.get('delay')} }\`
            )
          }`.trim()

        const output = await pluginTransform(input, id)

        expect(output).toMatchInlineSnapshot(`
          "import fs from 'node:fs';
          export const fortyTwo = () => 42,
            formAction = async formData => {
              'use server';

              await fs.promises.writeFile('settings.json', \`{ "delay": \${formData.get('delay')} }\`);
            };
          import { registerServerReference } from "react-server-dom-webpack/server";
          registerServerReference(formAction, "some/path/to/actions.ts", "formAction");"
        `)
      })

      it('should not register named function and arrow function with separate export', async () => {
        const id = 'some/path/to/actions.ts'
        const input = `
          import fs from 'node:fs'

          export { formAction, arrowAction }

          async function formAction(formData: FormData) {
            // A comment with 'use server' in it
            await fs.promises.writeFile(
              'settings.json',
              \`{ "delay": \${formData.get('delay')} }\`
            )
          }

          const arrowAction = async (formData: FormData) => {
            await fs.promises.writeFile(
              'settings.json',
              \`{ "delay": \${formData.get('delay')} }\`
            )
          }`.trim()

        const output = await pluginTransform(input, id)

        expect(output).toMatchInlineSnapshot(`
          "import fs from 'node:fs';
          export { formAction, arrowAction };
          async function formAction(formData) {
            // A comment with 'use server' in it
            await fs.promises.writeFile('settings.json', \`{ "delay": \${formData.get('delay')} }\`);
          }
          const arrowAction = async formData => {
            await fs.promises.writeFile('settings.json', \`{ "delay": \${formData.get('delay')} }\`);
          };"
        `)
      })

      it('should not register separate renamed export', async () => {
        const id = 'some/path/to/actions.ts'
        const input = `
          import fs from 'node:fs'

          async function formAction(formData: FormData) {
            // A comment with 'use server' in it
            await fs.promises.writeFile(
              'settings.json',
              \`{ "delay": \${formData.get('delay')} }\`
            )
          }

          const arrowAction = async (formData: FormData) => {
            // A comment with 'use server' in it
            await fs.promises.writeFile(
              'settings.json',
              \`{ "delay": \${formData.get('delay')} }\`
            )
          }

          export { formAction as fA, arrowAction }`.trim()

        const output = await pluginTransform(input, id)

        expect(output).toMatchInlineSnapshot(`
          "import fs from 'node:fs';
          async function formAction(formData) {
            // A comment with 'use server' in it
            await fs.promises.writeFile('settings.json', \`{ "delay": \${formData.get('delay')} }\`);
          }
          const arrowAction = async formData => {
            // A comment with 'use server' in it
            await fs.promises.writeFile('settings.json', \`{ "delay": \${formData.get('delay')} }\`);
          };
          export { formAction as fA, arrowAction };"
        `)
      })

      it('should not register default exported arrow function', async () => {
        const id = 'some/path/to/actions.ts'
        const input = `
          import fs from 'node:fs'

          export default async (formData: FormData) => {
            await fs.promises.writeFile(
              'settings.json',
              \`{ "delay": \${formData.get('delay')} }\`
            )
          }`.trim()

        const output = await pluginTransform(input, id)

        if (typeof output !== 'string') {
          throw new Error('Expected output to be a string')
        }

        expect(output).toMatchInlineSnapshot(`
          "import fs from 'node:fs'

                    export default async (formData: FormData) => {
                      await fs.promises.writeFile(
                        'settings.json',
                        \`{ "delay": \${formData.get('delay')} }\`
                      )
                    }"
        `)
      })
    })
  })

  describe('actions inside components', async () => {
    it('should handle self-contained named function inside default exported component', async () => {
      const id = 'some/path/to/Component.tsx'
      const input = `
        import fs from 'node:fs'

        export default async function MyComponent() {
          async function formAction(formData: FormData) {
            'use server'

            await fs.promises.writeFile(
              'settings.json',
              \`{ "delay": \${formData.get('delay')} }\`
            )
          }

          return (
            <form action={formAction}>
              <input type="number" name="delay" />
              <button type="submit">Submit</button>
            </form>
          )
        }`.trim()

      const output = await pluginTransform(input, id)

      if (typeof output !== 'string') {
        throw new Error('Expected output to be a string')
      }

      expect(output).toMatchInlineSnapshot(`
        "import fs from 'node:fs';
        export default async function MyComponent() {
          const formAction = __rwjs__rsa0_formAction;
          return <form action={formAction}>
                      <input type="number" name="delay" />
                      <button type="submit">Submit</button>
                    </form>;
        }
        import { registerServerReference } from "react-server-dom-webpack/server";
        export async function __rwjs__rsa0_formAction(formData: FormData) {
          'use server';

          await fs.promises.writeFile('settings.json', \`{ "delay": \${formData.get('delay')} }\`);
        }
        registerServerReference(__rwjs__rsa0_formAction, "some/path/to/Component.tsx", "__rwjs__rsa0_formAction");"
      `)
    })

    it.skip('should handle self-contained named function inside function with separate export', async () => {})
  })
})
