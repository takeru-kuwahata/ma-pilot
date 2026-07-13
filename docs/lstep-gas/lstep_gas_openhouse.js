const MA_PILOT_WEBHOOK_URL = 'https://ma-pilot.onrender.com/api/webhooks/lstep';
const LAST_PROCESSED_ROW_KEY = 'lastProcessedRow_openhouse';

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
    form_type: payload['form_type'] || 'doctor_openhouse',
    clinic_name: payload['クリニック名'] || '',
    full_name: payload['お名前'] || '',
    furigana: payload['フリガナ'] || '',
    birth_date: String(payload['生年月日'] || ''),
    email: payload['メールアドレス'] || '',
    phone: payload['お電話番号（携帯）'] || '',
    ma_staff_name: payload['メディカルアドバンス担当者名'] || '',
    opening_date: String(payload['ご開業日'] || ''),
    openhouse_start_date: String(payload['内覧会開始日(仮)'] || ''),
    openhouse_end_date: String(payload['内覧会終了日（仮）'] || ''),
    home_postal_code: payload['ご自宅　郵便番号'] || '',
    home_address: payload['ご自宅　住所'] || '',
    clinic_address: payload['医院　住所'] || '',
    clinic_address2: payload['医院　住所②'] || '',
    form_id: '710696'
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
