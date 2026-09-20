import React from "react";

interface RegistrationTabsProps {
  registrationType: "personal" | "business" | "agent";
  onTypeChange: (type: "personal" | "business" | "agent") => void;
}

const RegistrationTabs: React.FC<RegistrationTabsProps> = ({
  registrationType,
  onTypeChange,
}) => {
  return (
    <div className="register-tabs">
      <button
        className={`register-tab register-tab-personal ${
          registrationType === "personal" ? "active" : ""
        }`}
        onClick={() => onTypeChange("personal")}
      >
        Personal
      </button>
      <button
        className={`register-tab register-tab-business ${
          registrationType === "business" ? "active" : ""
        }`}
        onClick={() => onTypeChange("business")}
      >
        Business
      </button>
      <button type="button" className={`register-tab register-tab-personal ${registrationType === "agent" ? "active" : ""}`} onClick={() => onTypeChange("agent")}>Agent</button>
    </div>
  );
};

export default RegistrationTabs;

