import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Trabajador from './components/Trabajador';
import ScheduleManager from './components/ScheduleManager';
import Proyecciones from './components/Proyecciones';
import Organizacion from './components/Organizacion';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/trabajador" element={<Trabajador />} />
        <Route path="/dashboard" element={<ScheduleManager />} />
        <Route path="/proyecciones" element={<Proyecciones />} />
        <Route path="/organizacion" element={<Organizacion />} />
      </Routes>
    </Router>
  );
}

export default App;

