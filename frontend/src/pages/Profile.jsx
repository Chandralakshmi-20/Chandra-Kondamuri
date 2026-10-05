
import {
  User,
  Mail,
  ShieldCheck,
  Building2,
  BriefcaseBusiness,
  Phone,
  CalendarDays,
  Camera,
  Pencil,
  X,
  Save,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";

import { useAuth } from "../context/AuthContext";
import api from "../services/api";

import "./Profile.css";


function Profile() {
  const { user } = useAuth();

  const [profile, setProfile] = useState(user);

  const [isEditing, setIsEditing] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const [isUploading, setIsUploading] = useState(false);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  const fileInputRef = useRef(null);


  /* ==================================================
     LOAD LATEST PROFILE
     ================================================== */

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get("/api/profile/me");

        setProfile(response.data);
      } catch (error) {
        console.error(
          "Failed to load profile:",
          error
        );
      }
    };

    loadProfile();
  }, []);


  /* ==================================================
     ROLE NAME
     ================================================== */

  const getRoleName = () => {
    if (profile?.role === "hr") {
      return "HR Manager";
    }

    if (profile?.role === "employee") {
      return "Employee";
    }

    return "User";
  };


  /* ==================================================
     USER INITIALS
     ================================================== */

  const getInitials = () => {
    if (!profile?.full_name) {
      return "U";
    }

    const names = profile.full_name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (names.length === 1) {
      return names[0][0].toUpperCase();
    }

    return (
      names[0][0] +
      names[names.length - 1][0]
    ).toUpperCase();
  };


  /* ==================================================
     DATE FORMAT
     ================================================== */

  const formatDate = (date) => {
    if (!date) {
      return "Not available";
    }

    const formattedDate = new Date(date);

    if (
      Number.isNaN(
        formattedDate.getTime()
      )
    ) {
      return "Not available";
    }

    return formattedDate.toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };


  /* ==================================================
     STATUS
     ================================================== */

  const getStatus = () => {
    if (profile?.is_active === false) {
      return "Inactive";
    }

    return "Active";
  };


  /* ==================================================
     FORM STATE
     ================================================== */

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    date_of_birth: "",
  });


  /* ==================================================
     OPEN EDIT
     ================================================== */

  const openEdit = () => {
    setError("");
    setMessage("");

    setFormData({
      full_name: profile?.full_name || "",
      phone: profile?.phone || "",
      date_of_birth:
        profile?.date_of_birth || "",
    });

    setIsEditing(true);
  };


  /* ==================================================
     CLOSE EDIT
     ================================================== */

  const closeEdit = () => {
    if (isSaving) {
      return;
    }

    setIsEditing(false);
    setError("");
  };


  /* ==================================================
     INPUT CHANGE
     ================================================== */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  /* ==================================================
     SAVE PROFILE
     ================================================== */

  const handleSave = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!formData.full_name.trim()) {
      setError("Full name is required.");
      return;
    }

    try {
      setIsSaving(true);

      const response = await api.put(
        "/api/profile/me",
        {
          full_name:
            formData.full_name.trim(),

          phone:
            formData.phone.trim() || null,

          date_of_birth:
            formData.date_of_birth || null,
        }
      );

      setProfile(response.data);

      setIsEditing(false);

      setMessage(
        "Profile updated successfully."
      );

    } catch (error) {
      console.error(
        "Profile update error:",
        error
      );

      setError(
        error.response?.data?.detail ||
        "Failed to update profile."
      );

    } finally {
      setIsSaving(false);
    }
  };


  /* ==================================================
     IMAGE UPLOAD CLICK
     ================================================== */

  const handleImageClick = () => {
    if (isUploading) {
      return;
    }

    fileInputRef.current?.click();
  };


  /* ==================================================
     IMAGE UPLOAD
     ================================================== */

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setMessage("");

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Only JPG, PNG, and WEBP images are allowed."
      );

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Image size must be less than 5 MB."
      );

      event.target.value = "";
      return;
    }

    try {
      setIsUploading(true);

      const formData = new FormData();

      formData.append("file", file);

      const response = await api.post(
        "/api/profile/me/profile-image",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      setProfile(response.data);

      setMessage(
        "Profile image updated successfully."
      );

    } catch (error) {
      console.error(
        "Profile image upload error:",
        error
      );

      setError(
        error.response?.data?.detail ||
        "Failed to upload profile image."
      );

    } finally {
      setIsUploading(false);

      event.target.value = "";
    }
  };


  /* ==================================================
     LOADING / USER CHECK
     ================================================== */

  if (!profile) {
    return (
      <div className="profile-page">
        <div className="profile-card profile-empty">

          <h2>
            Profile unavailable
          </h2>

          <p>
            User information could not be loaded.
          </p>

        </div>
      </div>
    );
  }


  return (
    <div className="profile-page">

      {/* ==================================================
          PAGE HEADER
          ================================================== */}

      <div className="profile-page-header">

        <div>
          <h1>
            My Profile
          </h1>

          <p>
            View and manage your personal
            and professional information.
          </p>
        </div>

        <button
          type="button"
          className="profile-edit-button"
          onClick={openEdit}
        >
          <Pencil size={17} />

          Edit Profile
        </button>

      </div>


      {/* ==================================================
          MESSAGE
          ================================================== */}

      {message && (
        <div className="profile-success-message">
          {message}
        </div>
      )}


      {error && (
        <div className="profile-error-message">
          {error}
        </div>
      )}


      {/* ==================================================
          PROFILE LAYOUT
          ================================================== */}

      <section className="profile-layout">

        {/* ==================================================
            PROFILE SUMMARY
            ================================================== */}

        <div className="profile-card profile-summary-card">

          <div className="profile-image-wrapper">

            {profile.profile_image_url ? (

              <img
                src={profile.profile_image_url}
                alt={profile.full_name}
                className="profile-large-image"
              />

            ) : (

              <div className="profile-large-avatar">
                {getInitials()}
              </div>

            )}

            <button
              type="button"
              className="profile-camera-button"
              onClick={handleImageClick}
              disabled={isUploading}
              title="Upload profile image"
            >
              <Camera size={17} />
            </button>

          </div>


          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageUpload}
            className="profile-file-input"
          />


          <button
            type="button"
            className="profile-upload-button"
            onClick={handleImageClick}
            disabled={isUploading}
          >
            <Camera size={16} />

            {isUploading
              ? "Uploading..."
              : "Upload Photo"}
          </button>


          <h2>
            {profile.full_name || "User"}
          </h2>

          <p className="profile-role">
            {getRoleName()}
          </p>

          <span
            className={`profile-status ${
              profile.is_active === false
                ? "inactive"
                : ""
            }`}
          >
            <span className="status-dot" />

            {getStatus()}
          </span>

        </div>


        {/* ==================================================
            PERSONAL INFORMATION
            ================================================== */}

        <div className="profile-card profile-details-card">

          <div className="profile-section-header">

            <div>
              <h2>
                Personal Information
              </h2>

              <p>
                Your account information
              </p>
            </div>

            <User size={20} />

          </div>


          <div className="profile-details-grid">

            {/* FULL NAME */}

            <div className="profile-detail">

              <div className="detail-icon">
                <User size={18} />
              </div>

              <div>
                <span>
                  Full Name
                </span>

                <strong>
                  {profile.full_name ||
                    "Not available"}
                </strong>
              </div>

            </div>


            {/* EMAIL */}

            <div className="profile-detail">

              <div className="detail-icon">
                <Mail size={18} />
              </div>

              <div>
                <span>
                  Email
                </span>

                <strong>
                  {profile.email ||
                    "Not available"}
                </strong>
              </div>

            </div>


            {/* PHONE */}

            <div className="profile-detail">

              <div className="detail-icon">
                <Phone size={18} />
              </div>

              <div>
                <span>
                  Phone
                </span>

                <strong>
                  {profile.phone ||
                    "Not available"}
                </strong>
              </div>

            </div>


            {/* ROLE */}

            <div className="profile-detail">

              <div className="detail-icon">
                <ShieldCheck size={18} />
              </div>

              <div>
                <span>
                  Role
                </span>

                <strong>
                  {getRoleName()}
                </strong>
              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ==================================================
          PROFESSIONAL INFORMATION
          ================================================== */}

      <section className="profile-card profile-details-card">

        <div className="profile-section-header">

          <div>
            <h2>
              Professional Information
            </h2>

            <p>
              Your organization and job details
            </p>
          </div>

          <BriefcaseBusiness size={20} />

        </div>


        <div className="profile-details-grid">

          {/* DEPARTMENT */}

          <div className="profile-detail">

            <div className="detail-icon">
              <Building2 size={18} />
            </div>

            <div>
              <span>
                Department
              </span>

              <strong>
                {profile.department ||
                  "Not available"}
              </strong>
            </div>

          </div>


          {/* DESIGNATION */}

          <div className="profile-detail">

            <div className="detail-icon">
              <BriefcaseBusiness size={18} />
            </div>

            <div>
              <span>
                Designation
              </span>

              <strong>
                {profile.designation ||
                  "Not available"}
              </strong>
            </div>

          </div>


          {/* JOINING DATE */}

          <div className="profile-detail">

            <div className="detail-icon">
              <CalendarDays size={18} />
            </div>

            <div>
              <span>
                Joining Date
              </span>

              <strong>
                {formatDate(
                  profile.joining_date
                )}
              </strong>
            </div>

          </div>


          {/* DATE OF BIRTH */}

          <div className="profile-detail">

            <div className="detail-icon">
              <CalendarDays size={18} />
            </div>

            <div>
              <span>
                Date of Birth
              </span>

              <strong>
                {formatDate(
                  profile.date_of_birth
                )}
              </strong>
            </div>

          </div>

        </div>

      </section>


      {/* ==================================================
          EDIT PROFILE MODAL
          ================================================== */}

      {isEditing && (

        <div
          className="profile-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeEdit();
            }
          }}
        >

          <div className="profile-modal">

            <div className="profile-modal-header">

              <div>
                <h2>
                  Edit Profile
                </h2>

                <p>
                  Update your profile information.
                </p>
              </div>

              <button
                type="button"
                className="profile-modal-close"
                onClick={closeEdit}
                disabled={isSaving}
              >
                <X size={20} />
              </button>

            </div>


            <form
              className="profile-form"
              onSubmit={handleSave}
            >

              {/* FULL NAME */}

              <div className="profile-form-group">

                <label>
                  Full Name
                </label>

                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  required
                />

              </div>


              {/* EMAIL */}

              <div className="profile-form-group">

                <label>
                  Email
                </label>

                <input
                  type="email"
                  value={profile.email || ""}
                  disabled
                />

                <small>
                  Email cannot be changed here.
                </small>

              </div>


              {/* PHONE */}

              <div className="profile-form-group">

                <label>
                  Phone
                </label>

                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                />

              </div>


              {/* DATE OF BIRTH */}

              <div className="profile-form-group">

                <label>
                  Date of Birth
                </label>

                <input
                  type="date"
                  name="date_of_birth"
                  value={
                    formData.date_of_birth
                  }
                  onChange={handleChange}
                />

              </div>


              {/* FORM ACTIONS */}

              <div className="profile-form-actions">

                <button
                  type="button"
                  className="profile-cancel-button"
                  onClick={closeEdit}
                  disabled={isSaving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="profile-save-button"
                  disabled={isSaving}
                >
                  <Save size={17} />

                  {isSaving
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Profile;

