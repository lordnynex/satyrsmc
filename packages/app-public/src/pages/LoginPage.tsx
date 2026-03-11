import React from "react";
import { Hero } from "../components/Hero";

const LoginPage: React.FC = () => (
  <div className="stack max-w-5xl mx-auto" style={{ gap: "var(--space-6)" }}>
    <Hero title="Member Login" />
    <div className="max-w-md mx-auto text-center">
      <div className="card">
        <div className="card-body flex flex-col gap-4 items-center">
          <p style={{ color: "var(--color-muted)" }}>
            The member area is available through the admin panel. Click below to access it.
          </p>
          <a href="/admin" className="btn btn-primary">
            Go to Member Area &rarr;
          </a>
        </div>
      </div>
    </div>
  </div>
);

export default LoginPage;
