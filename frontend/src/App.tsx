import './i18n/config';

// ルーティング保護コンポーネント
import { PrivateRoute } from './components/routing/PrivateRoute';
import { RoleRoute } from './components/routing/RoleRoute';

// レイアウトコンポーネント
import { PublicLayout } from './layouts/PublicLayout';
import { MainLayout } from './layouts/MainLayout';
import { AdminLayout } from './layouts/AdminLayout';

console.log('[App] Routing components imported');

function App() {
  console.log('[App] Component rendering');

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>Routing components loaded!</h1>
      <p>PrivateRoute, RoleRoute, and Layouts are working.</p>
    </div>
  );
}

export default App;
