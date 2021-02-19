import moment from "moment"
import constants from "./constants"
import { streamData }from "./util"
const {
  endPoints: {
    product: { season, session, tuition, sessionOption },
    registration: { info: registrationInfo },
    person: { detail, answer, family }
  }
} = constants

export const streamSeasons = query => streamData(query, season);
export const streamSessions = query => streamData(query, session);
export const streamSessionsInDateRange = (_startDate, _endDate) => {
  const startDate = moment(_startDate);
  const endDate = moment(_endDate);
  return streamSeasons({ seasons: [] })
    .pluck("sessionIds")
    .flatten()
    .collect()
    .flatMap(sessionIds => streamSessions({ sessionIds }))
    .filter(
      ({
        startDate: { day: startDay, month: startMonth, year: startYear },
        endDate: { day: endDay, month: endMonth, year: endYear }
      }) => {
        const start = moment(
          `${startYear}-${startMonth}-${startDay}`,
          "YYYY-MM-DD"
        );
        const end = moment(`${endYear}-${endMonth}-${endDay}`, "YYYY-MM-DD");
        return (
          (moment(start).isSameOrBefore(startDate, "day") &&
            moment(end).isSameOrAfter(startDate, "day")) ||
          (moment(end).isSameOrAfter(endDate, "day") &&
            moment(start).isSameOrBefore(endDate, "day")) ||
          (moment(start).isSameOrAfter(startDate, "day") &&
            moment(end).isSameOrBefore(endDate, "day")) ||
          (moment(start).isSameOrBefore(startDate, "day") &&
            moment(end).isSameOrAfter(endDate, "day"))
        );
      }
    );
};

export const streamRegistrations = query => streamData(query, registrationInfo);
export const streamPeople = query => streamData(query, detail);
export const streamAnswers = query => streamData(query, answer);
export const streamTuitions = query => streamData(query, tuition);
export const streamSessionOptions = query => streamData(query, sessionOption);
export const streamFamilies = query => streamData(query, family);
