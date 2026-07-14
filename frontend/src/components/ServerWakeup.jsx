import { useEffect, useState } from "react";
import api from "../api/client";

export default function ServerWakeup({ onReady }) {
  const [message, setMessage] = useState("Checking server...");

  useEffect(() => {
    let mounted = true;

    const wakeServer = async () => {
      while (mounted) {
        try {
          setMessage("Starting Skillfeed server...");

          await api.get("/health");

          setMessage("Connected!");

          setTimeout(() => {
            if (mounted) onReady();
          }, 600);

          break;
        } catch {
          setMessage("Server is waking up... This can take up to a minute.");

          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }
    };

    wakeServer();

    return () => {
      mounted = false;
    };
  }, [onReady]);

  return (
    <div className="startup-screen">
      <div className="startup-card">
        <div className="logo-circle">S</div>

        <h1>Skillfeed</h1>

        <p>{message}</p>

        <div className="loader"></div>

        <small>
          Render puts inactive servers to sleep.
          <br />
          We're waking it up for you.
        </small>
      </div>
    </div>
  );
}