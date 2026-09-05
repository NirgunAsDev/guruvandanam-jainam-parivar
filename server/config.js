const brand = require('../shared/brand.json');

module.exports = {
  BRAND_NAME: brand.name,
  BRAND_NAME_HI: brand.nameHi,
  ORG_NAME: brand.org,
  ORG_NAME_HI: brand.orgHi,
  LOGO_PATH: brand.logoPath,
  YEAR: brand.year,

  COMPETITION_START_DATE: brand.competitionStart,
  COMPETITION_START_DISPLAY: brand.competitionStartDisplay,
  COMPETITION_END_DATE: brand.competitionEnd,
  COMPETITION_END_DISPLAY: brand.competitionEndDisplay,

  REGISTRATION_FEE_PAISE: brand.registrationFeePaise,
  REGISTRATION_FEE_DISPLAY: brand.registrationFeeDisplay,

  DAILY_GURUVANDAN_MAX: 30,

  // Server-only — env-driven, never expose via a file the client also imports
  JWT_SECRET: process.env.JWT_SECRET || 'aaradhna_patrak_secret_key_2025',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || brand.adminEmailPlaceholder,
  APP_URL: process.env.APP_URL || 'https://aaradhna.jainamparivar.org',
};
