import React from 'react'

import { act, render, waitFor } from '@testing-library/react'

import { Route, Router, navigate, routes } from '../'
import { Set } from '../Set'
import { analyzeRoutes } from '../util'

import '@testing-library/jest-dom/extend-expect'

const HomePage = () => {
  return <p>Home Page</p>
}

interface ContextState {
  contextValue: string
  setContextValue: React.Dispatch<React.SetStateAction<string>>
}

const SetContext = React.createContext<ContextState | undefined>(undefined)

const SetContextProvider = ({ children }) => {
  const [contextValue, setContextValue] = React.useState('initialSetValue')

  return (
    <SetContext.Provider value={{ contextValue, setContextValue }}>
      {children}
    </SetContext.Provider>
  )
}

const Ctx1Page = () => {
  const ctx = React.useContext(SetContext)

  React.useEffect(() => {
    ctx?.setContextValue('updatedSetValue')
  }, [ctx])

  return <p>1-{ctx?.contextValue}</p>
}

const Ctx2Page = () => {
  const ctx = React.useContext(SetContext)

  return <p>2-{ctx?.contextValue}</p>
}

const Ctx3Page = () => {
  const ctx = React.useContext(SetContext)

  return <p>3-{ctx?.contextValue}</p>
}

const Ctx4Page = () => {
  const ctx = React.useContext(SetContext)

  return <p>4-{ctx?.contextValue}</p>
}

const TestRouter = () => {
  return (
    <Router>
      <Route path="/" page={HomePage} name="home" />
      <Set wrap={SetContextProvider}>
        <Route path="/ctx-1-page" page={Ctx1Page} name="ctx1" />
        <Route path="/ctx-2-page" page={Ctx2Page} name="ctx2" />
        <Set wrap={SetContextProvider}>
          <Route path="/ctx-3-page" page={Ctx3Page} name="ctx3" />
        </Set>
      </Set>
      <Set wrap={SetContextProvider}>
        <Route path="/ctx-4-page" page={Ctx4Page} name="ctx4" />
      </Set>
    </Router>
  )
}

test("Doesn't destroy <Set> when navigating inside, but does when navigating between", async () => {
  const screen = render(<TestRouter />)

  await waitFor(() => screen.getByText('Home Page'))

  act(() => navigate(routes.ctx1()))
  await waitFor(() => screen.getByText('1-updatedSetValue'))
  act(() => navigate(routes.ctx2()))
  await waitFor(() => screen.getByText('2-updatedSetValue'))
  act(() => navigate(routes.ctx3()))
  await waitFor(() => screen.getByText('3-initialSetValue'))
  act(() => navigate(routes.ctx4()))
  await waitFor(() => screen.getByText('4-initialSetValue'))
})

test('Pages are correctly given a setId if they are nested in', () => {
  const { pathRouteMap } = analyzeRoutes(TestRouter().props.children, {
    currentPathName: '/',
  })

  expect(pathRouteMap['/'].setId).toBe(0)
  expect(pathRouteMap['/ctx-1-page'].setId).toBe(1)
  expect(pathRouteMap['/ctx-2-page'].setId).toBe(1)
  expect(pathRouteMap['/ctx-3-page'].setId).toBe(2)
  expect(pathRouteMap['/ctx-4-page'].setId).toBe(3)
})
