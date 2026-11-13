import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isRegister) await register(name, email, password);
      else await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.code || err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F7F5] px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-2xl shadow p-8 space-y-4">
        <h1 className="text-2xl font-bold text-[#26332D]">
          {isRegister ? "Créer un compte" : "Connexion"}
        </h1>
        {isRegister && (
          <input className="w-full border rounded-lg p-3" placeholder="Nom complet"
            value={name} onChange={(e) => setName(e.target.value)} required />
        )}
        <input className="w-full border rounded-lg p-3" type="email" placeholder="E-mail"
          value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full border rounded-lg p-3" type="password" placeholder="Mot de passe (6 caractères min.)"
          value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="w-full bg-[#008F68] hover:bg-[#006B50] text-white rounded-lg p-3 font-semibold">
          {isRegister ? "S'inscrire" : "Se connecter"}
        </button>
        <p className="text-sm text-center text-gray-600">
          {isRegister ? "Déjà un compte ?" : "Pas de compte ?"}{" "}
          <button type="button" className="text-[#008F68] font-semibold"
            onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? "Se connecter" : "S'inscrire"}
          </button>
        </p>
      </form>
    </div>
  );
}