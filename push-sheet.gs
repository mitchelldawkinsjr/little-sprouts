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
  ['*', 'hunt', 'crayon', 'crayons']
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
