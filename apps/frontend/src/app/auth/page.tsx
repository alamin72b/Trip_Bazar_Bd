import { AuthForm } from '@/components/auth-form';

export default function AuthPage() {
  return (
    <div className="shell page-section auth-page">
      <div className="auth-page__copy">
        <p className="eyebrow">Traveler access</p>
        <h1 className="section-heading">
          Authentication exists for reviews, not for browsing.
        </h1>
        <p className="muted-copy">
          Guests can explore offers freely. Sign in only when you want to review an
          offer and help future travelers decide.
        </p>
        <div className="panel auth-page__notes">
          <p className="eyebrow">Current v1 behavior</p>
          <ul className="feature-list">
            <li>One email/password form handles both sign-up and sign-in.</li>
            <li>Access and refresh tokens are restored on reload when still valid.</li>
            <li>Review forms become available immediately after authentication.</li>
          </ul>
        </div>
      </div>

      <AuthForm />
    </div>
  );
}
