/**
 * Regression test: PauseGameOverModal must call the same hooks on every render.
 *
 * The modal used to `return null` before its hooks when `visible` was false,
 * so switching from hidden to visible crashed with
 * "Rendered more hooks than during the previous render" (react-hooks/rules-of-hooks).
 */
import React from 'react'

// react-test-renderer ships with jest-expo (same version as react) but has no
// bundled type declarations, so describe the small surface this test uses.
interface TestRendererInstance {
  toJSON(): unknown
  update(element: React.ReactElement): void
}
// eslint-disable-next-line @typescript-eslint/no-require-imports -- untyped module, typed locally above
const { create, act } = require('react-test-renderer') as {
  create(element: React.ReactElement): TestRendererInstance
  act(callback: () => void): void
}

// Lightweight host-component stand-ins; the real react-native package is not
// transformable under this repo's ts-jest/node test environment.
jest.mock('react-native', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories cannot use imports
  const R = require('react')
  const host = (name: string) => (props: Record<string, unknown>) =>
    R.createElement(name, props, props.children as React.ReactNode)
  return {
    View: host('View'),
    Text: host('Text'),
    Pressable: host('Pressable'),
    Modal: host('Modal'),
  }
})

jest.mock('react-native-reanimated', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories cannot use imports
  const R = require('react')
  const host = (name: string) => (props: Record<string, unknown>) =>
    R.createElement(name, props, props.children as React.ReactNode)
  return {
    __esModule: true,
    default: { View: host('Animated.View'), Text: host('Animated.Text') },
    useSharedValue: jest.fn((initial: number) => R.useRef({ value: initial }).current),
    useAnimatedStyle: jest.fn((factory: () => object) => R.useMemo(factory, [])),
    withSpring: (to: number) => to,
    withTiming: (to: number) => to,
    runOnJS: (fn: unknown) => fn,
  }
})

// eslint-disable-next-line import/first
import { PauseGameOverModal, PauseGameOverModalProps } from '../components/game-ui/modals/PauseGameOverModal'
// eslint-disable-next-line import/first
import { useSharedValue, useAnimatedStyle } from 'react-native-reanimated'

// Required by React 19 so act() does not warn in a non-browser environment.
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const colors = new Proxy({}, { get: () => '#000000' }) as PauseGameOverModalProps['colors']

const baseProps: PauseGameOverModalProps = {
  visible: false,
  lives: 0,
  score: 1234,
  wave: 5,
  credits: 42,
  highScores: [],
  onRestart: jest.fn(),
  onContinue: jest.fn(),
  colors,
}

const hookCallsDuring = (render: () => void) => {
  const shared = useSharedValue as unknown as jest.Mock
  const styles = useAnimatedStyle as unknown as jest.Mock
  shared.mockClear()
  styles.mockClear()
  render()
  return { sharedValues: shared.mock.calls.length, animatedStyles: styles.mock.calls.length }
}

describe('PauseGameOverModal hook order', () => {
  it('calls the same hooks whether hidden or visible (rules-of-hooks)', () => {
    let renderer!: TestRendererInstance
    const hidden = hookCallsDuring(() =>
      act(() => {
        renderer = create(React.createElement(PauseGameOverModal, baseProps))
      })
    )
    const visible = hookCallsDuring(() =>
      act(() => {
        renderer.update(React.createElement(PauseGameOverModal, { ...baseProps, visible: true }))
      })
    )
    expect(visible.sharedValues).toBeGreaterThan(0)
    expect(hidden).toEqual(visible)
  })

  it('renders nothing while hidden', () => {
    let renderer!: TestRendererInstance
    act(() => {
      renderer = create(React.createElement(PauseGameOverModal, baseProps))
    })
    expect(renderer.toJSON()).toBeNull()
  })

  it.each([
    ['game over', 0],
    ['paused', 3],
  ])('can toggle hidden -> visible -> hidden without a hook-order error (%s)', (_label, lives) => {
    const props = { ...baseProps, lives }
    let renderer!: TestRendererInstance
    act(() => {
      renderer = create(React.createElement(PauseGameOverModal, props))
    })
    expect(() =>
      act(() => {
        renderer.update(React.createElement(PauseGameOverModal, { ...props, visible: true }))
      })
    ).not.toThrow()
    expect(renderer.toJSON()).not.toBeNull()
    expect(() =>
      act(() => {
        renderer.update(React.createElement(PauseGameOverModal, { ...props, visible: false }))
      })
    ).not.toThrow()
    expect(renderer.toJSON()).toBeNull()
  })
})
