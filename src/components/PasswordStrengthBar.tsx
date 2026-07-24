"use client";

interface PasswordStrengthBarProps {
  password: string;
}

function getStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;

  if (!password) return { score: 0, label: "", color: "" };

  // Length checks
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;

  // Character variety
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  if (score <= 1) return { score: 1, label: "Weak", color: "#ef4444" };
  if (score <= 2) return { score: 2, label: "Fair", color: "#f97316" };
  if (score <= 3) return { score: 3, label: "Good", color: "#eab308" };
  if (score <= 4) return { score: 4, label: "Strong", color: "#22c55e" };
  return { score: 5, label: "Very Strong", color: "#16a34a" };
}

export default function PasswordStrengthBar({ password }: PasswordStrengthBarProps) {
  const { score, label, color } = getStrength(password);

  if (!password) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((segment) => (
          <div
            key={segment}
            className="h-1.5 flex-1 rounded-full transition-all duration-300"
            style={{
              backgroundColor: segment <= score ? color : "rgba(255,255,255,0.1)",
            }}
          />
        ))}
      </div>
      <p
        className="text-xs font-medium transition-colors duration-300"
        style={{ color: score > 0 ? color : "transparent" }}
      >
        {label}
      </p>
    </div>
  );
}

