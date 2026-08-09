import streamlit as st
import segno
import io

def generate_qr_code(url: str) -> io.BytesIO:
    """
    Generates a QR code for a given URL and returns it as a BytesIO image buffer.
    """
    qr = segno.make_qr(url)
    qr_buffer = io.BytesIO()
    qr.save(qr_buffer, kind="png", scale=10)
    qr_buffer.seek(0)
    return qr_buffer

def render_qr_section(subjects: list):
    """
    Renders the glassmorphic QR Code generator section for the teacher.
    """
    st.markdown("---")
    st.markdown("### 🖨️ Generate Subject QR Codes")
    
    if subjects:
        sub_options = {f"{s['subject_code']} - {s['name']} (Sec {s['section']})": s for s in subjects}
        selected_sub_display = st.selectbox(
            "Select Subject to Generate QR Code", 
            options=list(sub_options.keys()), 
            key="qr_subj_selector"
        )
        selected_sub = sub_options[selected_sub_display]
        
        base_url = st.text_input(
            "Base Application URL",
            value="https://snapclass--ai-attendence-system-cfikqqbrr2gj2xmspvsbzf.streamlit.app",
            key="qr_base_url_input"
        )
        
        url_clean = base_url.strip().rstrip("/")
        enrollment_url = f"{url_clean}/?action=enroll&subject_code={selected_sub['subject_code']}"
        
        col_qr, col_info = st.columns([1, 1.5])
        with col_qr:
            try:
                qr_buffer = generate_qr_code(enrollment_url)
                st.image(qr_buffer, width=220, caption=f"Enrollment QR for {selected_sub['subject_code']}")
                st.download_button(
                    label="Download QR Code",
                    data=qr_buffer.getvalue(),
                    file_name=f"QR_{selected_sub['subject_code']}.png",
                    mime="image/png",
                    key="qr_download_btn"
                )
            except Exception as e:
                st.error(f"Failed to generate QR Code: {str(e)}")
                
        with col_info:
            st.markdown(
                f"""
                <div style="background: rgba(168, 85, 247, 0.08); padding: 1.2rem; border-radius: 12px; border: 1px solid rgba(168, 85, 247, 0.25); margin-top: 5px;">
                    <h5 style="margin-top: 0; margin-bottom: 0.8rem; color: #ffffff; font-weight: 600; font-size: 1rem;">QR Code Details</h5>
                    <p style="font-size: 0.85rem; color: rgba(255, 255, 255, 0.7); margin-bottom: 0.5rem; line-height: 1.5;">
                        <strong>Target Course:</strong> {selected_sub['name']}<br>
                        <strong>Subject Code:</strong> {selected_sub['subject_code']}<br>
                        <strong>Section:</strong> {selected_sub['section']}
                    </p>
                    <p style="font-size: 0.8rem; color: rgba(255, 255, 255, 0.55); word-break: break-all; margin-top: 0.8rem; margin-bottom: 0.8rem; line-height: 1.4;">
                        <strong>Encoded Enrollment URL:</strong><br>
                        <code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px; display: inline-block; margin-top: 4px; color: #c084fc;">{enrollment_url}</code>
                    </p>
                    <p style="font-size: 0.8rem; color: #a855f7; margin-bottom: 0; line-height: 1.5;">
                        💡 <strong>How it works:</strong> When a student scans this QR code, they are directed to the login page. Once logged in (or after creating an account), the system will automatically prompt them to enroll in this subject.
                    </p>
                </div>
                """,
                unsafe_allow_html=True
            )
    else:
        st.info("You haven't registered any subjects yet. Register a subject below first to generate a QR code.")
