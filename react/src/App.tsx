// src/App.tsx
import React from "react";
import Flashcard from "./flashcard";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route key="Flashcard" path="/" element={<Flashcard />} />
      </Routes>
    </Router>
  );
};

export default App;
