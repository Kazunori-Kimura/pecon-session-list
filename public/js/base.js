// サインイン状況
var isSigned = false;
// 現在セッションID
var currentId = -1;
// sessionデータ
var sessions = [];

$(() => {
  /**
   * フォーム表示
   */
  $("#open-signin-form").on("click", function() {
    openSigninForm();
  });
  /**
   * フォーム非表示
   */
  $("#close-signin-form").on("click", function() {
    closeSigninForm();
  });
  /**
   * sign in
   */
  $("#signin").on("click", function() {
    // authのパラメータ
    const username = $("#username").val();
    const password = $("#password").val();
    const data = {
      username,
      password
    };
    // auth
    $.ajax({
      type: "POST",
      url: "/api/auth",
      timeout: 10000,
      data
    }).done((res, status, jqXHR) => {
      if (res) {
        // OK
        signin();
      }
    }).fail((jqXHR, status, err) => {
      console.error(jqXHR);
      console.error(status);
      console.error(err);
    });
  });
  /**
   * sign out
   */
  $("#signout").on("click", function() {
    // signout
    signout();
  });

  // init
  initialize();
});


function initialize() {
  // ログインフォームを非表示
  closeSigninForm();

  // table描画
  renderSessionsTable();

  // 現在のセッションを取得
  getCurrentSession();

  // 定期的に現在セッションを更新
  setInterval(getCurrentSession, 3000);
}

function openSigninForm() {
  $("#open-signin-form").hide();
  $("#close-signin-form").show();
  if (isSigned) {
    // signin状態
    $("#username").hide();
    $("#password").hide();
    $("#signin").hide();
    $("#signout").show();
  } else {
    // signout状態
    $("#username").show();
    $("#password").show();
    $("#signin").show();
    $("#signout").hide();
  }
}

function closeSigninForm() {
  $("#open-signin-form").show();
  $("#close-signin-form").hide();
  $("#username").hide();
  $("#password").hide();
  $("#signin").hide();
  $("#signout").hide();
}

function renderSessionsTable() {
  // sessionリストを取得
  $.ajax({
    type: "GET",
    url: "/api/sessions",
    timeout: 10000,
    dataType: "json"
  }).done((res, status, jqXHR) => {
    if (res) {
      sessions = res;
      render(res);
    }
  }).fail((jqXHR, status, err) => {
    console.error(jqXHR);
    console.error(status);
    console.error(err);
  });
}


function render(data) {
  // 初期化
  $("thead").empty();
  $("tbody").empty();

  data.forEach((row, index) => {
    if (index === 0) {
      // thead
      renderHeaderRow(row);
    } else {
      // tbody
      renderRow(row, index);
    }
  });

  // set current session
  if (currentId > 0) {
    renderCurrentSession();
  }

  $(".set-current-session").off("click");
  $(".set-current-session").on("click", setCurrentSession);
}

function getCurrentSession() {
  // 管理者ログイン時は定期取得しない
  if (isSigned) {
    return;
  }

  // current session idを取得
  $.ajax({
    type: "GET",
    url: "/api/session/current"
  }).done((res, status, jqXHR) => {
    if (res) {
      // currentIdの更新
      if (currentId !== res.currentId) {
        currentId = parseInt(res.currentId, 10);
        renderCurrentSession();
      }
    }
  }).fail((jqXHR, status, err) => {
    console.error(jqXHR);
    console.error(status);
    console.error(err);
  });
}

function setCurrentSession() {
  const $button = $(this);
  const sessionId = parseInt($button.data("session-id"), 10);
  if (currentId === sessionId) {
    // 何もしない
    return;
  }

  $.ajax({
    type: "PUT",
    url: "/api/session/current",
    data: { currentId: sessionId }
  }).done((res, status, jqXHR) => {
    if (res) {
      currentId = sessionId;
      // activeボタンの変更
      $(".set-current-session>span").removeClass("glyphicon-star").addClass("glyphicon-star-empty");
      $button.children("span").addClass("glyphicon-star").removeClass("glyphicon-star-empty");
      // active列の更新
      renderCurrentSession();
    }
  }).fail((jqXHR, status, err) => {
    console.error(jqXHR);
    console.error(status);
    console.error(err);
  });
}

function renderCurrentSession() {
  $("tbody>tr").removeClass("info");
  $(`#row_${currentId}`).addClass("info");
}

function renderHeaderRow(row = []) {
  let actionCell = "";
  if (isSigned) {
    actionCell = "<th>&nbsp;</th>";
  }
  // thタグを生成
  const cols = convertArrayToTags("th", row);
  // trタグで括る
  const tr = `<tr>${actionCell}${cols.join("")}</tr>`;
  // theadにセット
  $("thead").append(tr);
}

function renderRow(row = [], index = 0) {
  let actionCell = "";
  if (isSigned) {
    let icon = "glyphicon glyphicon-star-empty";
    if (index === currentId) {
      icon = "glyphicon glyphicon-star";
    }
    actionCell = `<td>
        <button class="btn btn-default set-current-session" data-session-id="${index}">
          <span class="${icon}"></span>
        </button>
      </td>`;
  }
  // td
  const cols = convertArrayToTags("td", row);
  // tr
  const tr = `<tr id="row_${index}">${actionCell}${cols.join("")}</tr>`;
  // tbody
  $("tbody").append(tr);
}

function convertArrayToTags(tag, arr) {
  const reg = /\n/g;
  const cols = arr.map((cell) => {
    let val = "";
    if (cell) {
      val = cell.replace(reg, "<br>");
    }
    return `<${tag}>${val}</${tag}>`;
  });
  return cols;
}

/**
 * ログイン時の処理
 */
function signin() {
  // signoutを表示
  $("#signout").show();
  // signinを非表示
  $("#signin").hide();
  $("#username").hide();
  $("#password").hide();

  isSigned = true;
  render(sessions);
}
/**
 * ログアウト時の処理
 */
function signout() {
  // signoutを非表示
  $("#signout").hide();
  // signinを表示
  $("#signin").show();
  $("#username").show();
  $("#password").show();

  isSigned = false;
  render(sessions);
}