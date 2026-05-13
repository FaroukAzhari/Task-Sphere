import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { registerApi } from "../api/authApi";
import AuthForm from "../components/auth/AuthForm";
import useAuth from "../hooks/useAuth";
import { buildDetailMessages, firstFieldError, normalizeApiError } from "../utils/apiError";

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

  const normalizedError = mutation.error ? normalizeApiError(mutation.error, "Account creation could not be completed.") : null;
  const fieldErrors = normalizedError
    ? {
        name: firstFieldError(normalizedError.fieldErrors, "name"),
        email: firstFieldError(normalizedError.fieldErrors, "email"),
        password: firstFieldError(normalizedError.fieldErrors, "password"),
      }
    : {};

  return (
    <div className="space-y-4">
      <AuthForm
        mode="register"
        onSubmit={(payload) => mutation.mutate(payload)}
        loading={mutation.isPending}
        errorSummary={normalizedError?.summary || ""}
        errorDetails={buildDetailMessages(normalizedError)}
        fieldErrors={fieldErrors}
      />
      <p className="text-sm text-slate-500">
        Already registered? <Link className="font-semibold text-teal-700" to="/login">Login</Link>
      </p>
    </div>
  );
};

export default RegisterPage;
