import './i18n/config';

console.log('[App] All imports successful');

function App() {
  console.log('[App] Component rendering');

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>Imports successful!</h1>
      <p>All dependencies loaded correctly.</p>
    </div>
  );
}

export default App;
