import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import DetalhesJogo from './pages/DetalhesJogo';
import MinhasApostas from './pages/MinhasApostas';
import Admin from './pages/Admin';
import PagamentosAdmin from './pages/PagamentosAdmin';
import Historico from './pages/Historico';
import Layout from './layouts/Layout';
import SplashScreen from './components/SplashScreen';

function App() {
  return (
    <>
      <SplashScreen />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/jogo/:id" element={<DetalhesJogo />} />
            <Route path="/minhas-apostas" element={<MinhasApostas />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/pagamentos" element={<PagamentosAdmin />} />
            <Route path="/historico" element={<Historico />} />
          </Routes>
        </Layout>
      </Router>
    </>
  );
}

export default App;
