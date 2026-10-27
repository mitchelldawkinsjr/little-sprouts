/**
 * Copies question rows into this spreadsheet.
 * Ignores the website when it returns the Little Sprouts page instead of the CSV.
 * If the first cell is not "learner", the sheet is replaced. Otherwise only new rows are added.
 */
var DEFAULT_SHEET_URL = 'https://grow.360web.cloud/sheet.csv';

var DEFAULT_ROWS = [
  ['learner', 'game', 'item', 'extra'],
  ['*', 'words', 'I', ''],
  ['*', 'words', 'a', ''],
  ['*', 'words', 'the', ''],
  ['*', 'words', 'my', ''],
  ['*', 'words', 'see', ''],
  ['*', 'words', 'and', ''],
  ['*', 'words', 'is', ''],
  ['*', 'words', 'to', ''],
  ['*', 'words', 'go', ''],
  ['*', 'words', 'we', ''],
  ['*', 'words', 'like', ''],
  ['*', 'words', 'can', ''],
  ['*', 'words', 'you', ''],
  ['*', 'words', 'look', ''],
  ['*', 'words', 'at', ''],
  ['kindergarten', 'words', 'a', ''],
  ['kindergarten', 'words', 'and', ''],
  ['kindergarten', 'words', 'away', ''],
  ['kindergarten', 'words', 'big', ''],
  ['kindergarten', 'words', 'blue', ''],
  ['kindergarten', 'words', 'can', ''],
  ['kindergarten', 'words', 'come', ''],
  ['kindergarten', 'words', 'down', ''],
  ['kindergarten', 'words', 'find', ''],
  ['kindergarten', 'words', 'for', ''],
  ['kindergarten', 'words', 'go', ''],
  ['kindergarten', 'words', 'help', ''],
  ['kindergarten', 'words', 'here', ''],
  ['kindergarten', 'words', 'I', ''],
  ['kindergarten', 'words', 'in', ''],
  ['kindergarten', 'words', 'is', ''],
  ['kindergarten', 'words', 'it', ''],
  ['kindergarten', 'words', 'jump', ''],
  ['kindergarten', 'words', 'look', ''],
  ['kindergarten', 'words', 'make', ''],
  ['kindergarten', 'words', 'me', ''],
  ['kindergarten', 'words', 'my', ''],
  ['kindergarten', 'words', 'not', ''],
  ['kindergarten', 'words', 'one', ''],
  ['kindergarten', 'words', 'play', ''],
  ['kindergarten', 'words', 'red', ''],
  ['kindergarten', 'words', 'run', ''],
  ['kindergarten', 'words', 'said', ''],
  ['kindergarten', 'words', 'see', ''],
  ['kindergarten', 'words', 'the', ''],
  ['kindergarten', 'words', 'to', ''],
  ['kindergarten', 'words', 'two', ''],
  ['kindergarten', 'words', 'up', ''],
  ['kindergarten', 'words', 'we', ''],
  ['kindergarten', 'words', 'you', ''],
  ['grade4', 'words', 'Seedling', ''],
  ['grade4', 'words', 'Dreary', ''],
  ['grade4', 'words', 'Queasy', ''],
  ['grade4', 'words', 'Decree', ''],
  ['grade4', 'words', 'Deceive', ''],
  ['grade4', 'words', 'Retrieve', ''],
  ['grade4', 'words', 'Fatigue', ''],
  ['grade4', 'words', 'Uneasy', ''],
  ['grade4', 'words', 'Interfere', ''],
  ['grade4', 'words', 'Connection', ''],
  ['grade4', 'words', 'Condition', ''],
  ['grade4', 'words', 'Population', ''],
  ['grade4', 'words', 'Neighbor', ''],
  ['grade4', 'words', 'Provide', ''],
  ['grade4', 'words', 'Celebrate', ''],
  ['grade4', 'words', 'Operate', ''],
  ['grade4', 'words', 'Complicate', ''],
  ['grade4', 'words', 'Method', ''],
  ['grade4', 'words', 'Variable', ''],
  ['grade4', 'words', 'Responsible', ''],
  ['grade4', 'words', 'Manage', ''],
  ['grade4', 'words', 'Labor', ''],
  ['grade4', 'words', 'Apologize', ''],
  ['grade4', 'words', 'Persevere', ''],
  ['grade4', 'words', 'Courage', ''],
  ['grade4', 'words', 'Growth', ''],
  ['grade4', 'words', 'Confident', ''],
  ['grade4', 'words', 'Curious', ''],
  ['grade4', 'words', 'Empathy', ''],
  ['grade4', 'words', 'Gracious', ''],
  ['grade4', 'words', 'Integrity', ''],
  ['grade4', 'words', 'Forgiveness', ''],
  ['grade4', 'words', 'Generous', ''],
  ['grade4', 'words', 'Friendly', ''],
  ['grade4', 'words', 'Trust', ''],
  ['grade4', 'words', 'Trajectory', ''],
  ['grade4', 'words', 'Catapult', ''],
  ['grade4', 'words', 'Covenant', ''],
  ['grade4', 'words', 'Chosen', ''],
  ['grade4', 'words', 'Sacrifice', ''],
  ['grade4', 'words', 'Balance', ''],
  ['grade4', 'words', 'Expectation', ''],
  ['grade4', 'words', 'Force', ''],
  ['grade4', 'words', 'Mature', ''],
  ['grade4', 'words', 'Tenacity', ''],
  ['*', 'count', 'apples', '🍎'],
  ['*', 'count', 'stars', '⭐'],
  ['*', 'count', 'ladybugs', '🐞'],
  ['*', 'count', 'flowers', '🌼'],
  ['*', 'count', 'fish', '🐟'],
  ['*', 'count', 'balloons', '🎈'],
  ['*', 'hunt', 'sock', 'socks'],
  ['*', 'hunt', 'spoon', 'spoons'],
  ['*', 'hunt', 'toy', 'toys'],
  ['*', 'hunt', 'book', 'books'],
  ['*', 'hunt', 'block', 'blocks'],
  ['*', 'hunt', 'crayon', 'crayons'],
  ['*', 'facts', '2', ''],
  ['*', 'facts', '3', ''],
  ['*', 'facts', '4', ''],
  ['*', 'facts', '5', ''],
  ['*', 'facts', '6', ''],
  ['*', 'facts', '7', ''],
  ['*', 'facts', '8', ''],
  ['*', 'facts', '9', ''],
  ['*', 'facts', '10', ''],
  ['*', 'facts', '11', ''],
  ['*', 'facts', '12', ''],
  ['*', 'facts', 'cap', '12'],
  ['*', 'facts', 'double', ''],
  ['*', 'facts', '10s', ''],
  ['*', 'facts', '20s', 'off'],
  ['*', 'facts', '30s', 'off'],
  ['*', 'facts', '40s', 'off'],
  ['*', 'facts', '50s', 'off'],
  ['*', 'facts', '60s', 'off'],
  ['*', 'facts', '70s', 'off'],
  ['*', 'facts', '80s', 'off'],
  ['*', 'facts', '90s', 'off']
];

