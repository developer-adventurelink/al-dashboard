// export const appToken = process.env.APPTOKEN;
// export const userName = process.env.USERNAME;
// export const password = process.env.PASSWORD;
// const applicationName = process.env.APPLICATION_NAME;
// const mailerEmail = process.env.MAILER_EMAIL;
// const mailerPass = process.env.MAILER_PASS;
export const appToken =
  "SdEUeIpSkqVRgnnhll+m+dNnEEBWssJwkeREnBHQSJhd8YfPta6Qb3XeoVq0fk4F";
export const userName = "mark@adventurelinks.net";
export const password = "St@rtup1";
export const applicationName = "AdventureLinksNorthernVirginia";
export const mailerEmail = process.env.MAILER_EMAIL;
export const mailerPass = process.env.MAILER_PASS;

export const baseBody = {
  appToken
};

export const baseRequest = {
  userName,
  password,
  applicationName
};

export const endPoints = {
  base: "https://cors-anywhere.herokuapp.com/https://awapi.active.com/rest",
  fairfaxData:
    "https://cors-anywhere.herokuapp.com/https://fairfax.usedirect.com/FairfaxFCPAWeb/ACTIVITIES/Search.aspx?category_name=CAMPS&search_text=adventure+links&place_id=ALL+PLACES",
  product: {
    season: "camps-season-info",
    session: "camps-session-info",
    tuitionV2: "camps-tuition-info-v2",
    tuition: "camps-tuition-info",
    sessionOption: "camps-session-option-info"
  },
  registration: {
    info: "camps-registration-info-v2"
  },
  payment: {
    info: "camps-payment-info",
    allocation: "camps-payment-allocation-info"
  },
  person: {
    basic: "camps-person-basic-info",
    detail: "camps-person-detail-info",
    answer: "camps-person-answer-info",
    family: "camps-family-info-v2"
  },
  group: {
    assignment: "camps-group-assignment-info",
    participant: "camps-participant-info",
    info: "camps-group-info"
  },
  merchandise: {
    detail: "merchandise-info",
    purchase: "merchandise-purchaser-info"
  }
};

export const obj = {
  endPoints,
  baseBody,
  baseRequest,
  mailerEmail,
  mailerPass
};

export default obj
