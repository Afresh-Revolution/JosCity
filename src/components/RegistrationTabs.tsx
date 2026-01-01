import React from "react";

interface RegistrationTabsProps {
  registrationType: "personal" | "business";
  onTypeChange: (type: "personal" | "business") => void;
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
    </div>
  );
};

export default RegistrationTabs;

