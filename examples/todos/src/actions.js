import { dispatch } from './flex-reducer';
import { ADD_TODO, TOGGLE_TODO, SET_FILTER } from "./actionTypes";

let nextTodoId = 0;

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
