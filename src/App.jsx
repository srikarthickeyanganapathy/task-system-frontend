import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";

function App() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-apple-bg text-apple-text font-sans">
      {user ? <Dashboard /> : <LoginPage />}
    </div>
  );
}

export default App;
