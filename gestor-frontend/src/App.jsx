import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './components/Login';
import Trabajador from './components/Trabajador';
import ScheduleManager from './components/ScheduleManager';
import Proyecciones from './components/Proyecciones';
import Organizacion from './components/Organizacion';
import Externos from './components/Externos';
import EmpresaSelector from './components/EmpresaSelector';
import AppLayout from './components/AppLayout';
import { useEmpresa } from '@/context/EmpresaContext';

function RequireEmpresa() {
  const { empresaId } = useEmpresa();
  if (!empresaId) {
    return <Navigate to="/seleccionar-empresa" replace />;
  }
  return <Outlet />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/seleccionar-empresa" element={<EmpresaSelector />} />
        <Route element={<RequireEmpresa />}>
          <Route element={<AppLayout />}>
            <Route path="/trabajador" element={<Trabajador />} />
            <Route path="/dashboard" element={<ScheduleManager />} />
            <Route path="/proyecciones" element={<Proyecciones />} />
            <Route path="/organizacion" element={<Organizacion />} />
            <Route path="/externos" element={<Externos />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
