import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { registerApi } from "../api/authApi";
import AuthForm from "../components/auth/AuthForm";
import useAuth from "../hooks/useAuth";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const mutation = useMutation({
    mutationFn: registerApi,
    onSuccess: (data) => {
      login(data);
      navigate("/dashboard");
    },
  });

  return (
    <div className="space-y-4">
      <AuthForm mode="register" onSubmit={(payload) => mutation.mutate(payload)} loading={mutation.isPending} />
      {mutation.error && <p className="text-sm text-rose-600">Registration failed.</p>}
      <p className="text-sm text-slate-500">
        Already registered? <Link className="font-semibold text-teal-700" to="/login">Login</Link>
      </p>
    </div>
  );
};

export default RegisterPage;
