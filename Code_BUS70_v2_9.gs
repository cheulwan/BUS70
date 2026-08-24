/**
 * 소신여객 70번 V2.9 Google Sheets 중앙 DB
 * 1인 테스트용: BUS70 스프레드시트 ID 직접 연결
 */
const APP_KEY = 'sosin70_v2_6';
const SPREADSHEET_ID = '13m_iaBtgayWiP1EgiOo0nLt_pszfVRYjTj0t4f2ErLU';

function sheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName('SOSIN70_DB');
  if (!sh) {
    sh = ss.insertSheet('SOSIN70_DB');
    sh.getRange(1,1,1,6).setValues([[
      'KEY','JSON','UPDATED_AT','DEVICE_ID','SCHEMA_VERSION','BYTES'
    ]]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function rowFor_(sh,key) {
  const last=sh.getLastRow();
  if(last<2) return -1;
  const vals=sh.getRange(2,1,last-1,1).getDisplayValues().flat();
  const i=vals.indexOf(key);
  return i<0 ? -1 : i+2;
}

function output_(obj, callback) {
  const text=JSON.stringify(obj);
  if (callback) {
    const safe=String(callback).replace(/[^\w.$]/g,'');
    return ContentService.createTextOutput(`${safe}(${text});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(text)
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const p=e && e.parameter ? e.parameter : {};
  const callback=p.callback || '';
  try {
    const action=p.action || 'health';

    if(action==='health') {
      const sh=sheet_(); // 연결 시트 생성/확인까지 수행
      return output_({
        ok:true,
        app:'SOSIN70',
        sheetName:sh.getName(),
        schemaVersion:'2.9',
        serverTime:new Date().toISOString()
      },callback);
    }

    if(action==='get') {
      const key=(p.key || APP_KEY).trim();
      const sh=sheet_();
      const row=rowFor_(sh,key);
      if(row<0) return output_({ok:true,key,data:null},callback);
      const raw=sh.getRange(row,2).getValue();
      const updated=sh.getRange(row,3).getValue();
      return output_({
        ok:true,key,
        data:raw ? JSON.parse(raw) : null,
        updatedAt:updated instanceof Date ? updated.toISOString() : String(updated||'')
      },callback);
    }

    if(action==='pushStatus'){
      const x=getPushToken_(p.empNo||'');
      return output_({ok:true,registered:!!(x&&x.token&&x.active),driver:x?x.driver:''},callback);
    }
    if(action==='sendPushTest'){
      const x=getPushToken_(p.empNo||'');
      if(!x||!x.token)throw new Error('등록된 Push 토큰 없음');
      const r=sendFcm_(x.token,'BUS70 서버 Push 시험',`${x.driver} 기사님, 앱을 닫아도 이 알림이 보이면 서버 Push가 정상입니다.`,{tag:'bus70-server-test',url:'./'});
      return output_({ok:true,result:r},callback);
    }
    return output_({ok:false,error:'지원하지 않는 action'},callback);
  } catch(err) {
    return output_({ok:false,error:String(err)},callback);
  }
}

function doPost(e) {
  try {
    const body=JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if(body.action==='registerPush'){savePushToken_(body);return output_({ok:true});}
    if(body.action!=='save') throw new Error('지원하지 않는 action');

    const key=(body.key || APP_KEY).trim();
    const data=body.data;
    if(!data) throw new Error('data가 없습니다.');

    const json=JSON.stringify(data);
    const bytes=Utilities.newBlob(json).getBytes().length;
    if(bytes>4500000) throw new Error('저장 데이터가 너무 큽니다.');

    const lock=LockService.getScriptLock();
    lock.waitLock(15000);
    try {
      const sh=sheet_();
      let row=rowFor_(sh,key);
      const now=new Date();
      const deviceId=String(body.deviceId || (data.cloud && data.cloud.deviceId) || '');
      const schema=String((data.cloud && data.cloud.schemaVersion) || '2.6.1');

      if(row<0) {
        row=sh.getLastRow()+1;
        sh.getRange(row,1,1,6).setValues([[key,json,now,deviceId,schema,bytes]]);
      } else {
        sh.getRange(row,2,1,5).setValues([[json,now,deviceId,schema,bytes]]);
      }
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }

    return output_({ok:true,key,savedAt:new Date().toISOString()});
  } catch(err) {
    return output_({ok:false,error:String(err)});
  }
}

/* ===== V2.9 Firebase Cloud Messaging ===== */
function pushSheet_(){
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID);let sh=ss.getSheetByName('PUSH_TOKENS');
  if(!sh){sh=ss.insertSheet('PUSH_TOKENS');sh.getRange(1,1,1,7).setValues([['EMP_NO','DRIVER','TOKEN','DEVICE_ID','USER_AGENT','UPDATED_AT','ACTIVE']]);sh.setFrozenRows(1);}
  return sh;
}
function rowForPush_(sh,emp){
  const last=sh.getLastRow();if(last<2)return -1;
  const vals=sh.getRange(2,1,last-1,1).getDisplayValues().flat(),i=vals.indexOf(String(emp));
  return i<0?-1:i+2;
}
function savePushToken_(b){
  const sh=pushSheet_(),emp=String(b.empNo||'').trim();if(!emp)throw new Error('empNo 없음');
  let row=rowForPush_(sh,emp),v=[emp,String(b.driver||''),String(b.token||''),String(b.deviceId||''),String(b.userAgent||''),new Date(),true];
  if(row<0)sh.appendRow(v);else sh.getRange(row,1,1,7).setValues([v]);
}
function getPushToken_(emp){
  const sh=pushSheet_(),row=rowForPush_(sh,String(emp));if(row<0)return null;
  const v=sh.getRange(row,1,1,7).getValues()[0];
  return {empNo:v[0],driver:v[1],token:v[2],active:v[6]===true};
}
function fcmAccessToken_(){
  const p=PropertiesService.getScriptProperties();
  const project=p.getProperty('FIREBASE_PROJECT_ID'),email=p.getProperty('FIREBASE_CLIENT_EMAIL'),pk=p.getProperty('FIREBASE_PRIVATE_KEY');
  if(!project||!email||!pk)throw new Error('Firebase 서비스계정 Script Properties 미설정');
  const b64=b=>Utilities.base64EncodeWebSafe(b).replace(/=+$/,'');
  const now=Math.floor(Date.now()/1000);
  const h=b64(Utilities.newBlob(JSON.stringify({alg:'RS256',typ:'JWT'})).getBytes());
  const c=b64(Utilities.newBlob(JSON.stringify({iss:email,scope:'https://www.googleapis.com/auth/firebase.messaging',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600})).getBytes());
  const u=h+'.'+c,s=b64(Utilities.computeRsaSha256Signature(u,pk)),jwt=u+'.'+s;
  const r=UrlFetchApp.fetch('https://oauth2.googleapis.com/token',{method:'post',contentType:'application/x-www-form-urlencoded',payload:{grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:jwt},muteHttpExceptions:true});
  const j=JSON.parse(r.getContentText());if(!j.access_token)throw new Error('OAuth token 실패: '+r.getContentText());
  return {token:j.access_token,project};
}
function sendFcm_(token,title,body,data){
  const a=fcmAccessToken_();
  const payload={message:{token,notification:{title,body},data:Object.fromEntries(Object.entries(data||{}).map(([k,v])=>[k,String(v)])),webpush:{fcm_options:{link:'https://cheulwan.github.io/BUS70/'}}}};
  const r=UrlFetchApp.fetch(`https://fcm.googleapis.com/v1/projects/${a.project}/messages:send`,{method:'post',contentType:'application/json',headers:{Authorization:'Bearer '+a.token},payload:JSON.stringify(payload),muteHttpExceptions:true});
  if(r.getResponseCode()<200||r.getResponseCode()>=300)throw new Error(r.getContentText());
  return JSON.parse(r.getContentText());
}
