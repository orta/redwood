import path from 'path'

import pluginTester from 'babel-plugin-tester'

import plugin from '../babel-plugin-redwood-prerender-media-imports'

const mockDistDir = path.resolve(__dirname, './__fixtures__/distDir')

jest.mock('@redwoodjs/project-config', () => {
  return {
    ...jest.requireActual('@redwoodjs/project-config'),
    getPaths: () => {
      return {
        web: {
          dist: mockDistDir,
        },
      }
    },
  }
})

jest.mock('../utils', () => {
  return {
    convertToDataUrl: (assetPath) => {
      return `data:image/jpg;base64,xxx-mock-b64-${assetPath}`
    },
  }
})

describe('Should replace larger imports based on generated manifest', () => {
  pluginTester({
    plugin,
    pluginName: 'babel-plugin-redwood-prerender-media-imports',
    tests: [
      {
        title: 'Handle jpgs',
        code: `import img1 from './image1.jpg'`,
        output: `const img1 = '/static/media/myImageOne.hash.jpg'`,
      },
      {
        title: 'Handle jpegs',

        code: `import img2 from './image2.jpeg'`,
        output: `const img2 = '/static/media/myImageTwo.hash.jpeg'`,
      },
      {
        title: 'Handle pngs',

        code: `import img3 from './image3.png'`,
        output: `const img3 = '/static/media/myImageThree.hash.png'`,
      },
      {
        title: 'Handle bmps',
        code: `import img4 from './image4.bmp'`,
        output: `const img4 = '/static/media/myImageFour.hash.bmp'`,
      },
      {
        title: 'Handle pdfs',

        code: `import pdfDoc from './terms.pdf'`,
        output: `const pdfDoc = '/static/media/terms.pdf'`,
      },
      {
        title: 'Handle gifs',
        code: `import nyanCat from './nyan.gif'`,
        output: `const nyanCat = '/static/media/nyanKitty.gif'`,
      },
    ],
  })

  afterAll(() => {
    jest.clearAllMocks()
  })
})

describe('Should replace small img sources with blank data url', () => {
  // These imports aren't in the manifest
  // which simulates that they were handled by the url loader
  pluginTester({
    plugin,
    // disable formatter for this test
    formatResult: (r) => r,
    pluginName: 'babel-plugin-redwood-prerender-media-imports',
    tests: [
      {
        title: 'Url loaded image',
        code: `import img1 from './small.jpg'`,
        output: `const img1 = "data:image/jpg;base64,xxx-mock-b64-small.jpg";`,
      },
    ],
  })

  afterAll(() => {
    jest.clearAllMocks()
  })
})
