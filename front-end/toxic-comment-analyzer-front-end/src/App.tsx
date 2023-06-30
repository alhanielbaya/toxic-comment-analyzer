import React from 'react';
import { CommentForm } from './containers/CommentForm';
import './App.css';

function App() {
  return (
    <div className="App">
      <h1>Toxic Comment Classifier</h1>
      <CommentForm  />
    </div>
  );
}

export default App;
