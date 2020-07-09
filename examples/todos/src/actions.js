import { dispatch } from 'flex-reducer';
import unique from 'unique-action-types';

let nextTodoId = 0;

export const ADD_TODO = unique('ADD_TODO');
export const TOGGLE_TODO = unique('TOGGLE_TODO');
export const SET_FILTER = unique('SET_FILTER');


export const addTodo = (content) => dispatch({
  type: ADD_TODO,
  payload: {
    id: ++nextTodoId,
    content
  }
});

export const toggleTodo = (id) => dispatch({
  type: TOGGLE_TODO,
  payload: { id }
});

export const setFilter = (filter) => dispatch({
  type: SET_FILTER,
  payload: { filter }
});
