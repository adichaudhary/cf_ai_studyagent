// TODO: implement chat logic — connect to the /worker API endpoint

const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const messages = document.getElementById("messages");
const sendBtn = document.getElementById("send-btn");

// Auto-grow textarea
input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = input.scrollHeight + "px";
});

// Submit on Enter (Shift+Enter = newline)
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = input.value.trim();
  if (!text) return;

  appendMessage("user", text);
  input.value = "";
  input.style.height = "auto";
  sendBtn.disabled = true;

  // TODO: send `text` to the worker and stream/append the response
  // Placeholder — remove when worker is wired up
  appendMessage("assistant", "(agent response will appear here)");

  sendBtn.disabled = false;
});

function appendMessage(role, content) {
  const div = document.createElement("div");
  div.classList.add("message", role);
  div.textContent = content;
  messages.appendChild(div);
  messages.scrollIntoView({ block: "end" });
}
