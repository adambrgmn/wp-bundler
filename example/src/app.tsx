import React from 'react';
import ReactDOM from 'react-dom';
import { __ } from '@wordpress/i18n';
import { Button } from './components/Button';
import './app.css';

const App: React.FC = () => {
  return (
    <div>
      <h1 className="header">{__('Hello world!', 'wp-bundler')}</h1>
      <Button>{__('Click me', 'wp-bundler')}</Button>
    </div>
  );
};

ReactDOM.render(
  <React.Suspense fallback={null}>
    <App />
  </React.Suspense>,
  document.getElementById('root'),
);
