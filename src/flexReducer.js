import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import shallowEqual from './shallowEqual';

let counter = 1;
const genKey = () => counter++;
let cache = {};
const context = {
  state: {},
  dispatch: {},
};

Object.seal(context);

// We use useEffect for server side rendering
const useFlexEffect = typeof window !== 'undefined'
  ? useLayoutEffect
  : useEffect;

function callSelectorDispatch(dispatch) {
  const { selector, result, render } = dispatch;
  const nextResult = selector(context.state);
  if (!shallowEqual(result.current, nextResult)) {
    result.current = nextResult;
    render(nextResult);
  }
}

function callReducerDispatch(dispatch, action) {
  const { reducerName, reducer, render } = dispatch;
  const state = context.state[reducerName];
  const nextState = reducer(state, action);
  if (!shallowEqual(state, nextState)) {
    context.state[reducerName] = nextState;
    render(nextState);
  }
}

function callDispatch(dispatch, action) {
  if (dispatch.reducerName) {
    callReducerDispatch(dispatch, action)
  } else {
    callSelectorDispatch(dispatch);
  }
}

export function dispatch(action = {}) {
  if (!action.type || typeof action.type !== 'string') {
    throw new Error('Wrong action format.');
  }
  Object.keys(context.dispatch).forEach(key =>
    callDispatch(context.dispatch[key], action)
  );
}

export function useFlexReducer(reducerName, reducer, initialState, options = { cache: true }) {
  if (!reducerName) throw new Error('reducer name argument(1) is required.');
  if (!reducer) throw new Error('reducer argument(2) is required.');
  if (!initialState) throw new Error('initialState argument(3) is required.');

  const key = useRef();
  if (!key.current) {
    key.current = genKey();
  }
  const contextState = context.state[reducerName];
  if (contextState && context.dispatch[key.current]?.reducer !== reducer) {
    throw new Error(`Component with "${reducerName}" reducer name already in use.`);
  }

  const [state, render] = useState(options.cache && cache[reducerName]?.current || initialState);
  const lastState = useRef();
  lastState.current = state;
  context.state[reducerName] = state;

  useFlexEffect(() => {
    if (!contextState) {
      context.dispatch[key.current] = {
        reducerName,
        reducer,
        render,
      }
    }
    return () => {
      if (options.cache && !cache[reducerName]) cache[reducerName] = lastState;
      delete context.state[reducerName];
      delete context.dispatch[key.current];
    }
  }, [
    reducer, render, reducerName, cache,
    lastState, options.cache, key.current,
    context.state, context.dispatch,
  ]);

  return [context.state, dispatch];
}

export function useSelector(selector) {
  if (typeof selector !== 'function') {
    throw new Error('Selector must be a function.');
  }

  const key = useRef();
  if (!key.current) {
    key.current = genKey();
  }
  const initState = useRef();
  if (!initState.current) {
    initState.current = selector(context.state);
  }
  const [state, render] = useState(initState.current);
  const result = useRef();
  result.current = state;

  useFlexEffect(() => {
    context.dispatch[key.current] = { selector, result, render };
    return () => delete context.dispatch[key.current];
  }, [selector, render, result, key.current, context.dispatch]);

  return state;
}

//----------------------------------
//   DANGEROUS ZONE!!!
//   FOR TESTING PURPOSE ONLY
//----------------------------------

export function getState() {
  return context.state;
}

export function reset() {
  counter = 1;
  cache = {};
  context.state = {};
  context.dispatch = {};
}
