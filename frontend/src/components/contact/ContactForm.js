"use client";

import { Check, LoaderCircle, Send } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";

const ANALYTICS_URL = (process.env.NEXT_PUBLIC_ANALYTICS_URL || "").replace(/\/$/, "");
const LIMITS = { name: 100, message: 5000, minMessage: 10 };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPTY = { name: "", email: "", message: "", website: "" };

/** Returns a message if the email is missing or not in the form name@example.com. */
function emailError(value) {
  if (!value.trim()) return "Enter your email address.";
  if (!EMAIL_PATTERN.test(value.trim())) return "Enter an email address like name@example.com.";
  return undefined;
}

/** Same rules as the FastAPI endpoint, so most mistakes are caught before sending. */
function validate(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = "Enter your name.";
  else if (values.name.trim().length > LIMITS.name) errors.name = `Keep your name under ${LIMITS.name} characters.`;
  const email = emailError(values.email);
  if (email) errors.email = email;
  const message = values.message.trim();
  if (!message) errors.message = "Write a message.";
  else if (message.length < LIMITS.minMessage) errors.message = `Write at least ${LIMITS.minMessage} characters.`;
  else if (message.length > LIMITS.message) errors.message = `Keep your message under ${LIMITS.message} characters.`;
  return errors;
}

/** Turns FastAPI's 422 response into messages next to the right fields. */
function fieldErrorsFrom422(body) {
  const errors = {};
  let suggestion = "";
  for (const item of body?.detail ?? []) {
    const field = item.loc?.at(-1);
    if (field === "email") {
      // Fake-email checks send a readable message (and sometimes a corrected address).
      errors.email = item.type === "email_undeliverable" ? item.msg : "Enter a valid email address.";
      suggestion = item.suggestion || "";
    } else if (field === "name") errors.name = "Check your name and try again.";
    else if (field === "message") errors.message = `Write between ${LIMITS.minMessage} and ${LIMITS.message} characters.`;
  }
  return { errors, suggestion };
}

/**
 * Asks the FastAPI service whether an address can be real: catches typos in big providers,
 * throwaway inboxes and domains that can't receive email. Returns null if the check
 * couldn't run, so a network problem never blocks anyone.
 */
