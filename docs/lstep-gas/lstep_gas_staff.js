const MA_PILOT_WEBHOOK_URL = 'https://ma-pilot.onrender.com/api/webhooks/lstep';
const LAST_PROCESSED_ROW_KEY = 'lastProcessedRow_staff';

function onNewFormResponse(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var lastRow = sheet.getLastRow();

  if (lastRow < 2) return;

  var props = PropertiesService.getScriptProperties();
  var lastProcessedRow = Number(props.getProperty(LAST_PROCESSED_ROW_KEY) || 1);
  if (lastRow <= lastProcessedRow) return;
  props.setProperty(LAST_PROCESSED_ROW_KEY, String(lastRow));

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var values = sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).getValues()[0];

  var payload = {};
  for (var i = 0; i < headers.length; i++) {
    payload[headers[i]] = values[i];
  }

  Logger.log('処理行: ' + lastRow);
  Logger.log('メール: ' + payload['メールアドレス']);

  var mappedPayload = {
    form_type: payload['form_type'] || 'staff',
    clinic_name: payload['クリニック名'] || '',
    clinic_location: payload['お勤め先の医院様の所在地'] || '',
    full_name: payload['お名前'] || '',
    furigana: payload['フリガナ'] || '',
    email: payload['メールアドレス'] || '',
    job_type: payload['役職・職種'] || '',
    form_id: '710319'
  };

  Logger.log('送信ペイロード: ' + JSON.stringify(mappedPayload));

  try {
    var response = UrlFetchApp.fetch(MA_PILOT_WEBHOOK_URL, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(mappedPayload),
      muteHttpExceptions: true
    });
    Logger.log('送信結果: ' + response.getResponseCode() + ' ' + response.getContentText());
  } catch (err) {
    Logger.log('送信エラー: ' + err);
  }
}
