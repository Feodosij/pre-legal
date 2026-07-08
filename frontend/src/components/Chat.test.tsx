import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Chat from "./Chat";

describe("Chat", () => {
  it("shows the greeting bubble on first render with no messages", () => {
    render(<Chat messages={[]} isLoading={false} error={null} onSend={vi.fn()} />);
    expect(
      screen.getByText(/What kind of legal document do you need/)
    ).toBeInTheDocument();
  });

  it("renders user and assistant messages", () => {
    render(
      <Chat
        messages={[
          { role: "user", content: "I need an NDA" },
          { role: "assistant", content: "Great, let's get started." },
        ]}
        isLoading={false}
        error={null}
        onSend={vi.fn()}
      />
    );

    expect(screen.getByText("I need an NDA")).toBeInTheDocument();
    expect(screen.getByText("Great, let's get started.")).toBeInTheDocument();
  });

  it("calls onSend with the typed text and clears the input", () => {
    const onSend = vi.fn();
    render(<Chat messages={[]} isLoading={false} error={null} onSend={onSend} />);

    fireEvent.change(screen.getByPlaceholderText("Type your answer..."), {
      target: { value: "Hello there" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(onSend).toHaveBeenCalledWith("Hello there");
    expect(screen.getByPlaceholderText("Type your answer...")).toHaveValue("");
  });

  it("shows a typing indicator while isLoading is true", () => {
    render(<Chat messages={[]} isLoading={true} error={null} onSend={vi.fn()} />);
    expect(screen.getByRole("status", { name: /typing/i })).toBeInTheDocument();
  });

  it("does not show a typing indicator when not loading", () => {
    render(<Chat messages={[]} isLoading={false} error={null} onSend={vi.fn()} />);
    expect(screen.queryByRole("status", { name: /typing/i })).not.toBeInTheDocument();
  });

  it("disables input and send button while loading", () => {
    render(<Chat messages={[]} isLoading={true} error={null} onSend={vi.fn()} />);
    expect(screen.getByPlaceholderText("Type your answer...")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });

  it("shows an error banner when error is set", () => {
    render(<Chat messages={[]} isLoading={false} error="network down" onSend={vi.fn()} />);
    expect(screen.getByRole("alert")).toHaveTextContent("network down");
  });

  it("disables the send button for blank input", () => {
    render(<Chat messages={[]} isLoading={false} error={null} onSend={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });
});
