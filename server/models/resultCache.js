const fs = require('fs');
const path = require('path');
const moment = require('moment');
const sanitize = require('sanitize-filename');
const db = require('../lib/db.js');
const xlsx = require('node-xlsx');
const json2csv = require('json2csv');
const config = require('../lib/config');
const dbPath = config.get('dbPath');

function xlsxFilePath(cacheKey) {
  return path.join(dbPath, '/cache/', cacheKey + '.xlsx');
}

function csvFilePath(cacheKey) {
  return path.join(dbPath, '/cache/', cacheKey + '.csv');
}

async function findOneByCacheKey(cacheKey) {
  return db.cache.findOne({ cacheKey });
}

async function saveResultCache(cacheKey, queryName) {
  if (!cacheKey) {
    throw new Error('cacheKey required');
  }
  const EIGHT_HOURS = 1000 * 60 * 60 * 8;
  const expiration = new Date(Date.now() + EIGHT_HOURS);
  const modifiedDate = new Date();

  const savedQueryName = sanitize(
    (queryName || 'SQLPad Query Results') + ' ' + moment().format('YYYY-MM-DD')
  );

  const doc = { cacheKey, expiration, queryName: savedQueryName, modifiedDate };

  const existing = await findOneByCacheKey(cacheKey);
  if (!existing) {
    doc.createdDate = new Date();
  }

  return db.cache.update({ cacheKey }, doc, {
    upsert: true
  });
}

function writeXlsx(cacheKey, queryResult) {
  // loop through rows and build out an array of arrays
  const resultArray = [];
  resultArray.push(queryResult.fields);
  for (let i = 0; i < queryResult.rows.length; i++) {
    const row = [];
    for (let c = 0; c < queryResult.fields.length; c++) {
      const fieldName = queryResult.fields[c];
      row.push(queryResult.rows[i][fieldName]);
    }
    resultArray.push(row);
  }
  const xlsxBuffer = xlsx.build([{ name: 'query-results', data: resultArray }]);
  return new Promise(resolve => {
    fs.writeFile(xlsxFilePath(cacheKey), xlsxBuffer, function(err) {
      // if there's an error log it but otherwise continue on
      // we can still send results even if download file failed to create
      if (err) {
        console.log(err);
      }
      return resolve();
    });
  });
}

function writeCsv(cacheKey, queryResult) {
  return new Promise(resolve => {
    json2csv({ data: queryResult.rows, fields: queryResult.fields }, function(
      err,
      csv
    ) {
      if (err) {
        console.log(err);
        return resolve();
      }
      fs.writeFile(csvFilePath(cacheKey), csv, function(err) {
        if (err) {
          console.log(err);
        }
        return resolve();
      });
    });
  });
}

/*  Result cache maintenance
============================================================================== */

async function removeExpired() {
  try {
    const docs = await db.cache.find({ expiration: { $lt: new Date() } });
    for (const doc of docs) {
      const filepaths = [xlsxFilePath(doc.cacheKey), csvFilePath(doc.cacheKey)];
      filepaths.forEach(fp => {
        if (fs.existsSync(fp)) {
          fs.unlinkSync(fp);
        }
      });
      // eslint-disable-next-line no-await-in-loop
      await db.cache.remove({ _id: doc._id }, {});
    }
  } catch (error) {
    console.log(error);
  }
}

// Every five minutes check and expire cache
const FIVE_MINUTES = 1000 * 60 * 5;
setInterval(removeExpired, FIVE_MINUTES);

module.exports = {
  csvFilePath,
  findOneByCacheKey,
  saveResultCache,
  writeCsv,
  writeXlsx,
  xlsxFilePath
};
