import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="landing">

      <section className="hero">
        <h1>Build startups with the right people</h1>
        <p>
          Discover ideas, find collaborators, and launch projects together.
        </p>

        <div className="hero-buttons">
          <Link to="/register" className="primary-btn">
            Get Started
          </Link>

          <Link to="/login" className="secondary-btn">
            Login
          </Link>
        </div>
      </section>

      <section className="features">

        <div className="feature">
          <h3>Share Ideas</h3>
          <p>
            Post startup ideas and attract the right collaborators.
          </p>
        </div>

        <div className="feature">
          <h3>Find Teammates</h3>
          <p>
            Connect with developers, designers, and marketers.
          </p>
        </div>

        <div className="feature">
          <h3>Real-time Messaging</h3>
          <p>
            Collaborate instantly with built-in chat.
          </p>
        </div>

      </section>

      <section className="cta">
        <h2>Start building today</h2>
        <Link to="/register" className="primary-btn">
          Create your account
        </Link>
      </section>

      <footer className="landing-footer">
        Developed by <strong>Kshiprant</strong>
      </footer>

    </div>
  );
}
