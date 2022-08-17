import React, { useState } from 'react';
import { render } from 'react-dom';

const App = () => {
  const [count, setCount] = useState(0);
  return (
    <>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
      <p>Count: {count}</p>
    </>
  );
};

let wrapper = document.querySelector('.wp-site-blocks');
let sibling = document.getElementById('wp--skip-link--target');

if (wrapper != null && sibling != null) {
  let root = document.createElement('div');
  wrapper.insertBefore(root, sibling);

  render(<App />, root);
}
