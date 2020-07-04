import React, { useState } from "react";
import { dispatch } from "../flex-reducer";
import { addTodo } from "../actions";

const AddTodo = () => {
  const [input, setInput] = useState('');

  function handleAddTodo() {
    if (input) {
      dispatch(addTodo(input));
      setInput('');
    }
  }
  return (
    <div>
      <input value={input} onChange={e => setInput(e.target.value)} />
      <button className="add-todo" onClick={handleAddTodo}>
        Add Todo
      </button>
    </div>
  );
};

export default AddTodo;
