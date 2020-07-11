import React, { memo, useEffect, useLayoutEffect } from 'react';
import { renderHook, act, cleanup } from '@testing-library/react-hooks';
import * as rtl from '@testing-library/react';
import { reset } from '../src/flexReducer';
import {
  useFlexReducer,
  useSelector,
  dispatch,
  shallowEqual,
  getState,
} from '../src';

describe('Flex Reducer', () => {
  let pInitialState
  let cInitialState
  let pReducer
  let cReducer
  let pAction
  let cAction
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
    rtl.cleanup()
    cleanup()
    reset()
    pInitialState = {
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
    pAction = (payload) => dispatch({
      type: 'UPDATE_PARENT',
      payload
    })
    cAction = (payload) => dispatch({
      type: 'UPDATE_CHILD',
      payload
    })
    state = undefined
    cState = undefined
    scState = undefined
    pRenders = 0
    cRenders = 0
    scRenders = 0
    renders = []
    SubChild = () => {
      scState = useSelector(s => s.parent.value)
      scRenders += 1
      renders.push('SubChild')
      return <span />
    }
    Child = () => {
      [cState] = useFlexReducer('child', cReducer, cInitialState)
      cRenders += 1
      renders.push('Child')
      return (
        <div>
          <SubChild />
        </div>
      )
    }
    Parent = ({ mountChild = true }) => {
      [state] = useFlexReducer('parent', pReducer, pInitialState)
      pRenders += 1
      renders.push('Parent')
      return (
        <div>
          {mountChild && <Child />}
        </div>
      )
    }
  })

  describe('dispatch', () => {
    it('should dispatch an action', () => {
      rtl.render(<Parent />)
      expect(state.value).toBe(pInitialState.value)
      rtl.act(() => {
        dispatch({
          type: 'UPDATE_PARENT',
          payload: 'Updated Parent'
        })
      })
      expect(state.value).toBe('Updated Parent')
    })
    it('should throw an error if action type is an empty string', () => {
      rtl.render(<Parent />)
      expect(() => {
        rtl.act(() => {
          dispatch({
            type: '',
            payload: 'Updated Parent'
          })
        })
      }).toThrow('Wrong action format.')
    })
    it('should throw an error if action type is not a string', () => {
      rtl.render(<Parent />)
      expect(() => {
        rtl.act(() => {
          dispatch({
            type: 1,
            payload: 'Updated Parent'
          })
        })
      }).toThrow('Wrong action format.')
    })
  })
  describe('useFlexReducer', () => {
    it('should return [state][reducer_name] equal to initial state on initial render', () => {
      const { result } = renderHook(
        () => useFlexReducer('parent', pReducer, pInitialState)
      )
      expect(result.current[0]).toEqual(pInitialState)
    })
    it('should return dispatch', () => {
      const { result } = renderHook(
        () => useFlexReducer('parent', pReducer, pInitialState)
      )
      expect(result.current[1]).toEqual(dispatch)
    })
    it('should return updated state on dispatch', () => {
      const { result } = renderHook(
        () => useFlexReducer('parent', pReducer, pInitialState)
      )
      expect(result.current[0].value).toBe('Hello Parent!')
      act(() => {
        pAction('Bye Parent!')
      })
      expect(result.current[0].value).toBe('Bye Parent!')
    })
    it('should return the latest state on rerender', () => {
      const { result, rerender } = renderHook(
        () => useFlexReducer('parent', pReducer, pInitialState)
      )
      expect(result.current[0].value).toBe('Hello Parent!')
      act(() => {
        pAction('Bye Parent!')
      })
      expect(result.current[0].value).toBe('Bye Parent!')
      rerender()
      expect(result.current[0].value).toBe('Bye Parent!')
    })
    it('should return the latest state on multiple dispatches of the same reducer', () => {
      const { result } = renderHook(
        () => useFlexReducer('parent', pReducer, pInitialState)
      )
      expect(result.current[0].value).toBe('Hello Parent!')
      act(() => {
        pAction('Bye Parent!')
        pAction('Last Parent!')
      })
      expect(result.current[0].value).toBe('Last Parent!')
    })
    it('should return the latest state on multiple dispatches of different reducers', () => {
      rtl.render(<Parent />)
      expect(state.value).toBe('Hello Parent!')
      expect(cState.value).toBe('Hello Child!')
      rtl.act(() => {
        pAction('Last Parent!')
        cAction('Last Child!')
      })
      expect(state.value).toBe('Last Parent!')
      expect(cState.value).toBe('Last Child!')
    })
    it('should return the latest state on any async dispatch', async () => {
      Parent = () => {
        [state] = useFlexReducer('parent', pReducer, pInitialState)
        pRenders += 1
        return <button onClick={() => pAction('Bye Parent!')}>Button</button>
      }
      rtl.render(<Parent />)
      expect(state.value).toEqual('Hello Parent!')
      rtl.fireEvent.click(rtl.screen.getByText('Button'))
      expect(state.value).toEqual('Bye Parent!')
      await new Promise((resolve) => {
        rtl.act(() => {
          pAction('Last Parent!')
        })
        resolve()
      })
      expect(state.value).toEqual('Last Parent!')
    })
    it('should call one render on multiple dispatches at time', () => {
      rtl.render(<Parent />)
      expect(pRenders).toBe(1)
      expect(cRenders).toBe(1)
      expect(scRenders).toBe(1)
      rtl.act(() => {
        pAction('Bye Parent!')
        pAction('Last Parent!')
        cAction('Bye Child!')
        cAction('Last Child!')
      })
      expect(pRenders).toBe(2)
      expect(cRenders).toBe(2)
      expect(scRenders).toBe(2)
    })
    it('should not call a render on dispatch if it doesn\'t change state', () => {
      rtl.render(<Parent />)
      expect(pRenders).toBe(1)
      expect(cRenders).toBe(1)
      expect(scRenders).toBe(1)
      rtl.act(() => {
        pAction('Bye Parent!')
      })
      expect(pRenders).toBe(2)
      expect(cRenders).toBe(2)
      expect(scRenders).toBe(2)
      rtl.act(() => {
        pAction('Bye Parent!')
      })
      expect(pRenders).toBe(2)
      expect(cRenders).toBe(2)
      expect(scRenders).toBe(2)
    })
    it('should call a render on dispatch an action belong to it whether component memoized or not', () => {
      Child = memo(() => {
        [cState] = useFlexReducer('child', cReducer, cInitialState)
        cRenders += 1
        return (
          <div>
            <SubChild />
          </div>
        )
      })
      rtl.render(<Parent />)
      expect(cRenders).toBe(1)
      expect(scRenders).toBe(1)
      rtl.act(() => {
        cAction('Last Child!')
      })
      expect(cRenders).toBe(2)
      expect(scRenders).toBe(2)
    })
    it('should call renders in order from ancestor to descendant on dispatch', () => {
      expect(renders).toEqual([])
      rtl.render(<Parent />)
      expect(renders).toEqual(['Parent', 'Child', 'SubChild'])
      renders = []
      rtl.act(() => {
        pAction('First Parent!')
      })
      expect(renders).toEqual(['Parent', 'Child', 'SubChild'])
      renders = []
      rtl.act(() => {
        cAction('First Child!')
      })
      expect(renders).toEqual(['Child', 'SubChild'])
    })
    it('should call renders in order from ancestor to descendant on dispatch after unmount and mount of child', () => {
      const { rerender } = rtl.render(<Parent />)
      expect(renders).toEqual(['Parent', 'Child', 'SubChild'])

      renders = []
      rtl.act(() => {
        pAction('First Parent!')
      })
      expect(renders).toEqual(['Parent', 'Child', 'SubChild'])

      renders = []
      rerender(<Parent mountChild={false} />)
      expect(renders).toEqual(['Parent'])
      rtl.act(() => {
        pAction('Last Parent!')
      })
      expect(renders).toEqual(['Parent', 'Parent'])

      renders = []
      rerender(<Parent />)
      expect(renders).toEqual(['Parent', 'Child', 'SubChild'])

      renders = []
      rtl.act(() => {
        pAction('First Parent!')
      })
      expect(renders).toEqual(['Parent', 'Child', 'SubChild'])
    })
    it('should call render on dispatch inside useEffect', () => {
      Parent = () => {
        [state] = useFlexReducer('parent', pReducer, pInitialState)
        useEffect(() => {
          pAction('Bye Parent!')
        }, [])
        pRenders += 1
        renders.push(state.value)
        return <span />
      }
      rtl.render(<Parent />)
      expect(pRenders).toBe(2)
      expect(renders).toEqual(['Hello Parent!', 'Bye Parent!'])
    })
    it('should call render on dispatch inside useLayoutEffect', () => {
      Parent = () => {
        [state] = useFlexReducer('parent', pReducer, pInitialState)
        useLayoutEffect(() => {
          pAction('Bye Parent!')
        }, [])
        pRenders += 1
        renders.push(state.value)
        return <span />
      }
      rtl.render(<Parent />)
      expect(pRenders).toBe(2)
      expect(renders).toEqual(['Hello Parent!', 'Bye Parent!'])
    })
    it('should call render on action call (click event)', () => {
      Child = () => {
        [cState] = useFlexReducer('child', cReducer, cInitialState)
        cRenders += 1
        function handleClick() {
          cAction('Bye Child!')
        }
        return (
          <div>
            <button onClick={handleClick}>Button</button>
            <SubChild />
          </div>
        )
      }
      rtl.render(<Parent />)
      expect(pRenders).toBe(1)
      expect(cRenders).toBe(1)
      expect(scRenders).toBe(1)
      rtl.fireEvent.click(rtl.screen.getByText('Button'))
      expect(pRenders).toBe(1)
      expect(cRenders).toBe(2)
      expect(scRenders).toBe(2)
      rtl.fireEvent.click(rtl.screen.getByText('Button'))
      rtl.fireEvent.click(rtl.screen.getByText('Button'))
      expect(pRenders).toBe(1)
      expect(cRenders).toBe(2)
      expect(scRenders).toBe(2)
    })
    it('should return cached state if component unmounted and mounted again', () => {
      const { unmount } = rtl.render(<Parent />)
      expect(state.value).toBe('Hello Parent!')
      expect(cState.value).toBe('Hello Child!')
      rtl.act(() => {
        pAction('Bye Parent!')
      })
      expect(state.value).toBe('Bye Parent!')
      expect(cState.value).toBe('Hello Child!')

      const oldState = { ...state }
      const oldCState = { ...cState }
      unmount()
      rtl.render(<Parent />)
      expect(oldState).toEqual(state)
      expect(oldCState).toEqual(cState)
      expect(oldState.value).toBe('Bye Parent!')
      expect(oldCState.value).toBe('Hello Child!')
    })
    it('should return initial state if component unmounted and mounted again and cache option set to false', () => {
      Parent = () => {
        [state] = useFlexReducer('parent', pReducer, pInitialState, { cache: false })
        return (
          <div>
            <Child />
          </div>
        )
      }
      const { unmount } = rtl.render(<Parent />)
      expect(state.value).toBe('Hello Parent!')
      expect(cState.value).toBe('Hello Child!')
      rtl.act(() => {
        pAction('Bye Parent!')
        cAction('Bye Child!')
      })
      expect(state.value).toBe('Bye Parent!')
      expect(cState.value).toBe('Bye Child!')
      const oldState = { ...state }
      const oldCState = { ...cState }
      unmount()
      rtl.render(<Parent />)
      expect(state).toEqual(pInitialState)
      expect(cState).not.toEqual(cInitialState)
      expect(state.value).toBe('Hello Parent!')
      expect(cState.value).toBe('Bye Child!')
    })
    it('should not throw "reducer already in use" error if one component unmounted and another with the same reducer name is mounted and both happened through the same render', () => {
      const Child2 = () => {
        useFlexReducer('child', cReducer, cInitialState)
        return <div />
      }
      Parent = ({ mountChild = true }) => {
        useFlexReducer('parent', pReducer, pInitialState)
        return (
          <div>
            {mountChild && <Child />}
            {!mountChild && <Child2 />}
          </div>
        )
      }
      const { rerender } = rtl.render(<Parent />)
      rerender(<Parent mountChild={false} />)
    })
    it('should throw an error if reducer name is missing', () => {
      const { result } = renderHook(
        () => useFlexReducer()
      )
      expect(result.error).not.toBe(undefined)
    })
    it('should throw an error if reducer is missing', () => {
      const { result } = renderHook(
        () => useFlexReducer('parent')
      )
      expect(result.error).not.toBe(undefined)
    })
    it('should throw an error if initialState is missing', () => {
      const { result } = renderHook(
        () => useFlexReducer('parent', pReducer)
      )
      expect(result.error).not.toBe(undefined)
    })
  })
  describe('useSelector', () => {
    it('should call render on change value used by selector whether component memoized or not', () => {
      SubChild = memo(SubChild)
      rtl.render(<Parent />)
      expect(scRenders).toBe(1)
      expect(scState).toBe('Hello Parent!')
      rtl.act(() => {
        pAction('Bye Parent!')
      })
      expect(scRenders).toBe(2)
      expect(scState).toBe('Bye Parent!')
    })
    it('should not call render of memoized component on change value not used by selector', () => {
      SubChild = memo(SubChild)
      rtl.render(<Parent />)
      expect(scRenders).toBe(1)
      rtl.act(() => {
        cAction('Bye Child!')
      })
      expect(scRenders).toBe(1)
    })
    it('should apply second arg as equality function to decide should component be rendered or not', () => {
      SubChild = memo(() => {
        scState = useSelector(s => ({ value: s.parent.value }))
        scRenders += 1
        return <span />
      })
      const { unmount } = rtl.render(<Parent />)
      expect(scRenders).toBe(1)
      rtl.act(() => {
        pAction('Hello Parent!')
      })
      expect(scRenders).toBe(2)
      unmount()
      scRenders = 0
      SubChild = memo(() => {
        scState = useSelector(s => ({ value: s.parent.value }), shallowEqual)
        scRenders += 1
        renders.push('SubChild')
        return <span />
      })
      rtl.render(<Parent />)
      expect(scRenders).toBe(1)
      rtl.act(() => {
        pAction('Hello Parent!')
      })
      expect(scRenders).toBe(1)
    })
    it('should throw an error if selector is not a function', () => {
      SubChild = () => {
        expect(() => {
          scState = useSelector('function')
        }).toThrow('Selector must be a function.')
        return <span />
      }
      rtl.render(<SubChild />)
    })
    it('should throw an error if equality function is not a function', () => {
      SubChild = () => {
        expect(() => {
          scState = useSelector(() => {}, 'function')
        }).toThrow('Equality function must be a function.')
        return <span />
      }
      rtl.render(<SubChild />)
    })
  })
  describe('check if useFlexReducer and useSelector work well with props', () => {
    it('should call one render on dispatch and props change happened together', () => {
      SubChild = memo(() => {
        scState = useSelector(s => s.parent.value)
        scRenders += 1
        return <span />
      })
      Child = ({ parentValue }) => {
        [cState] = useFlexReducer('child', cReducer, cInitialState)
        cRenders += 1
        return (
          <div>
            {parentValue}
            <SubChild />
          </div>
        )
      }
      Parent = () => {
        [state] = useFlexReducer('parent', pReducer, pInitialState)
        pRenders += 1
        renders.push(state.value)
        return (
          <div>
            <Child parentValue={[...renders]}/>
          </div>
        )
      }
      rtl.render(<Parent />)
      expect(pRenders).toBe(1)
      expect(cRenders).toBe(1)
      expect(scRenders).toBe(1)
      expect(renders).toEqual(['Hello Parent!'])
      rtl.act(() => {
        cAction('Bye Child!')
      })
      expect(pRenders).toBe(1)
      expect(cRenders).toBe(2)
      expect(scRenders).toBe(1)
      expect(renders).toEqual(['Hello Parent!'])
      rtl.act(() => {
        pAction('Bye Parent!')
      })
      expect(pRenders).toBe(2)
      expect(cRenders).toBe(3)
      expect(scRenders).toBe(2)
      expect(renders).toEqual(['Hello Parent!', 'Bye Parent!'])
    })
  })
  describe('getState', () => {
    it('should always return current state', () => {
      expect(getState()).toEqual({});
      const { result } = renderHook(
        () => useFlexReducer('parent', pReducer, pInitialState)
      )
      expect(getState()).toEqual({ parent: result.current[0] })
      act(() => {
        pAction('Bye Parent!')
      })
      expect(getState()).toEqual({ parent: result.current[0] })
    })
  })
  describe('shallowEqual', () => {
    it('should return true if objects equal shallowly', () => {
      expect(shallowEqual({ a: 'a' }, { a: 'a' })).toBe(true)
    })
    it('should return false if objects aren\'t equal shallowly', () => {
      expect(shallowEqual({ a: 'a', b: 'b' }, { a: 'a', b: 'c' })).toBe(false)
    })
    it('should return false if objects key amounts are different', () => {
      expect(shallowEqual({ a: 'a', b: 'b' }, { a: 'a' })).toBe(false)
    })
    it('should return false if any of args isn\'t an object type', () => {
      expect(shallowEqual({ a: 'a' }, 1)).toBe(false)
    })
    it('should return false if any of args is null', () => {
      expect(shallowEqual(null, { a: 'a' })).toBe(false)
    })
  })
})
