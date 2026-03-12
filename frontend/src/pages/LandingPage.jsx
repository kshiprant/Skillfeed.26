import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="landing">
      <div className="landing-shell">
        <header className="landing-nav">
          <div className="landing-brand">
            <div className="landing-brand-mark">S</div>
            <div className="landing-brand-copy">
              <strong>Skillfeed</strong>
              <span>Build with the right people</span>
            </div>
          </div>

          <div className="landing-nav-actions">
            <Link to="/login" className="secondary-btn">
              Login
            </Link>
            <Link to="/register" className="primary-btn">
              Get Started
            </Link>
          </div>
        </header>

        <section className="hero-section">
          <div className="hero-copy-card">
            <span className="hero-eyebrow">Startup collaboration platform</span>

            <h1 className="hero-title">Build startups with the right people</h1>

            <p className="hero-subtitle">
              Discover ideas, find collaborators, and launch projects together
              with profiles, requests, notifications, and real-time messaging.
            </p>

            <div className="hero-actions">
              <Link to="/register" className="primary-btn">
                Create your account
              </Link>

              <Link to="/login" className="secondary-btn">
                Login
              </Link>
            </div>

            <div className="hero-meta">
              <span className="hero-meta-pill">Share startup ideas</span>
              <span className="hero-meta-pill">Find collaborators</span>
              <span className="hero-meta-pill">Message instantly</span>
            </div>
          </div>

          <div className="hero-preview-card">
            <div className="hero-preview-head">
              <strong>See Skillfeed in action</strong>
              <span>Mobile-first product</span>
            </div>

            <div className="hero-mock-window">
              <div className="hero-mock-bar">
                <span />
                <span />
                <span />
              </div>

              <div className="hero-mock-card">
                <div className="hero-mock-row">
                  <div className="hero-mock-avatar">K</div>
                  <div className="hero-mock-copy">
                    <strong>AI Study Assistant</strong>
                    <span>Looking for designer + frontend dev</span>
                  </div>
                </div>

                <div className="hero-mock-chip-row">
                  <span className="hero-mock-chip">React</span>
                  <span className="hero-mock-chip">Design</span>
                  <span className="hero-mock-chip">MVP</span>
                </div>
              </div>

              <div className="hero-mock-card">
                <div className="hero-mock-row">
                  <div className="hero-mock-avatar">A</div>
                  <div className="hero-mock-copy">
                    <strong>Arjun</strong>
                    <span>Product designer • open to collaborate</span>
                  </div>
                </div>

                <div className="hero-mock-bubble-row">
                  <div className="hero-mock-bubble them">
                    Your idea looks strong. I can help with UI and onboarding.
                  </div>
                  <div className="hero-mock-bubble me">
                    Perfect. Let’s build the MVP this week.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section">
          <div className="landing-section-head">
            <h2>Everything needed to start building</h2>
            <p>
              Skillfeed helps builders move from idea to collaboration without
              switching between multiple tools.
            </p>
          </div>

          <div className="landing-features-grid">
            <article className="landing-feature-card">
              <div className="landing-feature-icon">✦</div>
              <h3>Share Ideas</h3>
              <p>
                Post startup ideas clearly and attract the right collaborators
                around your vision.
              </p>
            </article>

            <article className="landing-feature-card">
              <div className="landing-feature-icon">◎</div>
              <h3>Find Teammates</h3>
              <p>
                Discover developers, designers, marketers, and ambitious people
                who actually want to build.
              </p>
            </article>

            <article className="landing-feature-card">
              <div className="landing-feature-icon">↗</div>
              <h3>Real-time Messaging</h3>
              <p>
                Move conversations forward instantly with built-in chat and
                collaboration flow.
              </p>
            </article>
          </div>
        </section>

        <section className="landing-section">
          <div className="landing-metrics-grid">
            <div className="landing-metric-card">
              <div className="landing-metric-value">Ideas</div>
              <div className="landing-metric-label">Share what you want to build</div>
            </div>

            <div className="landing-metric-card">
              <div className="landing-metric-value">People</div>
              <div className="landing-metric-label">Find collaborators with useful skills</div>
            </div>

            <div className="landing-metric-card">
              <div className="landing-metric-value">Chat</div>
              <div className="landing-metric-label">Start real conversations quickly</div>
            </div>
          </div>
        </section>

        <section className="landing-section">
          <div className="landing-cta-card">
            <h2>Start building today</h2>
            <p>
              Whether you have an idea, a skill, or the ambition to build
              something meaningful, Skillfeed helps you find the right people.
            </p>

            <Link to="/register" className="primary-btn">
              Create your account
            </Link>
          </div>
        </section>

        <footer className="landing-footer">
          Developed by <strong>Kshiprant</strong>
        </footer>
      </div>
    </div>
  );
}
