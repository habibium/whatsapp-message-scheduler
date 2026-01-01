import { type FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMessage, useMessages } from "../hooks/useMessages";
import { api, type WhatsAppGroup } from "../lib/api";
import "./MessageFormPage.css";

const CRON_PRESETS = [
  { label: "Every minute", value: "* * * * *" },
  { label: "Every 5 minutes", value: "*/5 * * * *" },
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every day at 9 AM", value: "0 9 * * *" },
  { label: "Every day at 6 PM", value: "0 18 * * *" },
  { label: "Every Monday at 9 AM", value: "0 9 * * 1" },
  { label: "Every weekday at 9 AM", value: "0 9 * * 1-5" },
  { label: "First of every month", value: "0 9 1 * *" }
];

export function MessageFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message, loading: loadingMessage } = useMessage(id);
  const { create, update } = useMessages();

  const [target, setTarget] = useState("");
  const [isGroup, setIsGroup] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [cronExpression, setCronExpression] = useState("0 9 * * *");
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  const isEditing = Boolean(id);

  // Load existing message if editing
  useEffect(() => {
    if (message) {
      setTarget(message.target);
      setIsGroup(message.isGroup);
      setMessageText(message.message);
      setCronExpression(message.cronExpression);
      setEnabled(message.enabled);
    }
  }, [message]);

  // Fetch groups when isGroup is true
  useEffect(() => {
    if (isGroup && groups.length === 0) {
      setLoadingGroups(true);
      api.whatsapp.groups().then((result) => {
        if (result.success) {
          setGroups(result.data);
        }
        setLoadingGroups(false);
      });
    }
  }, [isGroup, groups.length]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const data = {
      target,
      isGroup,
      message: messageText,
      cronExpression,
      enabled
    };

    let err: string | null;
    if (isEditing && id) {
      err = await update(id, data);
    } else {
      err = await create(data);
    }

    if (err) {
      setError(err);
      setSaving(false);
    } else {
      navigate("/messages");
    }
  };

  const handlePreset = (value: string) => {
    setCronExpression(value);
  };

  if (loadingMessage && isEditing) {
    return (
      <div className="form-page">
        <div className="form-loading">
          <div className="spinner spinner-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="form-page animate-fade-in">
      <header className="page-header">
        <h1 className="page-title">{isEditing ? "Edit Message" : "New Scheduled Message"}</h1>
        <p className="page-subtitle">
          {isEditing
            ? "Update your scheduled message settings"
            : "Set up a new automated WhatsApp message"}
        </p>
      </header>

      <form className="message-form" onSubmit={handleSubmit}>
        {error && <div className="form-error-banner">{error}</div>}

        <div className="form-section">
          <h2 className="section-title">Recipient</h2>

          <div className="form-row">
            <fieldset className="form-group type-fieldset">
              <legend className="form-label">Type</legend>
              <div className="type-toggle">
                <button
                  type="button"
                  className={`type-option ${!isGroup ? "active" : ""}`}
                  onClick={() => setIsGroup(false)}
                >
                  👤 Contact
                </button>
                <button
                  type="button"
                  className={`type-option ${isGroup ? "active" : ""}`}
                  onClick={() => setIsGroup(true)}
                >
                  👥 Group
                </button>
              </div>
            </fieldset>
          </div>

          <div className="form-group">
            <label htmlFor="target" className="form-label">
              {isGroup ? "Group Name" : "Phone Number"}
            </label>
            {isGroup ? (
              <div className="target-with-groups">
                <input
                  id="target"
                  type="text"
                  className="form-input"
                  placeholder="Enter group name exactly as it appears"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  required
                />
                {groups.length > 0 && (
                  <div className="groups-list">
                    <span className="groups-label">Available groups:</span>
                    {groups.slice(0, 5).map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        className="group-chip"
                        onClick={() => setTarget(g.name)}
                      >
                        {g.name}
                      </button>
                    ))}
                    {loadingGroups && <span className="spinner" />}
                  </div>
                )}
              </div>
            ) : (
              <input
                id="target"
                type="tel"
                className="form-input"
                placeholder="+1234567890"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                required
              />
            )}
            <span className="form-help">
              {isGroup
                ? "Enter the exact group name (case-insensitive)"
                : "Include country code without spaces or dashes"}
            </span>
          </div>
        </div>

        <div className="form-section">
          <h2 className="section-title">Message</h2>

          <div className="form-group">
            <label htmlFor="message" className="form-label">
              Content
            </label>
            <textarea
              id="message"
              className="form-input form-textarea"
              placeholder="Type your message here..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              required
              rows={5}
            />
            <span className="form-help">
              {messageText.length} characters • Supports emojis and formatting
            </span>
          </div>
        </div>

        <div className="form-section">
          <h2 className="section-title">Schedule</h2>

          <div className="form-group">
            <label htmlFor="cron" className="form-label">
              Cron Expression
            </label>
            <input
              id="cron"
              type="text"
              className="form-input cron-input"
              placeholder="* * * * *"
              value={cronExpression}
              onChange={(e) => setCronExpression(e.target.value)}
              required
            />
            <span className="form-help">Format: minute hour day-of-month month day-of-week</span>
          </div>

          <div className="presets">
            <span className="presets-label">Quick presets:</span>
            <div className="presets-grid">
              {CRON_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  className={`preset-btn ${cronExpression === preset.value ? "active" : ""}`}
                  onClick={() => handlePreset(preset.value)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-row toggle-row">
            <div>
              <h2 className="section-title">Enabled</h2>
              <p className="toggle-description">Schedule will run automatically when enabled</p>
            </div>
            <button
              type="button"
              className={`toggle ${enabled ? "active" : ""}`}
              onClick={() => setEnabled(!enabled)}
              aria-label={enabled ? "Disable" : "Enable"}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate("/messages")}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <span className="spinner" /> : isEditing ? "Save Changes" : "Create Schedule"}
          </button>
        </div>
      </form>
    </div>
  );
}
