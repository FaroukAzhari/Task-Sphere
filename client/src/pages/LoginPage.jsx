import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { loginApi } from "../api/authApi";
import AuthForm from "../components/auth/AuthForm";
import useAuth from "../hooks/useAuth";
import { buildDetailMessages, firstFieldError, normalizeApiError } from "../utils/apiError";

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

  const normalizedError = mutation.error ? normalizeApiError(mutation.error, "Login could not be completed.") : null;
  const fieldErrors = normalizedError
    ? {
        email: firstFieldError(normalizedError.fieldErrors, "email"),
        password: firstFieldError(normalizedError.fieldErrors, "password"),
      }
    : {};

  return (
    <div className="space-y-4">
      <AuthForm
        mode="login"
        onSubmit={(payload) => mutation.mutate(payload)}
        loading={mutation.isPending}
        errorSummary={normalizedError?.summary || ""}
        errorDetails={buildDetailMessages(normalizedError)}
        fieldErrors={fieldErrors}
      />
      <p className="text-sm text-slate-500">
        No account? <Link className="font-semibold text-teal-700" to="/register">Register</Link>
      </p>
    </div>
  );
};

export default LoginPage;
