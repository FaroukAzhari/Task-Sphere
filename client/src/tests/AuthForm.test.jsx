import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import AuthForm from "../components/auth/AuthForm";

describe("AuthForm", () => {
  it("submits login payload", () => {
    const handleSubmit = vi.fn();
    render(<AuthForm mode="login" onSubmit={handleSubmit} loading={false} />);

    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "test@x.com" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit.mock.calls[0][0]).toMatchObject({ email: "test@x.com", password: "123456" });
  });
});
