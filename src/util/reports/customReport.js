const _ = require("lodash");
const hl = require("highland");

const {
  streamRegistrations,
  streamPeople,
  streamAnswers,
  streamTuitions,
  streamSessionsInDateRange,
  streamFamilies
} = require("./data");

const { createBook, assignDocumentData, createBookCustom } = require("./util");

var requestSeason = require("request");

const {
    baseBody,
    baseRequest
} = require("./constants");


var sessionOptions = { method: 'POST',
  url: 'https://cors-anywhere.herokuapp.com/https://awapi.active.com/rest/camps-season-info',
  headers: 
   { 'postman-token': '3f01c442-ddf5-1a18-a72b-71b33a295ba9',
     'cache-control': 'no-cache',
     'content-type': 'application/json' },
  body: 
   { request: 
      { seasons: [],
        userName: baseRequest.userName,
        password: baseRequest.password,
        applicationName: baseRequest.applicationName},
        appToken: baseBody.appToken },
  json: true };

const executeRequestSeason = requestSeason(sessionOptions, function (error, response, body) {
    localStorage.setItem('session_season', JSON.stringify(body));
	localStorage.setItem('session_season_found', 1);
	});

const getSeasonData = localStorage.getItem('session_season') ; 
const seasonDataArr = JSON.parse(getSeasonData) ;
var jName = '';
var jSessionIds = [];

function getSeasonNameById( sessionid ) {
	
	for (var i=0; i < seasonDataArr.length; i++) {
		jName = seasonDataArr[i].name ;
		jSessionIds = _.indexOf(seasonDataArr[i].sessionIds, sessionid) ;
		if ( jSessionIds >= 0 )	{
			return jName;
		}
		
	}	

}
const customReportHeaders = {
  sessionName: "Session name",
  firstName: "Participant: First name",
  lastName: "Participant: Last name",
  screenName: "Participant: What is Child's Zoom Screen Name",
  prFriend: "Participant: friend",
  prAge: "Participant: Age as of today",
  gender: "Participant: Gender",
  p1Name: "Primary P/G: Name",
  p1Email: "Primary P/G: Email address",
  p1Number: "Primary P/G: Cell phone number",
  
  
};

const formatParentData = ({ person }) => {
  const {
    
    firstName: primaryFirst,
    lastName: primaryLast,
    email: p1Email,
    homePhoneNumber,
    businessPhoneNumber,
    cellPhoneNumber
  } = person || {};
  const { phoneNumber: phomePN } = homePhoneNumber || {};
  const { phoneNumber: pbizPN } = businessPhoneNumber || {};
  const { phoneNumber: pcellPN } = cellPhoneNumber || {};
  const numbers = [phomePN, pbizPN, pcellPN].filter(val => !!val);
  return {
    name: `${primaryFirst || ""} ${primaryLast || ""}`,
    number: numbers.join("/"),
    email: `${p1Email}`
  };
};


const formatChildData = ({ person }) => {
  const {
    
    firstName: primaryFirst,
    lastName: primaryLast,
    email: p1Email,
    homePhoneNumber,
    businessPhoneNumber,
    cellPhoneNumber
  } = person || {};
  const { phoneNumber: phomePN } = homePhoneNumber || {};
  const { phoneNumber: pbizPN } = businessPhoneNumber || {};
  const { phoneNumber: pcellPN } = cellPhoneNumber || {};
  const numbers = [phomePN, pbizPN, pcellPN].filter(val => !!val);
  return {
    name: `${primaryLast || ""}${primaryFirst || ""}`,
    number: numbers.join("/"),
    email: `${p1Email}`
  };
};

