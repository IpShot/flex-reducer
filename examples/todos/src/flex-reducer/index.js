import { useReducer, useRef, useEffect } from 'react';
import shallowEqual from './shallowEqual';

let counter = 0;
const genKey = () => counter++;
let cache = {};
let cacheReducerMap = {};
let selectors = {};
const context = {
  state: {},
  dispatch: [],
};

Object.seal(context);

function runSelectors() {
  Object.keys(selectors).forEach(key => {
    const { selector, forceRender, prevResult } = selectors[key];
    const currResult = selector(context.state);
    if (!shallowEqual(prevResult.current, currResult)) {
      prevResult.current = currResult;
      forceRender();
    }
  });
}

function defaultInit(initialState) {
  return initialState;
}

function removeDispatch(dispatch) {
  const idx = context.dispatch.findIndex(d => d === dispatch);
  if (idx !== -1) {
    context.dispatch.splice(idx, 1);
  }
}

export function dispatch(action = {}) {
  if (!action.type || typeof action.type !== 'string' || !action.payload) {
    throw new Error('Wrong action format.');
  }
  context.dispatch.forEach(disp => disp(action));
  runSelectors();
}

export function useFlexReducer(reducer, initialState, init, options = { cache: true }) {
  if (!reducer) throw new Error('reducer argument(1) is required.');
  if (!initialState) throw new Error('initialState argument(2) is required.');

  const initFunc = init || defaultInit;
  const initState = initFunc(initialState);

  if (!initState.__reducer__) {
    throw new Error('You have to specify a reducer name.');
  }

  const cacheKey = initState.__reducer__;
  const contextState = context.state[cacheKey];

  if (contextState && cacheReducerMap[cacheKey] !== reducer) {
    throw new Error(`Component with "${cacheKey}" reducer name already rendered.`);
  }

  const [state, disp] = useReducer(
    reducer,
    options.cache && cache[cacheKey]?.current || initialState,
    initFunc
  );

  const lastState = useRef();
  lastState.current = state;

  useEffect(() => {
    if (!contextState) {
      cacheReducerMap[cacheKey] = reducer;
      context.dispatch.push(disp);
    }
    return () => {
      if (options.cache && !cache[cacheKey]) cache[cacheKey] = lastState;
      delete cacheReducerMap[cacheKey];
      delete context.state[cacheKey];
      removeDispatch(disp);
    }
  }, [cacheKey]);

  context.state[cacheKey] = state;
  return [context.state, dispatch];
}

export function useSelector(selector) {
  if (typeof selector !== 'function') {
    throw new Error('Selector must be a function.');
  }

  const key = useRef(genKey());
  const [_, forceRender] = useReducer(s => s + 1, 0);
  const currResult = selector(context.state);
  const prevResult = useRef(currResult);

  useEffect(() => {
    selectors[key.current] = { selector, forceRender, prevResult };
    return () => delete selectors[key.current];
  }, [key.current]);

  return currResult;
}

//----------------------------------
//   DANGEROUS ZONE!!!
//   FOR TESTING PURPOSE ONLY
//----------------------------------

export function getCache() {
  return cache;
}

export function getState() {
  return context.state;
}

export function getContext() {
  return context;
}

export function resetCache() {
  cache = {};
  cacheReducerMap = {};
}

export function resetContext() {
  context.state = {};
  context.dispatch = [];
}

export function reset() {
  resetCache();
  resetContext();
  selectors = {};
  counter = 0;
}
