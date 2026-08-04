import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { BRAND } from '../lang';


function LocalVideoLandingModal({ videoUrl, onClose }) {
  const [playError, setPlayError] = useState(false);

  return (
    <div className="yt-modal-overlay">
      <div className="yt-modal-card">
        <div className="yt-modal-header">
          <h3 className="yt-modal-title">Welcome</h3>
          <button onClick={onClose} className="yt-modal-close-btn" title="Close Video">✕</button>
        </div>
        <div className="yt-modal-video-wrap">
          <video
            src={videoUrl}
            className="yt-modal-iframe"
            controls
            autoPlay
            playsInline
            onError={() => setPlayError(true)}
            onPlay={() => setPlayError(false)}
            style={{ objectFit: 'contain' }}
          />
          {playError && (
             <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', color: 'white' }}>
               <p style={{background: 'rgba(0,0,0,0.8)', padding: '10px 20px', borderRadius: 8}}>Please click play to start the video.</p>
             </div>
          )}
        </div>
        <div className="yt-modal-footer">
          <button onClick={onClose} className="yt-modal-continue-btn">Continue to App →</button>
        </div>
      </div>
    </div>
  );
}



export default function LandingPage() {
  const navigate = useNavigate();
  const [videoUrl, setVideoUrl] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Fetch the stored video URL. Always show if a URL exists.
    api.getLandingVideo()
      .then(res => {
        if (res.landing_video_url) {
          setVideoUrl(res.landing_video_url);
          setShowModal(true);
        }
      })
      .catch(() => {/* silently ignore – video is optional */});
  }, []);

  const handleClose = useCallback(() => {
    setShowModal(false);
  }, []);

  return (
    <>
      {/* ── Video modal overlay ── */}
      {showModal && videoUrl && (
        <LocalVideoLandingModal videoUrl={videoUrl} onClose={handleClose} />
      )}

      {/* ── Landing page content (blurred while modal is open) ── */}
      <div className={`landing-page${showModal ? ' landing-page--blurred' : ''}`}>
        <div className="landing-container">

          {/* Top benediction lines */}
          <div className="landing-benediction">
            <p>|| શાસનપતિ શ્રી મહાવીરસ્વામિને નમઃ ||</p>
            <p>|| શ્રી પ્રેમ-ભુવનભાનુ-પદ્મ-જયઘોષ-રાજેન્દ્ર-હેમચંદ્ર ગુરુભ્યો નમઃ ||</p>
          </div>

          {/* Organizer */}
          <div className="landing-organizer">
            <p>{BRAND.orgGu} આયોજિત</p>
          </div>

          {/* Main title in bordered box */}
          <div className="landing-title-box">
            <h1>{BRAND.nameGu}</h1>
          </div>

          {/* Blessing section */}
          <div className="landing-blessing-section">
            <p className="landing-blessing-heading">પાવન પ્રેરણા એવમ્ આશીર્વાદ :</p>

            <p className="landing-saint landing-saint--bold">
              પ.પૂ. સહસ્ત્રકૂટ તપારાધક આચાર્યદેવ શ્રીમદ્દ વિજયસંયમબોધિસૂરીશ્વરજી મહારાજ સાહેબ,
            </p>
            <p className="landing-saint">
              પૂજ્ય મુનિરાજ શ્રી જિનબોધિવિજયજી મહારાજ સાહેબ તથા
            </p>
            <p className="landing-saint">
              પૂજ્ય પંન્યાસ શ્રી કૃપાબોધિવિજયજી મહારાજ સાહેબ.
            </p>
          </div>

          {/* Rules section */}
          <div className="landing-rules-section">
            <h2 className="landing-rules-heading">{BRAND.nameGu} નિયમ:</h2>

            <ol className="landing-rules-list">
              <li>
                {BRAND.nameGu} તા.{BRAND.competitionStartDisplayGu}, બુધવારથી તા. {BRAND.competitionEndDisplayGu}, શુક્રવાર સુધી કુલ ૪ મહિના માટે ભરવાનું ફરજીયાત રહેશે.
              </li>
              <li>
                {BRAND.nameGu} ૫ વર્ષ થી ૬૦ વર્ષ સુધીના પુણ્યશાળીઓ માટે રહેશે.
              </li>
              <li>
                સંપૂર્ણ {BRAND.nameGu} Online ભરવાનું રહેશે.
              </li>
              <li>
                {BRAND.nameGu}માં રોજે રોજના points ભરવાના આવશ્યક રહેશે. આજના પોઈન્ટ્સની window  વધુમાં વધુ ૨ દિવસ સુધી જ ખુલી રહેશે. ત્યારબાદ જે-તે તારીખના પોઈન્ટ્સ online ભરી શકાશે નહિ જેની ખાસ નોંધ લેવી.
              </li>
              <li>
                Minimum 51,000 points થવા આવશ્યક છે. 51,000 points તથા તેનાથી વધુ પોઈન્ટ્સ મેળવનાર તમામ આરાધકનું વિશિષ્ટ બહુમાન કરવામાં આવશે.
              </li>
              <li>
                Highest Points મેળવનાર પ્રથમ ૩ ક્રમાંકનું વિશિષ્ટ બહુમાન કરવામાં આવશે. જેમાં પ્રથમ ક્રમાંકનું રૂ.૨૧,૦૦૦/-, દ્વિતીય ક્રમાંકનું રૂ. ૧૧,૦૦૦/- તથા તૃતીય ક્રમાંકનું રૂ. ૫૦૦૦/- થી બહુમાન કરવામાં આવશે.
              </li>
              <li>
                {BRAND.nameGu}માં ભરવામાં આવતા Points આપની આત્મસાક્ષીએ ભરવાના રહેશે. જે-તે આરાધના કરી હોય તો જ તે Points ભરવા.
              </li>
              <li>
                {BRAND.nameGu} માટે ફરજીયાત Registration ફી {BRAND.registrationFeeDisplayGu} ભરવાની રહેશે. જે કોઈએ પણ રજીસ્ટ્રેશન ફી {BRAND.registrationFeeDisplay} ભરેલી નહીં હોય તો તેમનું ફોર્મ disqualified કરવામાં આવશે.
              </li>
              <li>
                તમામ પોઈન્ટ્સ વગેરે માટેનો અંતિમ નિર્ણય સંપૂર્ણપણે આયોજક {BRAND.orgGu}નો રહેશે.
              </li>
            </ol>
          </div>

          {/* English Rules section */}
          <div className="landing-rules-section landing-rules-english">
            <h2 className="landing-rules-heading">{BRAND.name} – Rules</h2>

            <ol className="landing-rules-list">
              <li>
                The {BRAND.name} must be filled for 4 months, from {BRAND.competitionStartDisplayDMY} (Wednesday) to {BRAND.competitionEndDisplayDMY} (Friday).
              </li>
              <li>
                The {BRAND.name} is for participants aged 5 years to 60 years.
              </li>
              <li>
                The entire {BRAND.name} must be filled online.
              </li>
              <li>
                Daily points must be entered every day. The entry window for a day's points will remain open for a maximum of 2 days only. After that, points for that particular date cannot be submitted online, so please take note.
              </li>
              <li>
                A minimum of 51,000 points is required. All participants who achieve 51,000 or more points will receive special recognition.
              </li>
              <li>
                The top 3 participants with the highest points will receive special prizes: 1st Rank: ₹21,000, 2nd Rank: ₹11,000, 3rd Rank: ₹5,000
              </li>
              <li>
                All points entered in the {BRAND.name} should be filled honestly according to one's own conscience. Only enter points for practices that you have actually performed.
              </li>
              <li>
                A mandatory registration fee of {BRAND.registrationFeeDisplay} must be paid to participate in the {BRAND.name}. Anyone who has not paid the registration fee of {BRAND.registrationFeeDisplay} will have their form disqualified.
              </li>
              <li>
                The final decision regarding all points and related matters will rest solely with the organizing {BRAND.org}.
              </li>
            </ol>
          </div>

          {/* Contact section */}
          <div className="landing-contact">
            <p>
              <strong>Contact On: (only Whatsapp: – {BRAND.org} – 8980121712, Nisarg Shah – 9712129112, Hiten Shah – 9898891097, Dhaval Parekh – 9769088851)</strong>
            </p>
          </div>

          {/* CTA Button */}
          <div className="landing-cta">
            <button className="btn-primary landing-proceed-btn" onClick={() => navigate('/dashboard')}>
              આગળ વધો — Dashboard
            </button>
          </div>

        </div>
      </div>
    </>
  );
}

