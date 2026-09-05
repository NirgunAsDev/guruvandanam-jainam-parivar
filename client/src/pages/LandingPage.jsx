import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BRAND } from '../lang';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <>
      {/* ── Landing page content ── */}
      <div className="landing-page">
        <div className="landing-container">

          {/* Top benediction lines */}
          <div className="landing-benediction">
            <p>॥ शासनपति श्री महावीरस्वामिने नमः ॥</p>
            <p>॥ नमो नमः श्री गुरु प्रेम-भुवनभानु-पद्म-जयघोष-राजेन्द्र-हेमचंद्र सूरिभ्योः ॥</p>
          </div>

          {/* Organizer */}
          <div className="landing-organizer">
            <p>"जैनम् परिवार" आयोजित</p>
          </div>

          {/* Main title in bordered box */}
          <div className="landing-title-box">
            <h1>"गुरुवंदनम्"</h1>
            <p className="landing-title-sub">(कुल १००८ गुरु-वंदन)</p>
          </div>

          {/* Blessing section */}
          <div className="landing-blessing-section">
            <p className="landing-blessing-heading">पावन प्रेरणा एवं आशीर्वाद:</p>

            <p className="landing-saint landing-saint--bold">
              प.पू. सहस्र कूट तप आराधक आचार्यदेव श्रीमद् विजयसंयमबोधिसूरीश्वरजी म.सा.,
            </p>
            <p className="landing-saint">
              प.पू. मुनिराज श्री जिनबोधिविजयजी म.सा. तथा
            </p>
            <p className="landing-saint">
              प.पू. पंन्यास श्री कृपाबोधिविजयजी म.सा.
            </p>
          </div>

          {/* Rules section */}
          <div className="landing-rules-section">
            <h2 className="landing-rules-heading">गुरुवंदनम् नियम:</h2>

            <ol className="landing-rules-list">
              <li>
                आयु सीमा: इस गुरुवंदनम् आराधना में ६ वर्ष से ६० वर्ष तक के भाग्यशाली लाभार्थी भाग ले सकते हैं।
              </li>
              <li>
                लक्ष्य: गुरुवंदनम् आराधना के अंतर्गत पूज्य साधु एवम् साध्वी जी भगवंत को इस आराधना के १२१ दिनों में कुल १००८ गुरु-वंदन करने होंगे।
              </li>
              <li>
                प्रत्यक्ष वंदन: गुरु-वंदन केवल प्रत्यक्ष पूज्य साधु एवम् साध्वी जी भगवंत के समक्ष किया गया ही मान्य होगा। किसी फोटो या मूर्ति के समक्ष किया गया वंदन मान्य नहीं होगा।
              </li>
              <li>
                दैनिक सीमा: १ दिन में १ साधु महात्मा को अधिकतम ३ बार ही गुरु-वंदन किया जा सकता है। उससे अधिक किया गया वंदन मान्य नहीं होगा।
              </li>
              <li>
                पंजीकरण एवं प्रविष्टि: 'गुरुवंदनम्' में भाग लेने के लिए Online Registration (ऑनलाइन पंजीकरण) करवाना अनिवार्य है। प्रतिदिन किए गए गुरु-वंदन को ऑनलाइन सबमिट (Submit) करना होगा।
              </li>
              <li>
                बहुमान (सम्मान): इस आराधना के १२१ दिनों के दौरान जो भी पुण्यात्मा १००८ गुरु-वंदन पूर्ण करेंगे, उन सभी का विशेष बहुमान/सम्मान किया जाएगा।
              </li>
              <li>
                पंजीकरण शुल्क: गुरुवंदनम् आराधना में जुड़ने के लिए ₹ २००/- Registration Fee (पंजीकरण शुल्क) अनिवार्य है।
              </li>
            </ol>
          </div>

          {/* English Rules section */}
          <div className="landing-rules-section landing-rules-english">
            <h2 className="landing-rules-heading">{BRAND.name} – Rules</h2>

            <ol className="landing-rules-list">
              <li>
                Age Limit: Fortunate participants aged 6 to 60 years may take part in this {BRAND.name} aradhana.
              </li>
              <li>
                Goal: Under the {BRAND.name} aradhana, a total of 1008 Guru-Vandan must be offered to the revered Sadhu or Sadhvi Bhagwants during the 121 days of this aradhana.
              </li>
              <li>
                In-Person Vandan: Only Guru-Vandan performed directly in the presence of a Sadhu or Sadhvi Bhagwant will be considered valid. Vandan performed before a photo or idol will not be valid.
              </li>
              <li>
                Daily Limit: A maximum of 3 Guru-Vandan can be performed to one Sadhu Mahatma per day. Any Vandan performed beyond this will not be valid.
              </li>
              <li>
                Registration & Entry: Online Registration is mandatory to participate in '{BRAND.name}'. The Guru-Vandan performed each day must be submitted online.
              </li>
              <li>
                Honor (Recognition): All the blessed souls who complete 1008 Guru-Vandan during the 121 days of this aradhana will receive special honor/recognition.
              </li>
              <li>
                Registration Fee: A Registration Fee of ₹200/- is mandatory to join the {BRAND.name} aradhana.
              </li>
            </ol>
          </div>

          {/* Contact section */}
          <div className="landing-contact">
            <p>
              <strong>अधिक जानकारी के लिए संपर्क सूत्र: (Only Whatsapp)</strong>
            </p>
            <p>जैनम् परिवार: +91 8980121712</p>
            <p>निसर्ग शाह: +91 9712129112</p>
            <p>हितेन शाह: +91 98988 91097</p>
            <p>विशित शाह: +91 94270 38103</p>
            <p>धवल पारेख: +91 97690 88851</p>
          </div>

          {/* CTA Button */}
          <div className="landing-cta">
            <button className="btn-primary landing-proceed-btn" onClick={() => navigate('/dashboard')}>
              आगे बढ़ें — Dashboard
            </button>
          </div>

        </div>
      </div>
    </>
  );
}

