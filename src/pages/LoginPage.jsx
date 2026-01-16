import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!formData.username || !formData.password) return toast("Fill all fields", "error");
    setLoading(true);
    try {
      await login(formData.username, formData.password);
      toast("Welcome back!", "success");
      navigate("/", { replace: true });
    } catch (err) {
      toast("Invalid credentials", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1117] text-white">
      <div className="w-full max-w-md p-8 bg-[#161922] border border-white/5 rounded-2xl shadow-2xl">
        <h1 className="text-2xl font-bold text-center mb-6">TaskFlow</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Username" className="w-full bg-[#0F1117] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-violet-600" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
          <input type="password" placeholder="Password" className="w-full bg-[#0F1117] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-violet-600" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          <button disabled={loading} className="w-full bg-violet-600 hover:bg-violet-500 py-3 rounded-xl font-bold transition-all disabled:opacity-50">{loading ? "..." : "Sign In"}</button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;