function installHourly() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'pullDefaults') ScriptApp.deleteTrigger(trigger);
  });
  ScriptApp.newTrigger('pullDefaults').timeBased().everyHours(1).create();
  pullDefaults();
}

function pullDefaults() {
  var incoming = questionRows();
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var values = sheet.getDataRange().getValues();
  var width = incoming[0].length;
  if (!values.length || !isHeader(values[0]) || looksLikeHtml(values[0])) {
    sheet.clear();
    sheet.getRange(1, 1, incoming.length, width).setValues(pad(incoming, width));
    return;
  }
  var kept = values.filter(function (row, index) {
    return index === 0 || !looksLikeHtml(row);
  });
  if (kept.length !== values.length) {
    sheet.clear();
    sheet.getRange(1, 1, kept.length, width).setValues(pad(kept, width));
    values = kept;
  }
  var seen = {};
  values.forEach(function (row) { seen[key(row)] = true; });
  var add = incoming.slice(1).filter(function (row) {
    return String(row[2] || '').trim() && !seen[key(row)];
  });
  if (!add.length) return;
  sheet.getRange(values.length + 1, 1, add.length, width).setValues(pad(add, width));
}

function questionRows() {
  var response = UrlFetchApp.fetch(DEFAULT_SHEET_URL, { muteHttpExceptions: true });
  var text = response.getContentText() || '';
  if (response.getResponseCode() === 200 && isQuestionCsv(text)) {
    var parsed = Utilities.parseCsv(text).filter(function (row) { return row.join('').trim(); });
    if (parsed.length > 1 && isHeader(parsed[0])) return parsed;
  }
  return DEFAULT_ROWS;
}

function isQuestionCsv(text) {
  var first = String(text).replace(/^\uFEFF/, '').trim().split(/\r?\n/)[0].toLowerCase();
  return first.indexOf('learner') === 0 && first.indexOf('game') !== -1 && first.indexOf('<') === -1;
}

function isHeader(row) {
  return String(row[0] || '').trim().toLowerCase() === 'learner';
}

function looksLikeHtml(row) {
  return row.some(function (cell) {
    return /<!doctype|<html|<head|<body|<div|<script/i.test(String(cell));
  });
}

function key(row) {
  return [row[0], row[1], row[2]].map(function (cell) {
    return String(cell || '').trim().toLowerCase();
  }).join('|');
}

function pad(rows, width) {
  return rows.map(function (row) {
    var copy = row.slice(0, width);
    while (copy.length < width) copy.push('');
    return copy;
  });
}
