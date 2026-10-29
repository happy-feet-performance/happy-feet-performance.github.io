import { useState } from "react";
import {
  adminLogin,
  backFromForgot,
  forgotLookup,
  forgotReset,
  forgotVerify,
  login,
  showForgot,
  showScreen,
} from "../../lib/auth.js";
import {
  AuthLogo,
  ErrorMessage,
  PasswordInput,
  PhoneInput,
  Screen,
  StrengthMeter,
  TabToggle,
  useEnterKey,
  useTimedError,
} from "./parts.jsx";

export function LoginScreen({ active }) {
  const [tab, setTab] = useState("email");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+233");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, showError] = useTimedError(active);

  const submit = async () => showError(await login({ tab, email, countryCode, phone, password }));
  useEnterKey(active, submit);

  return (
    <Screen id="screen-login" active={active}>
      <AuthLogo tag="Changing the narrative of African football" />
      <div className="auth-title">Welcome back</div>
      <div className="auth-sub">Sign in to your account</div>
      <TabToggle tab={tab} onTab={setTab} />
      <ErrorMessage message={error} box />
      {tab === "email" ? (
        <div className="fg">
          <label>Email address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="off"
          />
        </div>
      ) : (
        <div className="fg">
          <label>Phone number</label>
          <PhoneInput countryCode={countryCode} onCountryCode={setCountryCode} phone={phone} onPhone={setPhone} />
        </div>
      )}
      <div className="fg">
        <label>Password</label>
        <PasswordInput value={password} onChange={setPassword} placeholder="Password" />
      </div>
      <button className="btn btn-primary btn-full" onClick={submit}>
        Sign in →
      </button>
      <div className="text-center mt-sm">
        <span onClick={showForgot} className="text-link">
          Forgot password?
        </span>
      </div>
      <div className="auth-link">
        New here? <a onClick={() => showScreen("screen-signup-role")}>Create account</a>
      </div>
      <div className="text-center mt-lg">
        <a onClick={() => showScreen("screen-admin-login")} className="text-link small-text-link">
          Admin access
        </a>
      </div>
    </Screen>
  );
}

export function AdminLoginScreen({ active }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, showError] = useTimedError(active);

  const submit = async () => showError(await adminLogin({ email, password }));
  useEnterKey(active, submit);

  return (
    <Screen id="screen-admin-login" active={active}>
      <AuthLogo tag="Admin portal" />
      <div className="auth-title">Admin sign in</div>
      <div className="auth-sub">Restricted access</div>
      <ErrorMessage message={error} box />
      <div className="fg">
        <label className="required">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your admin email"
          autoComplete="off"
        />
      </div>
      <div className="fg">
        <label className="required">Password</label>
        <PasswordInput value={password} onChange={setPassword} placeholder="Password" />
      </div>
      <button className="btn btn-primary btn-full" onClick={submit}>
        Sign in →
      </button>
      <div className="text-center mt-sm">
        <button type="button" className="text-link" onClick={showForgot}>
          Forgot password?
        </button>
      </div>
      <div className="auth-link">
        <a onClick={() => showScreen("screen-login")}>← Back to login</a>
      </div>
    </Screen>
  );
}

// Three steps: contact → security answer → new password. Remounted (and so
// reset) every time the screen is opened.
export function ForgotScreen({ active }) {
  const [step, setStep] = useState(1);
  const [contact, setContact] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, showError] = useTimedError(active);

  const lookup = async () => {
    const result = await forgotLookup(contact);
    if (result.error) return showError(result.error);
    setQuestion(result.question);
    setStep(2);
  };
  const verify = async () => {
    const err = await forgotVerify(answer);
    if (err) return showError(err);
    setStep(3);
  };
  const reset = async () => showError(await forgotReset(newPass, confirmPass));

  return (
    <Screen id="screen-forgot" active={active}>
      <AuthLogo name="mark" />
      <div className="auth-title">Reset password</div>
      <div className="auth-sub">Answer your security question to reset your password.</div>

      {step === 1 && (
        <div>
          <div className="fg">
            <label className="required">Email or phone</label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Enter your email or phone"
              onKeyDown={(e) => e.key === "Enter" && lookup()}
            />
          </div>
          <ErrorMessage message={error} />
          <button className="btn btn-primary btn-full" onClick={lookup}>
            <i className="ti ti-arrow-right"></i> Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="auth-panel">
            <i className="ti ti-shield-question"></i>
            <span>{question}</span>
          </div>
          <div className="fg">
            <label className="required">Your answer</label>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Enter your answer"
              onKeyDown={(e) => e.key === "Enter" && verify()}
            />
          </div>
          <ErrorMessage message={error} />
          <button className="btn btn-primary btn-full mt-sm" onClick={verify}>
            <i className="ti ti-arrow-right"></i> Verify answer
          </button>
        </div>
      )}

      {step === 3 && (
        <div>
          <div className="fg">
            <label className="required">New password</label>
            <PasswordInput value={newPass} onChange={setNewPass} placeholder="Enter new password" onEnter={reset} />
            <StrengthMeter password={newPass} />
          </div>
          <div className="fg">
            <label className="required">Confirm password</label>
            <PasswordInput value={confirmPass} onChange={setConfirmPass} onEnter={reset} />
          </div>
          <ErrorMessage message={error} />
          <button className="btn btn-primary btn-full mt-sm" onClick={reset}>
            <i className="ti ti-circle-check"></i> Reset password
          </button>
        </div>
      )}

      <button className="btn btn-outline btn-full mt-sm" onClick={backFromForgot}>
        Back to login
      </button>
    </Screen>
  );
}
