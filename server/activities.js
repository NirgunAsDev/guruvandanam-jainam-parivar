const activities = [

  // ─── BUMPER POINTS ───────────────────────────────────────────────────────────

  {
    id: "navpad_oli",
    group: "bumper",
    nameEn: "Navpad Oli",
    nameGu: "શ્રી નવપદજી ની ઓળી કરી",
    nameHi: "श्री नवपदजी की ओली की",
    pointsPerUnit: 2000,
    maxPerDay: 1,
    unit: "boolean",
    description: "૯ આયંબિલ સળંગ",
    descriptionHi: "९ आयंबिल लगातार"
  },

  {
    id: "vardhman_tap",
    group: "bumper",
    nameEn: "Vardhman Tap Oli",
    nameGu: "શ્રી વર્ધમાન તપ ની ઓળી કરી અથવા વર્ધમાન તપ ઓળીનો પાયો નાખ્યો",
    nameHi: "श्री वर्धमान तप की ओली की अथवा वर्धमान तप ओली की नींव रखी",
    pointsPerUnit: 4000,
    maxPerDay: 1,
    unit: "boolean",
    description: "",
    descriptionHi: ""
  },

  {
    id: "parva_pousadh",
    group: "bumper",
    nameEn: "Parva Pousadh",
    nameGu: "પર્વતિથિ પૌષધ કર્યો",
    nameHi: "पर्व तिथि पौषध किया",
    pointsPerUnit: 1000,
    maxPerDay: 1,
    unit: "boolean",
    description: "",
    descriptionHi: ""
  },

  {
    id: "mahavir_janm_kalyanak",
    group: "bumper",
    nameEn: "Mahavir Janma Kalyanak Celebration",
    nameGu: "પ્રભુ વીર જન્મ કલ્યાણક ની ઉજવણી કરી",
    nameHi: "प्रभु वीर जन्म कल्याणक का उत्सव किया",
    pointsPerUnit: 500,
    maxPerDay: 1,
    unit: "boolean",
    description: "અનુકંપા, જીવદયા, મહાપૂજા, ઘરે ઘરે દીવડા પ્રગટાવવા ઇત્યાદિ",
    descriptionHi: "अनुकंपा, जीवदया, महापूजा, घर-घर दीपक प्रज्वलित करना आदि"
  },

  {
    id: "shasan_sthapna",
    group: "bumper",
    nameEn: "Shasan Sthapna Celebration",
    nameGu: "શાસન સ્થાપના દિવસ ની ઉજવણી કરી",
    nameHi: "शासन स्थापना दिवस का उत्सव किया",
    pointsPerUnit: 500,
    maxPerDay: 1,
    unit: "boolean",
    description: "શાસન ધ્વજ ફરકાવવો, શાસન રેલી કાઢવી ઇત્યાદિ",
    descriptionHi: "शासन ध्वज फहराना, शासन रैली निकालना आदि"
  },

  {
    id: "bakri_eid_ayambil",
    group: "bumper",
    nameEn: "Ayambil on Bakri Eid",
    nameGu: "બકરી ઈદના દિવસે આયંબિલ તપ કર્યું",
    nameHi: "बकरी ईद के दिन आयंबिल तप किया",
    pointsPerUnit: 500,
    maxPerDay: 1,
    unit: "boolean",
    description: "",
    descriptionHi: ""
  },

  {
    id: "mango_tyag",
    group: "bumper",
    nameEn: "Mango Renunciation",
    nameGu: "આર્દ્રા નક્ષત્ર બાદ કેરી ત્યાગ નો નિયમ લેવો",
    nameHi: "आद्रा नक्षत्र के बाद आम के त्याग का नियम लेना",
    pointsPerUnit: 500,
    maxPerDay: 1,
    unit: "boolean",
    description: "",
    descriptionHi: ""
  },

  {
    id: "navkar",
    group: "common",
    nameEn: "Navkar (morning & night)",
    nameGu: "સવારે ઉઠતા ૮ અને સુતા ૭ નવકાર ગણવા",
    nameHi: "सुबह उठते ८ और सोते ७ नवकार गिनना",
    pointsPerUnit: 10,
    maxPerDay: 1,
    unit: "boolean",
    description: "",
    descriptionHi: ""
  },

  {
    id: "pratikraman",
    group: "common",
    nameEn: "Pratikraman",
    nameGu: "પ્રતિક્રમણ કરવું",
    nameHi: "प्रतिक्रमण करना",
    pointsPerUnit: 50,
    maxPerDay: 2,
    unit: "count",
    description: "રાઈ, દૈવસિ/ચૌમાસી/પાક્ષિક – પ્રતિક્રમણ દીઠ ૫૦ પોઈન્ટ્સ. Maximum per day 2",
    descriptionHi: "राई, दैवसिक/चातुर्मासी/पाक्षिक – प्रति प्रतिक्रमण ५० पॉइंट्स। Maximum per day 2"
  },

  {
    id: "tap",
    group: "common",
    nameEn: "Tap (Fasting)",
    nameGu: "તપ કરવું",
    nameHi: "तप करना",
    pointsPerUnit: null,
    maxPerDay: 1,
    unit: "select",
    options: [
      { label: "ઉપવાસ",    labelHi: "उपवास",    points: 100 },
      { label: "આયંબિલ",  labelHi: "आयंबिल",   points: 70  },
      { label: "એકાસણું", labelHi: "एकासना",   points: 50  },
      { label: "બીયાસણું",labelHi: "बियासना",  points: 40  }
    ],
    description: "",
    descriptionHi: ""
  },

  {
    id: "jinpuja",
    group: "common",
    nameEn: "Jinpuja",
    nameGu: "જિનપૂજા",
    nameHi: "जिनपूजा",
    pointsPerUnit: null,
    maxPerDay: 1,
    unit: "select",
    options: [
      { label: "સાદી જિનપૂજા",        labelHi: "सादी जिनपूजा",        points: 20 },
      { label: "અષ્ટપ્રકારી જિનપૂજા", labelHi: "अष्टप्रकारी जिनपूजा", points: 50 }
    ],
    description: "",
    descriptionHi: ""
  },

  {
    id: "samayik",
    group: "common",
    nameEn: "Samayik",
    nameGu: "સામાયિક કરવી",
    nameHi: "सामायिक करना",
    pointsPerUnit: 20,
    maxPerDay: 15,
    unit: "count",
    description: "સામાયિક કરવી- ૨૦.  maximum ૧૫ સામાયિક per day . maximum પોઈન્ટ્સ ૩૦૦",
    descriptionHi: "सामायिक करना - २०। maximum १५ सामायिक per day। maximum पॉइंट्स ३००"
  },

  {
    id: "boiled_water",
    group: "common",
    nameEn: "Drink boiled water",
    nameGu: "ઉકાળેલું પાણી પીવું",
    nameHi: "उबला हुआ पानी पीना",
    pointsPerUnit: 20,
    maxPerDay: 1,
    unit: "boolean",
    description: "",
    descriptionHi: ""
  },

  {
    id: "mobile_tyag",
    group: "common",
    nameEn: "Mobile renunciation (10pm–7am)",
    nameGu: "મોબાઈલ નો ત્યાગ કરવો",
    nameHi: "मोबाइल का त्याग करना",
    pointsPerUnit: 30,
    maxPerDay: 1,
    unit: "boolean",
    description: "રાત્રીના ૧૦ થી સવાર ના ૭ વાગ્યા સુધી",
    descriptionHi: "रात के १० बजे से सुबह के ७ बजे तक"
  },

  {
    id: "vigai_tyag",
    group: "common",
    nameEn: "Vigai renunciation",
    nameGu: "વિગઈ ત્યાગ કરવો",
    nameHi: "विगई का त्याग करना",
    pointsPerUnit: 50,
    maxPerDay: 1,
    unit: "boolean",
    description: "કોઈ પણ એક વિગઈ",
    descriptionHi: "कोई भी एक विगई"
  },

  {
    id: "abhakshya_tyag",
    group: "common",
    nameEn: "Avoid non-permissible foods",
    nameGu: "અભક્ષ્ય વસ્તુનો ત્યાગ કરવો",
    nameHi: "अभक्ष्य वस्तु का त्याग करना",
    pointsPerUnit: 30,
    maxPerDay: 1,
    unit: "boolean",
    description: "Ice cream, Cold Drink, બરફના ગોલા વિગેરે",
    descriptionHi: "Ice cream, Cold Drink, बर्फ के गोले आदि"
  },

  {
    id: "hotel_tyag",
    group: "common",
    nameEn: "Avoid hotel food",
    nameGu: "હોટેલ નો ત્યાગ કરવો",
    nameHi: "होटल का त्याग करना",
    pointsPerUnit: 30,
    maxPerDay: 1,
    unit: "boolean",
    description: "",
    descriptionHi: ""
  },

  {
    id: "angam_pani_tyag",
    group: "common",
    nameEn: "Avoid unfiltered/uncounted water",
    nameGu: "અણગણ પાણી નો ત્યાગ કરવો",
    nameHi: "अणगण पानी का त्याग करना",
    pointsPerUnit: 10,
    maxPerDay: 1,
    unit: "boolean",
    description: "નાહવા માટે, પીવા માટે વિગેરે",
    descriptionHi: "नहाने के लिए, पीने के लिए आदि"
  },

  {
    id: "dharmik_pustak_vachan",
    group: "common",
    nameEn: "Religious book reading",
    nameGu: "ધાર્મિક પુસ્તક વાંચન કરવું",
    nameHi: "धार्मिक पुस्तक वाचन करना",
    pointsPerUnit: 30,
    maxPerDay: 4,
    unit: "count",
    description: "૩૦ મિનિટના ૩૦ પોઈન્ટ્સ, maximum per day ૧૨૦ મિનિટ = ૧૨૦ પોઈન્ટ્સ",
    descriptionHi: "३० मिनट के ३० पॉइंट्स, maximum per day १२० मिनट = १२० पॉइंट्स"
  },

  {
    id: "maun",
    group: "common",
    nameEn: "Silence (Maun)",
    nameGu: "મૌન પાળવું",
    nameHi: "मौन पालना",
    pointsPerUnit: 10,
    maxPerDay: 5,
    unit: "count",
    description: "જાગ્રત અવસ્થા ફરજીયાત - ૧ કલાક ના ૧૦ પોઇન્ટ , maximum per day ૫ કલાક = ૫૦ પોઈન્ટ્સ",
    descriptionHi: "जागृत अवस्था अनिवार्य - १ घंटे के १० पॉइंट, maximum per day ५ घंटे = ५० पॉइंट्स"
  },

  {
    id: "kandmul_tyag",
    group: "common",
    nameEn: "Root vegetable renunciation",
    nameGu: "કંદમૂળ ત્યાગ કરવો",
    nameHi: "कंदमूल का त्याग करना",
    pointsPerUnit: 20,
    maxPerDay: 1,
    unit: "boolean",
    description: "",
    descriptionHi: ""
  },

  // ─── GROUP 1 (Age 5–15) ──────────────────────────────────────────────────────

  {
    id: "g1_matapita_pag",
    group: "1",
    nameEn: "Touch feet of parents",
    nameGu: "માતા-પિતાને પગે લાગ્યા",
    nameHi: "माता-पिता के पैर छूना",
    pointsPerUnit: 10,
    maxPerDay: 1,
    unit: "boolean",
    description: "",
    descriptionHi: ""
  },

  {
    id: "g1_jamta_maun",
    group: "1",
    nameEn: "Silence while eating",
    nameGu: "જમતાં-જમતાં મૌન લીધું",
    nameHi: "खाते-खाते मौन रखना",
    pointsPerUnit: 20,
    maxPerDay: 1,
    unit: "boolean",
    description: "",
    descriptionHi: ""
  },

  {
    id: "g1_tv_mobile_limit",
    group: "1",
    nameEn: "Limit TV & mobile entertainment to 1 hour",
    nameGu: "ટીવી તથા મોબાઈલ મનોરંજન માટે ૧ કલાક થી વધુ વાપરવો નહિ",
    nameHi: "TV तथा मोबाइल मनोरंजन के लिए १ घंटे से अधिक उपयोग न करना",
    pointsPerUnit: 50,
    maxPerDay: 1,
    unit: "boolean",
    description: "",
    descriptionHi: ""
  },

  {
    id: "g1_pathshala_gatha",
    group: "1",
    nameEn: "Learn new Gatha at Pathshala",
    nameGu: "પાઠશાળા જઈને નવી ગાથા કરવી",
    nameHi: "पाठशाला जाकर नई गाथा करना",
    pointsPerUnit: 5,
    maxPerDay: 10,
    unit: "count",
    description: "૧ ગાથાના ૫ પોઈન્ટ્સ. maximum ૧૦ ગાથા per day = ૫૦ પોઈન્ટ્સ",
    descriptionHi: "१ गाथा के ५ पॉइंट्स। maximum १० गाथा per day = ५० पॉइंट्स"
  },

  {
    id: "g1_stuti",
    group: "1",
    nameEn: "Recite new Stuti at Jinalay",
    nameGu: "જિનાલયમાં જઈ નવી સ્તુતિ બોલવી",
    nameHi: "जिनालय में जाकर नई स्तुति बोलना",
    pointsPerUnit: 10,
    maxPerDay: 1,
    unit: "boolean",
    description: "",
    descriptionHi: ""
  },

  {
    id: "g1_video_games_tyag",
    group: "1",
    nameEn: "Avoid video / online games",
    nameGu: "વિડિઓ ગેમ્સ / online ગેમ્સ નો ત્યાગ કરવો",
    nameHi: "वीडियो गेम्स / online गेम्स का त्याग करना",
    pointsPerUnit: 50,
    maxPerDay: 1,
    unit: "boolean",
    description: "",
    descriptionHi: ""
  },

  {
    id: "g1_guruvandan",
    group: "1",
    nameEn: "Guruvandan at Upashray",
    nameGu: "ઉપાશ્રયમાં જઈને મહાત્માને ગુરુવંદન કરવા",
    nameHi: "उपाश्रय में जाकर महात्मा को गुरुवंदन करना",
    pointsPerUnit: 10,
    maxPerDay: 10,
    unit: "count",
    description: "૧ ગુરુવંદન ના ૧૦ પોઈન્ટ્સ, maximum ૧૦ ગુરુવંદન per day = ૧૦૦ પોઈન્ટ",
    descriptionHi: "१ गुरुवंदन के १० पॉइंट्स, maximum १० गुरुवंदन per day = १०० पॉइंट"
  },

  {
    id: "g1_dhoti_khes_puja",
    group: "1",
    nameEn: "Worship in Dhoti-Khes (unsewn clothes)",
    nameGu: "ધોતી-ખેસ પહેરીને પરમાત્માની પૂજા કરી",
    nameHi: "धोती-खेस पहनकर परमात्मा की पूजा करना",
    pointsPerUnit: 30,
    maxPerDay: 1,
    unit: "boolean",
    description: "સીવેલા તમામ વસ્ત્રો નો ત્યાગ",
    descriptionHi: "सिले हुए सभी वस्त्रों का त्याग"
  },

  {
    id: "g1_aarti",
    group: "1",
    nameEn: "Attend Aarti at Jinalay",
    nameGu: "જિનાલયમાં આરતીમાં હાજરી આપવી",
    nameHi: "जिनालय में आरती में उपस्थित रहना",
    pointsPerUnit: 10,
    maxPerDay: 1,
    unit: "boolean",
    description: "",
    descriptionHi: ""
  },

  {
    id: "g1_shibir",
    group: "1",
    nameEn: "Attend a Shibir (camp)",
    nameGu: "શિબિર ભરવી",
    nameHi: "शिबिर में भाग लेना",
    pointsPerUnit: 50,
    maxPerDay: 1,
    unit: "boolean",
    description: "શ્રી સંઘમાં અથવા બહાર",
    descriptionHi: "श्री संघ में अथवा बाहर"
  },

  // ─── GROUP 2 (Age 16–25) ─────────────────────────────────────────────────────

  {
    id: "g2_blue_film_tyag",
    group: "2",
    nameEn: "Avoid obscene content online",
    nameGu: "મોબાઈલ - ઈન્ટરનેટ વિગેરે પર બ્લ્યુ ફિલ્મ,ગંદા દ્રશ્યો આદિ જોવા નો ત્યાગ કરવો",
    nameHi: "मोबाइल - इंटरनेट आदि पर ब्लू फिल्म, गंदे दृश्य आदि देखने का त्याग करना",
    pointsPerUnit: 100,
    maxPerDay: 1,
    unit: "boolean",
    description: "",
    descriptionHi: ""
  },

  {
    id: "g2_ott_adult_tyag",
    group: "2",
    nameEn: "Avoid adult OTT series",
    nameGu: "OTT  ચેનલ પર આવતી ADULT Series  જોવા નો ત્યાગ કરવો",
    nameHi: "OTT चैनल पर आने वाली ADULT Series देखने का त्याग करना",
    pointsPerUnit: 100,
    maxPerDay: 1,
    unit: "boolean",
    description: "",
    descriptionHi: ""
  },

  {
    id: "g2_dharmik_reels",
    group: "2",
    nameEn: "Create Jain religious reels on Social Media",
    nameGu: "Social Media ઉપર ધાર્મિક reels create કરવી",
    nameHi: "Social Media पर धार्मिक reels create करना",
    pointsPerUnit: 50,
    maxPerDay: 2,
    unit: "count",
    description: "માત્ર જૈન ધર્મ related જ. - ૧ reel create કરવાના ૨૦ પોઈન્ટ્સ, maximum ૨ રીલ per day",
    descriptionHi: "केवल जैन धर्म related। - १ reel create करने के २० पॉइंट्स, maximum २ रील per day"
  },

  {
    id: "g2_abhadr_bhasha_tyag",
    group: "2",
    nameEn: "Avoid abusive / indecent language",
    nameGu: "અભદ્ર ભાષા બોલવાનો ત્યાગ કરવો",
    nameHi: "अभद्र भाषा बोलने का त्याग करना",
    pointsPerUnit: 100,
    maxPerDay: 1,
    unit: "boolean",
    description: "double meaning જોક્સ, memes share કરવા, ગાળો ઇત્યાદિ",
    descriptionHi: "double meaning जोक्स, memes share करना, गालियाँ आदि"
  },

  {
    id: "g2_jinalay_seva",
    group: "2",
    nameEn: "Jinalay Shuddhi / Angi / Decoration / Mahapuja",
    nameGu: "જિનાલય શુદ્ધિકરણ / પરમાત્મા આંગી/ જિનાલય શણગાર , મહાપૂજા ઇત્યાદિ સ્વયં કરવું",
    nameHi: "जिनालय शुद्धिकरण / परमात्मा आंगी / जिनालय सजावट, महापूजा आदि स्वयं करना",
    pointsPerUnit: 100,
    maxPerDay: 1,
    unit: "boolean",
    description: "",
    descriptionHi: ""
  },

  {
    id: "g2_tirth_yatra",
    group: "2",
    nameEn: "Ancient pilgrimage (100+ year old Tirth)",
    nameGu: "કોઈપણ પ્રાચીન તીર્થયાત્રા કરવી",
    nameHi: "कोई भी प्राचीन तीर्थयात्रा करना",
    pointsPerUnit: 100,
    maxPerDay: 1,
    unit: "boolean",
    description: "તીર્થ ૧૦૦ વર્ષથી વધુ પ્રાચીન હોવું આવશ્યક અથવા મૂળનાયક પરમાત્માની પ્રતિમાજી ૧૦૦ વર્ષથી વધુ પ્રાચીન હોવી આવશ્યક છે",
    descriptionHi: "तीर्थ १०० वर्ष से अधिक प्राचीन होना आवश्यक अथवा मूलनायक परमात्मा की प्रतिमाजी १०० वर्ष से अधिक प्राचीन होनी आवश्यक है"
  },

  {
    id: "g2_vihar",
    group: "2",
    nameEn: "Walk with Mahatma (Vihar, min 2 km)",
    nameGu: "મહાત્મા સાથે વિહાર કરવો",
    nameHi: "महात्मा के साथ विहार करना",
    pointsPerUnit: 140,
    maxPerDay: 2,
    unit: "count",
    description: "વિહાર Minimum 2  Km થી વધુ હોવો આવશ્યક - દિવસમાં ૧ વિહારના ૧૪૦ પોઈન્ટ્સ , maximum ૨ વિહાર per day",
    descriptionHi: "विहार minimum 2 Km से अधिक होना आवश्यक - दिन में १ विहार के १४० पॉइंट्स, maximum २ विहार per day"
  },

  {
    id: "g2_shibir_satsang",
    group: "2",
    nameEn: "Attend Shibir or personal Satsang with Mahatma",
    nameGu: "શિબિર attend કરવી અથવા મહાત્મા સાથે personal સત્સંગ કરવો",
    nameHi: "शिबिर attend करना अथवा महात्मा के साथ personal सत्संग करना",
    pointsPerUnit: 100,
    maxPerDay: 1,
    unit: "boolean",
    description: "",
    descriptionHi: ""
  },

  {
    id: "g2_tattvaGyan_class",
    group: "2",
    nameEn: "Attend Tattva-Gyan classes",
    nameGu: "તત્ત્વજ્ઞાન ના ક્લાસીસ કરવા",
    nameHi: "तत्त्वज्ञान के क्लासेस करना",
    pointsPerUnit: 100,
    maxPerDay: 1,
    unit: "boolean",
    description: "",
    descriptionHi: ""
  },

  // ─── GROUP 3 (Age 26–60) ─────────────────────────────────────────────────────

  {
    id: "g3_grass_tyag",
    group: "3",
    nameEn: "Avoid walking on green grass",
    nameGu: "પ્રસંગોપાત લીલોતરી",
    nameHi: "प्रसंगोपात लीलोतरी",
    pointsPerUnit: 100,
    maxPerDay: 1,
    unit: "boolean",
    description: "ગ્રાસ - આદિ પર ચાલવાનો ત્યાગ કરવો",
    descriptionHi: "घास आदि पर चलने का त्याग करना"
  },

  {
    id: "g3_brahmacharya",
    group: "3",
    nameEn: "Observe Brahmacharya",
    nameGu: "બ્રહ્મચર્યનું પાલન કરવું.",
    nameHi: "ब्रह्मचर्य का पालन करना",
    pointsPerUnit: 100,
    maxPerDay: 1,
    unit: "boolean",
    description: "",
    descriptionHi: ""
  },

  {
    id: "g3_navkarwali",
    group: "3",
    nameEn: "Navkarwali (108 Navkar)",
    nameGu: "બાંધી નવકારવાળી ગણવી",
    nameHi: "बांधी नवकारवाली गिनना",
    pointsPerUnit: 20,
    maxPerDay: 5,
    unit: "count",
    description: "૧૦૮ નવકાર - ૧ નવકારવાળી દીઠ ૨૦ પોઈન્ટ્સ, maximum દિવસની ૫ નવકારવાળી = ૧૦૦ પોઈન્ટ્સ",
    descriptionHi: "१०८ नवकार - १ नवकारवाली के २० पॉइंट्स, maximum दिन की ५ नवकारवाली = १०० पॉइंट्स"
  },

  {
    id: "g3_sukrut",
    group: "3",
    nameEn: "Sukrut (Good deeds)",
    nameGu: "સુકૃત કરવું",
    nameHi: "सुकृत करना",
    pointsPerUnit: 50,
    maxPerDay: 1,
    unit: "boolean",
    description: "સાધર્મિક ભક્તિ, જીવદયા, અનુકંપા ઇત્યાદિ",
    descriptionHi: "साधर्मिक भक्ति, जीवदया, अनुकंपा आदि"
  },

  {
    id: "g3_shasan_prabhavna",
    group: "3",
    nameEn: "Shasan Prabhavna activities",
    nameGu: "શાસન પ્રભાવનાનાં કાર્યો કરવા",
    nameHi: "शासन प्रभावना के कार्य करना",
    pointsPerUnit: 100,
    maxPerDay: 1,
    unit: "boolean",
    description: "દા.ત. પ્રભુના કલ્યાણક ની ઉજવણી, વરઘોડા-રથયાત્રા આદિ માં પ્રભુનો રથ ખેંચવો, મહાત્માની વૈયાવચ્ચ કરવી, પાઠશાળા, આયંબિલખાતું, જ્ઞાનભંડાર આદિની ૩૦ મિનિટ સેવા કરવી વિગેરે વિગેરે.",
    descriptionHi: "जैसे प्रभु के कल्याणक का उत्सव, वरघोडा-रथयात्रा आदि में प्रभु का रथ खींचना, महात्मा की वैयावच्च करना, पाठशाला, आयंबिलखाता, ज्ञानभंडार आदि की ३० मिनट सेवा करना आदि।"
  },

  {
    id: "g3_digital_vaktavya",
    group: "3",
    nameEn: "Give a talk on Jain dharma on digital platform",
    nameGu: "જૈન ધર્મના કોઈપણ વિષય ઉપર digital પ્લેટફોર્મ ઉપર વક્તવ્ય આદિ આપવું.",
    nameHi: "जैन धर्म के किसी भी विषय पर digital platform पर वक्तव्य आदि देना",
    pointsPerUnit: 580,
    maxPerDay: 1,
    unit: "boolean",
    description: "નોંધ: તે વક્તવ્ય કે content આયોજક જૈનમ્ પરિવાર ને બતાવવું ફરજીયાત છે.ત્યારબાદ જ તે પોઇન્ટ count થશે. Content minimum ૩૦ seconds નું હોવું જરૂરી",
    descriptionHi: "नोट: वह वक्तव्य या content आयोजक जैनम् परिवार को दिखाना अनिवार्य है। तत्पश्चात ही वह पॉइंट count होगा। Content minimum ३० seconds का होना आवश्यक है"
  },

  {
    id: "g3_jinvani_shravan",
    group: "3",
    nameEn: "Listen to Jinvani with Mahatma",
    nameGu: "મહાત્માની નિશ્રામાં જિનવાણી શ્રવણ કરવું.",
    nameHi: "महात्मा की निश्रा में जिनवाणी श्रवण करना",
    pointsPerUnit: 50,
    maxPerDay: 1,
    unit: "boolean",
    description: "minimum ૩૦ મિનિટ",
    descriptionHi: "minimum ३० मिनट"
  },

];
function getActivityById(id) {
  return activities.find(a => a.id === id);
}

function calculatePoints(activity, quantity) {
  if (activity.unit === 'boolean') {
    return activity.pointsPerUnit;
  } else if (activity.unit === 'count') {
    const clamped = Math.min(quantity, activity.maxPerDay);
    return clamped * activity.pointsPerUnit;
  } else if (activity.unit === 'minutes') {
    // Book reading: 10 pts per 30 min, max 120 min
    const clamped = Math.min(quantity, activity.maxPerDay);
    return Math.floor(clamped / 30) * activity.pointsPerUnit;
  } else if (activity.unit === 'hours') {
    // Maun: 10 pts per 1 hour, max 5 hours
    const clamped = Math.min(quantity, activity.maxPerDay);
    return clamped * activity.pointsPerUnit;
  } else if (activity.unit === 'select') {
    const option = activity.options?.[quantity];
    return option ? option.points : 0;
  }
  return 0;
}

module.exports = { activities, getActivityById, calculatePoints };
