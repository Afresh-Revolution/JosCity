import React from "react";
import { useNavigate } from "react-router-dom";

const SignInLink: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="register-signin-link">
      <p>
        Already have an account?{" "}
        <button
          className="register-signin-link-button"
          onClick={() => navigate("/signin")}
          type="button"
        >
          Sign In
        </button>
      </p>
    </div>
  );
};

export default SignInLink;

