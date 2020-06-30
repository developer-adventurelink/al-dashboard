const hl = require("highland");
const XLSX = require("xlsx");
const _ = require("lodash");
const request = require("request");

const {
  endPoints: { base: api }
} = require("./constants");

const post = hl.wrapCallback(request.post);

const {
  endPoints: { base },
  baseRequest,
  baseBody
} = require("./constants");

const createUrl = (url, endPoint) => `${url}/${endPoint}`;
const parseBuffer = stream =>
  stream
    .collect()
    .map(buffers => buffers.join(""))
    .map(res => JSON.parse(res));

const streamData = (query, endPoint) => {
  const body = Object.assign(
    { request: Object.assign(query, baseRequest) },
    baseBody
  );
  return hl(
    post({
      uri: createUrl(base, endPoint),
      body,
      json: true
    })
  )
    .pluck("body")
    .flatten();
};

const assignDocumentData = (documents, getter, localKey, foreignKey, as) =>
  getter({ [`${foreignKey}s`]: _.map(documents, localKey) })
    .collect()
    .flatMap(docsToAdd => {
      const docsToAddByForeignKey = _.keyBy(docsToAdd, foreignKey);
      return hl(documents).map(document =>
        Object.assign(
          {
            [`${as}`]: docsToAddByForeignKey[document[localKey]] || {}
          },
          document
        )
      );
    });

  const createBookCustom = (sheets, currentBook, headers, reportName, sessionName) => {
    let currentSheet = 0;
    return hl(sheets)
      .doto(() => {
        currentSheet += 1;
      })
      .reduce((wb, sheet) => {
      //console.log(sheet[1].campCode); 
      const nName = sheet[1].seasonName;
      
        const ws = XLSX.utils.json_to_sheet(sheet, {
          header: Object.keys(headers),
          skipHeader: true
        });
        XLSX.utils.book_append_sheet(wb, ws, `${reportName} ${currentSheet} - ` + nName.substr(0,12));
        return wb;
      }, XLSX.utils.book_new())
      .map(wb =>
        XLSX.writeFile(wb, `${reportName}-book${currentBook}-${new Date()}.xlsx`)
      );
  };
       
const createBook = (sheets, currentBook, headers, reportName) => {
  let currentSheet = 0;
  return hl(sheets)
    .doto(() => {
      currentSheet += 1;
    })
    .reduce((wb, sheet) => {
      const ws = XLSX.utils.json_to_sheet(sheet, {
        header: Object.keys(headers),
        skipHeader: true
      });
      XLSX.utils.book_append_sheet(wb, ws, `sheet${currentSheet}`);
      return wb;
    }, XLSX.utils.book_new())
    .map(wb =>
      XLSX.writeFile(wb, `${reportName}-book${currentBook}-${new Date()}.xlsx`)
    );
};

module.exports = {
  createUrl,
  parseBuffer,
  streamData,
  createBook,
  assignDocumentData,
  createBookCustom
};
