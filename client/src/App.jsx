import {
  HashRouter,
  Routes,
  Route
} from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';

import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientForm from './pages/ClientForm';
import ClientDetails from './pages/ClientDetails';
import Explore from './pages/Explore';
import Admin from './pages/Admin';
import NotFound, { Forbidden } from './pages/NotFound';
import Profile from './pages/Profile';
import Tasks from './pages/Tasks';
import Clubs from './pages/Clubs';
import ClubFloor from './pages/ClubFloor';

import './styles/global.css';

function App() {
  return (
    <HashRouter>
      <AuthProvider>

        <Routes>

          {/* Публичные страницы */}

          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          <Route
            path="/403"
            element={<Forbidden />}
          />


          {/* Защищённые страницы с Layout */}

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            <Route
              path="/clients"
              element={<Clients />}
            />

            <Route path="/clubs" element={<Clubs />} />
            <Route path="/club-floor" element={<ClubFloor />} />

            <Route
              path="/clients/new"
              element={<ClientForm />}
            />

            <Route
              path="/clients/:id"
              element={<ClientDetails />}
            />

            <Route
              path="/clients/:id/edit"
              element={<ClientForm />}
            />

            <Route
              path="/tasks"
              element={<Tasks />}
            />

            <Route
              path="/profile"
              element={<Profile />}
            />

            <Route
              path="/explore"
              element={<Explore />}
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <Admin />
                </ProtectedRoute>
              }
            />
          </Route>


          {/* Страница 404 */}

          <Route
            path="*"
            element={<NotFound />}
          />

        </Routes>

      </AuthProvider>
    </HashRouter>
  );
}

export default App;