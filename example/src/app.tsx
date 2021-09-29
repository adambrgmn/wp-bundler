import React from 'react';
import ReactDOM from 'react-dom';
import { Button } from './components/Button';
import './app.css';

const App: React.FC = () => {
  // @ts-ignore
  console.log(process.env.NODE_ENV, __DEV__);
  return (
    <div>
      <h1 className="header">Hello world!</h1>
      <Button>Click me!</Button>
    </div>
  );
};

ReactDOM.render(
  <React.Suspense fallback={null}>
    <App />
  </React.Suspense>,
  document.getElementById('root'),
);
