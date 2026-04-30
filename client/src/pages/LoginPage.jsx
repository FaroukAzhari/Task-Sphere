import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { loginApi } from "../api/authApi";
import AuthForm from "../components/auth/AuthForm";
import useAuth from "../hooks/useAuth";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const mutation = useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      login(data);
      navigate("/dashboard");
    },
  });

  return (
    <div className="space-y-4">
      <AuthForm mode="login" onSubmit={(payload) => mutation.mutate(payload)} loading={mutation.isPending} />
      {mutation.error && <p className="text-sm text-rose-600">Login failed. Check credentials.</p>}
      <p className="text-sm text-slate-500">
        No account? <Link className="font-semibold text-teal-700" to="/register">Register</Link>
      </p>
    </div>
  );
};

export default LoginPage;
