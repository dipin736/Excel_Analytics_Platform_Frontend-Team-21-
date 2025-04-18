
import './App.css'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Register from './Components/Register';



function App() {


  return (
    <>
     <Router>
      <Routes>
        <Route path="/register" element={<Register />} />
     <Route
        exact
        path="/"
        element={
            <Navigate to="/register" />
        }
      />
      <Route path="*" element={<Navigate to="/register" />} />
      </Routes>

    </Router>
    </>
  )
}

export default App
