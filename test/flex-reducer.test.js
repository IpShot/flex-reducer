import React from 'react';
import { memo, useEffect, useLayoutEffect } from 'react';
import { renderHook, act, cleanup } from '@testing-library/react-hooks';
import * as rtl from '@testing-library/react';
import shallowEqual from '../src/shallowEqual';
import { getCache, getContext, reset } from '../src/flexReducer';
import {
  useFlexReducer,
  useSelector,
  dispatch,
  reducerName,
  uniqueType,
  getState,
} from '../src';

describe('Flex Reducer', () => {
  let pInitialState
  let cInitialState
  let pReducer
  let cReducer
  let state
  let cState
  let scState
  let pRenders
  let cRenders
  let scRenders
  let renders
  let Parent
  let Child
  let SubChild

  beforeEach(() => {
    reset()
    rtl.cleanup()
    cleanup()
    pInitialState = {
      __reducer__: 'parent',
      value: 'Hello Parent!',
    }
    cInitialState = {
      value: 'Hello Child!',
    }
    pReducer = (state, action) => {
      switch (action.type) {
        case 'UPDATE_PARENT':
          return {
            ...state,
            value: action.payload
          }
        default:
          return state
      }
    }
    cReducer = (state, action) => {
      switch (action.type) {
        case 'UPDATE_CHILD':
          return {
            ...state,
            value: action.payload
          }
        default:
          return state
      }
    }
    state = undefined
    cState = undefined
    scState = undefined
    pRenders = 0
    cRenders = 0
    scRenders = 0
    renders = []
    SubChild = () => {
      [scState] = useSelector(s => s)
      scRenders += 1
      renders.push('SubChild')
      return <span />
    }
    Child = () => {
      [cState] = useFlexReducer(cReducer, cInitialState, reducerName('child'))
      cRenders += 1
      renders.push('Child')
      return (
        <div>
          <SubChild />
        </div>
      )
    }
    Parent = ({ mountChild = true }) => {
      [state] = useFlexReducer(pReducer, pInitialState)
      pRenders += 1
      renders.push('Parent')
      return (
        <div>
          {mountChild && <Child />}
        </div>
      )
    }
  })

  const pAction = (payload) => ({
    type: 'UPDATE_PARENT',
    payload
  })
  const cAction = (payload) => ({
    type: 'UPDATE_CHILD',
    payload
  })

  describe('useFlexReducer', () => {
    it('should return [state][reducer_name] equal to initial state on initial render', () => {
      const { result } = renderHook(
        () => useFlexReducer(pReducer, pInitialState)
      )
      expect(result.current[0].parent).toEqual(pInitialState)
    })
    it('should return dispatch', () => {
      const { result } = renderHook(
        () => useFlexReducer(pReducer, pInitialState)
      )
      expect(result.current[1]).toEqual(dispatch)
    })
    it('should return updated state on dispatch', () => {
      const { result } = renderHook(
        () => useFlexReducer(pReducer, pInitialState)
      )
      expect(result.current[0].parent.value).toBe('Hello Parent!')
      act(() => {
        dispatch(pAction('Bye Parent!'))
      })
      expect(result.current[0].parent.value).toBe('Bye Parent!')
    })
    it('should return the latest state on rerender', () => {
      const { result, rerender } = renderHook(
        () => useFlexReducer(pReducer, pInitialState)
      )
      expect(result.current[0].parent.value).toBe('Hello Parent!')
      act(() => {
        dispatch(pAction('Bye Parent!'))
      })
      expect(result.current[0].parent.value).toBe('Bye Parent!')
      rerender()
      expect(result.current[0].parent.value).toBe('Bye Parent!')
    })
    it('should return the latest state on multiple dispatches of the same reducer', () => {
      const { result } = renderHook(
        () => useFlexReducer(pReducer, pInitialState)
      )
      expect(result.current[0].parent.value).toBe('Hello Parent!')
      act(() => {
        dispatch(pAction('Bye Parent!'))
        dispatch(pAction('Last Parent!'))
      })
      expect(result.current[0].parent.value).toBe('Last Parent!')
    })
    it('should return the latest state on multiple dispatches of different reducers', () => {
      rtl.render(<Parent />)
      expect(state.parent.value).toBe('Hello Parent!')
      expect(cState.parent.value).toBe('Hello Parent!')
      expect(state.child.value).toBe('Hello Child!')
      expect(cState.child.value).toBe('Hello Child!')
      rtl.act(() => {
        dispatch(pAction('Last Parent!'))
        dispatch(cAction('Last Child!'))
      })
      expect(state.parent.value).toBe('Last Parent!')
      expect(cState.parent.value).toBe('Last Parent!')
      expect(state.child.value).toBe('Last Child!')
      expect(cState.child.value).toBe('Last Child!')
    })
    it('should return the latest state on every async dispatch', async () => {
      const { result } = renderHook(
        () => useFlexReducer(pReducer, pInitialState)
      )
      expect(result.current[0].parent.value).toBe('Hello Parent!')
      await new Promise((resolve) => {
        act(() => {
          dispatch(pAction('Bye Parent!'))
        })
        resolve()
      })
      expect(result.current[0].parent.value).toBe('Bye Parent!')
      await new Promise((resolve) => {
        act(() => {
          dispatch(pAction('Last Parent!'))
        })
        resolve()
      })
      expect(result.current[0].parent.value).toBe('Last Parent!')
    })
    it('should call one render on a dispatches sequence', () => {
      expect(pRenders).toBe(0)
      expect(cRenders).toBe(0)
      expect(scRenders).toBe(0)
      rtl.render(<Parent />)
      expect(pRenders).toBe(1)
      expect(cRenders).toBe(1)
      expect(scRenders).toBe(1)
      rtl.act(() => {
        dispatch(pAction('Last Parent!'))
        dispatch(cAction('Last Child!'))
      })
      expect(pRenders).toBe(2)
      expect(cRenders).toBe(2)
      expect(scRenders).toBe(2)
    })
    it('should run dispatches in order from ancestor to descendant on dispatch', () => {
      expect(renders).toEqual([])
      rtl.render(<Parent />)
      expect(renders).toEqual(['Parent', 'Child', 'SubChild'])
      renders = []
      rtl.act(() => {
        dispatch(pAction('First Parent!'))
      })
      expect(renders).toEqual(['Parent', 'Child', 'SubChild'])
      renders = []
      rtl.act(() => {
        dispatch(cAction('First Child!'))
      })
      expect(renders).toEqual(['Parent', 'Child', 'SubChild'])
    })
    it('should run dispatches in order from ancestor to descendant on dispatch after unmount and mount of child', () => {
      const { rerender } = rtl.render(<Parent />)
      expect(renders).toEqual(['Parent', 'Child', 'SubChild'])

      renders = []
      rtl.act(() => {
        dispatch(pAction('First Parent!'))
      })
      expect(renders).toEqual(['Parent', 'Child', 'SubChild'])

      renders = []
      rerender(<Parent mountChild={false} />)
      expect(renders).toEqual(['Parent'])
      rtl.act(() => {
        dispatch(pAction('First Parent!'))
      })
      expect(renders).toEqual(['Parent', 'Parent'])

      renders = []
      rerender(<Parent />)
      expect(renders).toEqual(['Parent', 'Child', 'SubChild'])

      renders = []
      rtl.act(() => {
        dispatch(pAction('First Parent!'))
      })
      expect(renders).toEqual(['Parent', 'Child', 'SubChild'])
    })
    it('should return cached state if component unmounted and mounted again', () => {
      const { unmount } = rtl.render(<Parent />)
      expect(state.parent.value).toBe('Hello Parent!')
      expect(state.child.value).toBe('Hello Child!')
      expect(cState.parent.value).toBe('Hello Parent!')
      expect(cState.child.value).toBe('Hello Child!')
      rtl.act(() => {
        dispatch(pAction('Bye Parent!'))
      })
      expect(state.parent.value).toBe('Bye Parent!')
      expect(state.child.value).toBe('Hello Child!')
      expect(cState.parent.value).toBe('Bye Parent!')
      expect(cState.child.value).toBe('Hello Child!')

      const oldState = { ...state }
      const oldCState = { ...cState }
      unmount()
      rtl.render(<Parent />)
      expect(oldState).toEqual(state)
      expect(oldCState).toEqual(cState)
      expect(oldState.parent.value).toBe('Bye Parent!')
      expect(oldState.child.value).toBe('Hello Child!')
      expect(oldCState.parent.value).toBe('Bye Parent!')
      expect(oldCState.child.value).toBe('Hello Child!')
    })
    it('should return initial state if component unmounted and mounted again and cache option set to false', () => {
      Parent = () => {
        [state] = useFlexReducer(pReducer, pInitialState, null, { cache: false })
        return (
          <div>
            <Child />
          </div>
        )
      }
      const { unmount } = rtl.render(<Parent />)
      expect(state.parent.value).toBe('Hello Parent!')
      expect(cState.parent.value).toBe('Hello Parent!')
      expect(state.child.value).toBe('Hello Child!')
      expect(cState.child.value).toBe('Hello Child!')
      rtl.act(() => {
        dispatch(pAction('Bye Parent!'))
        dispatch(cAction('Bye Child!'))
      })
      expect(state.parent.value).toBe('Bye Parent!')
      expect(cState.parent.value).toBe('Bye Parent!')
      expect(state.child.value).toBe('Bye Child!')
      expect(cState.child.value).toBe('Bye Child!')
      const oldState = { ...state }
      const oldCState = { ...cState }
      unmount()
      rtl.render(<Parent />)
      expect(state.parent).toEqual(pInitialState)
      expect(cState.parent).toEqual(pInitialState)
      expect(state.child).not.toEqual(cInitialState)
      expect(cState.child).not.toEqual(cInitialState)
      expect(state.parent.value).toBe('Hello Parent!')
      expect(cState.parent.value).toBe('Hello Parent!')
      expect(state.child.value).toBe('Bye Child!')
      expect(cState.child.value).toBe('Bye Child!')
    })
    it('should throw an error if reducer is missing', () => {
      const { result } = renderHook(
        () => useFlexReducer()
      )
      expect(result.error).not.toBe(undefined)
    })
    it('should throw an error if initialState is missing', () => {
      const { result } = renderHook(
        () => useFlexReducer(pReducer)
      )
      expect(result.error).not.toBe(undefined)
    })
    it('should throw an error if initialState.__reducer__ name is missing', () => {
      const { result } = renderHook(
        () => useFlexReducer(cReducer, cInitialState)
      )
      expect(result.error).not.toBe(undefined)
    })
    it('should throw an error if initialState.__reducer__ name is duplicating', () => {
      renderHook(
        () => useFlexReducer(pReducer, pInitialState)
      )
      const { result } = renderHook(
        () => useFlexReducer(cReducer, pInitialState)
      )
      const { result: cResult } = renderHook(
        () => useFlexReducer(cReducer, cInitialState, reducerName(pInitialState.__reducer__))
      )
      expect(result.error).not.toBe(undefined)
      expect(cResult.error).not.toBe(undefined)
    })
  })
})