const formatAnswers = answers =>
  answers.reduce(
    (accum, { label, answer }) => {
      accum.canAdministerMedicine =
        accum.canAdministerMedicine ||
        (/over-the-counter/.test(label) && answer);
      accum.unApproved =
        accum.unApproved || (/Not Authorized/i.test(label) && answer);
      accum.shirtSize = accum.shirtSize || (/Shirt Size/.test(label) && answer);
      accum.forbiddenMedication =
        accum.forbiddenMedication ||
        (/Forbidden Over-the-counter Medications/.test(label) && answer);
      if (/Person/.test(label)) {
        const number = label[8];
        if (/Phone Number/.test(label)) accum[`p${number}Number`] = answer;
        if (/Full Name/.test(label)) {
          accum[`p${number}Name`] = answer;
        }
        if (/Relation/.test(label)) {
          accum[`p${number}Relation`] = answer;
        }
      }
      return accum;
    },
    {
      forbiddenMedication: "",
      canAdministerMedicine: "",
      unApproved: "",
      shirtSize: ""
    }
  );

const formatSeasonData = sessionId => {
  var sessName = getSeasonNameById(sessionId);
  return {
    seasonName: sessName
  };
};

const formatCustomReportData = data => {
  const {
    sessionId,
    person = {},
    answers = {},
    tuition: { name: tuitionName },
    location: { name: locationName },
    name: sessionName,
    startDate: { day: startDay, month: startMonth, year: startYear },
    endDate: { day: endDay, month: endMonth, year: endYear },
    family = []
  } = data;
  const { firstName, lastName, gender, dateOfBirth, email, cellPhoneNumber} = person;
  const [primaryParent = {}] = family.filter(
    ({ isPrimaryParent }) => isPrimaryParent === "Yes"
  );
  const { name: primaryName, number: primaryNumber } = formatParentData(
    primaryParent
  );
  
  //////////
  const [childParent = {}] = family.filter(
    ({ isChild }) => isChild === "Yes"
  );
  const { name: childName, number: childNumber } = formatChildData(
    childParent
  );
  /////////////
  
  const [secondaryParent = {}] = family.filter(
    ({ isSecondaryParent }) => isSecondaryParent === "Yes"
  );
  const { name: secondaryName, number: secondaryNumber } = formatParentData(
    secondaryParent
  );
  const { seasonName: seasonName} = formatSeasonData (sessionId);
  const { questionAnswers } = answers;
  const {
    p1Name,
    p1Number,
    p1Relation,
 
  } = formatAnswers(questionAnswers);
  return {
    seasonName,
    sessionName,
    firstName,
    lastName,
    screenName: childName,
    prFriend: p1Relation,
    gender,
    prAge: new Date().getFullYear() - `${dateOfBirth.year}`, 
    p1Name: primaryName,
    p1Email: `${email}`,
    p1Number: cellPhoneNumber,
    
  };
};

module.exports = (startDate, endDate) => {
  let currentBook = 0;

  return streamSessionsInDateRange(startDate, endDate)
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
    .flatMap(session =>
      hl(session.registration.registrationDetails || [])
        .filter(({ cancelled }) => !cancelled)
        .map(({ tuitionId, personId }) =>
          Object.assign({ tuitionId, personId }, session)
        )
    )
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
    .flatMap(sessions =>
      streamFamilies({ personIds: _.map(sessions, "personId") })
        .collect()
        .flatMap(families =>
          assignDocumentData(
            families,
            streamPeople,
            "personId",
            "personId",
            "person"
          )
        )
        .collect()
        .flatMap(families => {
          const familiesByFamilyId = _.groupBy(families, "familyId");
          return hl(sessions).map(session =>
            Object.assign(
              { family: familiesByFamilyId[session.person.familyId] },
              session
            )
          );
        })
    )
    .collect()
    .flatMap(families =>
      assignDocumentData(
        families,
        streamAnswers,
        "personId",
        "personId",
        "answers"
      )
    )
    .map(formatCustomReportData)
    .collect()
    .map(sessions => _.groupBy(sessions, "seasonName"))
    .map(hl.values)
    .merge()
    .map(rows => rows.map(({ sessionId, ...rest }) => rest))
    .map(rows => [customReportHeaders, ...rows])
    .batch(15)
    .doto(() => {
      currentBook += 1;
    })
    .map(sheets => createBookCustom(sheets, currentBook, customReportHeaders, "Custom Report"))
    .merge()
    .stopOnError(err => {
      console.log(err);
    });
};