async function checkEmailOnServer(email) {
  try {
    const response = await fetch(`${ANALYTICS_URL}/api/v1/contact/check-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (response.status === 422) return { valid: false, message: "Enter a valid email address." };
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function Field({ id, label, error, hint, after, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
      <div className="mt-1.5 flex min-h-5 items-start justify-between gap-3 text-[13px]">
        <AnimatePresence mode="wait" initial={false}>
          {error ? (
            <motion.p
              key="error"
              id={`${id}-error`}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-error"
            >
              {error}
            </motion.p>
          ) : (
            <span key="none" />
          )}
        </AnimatePresence>
        {hint}
      </div>
      {after}
    </div>
  );
}

function SentMessage({ name, onReset }) {
  return (
    <motion.div
      key="sent"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-start rounded-xl border border-ok/40 bg-panel p-8"
      role="status"
    >
      <svg viewBox="0 0 52 52" className="size-14" aria-hidden>
        <motion.circle
          cx="26"
          cy="26"
          r="24"
          fill="none"
          stroke="var(--ok)"
          strokeWidth="2.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        />
        <motion.path
          d="M15 27 l7.5 7.5 L37 19"
          fill="none"
          stroke="var(--ok)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.35, delay: 0.45, ease: "easeOut" }}
        />
      </svg>
      <h2 className="mt-5 text-2xl font-bold tracking-tight">Message sent</h2>
      <p className="mt-2 max-w-md leading-relaxed text-muted">
        Thanks, {name}. I&rsquo;ll read it soon and reply to the email address you gave.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-6 rounded-lg border border-line px-4 py-2.5 text-sm font-semibold transition-colors hover:border-accent hover:text-accent"
      >
        Send another message
      </button>
    </motion.div>
  );
}

export default function ContactForm() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | sent
  const [formError, setFormError] = useState("");
  const [sentName, setSentName] = useState("");
  // Becomes true once the visitor has left the email field with something typed in it.
  // From then on the email is re-checked on every keystroke.
  const [emailChecked, setEmailChecked] = useState(false);
  // Result of the server-side fake-email check, for the exact address it was run on.
  const [serverCheck, setServerCheck] = useState({ status: "idle", email: "" }); // idle | checking | valid | invalid | unknown
  const [suggestion, setSuggestion] = useState("");
  const checkTimer = useRef(null);
  const latestCheck = useRef(0);

  useEffect(() => () => clearTimeout(checkTimer.current), []);

  async function runServerCheck(email) {
    const trimmed = email.trim();
    if (emailError(trimmed)) return;
    const requestId = ++latestCheck.current;
    setServerCheck({ status: "checking", email: trimmed });
    const result = await checkEmailOnServer(trimmed);
    if (requestId !== latestCheck.current) return; // a newer check has started; ignore this one
    if (!result) {
      setServerCheck({ status: "unknown", email: trimmed });
    } else if (result.valid) {
      setServerCheck({ status: "valid", email: trimmed });
    } else {
      setServerCheck({ status: "invalid", email: trimmed });
      setErrors((current) => ({ ...current, email: result.message }));
      setSuggestion(result.suggestion || "");
    }
  }

  function applySuggestion() {
    setValues((current) => ({ ...current, email: suggestion }));
    setErrors((current) => ({ ...current, email: undefined }));
    setSuggestion("");
    runServerCheck(suggestion);
  }
  const formRef = useRef(null);
  const ids = { name: useId(), email: useId(), message: useId() };

  /** One change handler for every field; the field is known from the input's name. */
  function handleChange(event) {
    const field = event.target.name;
    const value = event.target.value;
    setValues((current) => ({ ...current, [field]: value }));
    if (field === "email") {
      // Any earlier server answer was for a different address.
      latestCheck.current += 1;
      clearTimeout(checkTimer.current);
      setServerCheck({ status: "idle", email: "" });
      setSuggestion("");
    }
    if (field === "email" && emailChecked) {
      // Live re-check: the format error goes the moment the address looks right, and the
      // server check runs once the visitor pauses typing.
      const formatError = emailError(value);
      setErrors((current) => ({ ...current, email: formatError }));
      if (!formatError) checkTimer.current = setTimeout(() => runServerCheck(value), 700);
    } else if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
    if (formError) setFormError("");
  }

  /** Instant check when leaving the email field. An empty field is left alone until Send. */
  function checkEmailOnBlur(event) {
    const value = event.target.value;
    if (!value.trim()) return;
    setEmailChecked(true);
    const formatError = emailError(value);
    setErrors((current) => ({ ...current, email: formatError }));
    clearTimeout(checkTimer.current);
    const alreadyChecked = serverCheck.email === value.trim() && serverCheck.status !== "idle";
    if (!formatError && !alreadyChecked) runServerCheck(value);
  }

  function focusFirstError(found) {
    const first = ["name", "email", "message"].find((field) => found[field]);
    if (first) formRef.current?.querySelector(`[name="${first}"]`)?.focus();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const found = validate(values);
    // Keep a fake-email result the server already gave for this exact address.
    if (!found.email && serverCheck.status === "invalid" && serverCheck.email === values.email.trim()) {
      found.email = errors.email || "Check your email address.";
    }
    setErrors(found);
    setEmailChecked(true);
    if (Object.keys(found).length) {
      focusFirstError(found);
      return;
    }

    setStatus("sending");
    setFormError("");
    try {
      const response = await fetch(`${ANALYTICS_URL}/api/v1/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          email: values.email.trim(),
          message: values.message.trim(),
          website: values.website,
        }),
      });

      if (response.status === 202) {
        setSentName(values.name.trim().split(" ")[0]);
        setValues(EMPTY);
        setEmailChecked(false);
        setServerCheck({ status: "idle", email: "" });
        setSuggestion("");
        setStatus("sent");
        return;
      }
      if (response.status === 422) {
        const { errors: serverErrors, suggestion: serverSuggestion } = fieldErrorsFrom422(
          await response.json().catch(() => null),
        );
        setErrors(serverErrors);
        setSuggestion(serverSuggestion);
        if (serverErrors.email) setServerCheck({ status: "invalid", email: values.email.trim() });
        focusFirstError(serverErrors);
        setFormError(Object.keys(serverErrors).length ? "" : "Check the form and try again.");
      } else if (response.status === 429) {
        const seconds = Number(response.headers.get("Retry-After")) || 3600;
        const minutes = Math.max(1, Math.ceil(seconds / 60));
        setFormError(
          `You've sent several messages recently. Try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}, or email me directly.`,
        );
      } else {
        setFormError("Your message couldn't be sent because of a problem on my side. Try again, or email me directly.");
      }
    } catch {
      setFormError("Your message couldn't be sent. Check your connection and try again, or email me directly.");
    }
    setStatus("idle");
  }

  const emailValid =
    emailChecked &&
    !emailError(values.email) &&
    serverCheck.status === "valid" &&
    serverCheck.email === values.email.trim();
  const emailChecking = serverCheck.status === "checking" && serverCheck.email === values.email.trim();
  const messageLength = values.message.trim().length;
  const sending = status === "sending";
  const inputClass = (field) =>
    `w-full rounded-lg border bg-panel px-3.5 py-2.5 text-[15px] outline-none transition-colors placeholder:text-muted/70 focus:border-accent focus-visible:outline-none ${
      errors[field] ? "border-error" : "border-line hover:border-muted/60"
    }`;

  return (
    <AnimatePresence mode="wait" initial={false}>
      {status === "sent" ? (
        <SentMessage name={sentName} onReset={() => setStatus("idle")} />
      ) : (
        <motion.form
          key="form"
          ref={formRef}
          onSubmit={handleSubmit}
          noValidate
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="space-y-3 rounded-xl border border-line bg-panel/60 p-6 sm:p-8"
          aria-label="Contact form"
        >
          <Field id={ids.name} label="Name" error={errors.name}>
            <input
              id={ids.name}
              name="name"
              autoComplete="name"
              value={values.name}
              onChange={handleChange}
              maxLength={LIMITS.name}
              placeholder="Alex Morgan"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? `${ids.name}-error` : undefined}
              className={inputClass("name")}
            />
          </Field>

          <Field
            id={ids.email}
            label="Email"
            error={errors.email}
            after={
              <AnimatePresence>
                {suggestion && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="-mt-1 overflow-hidden pb-1.5 text-[13px] text-muted"
                  >
                    <span className="inline-block">
                      Did you mean{" "}
                      <button
                        type="button"
                        onClick={applySuggestion}
                        className="font-semibold text-accent underline-offset-2 hover:underline"
                      >
                        {suggestion}
                      </button>
                      ?
                    </span>
                  </motion.p>
                )}
              </AnimatePresence>
            }
          >
            <div className="relative">
              <input
                id={ids.email}
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={values.email}
                onChange={handleChange}
                onBlur={checkEmailOnBlur}
                placeholder="alex@company.com"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? `${ids.email}-error` : undefined}
                className={`${inputClass("email")} pr-10`}
              />
              <AnimatePresence>
                {emailChecking && (
                  <motion.span
                    key="checking"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                  >
                    <LoaderCircle size={17} aria-hidden className="animate-spin" />
                    <span className="sr-only">Checking email address</span>
                  </motion.span>
                )}
                {emailValid && (
                  <motion.span
                    key="valid"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.12 } }}
                    transition={{ type: "spring", stiffness: 500, damping: 28 }}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ok"
                  >
                    <Check size={18} strokeWidth={2.5} aria-hidden />
                    <span className="sr-only">Email address looks valid</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </Field>

          <Field
            id={ids.message}
            label="Message"
            error={errors.message}
            hint={
              <span className={`shrink-0 tabular-nums ${messageLength > LIMITS.message ? "text-error" : "text-muted"}`}>
                {messageLength.toLocaleString("en-GB")} / {LIMITS.message.toLocaleString("en-GB")}
              </span>
            }
          >
            <textarea
              id={ids.message}
              name="message"
              rows={6}
              value={values.message}
              onChange={handleChange}
              placeholder="Tell me about the role or project, and how I can help."
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? `${ids.message}-error` : undefined}
              className={`${inputClass("message")} resize-y`}
            />
          </Field>

          {/* Spam trap: hidden from people and screen readers, so only bots fill it in. */}
          <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label>
              Leave this field empty
              <input name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={handleChange} />
            </label>
          </div>

          <AnimatePresence>
            {formError && (
              <motion.p
                role="alert"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error"
              >
                {formError}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="pt-2">
            <button
              type="submit"
              disabled={sending}
              className="inline-flex min-w-40 items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-bg transition-[transform,opacity] hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-80"
            >
              <AnimatePresence mode="wait" initial={false}>
                {sending ? (
                  <motion.span key="sending" className="flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <LoaderCircle size={16} aria-hidden className="animate-spin" />
                    Sending…
                  </motion.span>
                ) : (
                  <motion.span key="send" className="flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Send size={16} aria-hidden />
                    Send message
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
