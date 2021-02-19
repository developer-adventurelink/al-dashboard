const hl = require("highland");
const _ = require("lodash");
const { GoogleSpreadsheet } = require('google-spreadsheet');
console.log ('started!!!!!!!!!') ;
/*
// spreadsheet key is the long id in the sheets URL
const doc = new GoogleSpreadsheet('<the sheet ID from the url>');

// use service account creds
await doc.useServiceAccountAuth({
  client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  private_key: process.env.GOOGLE_PRIVATE_KEY,
});
*/
const {
  streamRegistrations,
  streamPeople,
  streamTuitions,
  streamSessionOptions,
  streamSessionsInDateRange
} = require("./data");

const { assignDocumentData, createBook } = require("./util");

const campPhotosHeaders = {
  campCode: "Camp Code",
  sessionName: "Camp Name",
  locationName: "Camp Location",
  emailsPurchased: "Emails Who Purchased",
  emailsNotPurchased: "Emails Who Did Not Purchased",
  numberPurchased: "Number Purchsed",
  price: "Price Charged"
};

const formatCampPhotoData = data => {
  const {
    tuition: { name: tuitionName },
    emailsPurchased,
    emailsNotPurchased,
    location: { name: locationName },
    name: sessionName
  } = data;
  return {
    campCode: `${tuitionName}`,
    sessionName,
    locationName,
    emailsPurchased: emailsPurchased.join(" "),
    emailsNotPurchased: emailsNotPurchased.join(" "),
    numberPurchased: emailsPurchased.length,
    price: 39
  };
};

const assignHasPurchasedPhotos = registrations =>
  hl(registrations)
    .flatMap(({ sessionOptions }) => {
      const _sessionOptions = sessionOptions || [];
      return hl(_sessionOptions).pluck("sessionOptionId");
    })
    .collect()
    .flatMap(sessionOptionIds => streamSessionOptions({ sessionOptionIds }))
    .filter(({ name }) => /Camp Photos/i.test(name))
    .pluck("sessionOptionId")
    .collect()
    .flatMap(photoSessionOptionIds => {
      const photoSessionOptionIdsMap = _.keyBy(photoSessionOptionIds);
      return hl(registrations).map(session =>
        Object.assign(
          {
            hasPurchasedPhotos: _.some(
              session.sessionOptions || [],
              ({ sessionOptionId }) =>
                !!photoSessionOptionIdsMap[sessionOptionId]
            )
          },
          session
        )
      );
    })
    .otherwise(
      hl(registrations).map(session =>
        Object.assign({ hasPurchasedPhotos: false }, session)
      )
    );

const func =  (startDate, endDate) =>
  streamSessionsInDateRange(startDate, endDate)
    .collect()
    .flatMap(sessions =>
      assignDocumentData(
        sessions,
        streamRegistrations,
        "sessionId",
        "sessionId",
        "registration"
      )
    )
    .flatMap(({ registration, ...rest }) =>
      hl(registration.registrationDetails || [])
        .filter(({ cancelled }) => !cancelled)
        .map(({ tuitionId, personId }) =>
          Object.assign({ tuitionId, personId }, rest)
        )
    )
    .collect()
    .flatMap(assignHasPurchasedPhotos)
    .collect()
    .flatMap(sessions =>
      assignDocumentData(
        sessions,
        streamTuitions,
        "tuitionId",
        "tuitionId",
        "tuition"
      )
    )
    .collect()
    .flatMap(sessions =>
      assignDocumentData(
        sessions,
        streamPeople,
        "personId",
        "personId",
        "person"
      )
    )
    .collect()
    .map(sessions => _.groupBy(sessions, "sessionId"))
    .flatMap(hl.values)
    .map(registrations => {
      const session = registrations[0];
      const emailsPurchased = registrations
        .filter(({ hasPurchasedPhotos }) => hasPurchasedPhotos)
        .map(({ person: { email } }) => email);
      const emailsNotPurchased = registrations
        .filter(({ hasPurchasedPhotos }) => !hasPurchasedPhotos)
        .map(({ person: { email } }) => email);
      return Object.assign({ emailsPurchased, emailsNotPurchased }, session);
    })
    .map(formatCampPhotoData)
    .collect()
    .map(rows => [[campPhotosHeaders, ...rows]])
    .map(sheets => createBook(sheets, 1, campPhotosHeaders, "Camp-Photos"))
    .merge()
    .stopOnError(err => console.log(err));

export default func