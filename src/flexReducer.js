import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { unstable_batchedUpdates as batch } from './utils/batch';
import shallowEqual from './utils/shallowEqual';

let counter = 1;
const genKey = () => counter++;
let cache = {};
const context = {
  state: {},
  dispatch: new Map(),
};

Object.seal(context);

// We use useEffect for server side rendering
const useFlexEffect = typeof window !== 'undefined'
  ? useLayoutEffect
  : useEffect;

function callReducerDispatch(disp, action) {
  const { reducerName, reducer, render } = disp;
  const state = context.state[reducerName];
  const nextState = reducer(state, action);
  if (!shallowEqual(state, nextState)) {
    context.state[reducerName] = nextState;
    render(nextState);
  }
}

function callSelectorDispatch(disp) {
  const { selector, equalityFn, result, render } = disp;
  const nextResult = selector(context.state);
  if (!equalityFn(result.current, nextResult)) {
    result.current = nextResult;
    render(nextResult);
  }
}

function callDispatch(disp, action) {
  if (disp.reducerName) {
    callReducerDispatch(disp, action)
  } else {
    callSelectorDispatch(disp);
  }
}

export function dispatch(action = {}) {
  if (!action.type || typeof action.type !== 'string') {
    throw new Error('Wrong action format.');
  }
  batch(() => {
    context.dispatch.forEach(disp => {
      callDispatch(disp, action);
    });
  });
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
  if (contextState && context.dispatch.get(key.current)?.reducer !== reducer) {
    throw new Error(`Component with "${reducerName}" reducer name already in use.`);
  }

  const [state, render] = useState(options.cache && cache[reducerName]?.current || initialState);
  const lastState = useRef();
  lastState.current = state;
  context.state[reducerName] = state;

  if (!context.dispatch.has(key.current)) {
    context.dispatch.set(key.current, {
      reducerName,
      reducer,
      render,
    });
  }

  useFlexEffect(() => {
    return () => {
      if (options.cache && !cache[reducerName]) cache[reducerName] = lastState;
      delete context.state[reducerName];
      context.dispatch.delete(key.current);
    }
  }, [
    reducer, render, reducerName, cache,
    lastState, options.cache, key.current,
    context.state, context.dispatch,
  ]);

  return [state, dispatch];
}

function refEquality(prev, next) {
  return prev === next;
}

export function useSelector(selector, equalityFn = refEquality) {
  if (typeof selector !== 'function') {
    throw new Error('Selector must be a function.');
  }
  if (equalityFn && typeof equalityFn !== 'function') {
    throw new Error('Equality function must be a function.');
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

  if (!context.dispatch.has(key.current)) {
    context.dispatch.set(key.current, { selector, equalityFn, result, render });
  }

  useFlexEffect(() => {
    return () => context.dispatch.delete(key.current);
  }, [selector, equalityFn, render, result, key.current, context.dispatch]);

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
  context.dispatch = new Map();
}
