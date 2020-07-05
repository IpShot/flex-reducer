import React, { useState } from "react";
import { addTodo } from "../actions";

const AddTodo = () => {
  const [input, setInput] = useState('');

  function handleAddTodo() {
    if (input) {
      addTodo(input);
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
