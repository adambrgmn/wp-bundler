import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

import * as style from './main.module.css';

const App = () => {
  const [count, setCount] = useState(0);
  return (
    <>
      <button className={style.button} onClick={() => setCount(count + 1)}>
        Increment
      </button>
      <button className={style.button} onClick={() => setCount(count - 1)}>
        Decrement
      </button>
      <p>Count: {count}</p>
    </>
  );
};

let wrapper = document.querySelector('.wp-site-blocks');
let sibling = document.getElementById('wp--skip-link--target');

if (wrapper != null && sibling != null) {
  let root = document.createElement('div');
  wrapper.insertBefore(root, sibling);

  createRoot(root).render(<App />);
}
