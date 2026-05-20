import streamlit as st
from src.database.db import get_subject_by_code, enroll_student, get_student_attendance_summary

def render_student_dashboard():
    """Placeholder for the student dashboard."""
    # Check if student is logged in
    if "current_student_id" not in st.session_state:
        st.session_state["current_screen"] = "student"
        st.rerun()

    # ── Render Persisted Enrollment Toasts ──
    if "enrollment_toast" in st.session_state:
        toast_data = st.session_state.pop("enrollment_toast")
        st.toast(toast_data["message"], icon=toast_data["icon"])

    st.markdown(
        """
        <style>
            .dashboard-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 2rem;
            }
            .dashboard-title h2 {
                margin: 0;
                color: #ffffff;
                font-size: 1.8rem;
                font-weight: 700;
            }
            .dashboard-title p {
                margin: 0;
                color: rgba(255,255,255,0.6);
                font-size: 0.9rem;
            }
        </style>
        """,
        unsafe_allow_html=True,
    )

    st.markdown(
        f"""
        <div class="dashboard-header">
            <div class="dashboard-title">
                <h2>Welcome to your Dashboard</h2>
                <p>Student ID: {st.session_state["current_student_id"]}</p>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )
    
    # ── Handle Pending QR Code Enrollment ──
    if "pending_enrollment_subject_code" in st.session_state:
        pending_subject_code = st.session_state["pending_enrollment_subject_code"]
        
        with st.spinner("Fetching scanned subject details..."):
            subject_res = get_subject_by_code(pending_subject_code)
            
        if subject_res["success"]:
            subject_data = subject_res["data"]
            subject_id = subject_data["subject_id"]
            subject_name = subject_data["name"]
            
            # Show a beautiful glassmorphic confirmation prompt card
            st.markdown(
                f"""
                <style>
                    .qr-enrollment-card {{
                        background: linear-gradient(135deg, rgba(108, 92, 231, 0.12), rgba(85, 239, 196, 0.12));
                        border: 1px solid rgba(108, 92, 231, 0.35);
                        border-radius: 16px;
                        padding: 1.5rem;
                        margin-bottom: 1.5rem;
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                        backdrop-filter: blur(10px);
                    }}
                    .qr-enrollment-title {{
                        color: #55efc4;
                        font-weight: 700;
                        font-size: 1.25rem;
                        margin-bottom: 0.5rem;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }}
                    .qr-enrollment-subtitle {{
                        color: rgba(255, 255, 255, 0.85);
                        font-size: 0.95rem;
                        margin-bottom: 1.2rem;
                        line-height: 1.5;
                    }}
                </style>
                <div class="qr-enrollment-card">
                    <div class="qr-enrollment-title">📚 Subject Scanned via QR Code</div>
                    <div class="qr-enrollment-subtitle">
                        You scanned the registration link for <strong>{subject_name} ({pending_subject_code})</strong>. 
                        Would you like to enroll in this subject?
                    </div>
                </div>
                """,
                unsafe_allow_html=True
            )
            
            # Confirmation Buttons
            btn_col1, btn_col2, btn_spacer = st.columns([1.2, 1.2, 3])
            with btn_col1:
                confirm_enroll = st.button("Yes, Enroll Me", type="primary", key="qr_confirm_enroll_btn", width="stretch")
            with btn_col2:
                cancel_enroll = st.button("No, Cancel", type="secondary", key="qr_cancel_enroll_btn", width="stretch")
                
            if confirm_enroll:
                student_id = st.session_state["current_student_id"]
                with st.spinner("Enrolling..."):
                    enroll_res = enroll_student(student_id, subject_id)
                    if enroll_res["success"]:
                        st.session_state["enrollment_toast"] = {"message": f"Successfully enrolled in {subject_name}!", "icon": "🎉"}
                    else:
                        error_msg = enroll_res.get("error", "")
                        if "Already enrolled" in error_msg:
                            st.session_state["enrollment_toast"] = {"message": f"You are already enrolled in {subject_name}.", "icon": "ℹ️"}
                        else:
                            st.session_state["enrollment_toast"] = {"message": f"Failed to enroll: {error_msg}", "icon": "⚠️"}
                # Clean up session state and reload page
                st.session_state.pop("pending_enrollment_subject_code", None)
                st.rerun()
                
            if cancel_enroll:
                st.session_state["enrollment_toast"] = {"message": "Enrollment cancelled.", "icon": "ℹ️"}
                st.session_state.pop("pending_enrollment_subject_code", None)
                st.rerun()
                
            st.divider()
        else:
            # Subject code from QR was not found in DB
            st.session_state["enrollment_toast"] = {"message": f"Scanned subject code '{pending_subject_code}' not found.", "icon": "⚠️"}
            st.session_state.pop("pending_enrollment_subject_code", None)
            st.rerun()

    st.markdown("### Enroll in a Subject")
    st.markdown("Enter the subject code provided by your teacher to enroll in their class.")
    
    with st.container():
        col1, col2 = st.columns([3, 1])
        with col1:
            subject_code = st.text_input("Subject Code", placeholder="e.g. CS101", label_visibility="collapsed")
        with col2:
            enroll_clicked = st.button("Enroll", width="stretch", type="primary")
            
        if enroll_clicked:
            if not subject_code.strip():
                st.warning("Please enter a subject code.")
            else:
                with st.spinner("Enrolling..."):
                    subject_res = get_subject_by_code(subject_code.strip())
                    if not subject_res["success"]:
                        st.error(subject_res["error"])
                    else:
                        subject_data = subject_res["data"]
                        subject_id = subject_data["subject_id"]
                        subject_name = subject_data["name"]
                        student_id = st.session_state["current_student_id"]
                        
                        enroll_res = enroll_student(student_id, subject_id)
                        if enroll_res["success"]:
                            st.success(f"Successfully enrolled in {subject_name} ({subject_code})!")
                        else:
                            st.error(enroll_res["error"])
                            
    st.divider()
    
    st.markdown("### 📊 My Attendance")
    with st.spinner("Fetching your attendance records..."):
        attendance_summary = get_student_attendance_summary(st.session_state["current_student_id"])
        
    if attendance_summary:
        import pandas as pd
        df = pd.DataFrame(attendance_summary)
        st.dataframe(df, width="stretch", hide_index=True)
    else:
        st.info("You haven't enrolled in any subjects yet, or no classes have been held.")

    st.divider()

    if st.button("Logout", key="student_logout"):
        st.session_state.pop("current_student_id", None)
        st.session_state["current_screen"] = "home"
        st.rerun()
